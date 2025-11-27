document.addEventListener('DOMContentLoaded', function() {
    // Get username from localStorage if available
    const userName = localStorage.getItem('userName') || 'Guest';
    document.getElementById('userName').textContent = userName;

    // Add click listeners to tool cards
    const toolButtons = document.querySelectorAll('.tool-select-btn');
    
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            
            if (tool === 'connect-broker') {
                handleConnectBroker();
            } else if (tool === 'demo-portfolio') {
                handleDemoPortfolio();
            }
        });
    });

    // Handle Connect Broker option
    function handleConnectBroker() {
        // In a real application, this would open a broker connection interface
        // For demo purposes, show a modal or alert
        showNotification('This is a demo feature. In a real application, you would be directed to connect your brokerage account.', 'info');
        
        // Simulate redirection to a broker connection page
        setTimeout(() => {
            // This could be replaced with actual navigation in a real application
            showNotification('Redirecting to broker connection interface...', 'info');
        }, 2000);
    }

    // Handle Demo Portfolio option
    function handleDemoPortfolio() {
        showNotification('Loading demo portfolio...', 'success');
        
        // Simulate loading a demo portfolio
        setTimeout(() => {
            // In a real app, this would load a pre-configured portfolio
            localStorage.setItem('usingDemoPortfolio', 'true');
            
            // Redirect to the portfolio dashboard
            window.location.href = 'portfolio-dashboard.html';
        }, 1500);
    }

    // Notification function
    function showNotification(message, type) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set notification content and type
        notification.textContent = message;
        notification.className = 'notification ' + type;
        
        // Add show class to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Add animation effects for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Simple animation using Intersection Observer API
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        featureCards.forEach(card => {
            observer.observe(card);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        featureCards.forEach(card => {
            card.classList.add('animated');
        });
    }
}); 