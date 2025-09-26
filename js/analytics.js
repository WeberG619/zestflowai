// Analytics and Tracking Configuration
(function() {
    'use strict';
    
    // Wait for cookie consent
    window.addEventListener('cookieConsentUpdated', function(event) {
        const preferences = event.detail;
        
        if (preferences.analytics) {
            initializeAnalytics();
        }
        
        if (preferences.marketing) {
            initializeMarketing();
        }
    });
    
    // Initialize analytics if consent already given
    document.addEventListener('DOMContentLoaded', function() {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
            const preferences = JSON.parse(consent);
            if (preferences.analytics) {
                initializeAnalytics();
            }
            if (preferences.marketing) {
                initializeMarketing();
            }
        }
    });
    
    function initializeAnalytics() {
        // Google Analytics 4
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        
        // Track page views
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
        
        // Track form submissions
        document.addEventListener('submit', function(e) {
            if (e.target.matches('form[data-form]')) {
                const formName = e.target.getAttribute('data-form');
                gtag('event', 'form_submit', {
                    form_name: formName,
                    form_destination: e.target.action
                });
            }
        });
        
        // Track CTA clicks
        document.addEventListener('click', function(e) {
            if (e.target.matches('.contact-btn, .btn-primary, .nav-cta')) {
                gtag('event', 'cta_click', {
                    cta_text: e.target.textContent,
                    cta_location: e.target.getAttribute('data-location') || 'unknown'
                });
            }
        });
        
        // Track scroll depth
        let scrollDepths = [25, 50, 75, 90];
        let achievedDepths = [];
        
        window.addEventListener('scroll', throttle(function() {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            scrollDepths.forEach(depth => {
                if (scrollPercent >= depth && !achievedDepths.includes(depth)) {
                    achievedDepths.push(depth);
                    gtag('event', 'scroll_depth', {
                        percent_scrolled: depth
                    });
                }
            });
        }, 500));
        
        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            gtag('event', 'time_on_page', {
                time_seconds: timeOnPage,
                page_path: window.location.pathname
            });
        });
    }
    
    function initializeMarketing() {
        // Facebook Pixel events
        if (window.fbq) {
            // Track lead events
            document.addEventListener('submit', function(e) {
                if (e.target.matches('form[data-form="lead"]')) {
                    fbq('track', 'Lead', {
                        content_name: e.target.getAttribute('data-form-name') || 'Unknown Form'
                    });
                }
            });
            
            // Track book install clicks
            document.addEventListener('click', function(e) {
                if (e.target.matches('a[href*="book-install"]')) {
                    fbq('track', 'InitiateCheckout');
                }
            });
        }
        
        // LinkedIn Insight Tag
        _linkedin_partner_id = "YOUR_LINKEDIN_ID";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        
        // Twitter Pixel
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('init','YOUR_TWITTER_ID');
        twq('track','PageView');
    }
    
    // Conversion tracking
    window.trackConversion = function(conversionType, value) {
        if (window.gtag) {
            gtag('event', 'conversion', {
                'send_to': 'G-XXXXXXXXXX/conversion',
                'value': value || 0,
                'currency': 'USD',
                'conversion_type': conversionType
            });
        }
        
        if (window.fbq) {
            fbq('track', 'Purchase', {
                value: value || 0,
                currency: 'USD',
                content_type: conversionType
            });
        }
    };
    
    // Custom event tracking
    window.trackEvent = function(eventName, parameters) {
        if (window.gtag) {
            gtag('event', eventName, parameters);
        }
    };
    
    // Utility function for throttling
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Exit intent tracking
    let exitIntentShown = false;
    document.addEventListener('mouseout', function(e) {
        if (e.clientY <= 0 && !exitIntentShown) {
            exitIntentShown = true;
            if (window.gtag) {
                gtag('event', 'exit_intent_triggered');
            }
        }
    });
    
})();