const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const GoogleSheetsManager = require('./google-sheets');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google Sheets
const googleSheets = new GoogleSheetsManager();
googleSheets.initialize();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize SQLite database
const db = new sqlite3.Database('./bookings.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    // Create leads table
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service_type TEXT,
        timeline TEXT,
        message TEXT,
        source TEXT DEFAULT 'website',
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating leads table:', err);
        } else {
            console.log('Leads table ready');
        }
    });

    // Create bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service_type TEXT,
        scheduled_date DATE,
        scheduled_time TEXT,
        status TEXT DEFAULT 'pending',
        deposit_amount DECIMAL(10,2),
        deposit_status TEXT DEFAULT 'pending',
        stripe_payment_intent_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating bookings table:', err);
        } else {
            console.log('Bookings table ready');
        }
    });

    // Create notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating notifications table:', err);
        } else {
            console.log('Notifications table ready');
        }
    });

    // Create follow_ups table for automated sequences
    db.run(`CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        sequence_step INTEGER DEFAULT 1,
        scheduled_for DATETIME,
        sent_at DATETIME,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating follow_ups table:', err);
        } else {
            console.log('Follow-ups table ready');
        }
    });
}

// Email configuration (using nodemailer)
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Helper function to send email
async function sendEmail(to, subject, html) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'weber@zestflowai.com',
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

// Schedule follow-up emails
function scheduleFollowUp(leadId, stepNumber, hoursDelay) {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + hoursDelay);
    
    db.run(`INSERT INTO follow_ups (lead_id, sequence_step, scheduled_for) 
            VALUES (?, ?, ?)`, 
            [leadId, stepNumber, scheduledTime.toISOString()], 
            (err) => {
                if (err) {
                    console.error('Error scheduling follow-up:', err);
                } else {
                    console.log(`Follow-up ${stepNumber} scheduled for lead ${leadId}`);
                }
            });
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ZestFlow API is running' });
});

// Contact form submission
app.post('/api/contact', [
    body('name').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('message').notEmpty().trim().escape(),
    body('service').optional().trim().escape(),
    body('timeline').optional().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, service, timeline, message } = req.body;

    // Insert into database
    const query = `INSERT INTO leads (name, email, service_type, timeline, message, source) 
                   VALUES (?, ?, ?, ?, ?, 'contact_form')`;

    db.run(query, [name, email, service, timeline, message], async function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to save contact information' });
        }

        const leadId = this.lastID;

        // Add to Google Sheets if configured
        await googleSheets.addLead({
            id: leadId,
            name,
            email,
            service_type: service,
            timeline,
            message,
            status: 'new'
        });

        // Schedule follow-up emails
        scheduleFollowUp(leadId, 1, 24);  // 24 hours later
        scheduleFollowUp(leadId, 2, 72);  // 3 days later
        scheduleFollowUp(leadId, 3, 168); // 7 days later

        // Send confirmation email
        const emailHtml = `
            <h2>Thank you for contacting ZestFlow AI!</h2>
            <p>Hi ${name},</p>
            <p>We've received your message and will get back to you within 2-4 hours.</p>
            <p><strong>Your inquiry details:</strong></p>
            <ul>
                <li>Service: ${service || 'Not specified'}</li>
                <li>Timeline: ${timeline || 'Not specified'}</li>
                <li>Message: ${message}</li>
            </ul>
            <p>If this is urgent, you can also text us at (XXX) XXX-XXXX.</p>
            <p>Best regards,<br>The ZestFlow AI Team</p>
        `;

        await sendEmail(email, 'Thank you for contacting ZestFlow AI', emailHtml);

        // Send notification to admin
        const adminEmailHtml = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Service:</strong> ${service || 'Not specified'}</p>
            <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin.html">View in Admin Dashboard</a></p>
        `;

        await sendEmail(process.env.ADMIN_EMAIL || 'weber@zestflowai.com', 
                       'New Lead: ' + name, adminEmailHtml);

        res.json({ 
            success: true, 
            message: 'Thank you for contacting us! We\'ll be in touch soon.',
            leadId: leadId 
        });
    });
});

