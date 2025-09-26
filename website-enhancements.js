// Business-driving enhancements for ZestFlowAI
// TEMPORARILY DISABLED - All popups and floating elements removed per client request
if (false) { // Disable all enhancements

// 1. Exit Intent Popup
let exitIntentShown = false;
document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !exitIntentShown) {
        exitIntentShown = true;
        showExitPopup();
    }
});

function showExitPopup() {
    const popup = document.createElement('div');
    popup.className = 'exit-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <button class="close-popup">&times;</button>
            <h2>Wait! Don't Leave Empty-Handed</h2>
            <p>Get my free guide: "5 Python Scripts That Save 10 Hours/Week"</p>
            <form class="popup-form" onsubmit="handlePopupSubmit(event)">
                <input type="email" placeholder="Your email" required>
                <button type="submit">Send Me The Guide</button>
            </form>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.querySelector('.close-popup').onclick = () => popup.remove();
}

// 2. Floating CTA Button - REMOVED
// Removed per client request

// 3. Live Chat Widget - REMOVED
// Removed per client request

// toggleChat function removed

// 4. Notification Bar - REMOVED per client request
// The notification bar was causing header positioning issues
// and has been completely removed

// 5. Social Proof Toasts
const testimonials = [
    "Sarah M. just saved 15 hours/week with our automation",
    "New bug fix completed for James D. in 2 hours",
    "Lisa K. rated our service 5 stars",
    "3 new automation projects delivered this week"
];

function showSocialProof() {
    const toast = document.createElement('div');
    toast.className = 'social-proof-toast';
    toast.textContent = testimonials[Math.floor(Math.random() * testimonials.length)];
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Show social proof every 30 seconds
setInterval(showSocialProof, 30000);
setTimeout(showSocialProof, 5000); // First one after 5 seconds

// 6. Scroll Progress Bar
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
});

// 7. Smart CTA based on page section
let lastCTA = '';
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
            updateFloatingCTA(section.id);
        }
    });
});

function updateFloatingCTA(sectionId) {
    const btn = document.querySelector('.floating-btn span:last-child');
    if (!btn) return;
    
    switch(sectionId) {
        case 'services':
            // Removed - floating button no longer exists
            break;
        case 'portfolio':
            // Removed - floating button no longer exists
            break;
        case 'testimonials':
            // Removed - floating button no longer exists
            break;
        default:
            // Removed - floating button no longer exists
    }
}

} // End of disabled code