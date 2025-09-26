// Google Sheets Integration - Free lead tracking
// This uses Google Sheets API v4 with service account (no cost)

const { google } = require('googleapis');

class GoogleSheetsManager {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    }

    async initialize() {
        try {
            // Only initialize if credentials are provided
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                console.log('Google Sheets integration not configured - skipping');
                return false;
            }

            // Create auth client
            this.auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
            // Create headers if sheet is empty
            await this.initializeSheet();
            
            console.log('Google Sheets integration initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Sheets:', error.message);
            return false;
        }
    }

    async initializeSheet() {
        try {
            // Check if headers exist
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Leads!A1:J1'
            });

            if (!response.data.values || response.data.values.length === 0) {
                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Leads!A1:J1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[
                            'ID',
                            'Date',
                            'Time',
                            'Name',
                            'Email',
                            'Phone',
                            'Service',
                            'Timeline',
                            'Message',
                            'Status'
                        ]]
                    }
                });
                console.log('Google Sheet headers created');
            }
        } catch (error) {
            console.error('Error initializing sheet:', error);
        }
    }

    async addLead(leadData) {
        if (!this.sheets) {
            console.log('Google Sheets not initialized - skipping lead sync');
            return;
        }

        try {
            const now = new Date();
            const values = [[
                leadData.id,
                now.toLocaleDateString(),
                now.toLocaleTimeString(),
                leadData.name,
                leadData.email,
                leadData.phone || '',
                leadData.service_type || '',
                leadData.timeline || '',
                leadData.message || '',
                leadData.status || 'new'
            ]];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Leads!A:J',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

            console.log('Lead added to Google Sheets');
        } catch (error) {
            console.error('Error adding lead to Google Sheets:', error);
        }
    }

    async addBooking(bookingData) {
        if (!this.sheets) {
            return;
        }

        try {
            // Check if Bookings sheet exists, create if not
            const sheets = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const bookingSheet = sheets.data.sheets.find(s => s.properties.title === 'Bookings');
            
            if (!bookingSheet) {
                // Create Bookings sheet
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: 'Bookings'
                                }
                            }
                        }]
                    }
                });

                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Bookings!A1:K1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[
                            'Booking ID',
                            'Date Created',
                            'Name',
                            'Email',
                            'Phone',
                            'Service',
                            'Scheduled Date',
                            'Scheduled Time',
                            'Status',
                            'Deposit Status',
                            'Notes'
                        ]]
                    }
                });
            }

            // Add booking data
            const now = new Date();
            const values = [[
                bookingData.id,
                now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
                bookingData.name,
                bookingData.email,
                bookingData.phone || '',
                bookingData.service_type || 'After-Hours System',
                bookingData.scheduled_date || 'TBD',
                bookingData.scheduled_time || 'TBD',
                bookingData.status || 'pending',
                bookingData.deposit_status || 'N/A',
                bookingData.notes || ''
            ]];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Bookings!A:K',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

            console.log('Booking added to Google Sheets');
        } catch (error) {
            console.error('Error adding booking to Google Sheets:', error);
        }
    }
}

module.exports = GoogleSheetsManager;