// DOM Elements
const passwordInputs = document.querySelectorAll('input[type="password"]');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
const strengthMeter = document.querySelector('.strength-meter');
const strengthText = document.querySelector('.strength-text');
const authForm = document.querySelector('.auth-form');
const links = document.querySelectorAll('a[href]');

// Page Transition
function initPageTransitions() {
    links.forEach(link => {
        // Only handle internal links
        if (link.hostname === window.location.hostname) {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = link.href;
                
                // Fade out
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    window.location.href = target;
                }, 300);
            });
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Fade in on load
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '1';
    });
    
    initPageTransitions();
    initFloatingLabels();
    initFormInteractions();
});

// Floating labels
function initFloatingLabels() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input');
        const label = group.querySelector('label');
        
        if (input && label) {
            // Check initial state
            if (input.value) {
                label.classList.add('float');
            }
            
            // Handle input events
            input.addEventListener('focus', () => label.classList.add('float'));
            input.addEventListener('blur', () => {
                if (!input.value) {
                    label.classList.remove('float');
                }
            });
        }
    });
}

// Enhanced form interactions
function initFormInteractions() {
    const inputs = document.querySelectorAll('.form-group input');
    
    inputs.forEach(input => {
        // Add ripple effect on focus
        input.addEventListener('focus', () => {
            input.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', () => {
            input.style.transform = 'translateY(0)';
        });
        
        // Validate on input
        input.addEventListener('input', debounce(() => {
            validateField(input);
        }, 300));
    });
}

// Password visibility toggle with animation
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');
        
        // Animate icon
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.style.transform = 'rotate(0)';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }, 150);
        
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
    });
});

// Enhanced password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    const patterns = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate strength with weighted scoring
    strength += patterns.length ? 20 : 0;
    strength += patterns.lowercase ? 20 : 0;
    strength += patterns.uppercase ? 20 : 0;
    strength += patterns.numbers ? 20 : 0;
    strength += patterns.special ? 20 : 0;

    // Smooth animation for strength meter
    if (strengthMeter && strengthText) {
        requestAnimationFrame(() => {
            strengthMeter.style.setProperty('--strength-width', `${strength}%`);
            strengthMeter.style.setProperty('--strength-color', getStrengthColor(strength));
            
            // Animate text change
            strengthText.style.opacity = '0';
            setTimeout(() => {
                strengthText.textContent = `Password strength: ${getStrengthText(strength)}`;
                strengthText.style.opacity = '1';
            }, 200);
        });
    }

    return strength;
}

function getStrengthColor(strength) {
    if (strength < 40) return '#ff4444';
    if (strength < 60) return '#ffbb33';
    if (strength < 80) return '#00C851';
    return '#007E33';
}

function getStrengthText(strength) {
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
}

// Password input event listener
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
    });
}

// Form validation with improved UX
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields with animation
        const isValid = await validateForm();
        
        if (isValid) {
            try {
                const submitButton = authForm.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                
                // Enhanced loading state
                submitButton.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                `;
                submitButton.disabled = true;
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Success animation
                showNotification('Success! Redirecting...', 'success');
                
                // Smooth redirect
                setTimeout(() => {
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 300);
                }, 1500);
                
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        }
    });
}

// Enhanced notification system
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Enhanced positioning and animation
    Object.assign(notification.style, {
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        padding: '1rem 2rem',
        borderRadius: '0.75rem',
        color: 'white',
        zIndex: '1000',
        opacity: '0',
        transform: 'translateX(2rem)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(2rem)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(field, message) {
    clearError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ff4444';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#ff4444';
}

function clearError(field) {
    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

function debounce(func, wait) {
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

async function validateForm() {
    const requiredFields = authForm.querySelectorAll('[required]');
    let isValid = true;
    
    // Validate each field with animation
    for (const field of requiredFields) {
        const fieldValid = await validateField(field);
        isValid = isValid && fieldValid;
    }
    
    return isValid;
}

async function validateField(field) {
    let isValid = true;
    const label = field.parentNode.querySelector('label');
    
    // Clear existing errors
    clearError(field);
    
    // Required field validation
    if (field.required && !field.value.trim()) {
        isValid = false;
        await animateError(field, 'This field is required');
    }
    
    // Email validation
    if (field.type === 'email' && !isValidEmail(field.value)) {
        isValid = false;
        await animateError(field, 'Please enter a valid email address');
    }
    
    // Password match validation
    if (field.id === 'confirmPassword' && field.value !== passwordInput.value) {
        isValid = false;
        await animateError(field, 'Passwords do not match');
    }
    
    return isValid;
}

async function animateError(field, message) {
    field.style.transform = 'translateX(10px)';
    await new Promise(resolve => setTimeout(resolve, 50));
    field.style.transform = 'translateX(-10px)';
    await new Promise(resolve => setTimeout(resolve, 50));
    field.style.transform = 'translateX(0)';
    showError(field, message);
} 