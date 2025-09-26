# How to View and Manage Form Submissions in Netlify

## Quick Access Links:
- **Netlify Dashboard**: https://app.netlify.com
- **Your Site Forms**: https://app.netlify.com/sites/zestflowai/forms

## Finding Your Form Submissions:

### Step 1: Access Forms Section
1. Log into https://app.netlify.com
2. Click on your site (zestflowai)
3. Look for **"Forms"** in the left sidebar menu
4. Click on "Forms"

### Step 2: View Submissions
- You'll see a list of all forms (contact, simple-test, etc.)
- The number next to each form shows how many submissions
- Click on any form name to see individual submissions
- Click on a submission to see all details

### Step 3: Set Up Email Notifications
1. Inside the Forms section, click **"Settings & usage"**
2. Under "Form notifications", click **"Add notification"**
3. Choose notification type:
   - **Email notification** - Get emails for each submission
   - **Slack notification** - Send to Slack channel
   - **Webhook** - Send to your backend

4. For Email notifications:
   - Email: `weber@zestflowai.com`
   - Form: Select "contact" or "All forms"
   - Email subject: "New contact from {{name}}"
   - Click "Save"

### Step 4: Export Submissions
- In the Forms section, click on a form
- Click **"Download CSV"** to export all submissions
- Use this for your records or CRM

## Troubleshooting:

### Not Seeing Any Forms?
1. Make sure form detection is enabled
2. Check that your latest deploy completed
3. Forms must have the `data-netlify="true"` attribute

### Not Getting Emails?
1. Check spam/junk folder
2. Verify email in notification settings
3. Make sure notifications are enabled

### Test Your Setup:
1. Submit a test form on your site
2. Check Forms tab in Netlify (refresh page)
3. You should see the submission immediately
4. Email notification arrives within 1-2 minutes

## Form Submission Data:
Each submission includes:
- Timestamp
- All form field values
- IP address (for spam detection)
- User agent info

## Free Tier Limits:
- 100 form submissions per month
- Unlimited forms
- All submissions stored for 30 days
- CSV export anytime

## Need More Submissions?
- Upgrade to Netlify Pro ($19/mo) for 1000 submissions
- Or use your backend (already built) for unlimited submissions