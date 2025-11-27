// Utility Functions
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Chat Interface Variables
let currentConversationId = null;
let isTyping = false;
let chatVisible = false;

// Portfolio Analyzer Functions
const updatePortfolioData = async () => {
    try {
        // Simulate API call
        const response = await fetch('/api/portfolio/data');
        const data = await response.json();
        
        // Update portfolio overview
        document.querySelector('.overview-card:nth-child(1) .value').textContent = formatCurrency(data.totalValue);
        document.querySelector('.overview-card:nth-child(2) .value').textContent = formatCurrency(data.dailyPL);
        document.querySelector('.overview-card:nth-child(3) .value').textContent = `${data.riskScore}/10`;
        
        // Update holdings table
        updateHoldingsTable(data.holdings);
    } catch (error) {
        console.error('Error updating portfolio data:', error);
        showNotification('Failed to update portfolio data', 'error');
    }
};

const updateHoldingsTable = (holdings) => {
    const tbody = document.querySelector('.holdings-table tbody');
    tbody.innerHTML = holdings.map(holding => `
        <tr>
            <td>
                <div class="asset-info">
                    <img src="${holding.icon}" alt="${holding.name}">
                    <span>${holding.name}</span>
                </div>
            </td>
            <td>${formatCurrency(holding.value)}</td>
            <td class="${holding.change >= 0 ? 'positive' : 'negative'}">
                ${formatPercentage(holding.change)}
            </td>
            <td>
                <div class="ai-analysis">
                    <span class="trend ${holding.trend}">${holding.trend}</span>
                    <button class="details-btn" data-asset="${holding.id}">Details</button>
                </div>
            </td>
        </tr>
    `).join('');
};

// Market Researcher Functions
const searchMarket = async (query) => {
    try {
        // Simulate API call
        const response = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // Update research cards
        updateMarketTrends(data.trends);
        updateAIInsights(data.insights);
        updateNewsAnalysis(data.news);
    } catch (error) {
        console.error('Error searching market:', error);
        showNotification('Failed to search market data', 'error');
    }
};

const updateMarketTrends = (trends) => {
    const trendList = document.querySelector('.trend-list');
    trendList.innerHTML = trends.map(trend => `
        <div class="trend-item">
            <div class="trend-info">
                <span class="trend-name">${trend.name}</span>
                <span class="trend-value ${trend.value >= 0 ? 'positive' : 'negative'}">
                    ${formatPercentage(trend.value)}
                </span>
            </div>
            <div class="trend-chart">
                <!-- Add mini chart visualization here -->
            </div>
        </div>
    `).join('');
};

