const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
                leadId: leadId
            });
        });
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

// Start server
app.listen(PORT, () => {
    console.log(`ZestFlow backend running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
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