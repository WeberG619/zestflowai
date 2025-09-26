// Form Handler for ZestFlow AI
(function() {
    'use strict';
    
    // API endpoint - update this to your actual backend URL when deployed
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api' 
        : 'https://api.zestflowai.com/api';
    
    // Handle all forms with data-form attribute
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form[data-form]');
        
        forms.forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });
        
        // Also handle legacy forms
        handleContactForm();
        handleBookingForm();
        
        // Initialize additional features
        initializeFloatingCTA();
        initializeExitIntent();
    });
    
    // Main form submission handler
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formType = form.getAttribute('data-form');
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        try {
            // Collect form data
            const formData = new FormData(form);
            const data = {
                type: formType,
                timestamp: new Date().toISOString(),
                fields: {}
            };
            
            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                data.fields[key] = value;
            }
            
            // Add tracking data
            data.tracking = {
                page: window.location.pathname,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`
            };
            
            // Handle different form types
            switch (formType) {
                case 'lead':
                case 'newsletter':
                case 'contact':
                case 'demo':
                case 'book-install':
                    await handleLeadForm(data, form, submitButton);
                    break;
                case 'calculator':
                    await handleCalculatorForm(data, form, submitButton);
                    break;
                case 'case-study-download':
                case 'resource-download':
                    await handleDownloadForm(data, form, submitButton);
                    break;
                case 'talent-network':
                    await handleTalentForm(data, form, submitButton);
                    break;
                default:
                    await handleGenericForm(data, form, submitButton);
            }
            
            // Track conversion
            if (window.trackEvent) {
                window.trackEvent('form_submit_success', {
                    form_type: formType,
                    form_name: form.getAttribute('data-form-name') || formType
                });
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage(form, 'error', 'Something went wrong. Please try again.');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
    
    // Handle lead generation forms
    async function handleLeadForm(data, form, submitButton) {
        // In production, this would POST to your API
        // For demo, we'll simulate a successful submission
        await simulateApiCall();
        
        // Show success message
        showMessage(form, 'success', 'Thanks! We\'ll be in touch within 24 hours.');
        
        // Clear form
        form.reset();
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Submitted!';
        
        // Reset button text after delay
        setTimeout(() => {
            submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Submit';
        }, 3000);
        
        // Store lead in localStorage for demo
        storeLeadLocally(data);
        
        // Trigger conversion tracking
        if (window.trackConversion) {
            window.trackConversion('lead', 0);
        }
    }
    
    // Handle calculator form
    async function handleCalculatorForm(data, form, submitButton) {
        await simulateApiCall();
        
        // Calculate results
        const results = calculateROI(data.fields);
        
        // Show results
        showCalculatorResults(form, results);
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Calculate';
        
        // Store calculation data
        storeLeadLocally(data);
    }
    
    // Handle download forms
    async function handleDownloadForm(data, form, submitButton) {
        await simulateApiCall();
        
        // Show download link
        const downloadUrl = form.getAttribute('data-download-url') || '#';
        showMessage(form, 'success', `Thanks! Your download will start automatically. If not, <a href="${downloadUrl}" download>click here</a>.`);
        
        // Trigger download
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = true;
            link.click();
        }, 1000);
        
        // Clear form
        form.reset();
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Downloaded!';
        
        storeLeadLocally(data);
    }
    
    // Handle talent network form
    async function handleTalentForm(data, form, submitButton) {
        await simulateApiCall();
        
        showMessage(form, 'success', 'Welcome to our talent network! We\'ll notify you when relevant positions open.');
        
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Joined!';
        
        storeLeadLocally(data);
    }
    
    // Handle generic forms
    async function handleGenericForm(data, form, submitButton) {
        await simulateApiCall();
        
        showMessage(form, 'success', 'Thank you! Your submission has been received.');
        
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Submitted!';
        
        storeLeadLocally(data);
    }
    
    // Legacy contact form handler
    function handleContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                service: formData.get('service'),
                timeline: formData.get('timeline'),
                message: formData.get('message')
            };

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Show success message
                    showMessage(form, 'success', result.message || 'Thank you! We\'ll be in touch soon.');
                    form.reset();
                    
                    // Track conversion if analytics is available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'form_submit', {
                            'event_category': 'engagement',
                            'event_label': 'contact_form'
                        });
                    }
                } else {
                    // Show error message
                    showMessage(form, 'error', result.error || 'Something went wrong. Please try again.');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showMessage(form, 'error', 'Unable to submit form. Please try again or email us directly.');
            } finally {
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Legacy booking form handler
    function handleBookingForm() {
        const form = document.getElementById('booking-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service_type: formData.get('service_type'),
                scheduled_date: formData.get('scheduled_date'),
                scheduled_time: formData.get('scheduled_time')
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Booking...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/book-install`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showMessage(form, 'success', 'Installation booked successfully! Check your email for confirmation.');
                    form.reset();
                    
                    // Optionally redirect to thank you page
                    setTimeout(() => {
                        window.location.href = '/thank-you.html';
                    }, 2000);
                } else {
                    showMessage(form, 'error', result.error || 'Booking failed. Please try again.');
                }
            } catch (error) {
                console.error('Booking error:', error);
                showMessage(form, 'error', 'Unable to book installation. Please call us directly.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Show form messages
    function showMessage(form, type, message) {
        // Remove any existing messages
        const existingMessage = form.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message form-message-${type}`;
        messageDiv.innerHTML = message;
        
        // Style the message
        messageDiv.style.cssText = `
            margin-top: 15px;
            padding: 15px;
            border-radius: 5px;
            font-size: 16px;
            text-align: center;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
              'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
        `;
        
        // Add to form
        form.appendChild(messageDiv);
        
        // Remove after delay
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => messageDiv.remove(), 300);
            }, 5000);
        }
    }
    
    // Calculate ROI for calculator form
    function calculateROI(fields) {
        const monthlyCallsAfterHours = parseInt(fields.monthly_calls_after_hours) || 50;
        const averageJobValue = parseInt(fields.average_job_value) || 450;
        const conversionRate = 0.87; // 87% conversion rate with SMS
        const depositAmount = 99;
        
        const jobsBooked = Math.round(monthlyCallsAfterHours * conversionRate);
        const monthlyRevenue = jobsBooked * averageJobValue;
        const depositsCollected = jobsBooked * depositAmount;
        const yearlyRevenue = monthlyRevenue * 12;
        const systemCost = 497; // Monthly cost
        const monthlyROI = ((monthlyRevenue - systemCost) / systemCost) * 100;
        
        return {
            jobsBooked,
            monthlyRevenue,
            depositsCollected,
            yearlyRevenue,
            monthlyROI: Math.round(monthlyROI)
        };
    }
    
    // Show calculator results
    function showCalculatorResults(form, results) {
        let resultsDiv = document.getElementById('calculator-results');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'calculator-results';
            form.parentNode.insertBefore(resultsDiv, form.nextSibling);
        }
        
        resultsDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 40px; border-radius: 8px; margin-top: 30px; text-align: center;">
                <h3 style="font-size: 32px; margin-bottom: 30px;">Your Potential Results</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px;">
                    <div>
                        <div style="font-size: 48px; font-weight: bold;">${results.jobsBooked}</div>
                        <div style="opacity: 0.9;">Jobs Booked/Month</div>
                    </div>
                    <div>
                        <div style="font-size: 48px; font-weight: bold;">$${results.monthlyRevenue.toLocaleString()}</div>
                        <div style="opacity: 0.9;">Monthly Revenue</div>
                    </div>
                    <div>
                        <div style="font-size: 48px; font-weight: bold;">${results.monthlyROI}%</div>
                        <div style="opacity: 0.9;">ROI</div>
                    </div>
                </div>
                <p style="margin-top: 30px; font-size: 18px;">You could generate <strong>$${results.yearlyRevenue.toLocaleString()}</strong> in additional revenue this year!</p>
                <a href="/book-install.html" style="background: white; color: #28a745; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;">Start Capturing This Revenue</a>
            </div>
        `;
    }
    
    // Store lead data locally (for demo purposes)
    function storeLeadLocally(data) {
        const leads = JSON.parse(localStorage.getItem('zestflow_leads') || '[]');
        leads.push(data);
        localStorage.setItem('zestflow_leads', JSON.stringify(leads));
    }
    
    // Simulate API call
    function simulateApiCall() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }
    
    // Floating CTA for scroll
    function initializeFloatingCTA() {
        let ctaShown = false;
        
        window.addEventListener('scroll', function() {
            if (!ctaShown && window.pageYOffset > window.innerHeight * 0.5) {
                ctaShown = true;
                showFloatingCTA();
            }
        });
    }
    
    // Show floating CTA
    function showFloatingCTA() {
        const cta = document.createElement('div');
        cta.className = 'floating-cta';
        cta.innerHTML = `
            <button class="floating-close" onclick="this.parentElement.remove()">×</button>
            <h3>Ready to Capture After-Hours Revenue?</h3>
            <p>Join 500+ contractors already using ZestFlow AI</p>
            <a href="/book-install.html" class="floating-btn">Book Your Installation</a>
        `;
        
        cta.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 30px;
            border-radius: 8px;
            max-width: 350px;
            z-index: 1000;
            animation: slideIn 0.5s ease-out;
        `;
        
        document.body.appendChild(cta);
    }
    
    // Exit intent popup
    function initializeExitIntent() {
        let exitIntentShown = false;
        
        document.addEventListener('mouseout', function(e) {
            if (!exitIntentShown && e.clientY <= 0) {
                exitIntentShown = true;
                showExitIntentPopup();
            }
        });
    }
    
    // Show exit intent popup
    function showExitIntentPopup() {
        // Only show on certain pages
        const allowedPages = ['/', '/pricing.html', '/demo.html'];
        if (!allowedPages.includes(window.location.pathname)) {
            return;
        }
        
        const popup = document.createElement('div');
        popup.className = 'exit-intent-popup';
        popup.innerHTML = `
            <div class="exit-intent-overlay" onclick="this.parentElement.remove()"></div>
            <div class="exit-intent-content">
                <button class="exit-intent-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Wait! Don't Miss Out on $20,000+/Month</h2>
                <p>Get our free guide: "7 Ways Contractors Leave Money on the Table After Hours"</p>
                <form data-form="exit-intent-lead" style="display: flex; gap: 10px; margin-top: 20px;">
                    <input type="email" name="email" placeholder="Enter your email" required style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 5px;">
                    <button type="submit" style="background: #3282b8; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-weight: bold;">Get Free Guide</button>
                </form>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .exit-intent-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            }
            .exit-intent-content {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 40px;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
                z-index: 10000;
                text-align: center;
            }
            .exit-intent-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 30px;
                cursor: pointer;
                color: #999;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(popup);
        
        // Add form handler
        const form = popup.querySelector('form');
        form.addEventListener('submit', handleFormSubmit);
    }

})();

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
    
    .floating-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
    }
    
    .floating-btn {
        display: inline-block;
        background: #3282b8;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        margin-top: 15px;
    }
`;
document.head.appendChild(style);