// Booking submission
app.post('/api/book-install', [
    body('name').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('service_type').optional().trim().escape(),
    body('scheduled_date').optional().isISO8601(),
    body('scheduled_time').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, service_type, scheduled_date, scheduled_time } = req.body;

    // First create a lead
    const leadQuery = `INSERT INTO leads (name, email, phone, service_type, source) 
                      VALUES (?, ?, ?, ?, 'booking')`;

    db.run(leadQuery, [name, email, phone, service_type], function(err) {
        if (err) {
            console.error('Lead creation error:', err);
            return res.status(500).json({ error: 'Failed to create lead' });
        }

        const leadId = this.lastID;

        // Then create the booking
        const bookingQuery = `INSERT INTO bookings 
                             (lead_id, name, email, phone, service_type, scheduled_date, scheduled_time, status) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`;

        db.run(bookingQuery, [leadId, name, email, phone, service_type, scheduled_date, scheduled_time], 
               async function(err) {
            if (err) {
                console.error('Booking creation error:', err);
                return res.status(500).json({ error: 'Failed to create booking' });
            }

            const bookingId = this.lastID;

            // Add to Google Sheets
            await googleSheets.addBooking({
                id: bookingId,
                name,
                email,
                phone,
                service_type,
                scheduled_date,
                scheduled_time,
                status: 'pending'
            });

            // Send confirmation emails
            const customerEmailHtml = `
                <h2>Installation Booking Confirmed!</h2>
                <p>Hi ${name},</p>
                <p>Your installation has been scheduled!</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li>Booking ID: #${bookingId}</li>
                    <li>Date: ${scheduled_date || 'To be scheduled'}</li>
                    <li>Time: ${scheduled_time || 'To be scheduled'}</li>
                    <li>Service: ${service_type || 'After-Hours Booking System'}</li>
                </ul>
                <p>We'll contact you within 24 hours to confirm the details and answer any questions.</p>
                <p>Remember our guarantee: If the system doesn't book at least one job in 7 days, we'll remove it and refund your setup fee!</p>
                <p>Best regards,<br>The ZestFlow AI Team</p>
            `;

            await sendEmail(email, 'Installation Booking Confirmed - ZestFlow AI', customerEmailHtml);

            res.json({
                success: true,
                message: 'Installation booked successfully!',
                bookingId: bookingId,
                leadId: leadId,
                redirectUrl: `/thank-you.html?booking=${bookingId}&lead=${leadId}`
            });
        });
    });
});

// Export leads to CSV
app.get('/api/admin/export/leads', (req, res) => {
    const query = `SELECT * FROM leads ORDER BY created_at DESC`;
    
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to export leads' });
        }

        // Convert to CSV
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Service', 'Timeline', 'Message', 'Source', 'Status', 'Created At'];
        const csvData = [headers.join(',')];
        
        rows.forEach(row => {
            const values = [
                row.id,
                `"${row.name}"`,
                `"${row.email}"`,
                `"${row.phone || ''}"`,
                `"${row.service_type || ''}"`,
                `"${row.timeline || ''}"`,
                `"${row.message || ''}"`,
                row.source,
                row.status,
                row.created_at
            ];
            csvData.push(values.join(','));
        });

        const csv = csvData.join('\n');
        const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    });
});

