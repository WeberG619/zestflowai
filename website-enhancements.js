// Business-driving enhancements for ZestFlowAI

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

// 2. Floating CTA Button
const floatingCTA = document.createElement('div');
floatingCTA.className = 'floating-cta';
floatingCTA.innerHTML = `
    <a href="/contact.html" class="floating-btn">
        <span class="urgency">🔥 Available Now</span>
        <span>Get Quick Fix →</span>
    </a>
`;
document.body.appendChild(floatingCTA);

// 3. Live Chat Widget (Simple version)
const chatWidget = document.createElement('div');
chatWidget.className = 'chat-widget';
chatWidget.innerHTML = `
    <button class="chat-button" onclick="toggleChat()">
        <span class="chat-icon">💬</span>
        <span class="chat-status">Online</span>
    </button>
    <div class="chat-window" style="display: none;">
        <div class="chat-header">
            <span>Quick Question?</span>
            <button onclick="toggleChat()">×</button>
        </div>
        <div class="chat-body">
            <p>👋 Hi! I typically respond within 2-4 hours.</p>
            <p>For urgent fixes, email me with "URGENT" in the subject.</p>
            <a href="/contact.html" class="chat-cta">Send Message →</a>
        </div>
    </div>
`;
document.body.appendChild(chatWidget);

function toggleChat() {
    const window = document.querySelector('.chat-window');
    window.style.display = window.style.display === 'none' ? 'block' : 'none';
}

// 4. Notification Bar
const notificationBar = document.createElement('div');
notificationBar.className = 'notification-bar';
notificationBar.innerHTML = `
    <p>⚡ <strong>Limited Availability:</strong> Only taking 3 new projects this week. <a href="/contact.html">Reserve your spot →</a></p>
    <button class="close-notification">&times;</button>
`;
document.body.insertBefore(notificationBar, document.body.firstChild);

notificationBar.querySelector('.close-notification').onclick = () => {
    notificationBar.style.display = 'none';
};

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
            btn.textContent = 'Get Service Quote →';
            break;
        case 'portfolio':
            btn.textContent = 'Start Your Project →';
            break;
        case 'testimonials':
            btn.textContent = 'Join Happy Clients →';
            break;
        default:
            btn.textContent = 'Get Quick Fix →';
    }
}