// Script to update navigation across all pages
const fs = require('fs');
const path = require('path');

const standardNavigation = `    <!-- Navigation (using standard header) -->
    <header>
        <nav class="container">
            <a href="/" class="logo">ZestFlow AI</a>
            <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li class="dropdown">
                    <a href="/demo.html">Product</a>
                    <ul class="dropdown-menu">
                        <li><a href="/demo.html">Watch Demo</a></li>
                        <li><a href="/widget-demo.html">How It Works</a></li>
                        <li><a href="/integrations.html">Integrations</a></li>
                        <li><a href="/status.html">System Status</a></li>
                    </ul>
                </li>
                <li><a href="/pricing.html">Pricing</a></li>
                <li class="dropdown">
                    <a href="/resources.html">Resources</a>
                    <ul class="dropdown-menu">
                        <li><a href="/resources.html">Free Downloads</a></li>
                        <li><a href="/blog.html">Blog</a></li>
                        <li><a href="/tutorials.html">Video Tutorials</a></li>
                        <li><a href="/help.html">Help Center</a></li>
                        <li><a href="/calculator.html">ROI Calculator</a></li>
                    </ul>
                </li>
                <li class="dropdown">
                    <a href="/about.html">Company</a>
                    <ul class="dropdown-menu">
                        <li><a href="/about.html">About Us</a></li>
                        <li><a href="/testimonials.html">Testimonials</a></li>
                        <li><a href="/case-studies.html">Case Studies</a></li>
                        <li><a href="/press.html">Press & Media</a></li>
                        <li><a href="/careers.html">Careers</a></li>
                        <li><a href="/contact.html">Contact</a></li>
                        <li><a href="/affiliate.html">Affiliate Program</a></li>
                    </ul>
                </li>
                <li><a href="/book-install.html" class="nav-cta">Book Install</a></li>
            </ul>
            <a href="/book-install.html" class="contact-btn">Get Started</a>
            <button class="mobile-menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </nav>
    </header>`;

// Function to update navigation in a file
function updateNavigationInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Match existing header tags
    const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/i;
    
    if (headerRegex.test(content)) {
        const updatedContent = content.replace(headerRegex, standardNavigation);
        fs.writeFileSync(filePath, updatedContent);
        console.log(`Updated navigation in: ${filePath}`);
    }
}

// Get all HTML files
const htmlFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(__dirname, file));

// Update each file
htmlFiles.forEach(updateNavigationInFile);

console.log('Navigation update complete!');