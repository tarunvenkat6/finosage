document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const authButtons = document.querySelectorAll('.auth-btn');

    // Add ripple effect to all auth buttons
    authButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            this.appendChild(ripple);

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        // Add loading state
        submitButton.classList.add('loading');
        const originalContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitButton.disabled = true;

        try {
            // Get form data
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Store user info in localStorage
            localStorage.setItem('userName', email.split('@')[0]);
            localStorage.setItem('isLoggedIn', 'true');

            // Redirect to advisor page with success animation
            submitButton.innerHTML = '<i class="fas fa-check"></i> Success!';
            submitButton.style.background = 'linear-gradient(135deg, #34d399, #059669)';
            
            setTimeout(() => {
                window.location.href = 'advisor.html';
            }, 500);

        } catch (error) {
            // Handle error
            submitButton.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            submitButton.innerHTML = '<i class="fas fa-times"></i> Error';
            
            setTimeout(() => {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent;
                submitButton.style.background = '';
            }, 2000);
        }
    });

    // Handle Google Sign In button
    const googleButton = document.getElementById('googleSignIn');
    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            googleButton.classList.add('loading');
            const originalContent = googleButton.innerHTML;
            googleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            googleButton.disabled = true;

            try {
                // Simulate Google sign in
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Store user info
                localStorage.setItem('userName', 'Google User');
                localStorage.setItem('isLoggedIn', 'true');

                // Success animation
                googleButton.innerHTML = '<i class="fas fa-check"></i> Connected!';
                googleButton.style.background = '#34d399';
                
                setTimeout(() => {
                    window.location.href = 'advisor.html';
                }, 500);

            } catch (error) {
                googleButton.innerHTML = '<i class="fas fa-times"></i> Error';
                googleButton.style.background = '#ef4444';
                
                setTimeout(() => {
                    googleButton.classList.remove('loading');
                    googleButton.disabled = false;
                    googleButton.innerHTML = originalContent;
                    googleButton.style.background = '';
                }, 2000);
            }
        });
    }
}); 