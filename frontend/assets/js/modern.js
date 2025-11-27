/**
 * Finosage AI - Modern Interface
 * JavaScript for interactions and functionality
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebarBtn = document.querySelector('.close-sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatArea = document.getElementById('chatArea');
    const welcomeCard = document.querySelector('.welcome-card');
    const newConversationBtn = document.getElementById('newConversationBtn');
    const headerNewChatBtn = document.getElementById('headerNewChatBtn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const formatBtns = document.querySelectorAll('.format-btn');
    const themeToggle = document.querySelector('.theme-toggle');
    const userBtn = document.querySelector('.user-btn');
    const body = document.body;
    
    // State management
    const state = {
        messages: [],
        currentConversation: 'portfolio-analysis',
        darkMode: true,
        collapsed: false,
        conversationCount: 2
    };
    
    // Initialize the UI
    initializeUI();
    
    // Handle sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    
    // Handle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
        });
    }
    
    // Handle new conversation
    if (newConversationBtn) {
        newConversationBtn.addEventListener('click', createNewConversation);
    }
    
    // Handle new conversation from header button
    if (headerNewChatBtn) {
        headerNewChatBtn.addEventListener('click', createNewConversation);
    }
    
    // Handle user button click
    if (userBtn) {
        userBtn.addEventListener('click', function() {
            showToast('User profile - Coming soon');
        });
    }
    
    // Handle input and sending messages
    userInput.addEventListener('input', autoResizeTextarea);
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Handle suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            userInput.value = this.innerText;
            userInput.focus();
            autoResizeTextarea();
            // Hide welcome card immediately when a suggestion is clicked
            if (welcomeCard) {
                welcomeCard.style.display = 'none';
            }
        });
    });
    
    // Handle formatting buttons
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const formatType = this.getAttribute('title');
            applyFormatting(formatType);
        });
    });
    
    // Handle theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Initialize conversation items
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => {
        item.addEventListener('click', function() {
            conversationItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            // In a real app, would load the conversation data here
        });
    });
    
    // Functions
    function initializeUI() {
        // Check for saved preferences
        checkSavedPreferences();
        
        // Auto-resize the textarea
        autoResizeTextarea();
        
        // Initial sidebar state for mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    }
    
    function checkSavedPreferences() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('finosage_theme');
        if (savedTheme) {
            if (savedTheme === 'light') {
                body.classList.add('light-theme');
                state.darkMode = false;
                themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            }
        }
        
        // Check for saved sidebar state
        const sidebarState = localStorage.getItem('finosage_sidebar');
        if (sidebarState === 'collapsed') {
            sidebar.classList.add('collapsed');
            state.collapsed = true;
        }
    }
    
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
            state.collapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('finosage_sidebar', state.collapsed ? 'collapsed' : 'expanded');
        }
    }
    
    function toggleTheme() {
        body.classList.toggle('light-theme');
        state.darkMode = !body.classList.contains('light-theme');
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        
        if (state.darkMode) {
            icon.classList.replace('fa-sun', 'fa-moon');
        } else {
            icon.classList.replace('fa-moon', 'fa-sun');
        }
        
        // Save preference
        localStorage.setItem('finosage_theme', state.darkMode ? 'dark' : 'light');
    }
    
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    }
    
    function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Simulate AI response after a short delay
        setTimeout(() => {
            // This is where you'd connect to your AI backend
            const aiResponse = getSimulatedResponse(message);
            addMessage(aiResponse, 'ai');
        }, 1000);
    }
    
    function addMessage(content, sender) {
        // Hide welcome card immediately when a message is being added
        if (welcomeCard) {
            welcomeCard.style.display = 'none';
        }
        
        // Create timestamp if it's a new group
        if (state.messages.length === 0 || getMessageTimeDiff() > 10) {
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = getCurrentTimeFormatted(true);
            chatArea.appendChild(timestamp);
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Create message content based on sender
        if (sender === 'ai') {
            // Add avatar for AI
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
            messageDiv.appendChild(avatar);
        }
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Format the content (very simple parsing)
        messageContent.innerHTML = formatMessageContent(content);
        
        messageDiv.appendChild(messageContent);
        
        // Add message footer
        const footer = document.createElement('div');
        footer.className = 'message-footer';
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = getCurrentTimeFormatted();
        footer.appendChild(time);
        
        // Only add action buttons to AI messages
        if (sender === 'ai') {
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            
            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'message-action';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.addEventListener('click', function() {
                copyToClipboard(content);
                showToast('Copied to clipboard');
            });
            
            // Thumbs up button
            const thumbsUpBtn = document.createElement('button');
            thumbsUpBtn.className = 'message-action';
            thumbsUpBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
            thumbsUpBtn.addEventListener('click', function() {
                showToast('Feedback submitted: Helpful');
            });
            
            // Thumbs down button
            const thumbsDownBtn = document.createElement('button');
            thumbsDownBtn.className = 'message-action';
            thumbsDownBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
            thumbsDownBtn.addEventListener('click', function() {
                showToast('Feedback submitted: Not helpful');
            });
            
            actions.appendChild(copyBtn);
            actions.appendChild(thumbsUpBtn);
            actions.appendChild(thumbsDownBtn);
            footer.appendChild(actions);
        }
        
        messageContent.appendChild(footer);
        
        // Add to chat area
        chatArea.appendChild(messageDiv);
        
        // Store in state
        state.messages.push({
            content,
            sender,
            timestamp: new Date()
        });
        
        // Scroll to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    function formatMessageContent(content) {
        // Simple formatting for demonstration
        // In a real app, you would use a proper Markdown parser
        
        // Convert line breaks to paragraphs
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        if (paragraphs.length > 1) {
            return paragraphs.map(p => `<p>${p}</p>`).join('');
        }
        
        return `<p>${content}</p>`;
    }
    
    function getMessageTimeDiff() {
        if (state.messages.length === 0) return 100; // Large number to ensure timestamp
        
        const lastMessage = state.messages[state.messages.length - 1];
        const now = new Date();
        const diffMinutes = (now - lastMessage.timestamp) / (1000 * 60);
        
        return diffMinutes;
    }
    
    function getCurrentTimeFormatted(includeDate = false) {
        const now = new Date();
        const timeOptions = { hour: 'numeric', minute: '2-digit' };
        
        if (includeDate) {
            return `Today, ${now.toLocaleTimeString([], timeOptions)}`;
        }
        
        return now.toLocaleTimeString([], timeOptions);
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    function showToast(message) {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove the toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    function applyFormatting(formatType) {
        const selectionStart = userInput.selectionStart;
        const selectionEnd = userInput.selectionEnd;
        const text = userInput.value;
        const selectedText = text.substring(selectionStart, selectionEnd);
        
        if (!selectedText && formatType !== 'Link') {
            showToast(`Select text to apply ${formatType} formatting`);
            return;
        }
        
        let formattedText = '';
        let cursorPosition = 0;
        
        switch(formatType) {
            case 'Bold':
                formattedText = `**${selectedText}**`;
                cursorPosition = selectionStart + 2;
                break;
            case 'Italic':
                formattedText = `*${selectedText}*`;
                cursorPosition = selectionStart + 1;
                break;
            case 'Code':
                formattedText = `\`${selectedText}\``;
                cursorPosition = selectionStart + 1;
                break;
            case 'Link':
                if (selectedText) {
                    formattedText = `[${selectedText}](url)`;
                    cursorPosition = selectionEnd + 2;
                } else {
                    formattedText = '[](url)';
                    cursorPosition = 1;
                }
                break;
        }
        
        // Apply formatting
        userInput.value = text.substring(0, selectionStart) + formattedText + text.substring(selectionEnd);
        
        // Restore focus and selection
        userInput.focus();
        
        if (selectedText) {
            // Place cursor at the end of the formatted text
            userInput.selectionStart = selectionEnd + formattedText.length - selectedText.length;
            userInput.selectionEnd = userInput.selectionStart;
        } else {
            // For link, place cursor where URL would go
            userInput.selectionStart = selectionStart + cursorPosition;
            userInput.selectionEnd = userInput.selectionStart;
        }
        
        // Resize the textarea
        autoResizeTextarea();
    }
    
    function createNewConversation() {
        // Clear messages from state
        state.messages = [];
        
        // Clear chat area
        chatArea.innerHTML = '';
        
        // Show welcome card
        if (welcomeCard) {
            welcomeCard.style.display = 'block';
        }
        
        // Create new conversation item
        state.conversationCount++;
        const conversationItems = document.querySelector('.conversation-items');
        
        // Create a new conversation with a random icon and name
        const icons = ['chart-line', 'coins', 'university', 'chart-pie', 'money-bill-wave', 'piggy-bank'];
        const titles = ['New Conversation', 'Financial Analysis', 'Investment Planning', 'Market Research'];
        
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        const randomTitle = titles[Math.floor(Math.random() * titles.length)] + ' ' + state.conversationCount;
        
        const newItem = document.createElement('div');
        newItem.className = 'conversation-item';
        newItem.innerHTML = `
            <div class="convo-icon"><i class="fas fa-${randomIcon}"></i></div>
            <div class="convo-content">
                <div class="convo-title">${randomTitle}</div>
            </div>
        `;
        
        // Add event listener to the new item
        newItem.addEventListener('click', function() {
            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            // In a real app, would load the conversation data here
        });
        
        // Add to list and set as active
        conversationItems.prepend(newItem);
        document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
        newItem.classList.add('active');
        
        // Update state
        state.currentConversation = randomTitle;
        
        // Update chat header if exists
        const chatHeader = document.querySelector('.chat-info h2');
        if (chatHeader) {
            chatHeader.textContent = randomTitle;
        }
        
        // Clear user input
        userInput.value = '';
        autoResizeTextarea();
        
        showToast('New conversation created');
    }
    
    // Simulated AI responses for demo
    function getSimulatedResponse(userMessage) {
        const lowercaseMessage = userMessage.toLowerCase();
        
        if (lowercaseMessage.includes('portfolio') || lowercaseMessage.includes('investment')) {
            return "Based on your investment goals, I'd recommend a diversified portfolio with 60% stocks, 30% bonds, and 10% alternatives. This provides a balanced approach to growth while managing risk. Would you like me to analyze specific sectors or asset classes?";
        }
        
        if (lowercaseMessage.includes('market') || lowercaseMessage.includes('trend')) {
            return "Current market trends show technology and healthcare sectors continuing strong performance, while energy faces challenges due to market transitions. Inflation concerns are affecting interest rate expectations, which may impact bond markets in the coming quarter.";
        }
        
        if (lowercaseMessage.includes('retirement') || lowercaseMessage.includes('planning')) {
            return "Retirement planning should balance your timeline, risk tolerance, and income needs. For most people, I recommend:\n\n1. Maximize tax-advantaged accounts (401k, IRA)\n2. Build a diversified portfolio that shifts more conservative as you approach retirement\n3. Plan for healthcare costs\n4. Consider delayed Social Security benefits for higher lifetime payouts";
        }
        
        // Default response
        return "I understand your query about " + userMessage.substring(0, 20) + "... To provide the most helpful advice, could you share more details about your financial goals and current situation?";
    }
});

// Add toast styling to the document
document.head.insertAdjacentHTML('beforeend', `
<style>
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: var(--surface);
    color: var(--text-primary);
    padding: 0.75rem 1.25rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    z-index: 1000;
    font-size: 0.875rem;
    border: 1px solid var(--border);
}

.toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}
</style>
`); 