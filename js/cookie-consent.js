// Cookie Consent Management
(function() {
    'use strict';
    
    // Cookie consent configuration
    const cookieConfig = {
        necessary: true, // Always enabled
        analytics: false,
        marketing: false,
        preferences: false
    };
    
    // Check if consent has been given
    function hasConsent() {
        return localStorage.getItem('cookieConsent') !== null;
    }
    
    // Get consent preferences
    function getConsentPreferences() {
        const stored = localStorage.getItem('cookieConsent');
        if (stored) {
            return JSON.parse(stored);
        }
        return cookieConfig;
    }
    
    // Save consent preferences
    function saveConsent(preferences) {
        localStorage.setItem('cookieConsent', JSON.stringify(preferences));
        localStorage.setItem('consentDate', new Date().toISOString());
        
        // Apply preferences
        applyPreferences(preferences);
    }
    
    // Apply cookie preferences
    function applyPreferences(preferences) {
        if (preferences.analytics) {
            loadGoogleAnalytics();
            loadFacebookPixel();
        }
        
        if (preferences.marketing) {
            loadMarketingScripts();
        }
        
        // Dispatch event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
            detail: preferences 
        }));
    }
    
    // Load Google Analytics
    function loadGoogleAnalytics() {
        if (window.gtag) return; // Already loaded
        
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
        document.head.appendChild(script);
        
        script.onload = function() {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX', {
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=None;Secure'
            });
        };
    }
    
    // Load Facebook Pixel
    function loadFacebookPixel() {
        if (window.fbq) return; // Already loaded
        
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', 'YOUR_PIXEL_ID');
        fbq('track', 'PageView');
    }
    
    // Load marketing scripts
    function loadMarketingScripts() {
        // Load retargeting pixels, etc.
    }
    
    // Show cookie banner
    function showCookieBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-consent show';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <h3>We value your privacy</h3>
                    <p>We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. By clicking "Accept All", you consent to our use of cookies. <a href="/cookies.html" target="_blank">Learn more</a></p>
                </div>
                <div class="cookie-actions">
                    <button class="cookie-btn cookie-settings" onclick="openCookieSettings()">Cookie Settings</button>
                    <button class="cookie-btn cookie-accept" onclick="acceptAllCookies()">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
    }
    
    // Accept all cookies
    window.acceptAllCookies = function() {
        const preferences = {
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true
        };
        saveConsent(preferences);
        hideCookieBanner();
    };
    
    // Open cookie settings
    window.openCookieSettings = function() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-modal';
        modal.innerHTML = `
            <div class="cookie-settings-content">
                <h2>Cookie Settings</h2>
                <p>Choose which cookies you want to accept. Your choice will be saved for one year.</p>
                
                <div class="cookie-category">
                    <label>
                        <input type="checkbox" checked disabled>
                        <strong>Necessary Cookies</strong>
                        <p>These cookies are essential for the website to function properly.</p>
                    </label>
                </div>
                
                <div class="cookie-category">
                    <label>
                        <input type="checkbox" id="analytics-cookies">
                        <strong>Analytics Cookies</strong>
                        <p>Help us understand how visitors interact with our website.</p>
                    </label>
                </div>
                
                <div class="cookie-category">
                    <label>
                        <input type="checkbox" id="marketing-cookies">
                        <strong>Marketing Cookies</strong>
                        <p>Used to track visitors across websites for marketing purposes.</p>
                    </label>
                </div>
                
                <div class="cookie-category">
                    <label>
                        <input type="checkbox" id="preferences-cookies">
                        <strong>Preference Cookies</strong>
                        <p>Allow the website to remember your preferences.</p>
                    </label>
                </div>
                
                <div class="cookie-actions">
                    <button onclick="saveCustomCookies()">Save Preferences</button>
                    <button onclick="closeCookieSettings()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };
    
    // Save custom cookie preferences
    window.saveCustomCookies = function() {
        const preferences = {
            necessary: true,
            analytics: document.getElementById('analytics-cookies').checked,
            marketing: document.getElementById('marketing-cookies').checked,
            preferences: document.getElementById('preferences-cookies').checked
        };
        saveConsent(preferences);
        closeCookieSettings();
        hideCookieBanner();
    };
    
    // Close cookie settings
    window.closeCookieSettings = function() {
        const modal = document.querySelector('.cookie-settings-modal');
        if (modal) modal.remove();
    };
    
    // Hide cookie banner
    function hideCookieBanner() {
        const banner = document.querySelector('.cookie-consent');
        if (banner) banner.remove();
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        if (!hasConsent()) {
            showCookieBanner();
        } else {
            // Apply saved preferences
            const preferences = getConsentPreferences();
            applyPreferences(preferences);
        }
    });
    
})();