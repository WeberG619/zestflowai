# ZestFlow AI - Complete System Setup Guide

## Overview
This guide explains how to set up and run the complete ZestFlow AI After-Hours Booking System, including the backend API, database, and all integrations.

## System Components

### 1. Frontend (Static Website)
- **Location**: `/` (root directory)
- **Technology**: HTML, CSS, JavaScript
- **Key Files**:
  - `index.html` - Landing page
  - `book-install.html` - Booking page with Calendly
  - `contact.html` - Contact form
  - `js/form-handler.js` - Form submission handler

### 2. Backend API
- **Location**: `/backend`
- **Technology**: Node.js, Express, SQLite
- **Key Files**:
  - `server.js` - Main API server
  - `package.json` - Dependencies
  - `.env.example` - Configuration template

### 3. Database
- **Technology**: SQLite (automatically created)
- **Tables**:
  - `leads` - All contact form submissions
  - `bookings` - Installation bookings
  - `notifications` - Email/SMS log

## Quick Start Guide

### Step 1: Set Up Backend

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
```bash
cp .env.example .env
```

4. **Edit `.env` file** with your actual credentials:
```
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=weber@zestflowai.com

# Optional: Twilio for SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

5. **Start the backend server**:
```bash
npm start
# Or for development with auto-restart:
npm run dev
```

The API will run at `http://localhost:3001`

### Step 2: Set Up Calendly Integration

1. **Create Calendly Account**: 
   - Go to [calendly.com](https://calendly.com)
   - Sign up for a free account

2. **Create Event Type**:
   - Name it "Installation Setup"
   - Set duration to 30 minutes
   - Configure availability

3. **Get Your Calendly Link**:
   - Copy your event link (e.g., `https://calendly.com/yourusername/installation-setup`)

4. **Update book-install.html**:
   - Replace `zestflowai` with your Calendly username in the data-url

### Step 3: Configure Email Sending

For Gmail:
1. Enable 2-factor authentication
2. Generate app-specific password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this password in `.env` file

### Step 4: Deploy the Frontend

The frontend can be hosted on any static hosting service:

**Option A: GitHub Pages**
1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Your site will be live at `https://yourusername.github.io/zestflowai`

**Option B: Netlify**
1. Connect your GitHub repo
2. Deploy with default settings
3. Custom domain available

**Option C: Vercel**
1. Import GitHub repository
2. Deploy with zero config
3. Automatic SSL and custom domains

### Step 5: Deploy the Backend

**Option A: Heroku** (Free tier available)
1. Create Heroku app
2. Add Heroku Postgres addon (or use SQLite)
3. Set environment variables
4. Deploy using Heroku CLI or GitHub integration

**Option B: Railway.app**
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

**Option C: DigitalOcean App Platform**
1. Create new app
2. Connect GitHub
3. Configure environment
4. Deploy

### Step 6: Update API URLs

Once deployed, update the API URL in:
- `/js/form-handler.js` - Change `API_URL` to your deployed backend URL

## How The System Works

### Contact Form Flow
1. User fills out contact form on `contact.html`
2. JavaScript (`form-handler.js`) sends data to API
3. Backend stores in `leads` table
4. Sends confirmation email to user
5. Sends notification email to admin
6. Shows success message to user

### Booking Flow
1. User visits `book-install.html`
2. Chooses between:
   - **Option 1**: Books via Calendly widget
   - **Option 2**: Pays first, then schedules
3. Calendly handles scheduling
4. Backend tracks all bookings

### Data Management
- All leads stored in SQLite database
- Access via admin endpoints:
  - `GET /api/admin/leads` - View all leads
  - `GET /api/admin/bookings` - View all bookings

## Testing The System

### Test Contact Form
1. Go to `/contact.html`
2. Fill out the form
3. Submit and check:
   - Success message appears
   - Email received (if configured)
   - Lead appears in database

### Test Booking
1. Go to `/book-install.html`
2. Use Calendly widget to book
3. Verify calendar event created

### Test API Directly
```bash
# Test health check
curl http://localhost:3001/api/health

# Test contact form submission
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

## Production Checklist

- [ ] Set up real email service (SendGrid/Mailgun for production)
- [ ] Configure Twilio for SMS notifications
- [ ] Set up Stripe for payment processing
- [ ] Add SSL certificate (automatic with most hosts)
- [ ] Set up monitoring (UptimeRobot, etc.)
- [ ] Configure backups for database
- [ ] Add Google Analytics
- [ ] Test on mobile devices
- [ ] Set up error tracking (Sentry)

## Troubleshooting

### Forms Not Submitting
1. Check browser console for errors
2. Verify API is running
3. Check CORS settings if on different domains

### Emails Not Sending
1. Verify Gmail app password is correct
2. Check spam folder
3. Try using SendGrid instead

### Calendly Not Showing
1. Verify Calendly account is active
2. Check event is published
3. Ensure embed code is correct

### Database Errors
1. Check write permissions on backend folder
2. Verify SQLite is installed
3. Delete `bookings.db` and restart to recreate

## Support

For issues or questions:
- Email: weber@zestflowai.com
- Create GitHub issue
- Check documentation at `/docs`

## Next Steps

1. **Add Payment Processing**: Integrate Stripe for deposit collection
2. **SMS Notifications**: Set up Twilio for text confirmations
3. **Google Sheets**: Auto-sync leads to Google Sheets
4. **Admin Dashboard**: Build interface to manage bookings
5. **Analytics**: Track conversion rates and ROI

Remember: The 7-day guarantee requires tracking when customers book their first job!