const updateAIInsights = (insights) => {
    const insightsList = document.querySelector('.insights-list');
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="insight-content">
                <p>${insight.text}</p>
                <span class="confidence">${insight.confidence}% confidence</span>
            </div>
        </div>
    `).join('');
};

const updateNewsAnalysis = (news) => {
    const newsList = document.querySelector('.news-list');
    newsList.innerHTML = news.map(item => `
        <div class="news-item">
            <div class="news-source">
                <img src="${item.source.icon}" alt="${item.source.name}">
                <span>${item.source.name}</span>
            </div>
            <p>${item.title}</p>
            <span class="sentiment ${item.sentiment}">${item.sentiment} Impact</span>
        </div>
    `).join('');
};

// UI Functions
const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

// Chat Interface Functions
const toggleChat = () => {
    const chatInterface = document.getElementById('chatInterface');
    chatVisible = !chatVisible;
    
    if (chatVisible) {
        chatInterface.style.display = 'flex';
        // Load conversations if the user is logged in
        checkAuth().then(isAuthenticated => {
            if (isAuthenticated) {
                loadConversations();
            }
        });
    } else {
        chatInterface.style.display = 'none';
    }
};

const toggleConversationList = () => {
    const conversationList = document.getElementById('conversationList');
    const chatMessages = document.getElementById('chatMessages');
    
    if (conversationList.style.display === 'flex') {
        conversationList.style.display = 'none';
        chatMessages.style.display = 'flex';
    } else {
        conversationList.style.display = 'flex';
        chatMessages.style.display = 'none';
    }
};

const loadConversations = async () => {
    try {
        const conversations = await apiClient.getConversations();
        const conversationList = document.getElementById('conversationList');
        
        // Clear current list
        conversationList.innerHTML = '';
        
        if (conversations.length === 0) {
            conversationList.innerHTML = '<div class="no-conversations">No previous conversations</div>';
            return;
        }
        
        // Add each conversation to the list
        conversations.forEach(conversation => {
            const date = new Date(conversation.updated_at);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            conversationItem.dataset.id = conversation.id;
            conversationItem.innerHTML = `
                <h4>${conversation.title}</h4>
                <div class="date">${formattedDate}</div>
            `;
            
            conversationItem.addEventListener('click', () => {
                loadConversation(conversation.id);
            });
            
            conversationList.appendChild(conversationItem);
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
        showNotification('Failed to load conversations', 'error');
    }
};

const loadConversation = async (conversationId) => {
    try {
        const messages = await apiClient.getConversationHistory(conversationId);
        currentConversationId = conversationId;
        
        // Toggle back to chat view
        const conversationList = document.getElementById('conversationList');
        const chatMessages = document.getElementById('chatMessages');
        conversationList.style.display = 'none';
        chatMessages.style.display = 'flex';
        
        // Clear current messages
        chatMessages.innerHTML = '';
        
        // Add messages to the chat
        messages.forEach(message => {
            displayMessage(message.content, message.role);
        });
        
        // Scroll to bottom
        scrollToBottom();
    } catch (error) {
        console.error('Error loading conversation:', error);
        showNotification('Failed to load conversation', 'error');
    }
};

const startNewConversation = () => {
    // Reset conversation ID
    currentConversationId = null;
    
    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    // Add welcome message
    displayMessage('Hello! I\'m your FinoSage AI Assistant. How can I help with your financial questions today?', 'assistant');
    
    // Toggle back to chat view if needed
    const conversationList = document.getElementById('conversationList');
    conversationList.style.display = 'none';
    chatMessages.style.display = 'flex';
};

const sendMessage = async (message) => {
    if (!message.trim()) return;
    
    // Display user message
    displayMessage(message, 'user');
    
    // Clear input
    document.getElementById('messageInput').value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Check auth before sending message
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            hideTypingIndicator();
            showNotification('Please log in to use the chat', 'error');
            return;
        }
        
        // Send message to API
        const response = await apiClient.sendMessage(message, currentConversationId);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Update conversation ID if this is a new conversation
        if (!currentConversationId && response.conversation_id) {
            currentConversationId = response.conversation_id;
        }
        
        // Display AI response
        displayMessage(response.message, 'assistant');
        
        // Scroll to bottom
        scrollToBottom();
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        showNotification('Failed to send message', 'error');
        
        // Display error message in chat
        displayMessage('Sorry, I encountered an error. Please try again later.', 'assistant');
    }
};

const displayMessage = (content, role) => {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    messageElement.innerHTML = `<p>${content}</p>`;
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
};

const scrollToBottom = () => {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const showTypingIndicator = () => {
    if (isTyping) return;
    
    isTyping = true;
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'block';
    
    // Scroll to bottom
    scrollToBottom();
};

const hideTypingIndicator = () => {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'none';
};

// Check if user is authenticated
async function checkAuth() {
    try {
        const user = await apiClient.getCurrentUser();
        if (!user) {
            // Show login prompt
            showNotification('Please log in to use all features', 'info');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

// Tool Navigation
function handleToolSelection(tool) {
    const button = event.currentTarget;
    
    // Add loading effect
    if (tool === 'builder') {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.style.pointerEvents = 'none';
        button.classList.add('loading');
        
        // Add ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        button.appendChild(ripple);
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size/2}px`;
        ripple.style.top = `${event.clientY - rect.top - size/2}px`;
        
        // Delayed navigation
        setTimeout(() => {
            window.location.href = 'portfolio-builder.html';
        }, 800);
    } else {
        // Navigate immediately for other tools
        switch(tool) {
            case 'analyzer':
                window.location.href = 'portfolio-analyzer.html';
                break;
            case 'research':
                window.location.href = 'ai-research.html';
                break;
        }
    }
}

// Initialize theme and setup
document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    await checkAuth();
    
    // Setup theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Setup user name
    const userName = localStorage.getItem('userName') || 'Guest';
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    
    // Add hover effect to builder card
    const builderCard = document.querySelector('.tool-card[data-tool="builder"]');
    if (builderCard) {
        const button = builderCard.querySelector('.tool-select-btn');
        
        button.addEventListener('mouseover', () => {
            builderCard.style.transform = 'translateY(-10px)';
            builderCard.style.boxShadow = '0 20px 30px rgba(99, 102, 241, 0.2)';
        });
        
        button.addEventListener('mouseout', () => {
            builderCard.style.transform = 'translateY(0)';
            builderCard.style.boxShadow = 'none';
        });
    }

    // Setup tool selection buttons
    document.querySelectorAll('.tool-select-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const tool = event.currentTarget.getAttribute('data-tool');
            handleToolSelection(tool);
        });
    });
    
    // Chat interface setup
    const chatButton = document.getElementById('chatButton');
    const closeChat = document.getElementById('closeChat');
    const conversationsButton = document.getElementById('conversationsButton');
    const newChatButton = document.getElementById('newChatButton');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    
    // Initially hide the chat interface
    document.getElementById('chatInterface').style.display = 'none';
    
    // Chat toggle
    chatButton.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);
    
    // Conversations toggle
    conversationsButton.addEventListener('click', toggleConversationList);
    
    // New chat button
    newChatButton.addEventListener('click', startNewConversation);
    
    // Message form submission
    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageInput.value;
        sendMessage(message);
    });
    
    // Set up chat interface
    document.getElementById('chatInterface').style.display = 'none';
    document.getElementById('conversationList').style.display = 'none';
}); 