// Export bookings to CSV
app.get('/api/admin/export/bookings', (req, res) => {
    const query = `SELECT * FROM bookings ORDER BY created_at DESC`;
    
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to export bookings' });
        }

        const headers = ['ID', 'Lead ID', 'Name', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Created At'];
        const csvData = [headers.join(',')];
        
        rows.forEach(row => {
            const values = [
                row.id,
                row.lead_id,
                `"${row.name}"`,
                `"${row.email}"`,
                `"${row.phone || ''}"`,
                `"${row.service_type || ''}"`,
                row.scheduled_date || '',
                row.scheduled_time || '',
                row.status,
                row.created_at
            ];
            csvData.push(values.join(','));
        });

        const csv = csvData.join('\n');
        const filename = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    });
});

// Get all leads (admin endpoint)
app.get('/api/admin/leads', (req, res) => {
    // In production, add authentication here
    db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch leads' });
        }
        res.json({ leads: rows });
    });
});

// Get all bookings (admin endpoint)
app.get('/api/admin/bookings', (req, res) => {
    // In production, add authentication here
    db.all('SELECT * FROM bookings ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        res.json({ bookings: rows });
    });
});

// Update lead status
app.put('/api/admin/leads/:id/status', [
    body('status').isIn(['new', 'contacted', 'converted', 'lost'])
], (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [status, id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update lead status' });
        }
        res.json({ success: true, message: 'Lead status updated' });
    });
});

// Process scheduled follow-ups (run this periodically)
function processFollowUps() {
    const now = new Date().toISOString();
    
    db.all(`SELECT f.*, l.name, l.email, l.service_type 
            FROM follow_ups f 
            JOIN leads l ON f.lead_id = l.id 
            WHERE f.status = 'pending' AND f.scheduled_for <= ?`, 
            [now], async (err, rows) => {
        if (err) {
            console.error('Error fetching follow-ups:', err);
            return;
        }

        for (const followUp of rows) {
            // Send follow-up email based on sequence step
            let emailSubject, emailContent;
            
            switch (followUp.sequence_step) {
                case 1:
                    emailSubject = 'Still interested in the After-Hours Booking System?';
                    emailContent = `
                        <p>Hi ${followUp.name},</p>
                        <p>Just following up on your inquiry about our after-hours booking system.</p>
                        <p>Many contractors tell us they lose 3-5 jobs per week to competitors who answer after hours. 
                        Our system ensures you never miss another opportunity.</p>
                        <p>Ready to get started? <a href="${process.env.FRONTEND_URL}/book-install">Book your installation here</a></p>
                        <p>Questions? Just reply to this email.</p>
                    `;
                    break;
                case 2:
                    emailSubject = 'Last chance: 7-day guarantee ending soon';
                    emailContent = `
                        <p>Hi ${followUp.name},</p>
                        <p>Quick reminder: Our 7-day guarantee means if the system doesn't book at least one job 
                        in your first week, we remove it and refund everything.</p>
                        <p>Most contractors book their first job within 48 hours of going live.</p>
                        <p><a href="${process.env.FRONTEND_URL}/book-install">Claim your spot here</a></p>
                    `;
                    break;
                case 3:
                    emailSubject = 'Final notice: Your after-hours jobs are going to competitors';
                    emailContent = `
                        <p>Hi ${followUp.name},</p>
                        <p>This is our last automated email. While you've been thinking about it, 
                        your competitors have been booking jobs at 2 AM.</p>
                        <p>If you change your mind, we're here: <a href="${process.env.FRONTEND_URL}">ZestFlow AI</a></p>
                        <p>Best of luck with your business!</p>
                    `;
                    break;
            }

            await sendEmail(followUp.email, emailSubject, emailContent);

            // Mark as sent
            db.run('UPDATE follow_ups SET status = "sent", sent_at = CURRENT_TIMESTAMP WHERE id = ?', 
                   [followUp.id], (err) => {
                if (err) {
                    console.error('Error updating follow-up status:', err);
                }
            });
        }
    });
}

// Run follow-up processor every hour
setInterval(processFollowUps, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`ZestFlow backend running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Admin dashboard at http://localhost:${PORT}/admin.html`);
    
    // Process any pending follow-ups on startup
    processFollowUps();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});