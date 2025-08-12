// Check if user is already logged in
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication status using backend API
    if (window.authAPI && window.authAPI.isAuthenticated()) {
        const isLoggedIn = await window.authAPI.checkAuthStatus();
        if (isLoggedIn) {
            // If already logged in, redirect to appropriate page
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'index.html';
            window.location.href = redirectUrl;
            return;
        }
    }

    // Pre-fill email if coming from signup
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        document.getElementById('email').value = email;
    }
});

function showError(message) {
    console.log('Showing error:', message);
    showTopNotification(message, 'error');
    
    // Also show in form for backup
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.style.display = 'none';
        }
    }
}

function showSuccess(message) {
    console.log('Showing success:', message);
    showTopNotification(message, 'success');
    
    // Also show in form for backup
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    hideTopNotification();
}

function showTopNotification(message, type) {
    const notification = document.getElementById('topNotification');
    const messageEl = document.getElementById('notificationMessage');
    
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.className = `top-notification ${type}`;
        notification.style.display = 'block';
        document.body.classList.add('notification-shown');
        
        // Auto hide after 1 minute for success messages
        if (type === 'success') {
            setTimeout(() => {
                hideTopNotification();
            }, 60000);
        }
    }
}

function hideTopNotification() {
    const notification = document.getElementById('topNotification');
    if (notification) {
        notification.classList.add('slide-out');
        setTimeout(() => {
            notification.style.display = 'none';
            notification.classList.remove('slide-out');
            document.body.classList.remove('notification-shown');
        }, 400);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('handleLogin called');
    hideMessages();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    // Validation
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    // Show loading state
    loginBtn.textContent = 'Signing In...';
    loginBtn.disabled = true;
    document.querySelector('.login-form').classList.add('loading');

    try {
        // Authenticate user using backend API
        const result = await window.authAPI.login({
            email,
            password
        });

        if (result.success) {
            showSuccess('Login successful! Redirecting...');

            // Test authentication immediately after login
            console.log('✅ Login successful, user data:', result.user);
            console.log('🧪 Testing auth token:', window.authAPI.isAuthenticated());
            
            // Try to get current user to verify it works
            try {
                const currentUser = await window.authAPI.getCurrentUser();
                console.log('🧪 Current user from API:', currentUser);
            } catch (error) {
                console.error('❌ Error getting current user after login:', error);
            }

            // Much longer delay for user feedback, then redirect to home page
            setTimeout(() => {
                // Check if there's a redirect URL in the query params
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect') || 'index.html';

                // Redirect to the specified URL or default to home page
                window.location.href = redirectUrl;
            }, 5000);
        } else {
            showError(result.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button state
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
        document.querySelector('.login-form').classList.remove('loading');
    }
}

function socialLogin(provider) {
    showError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`);
}

function forgotPassword() {
    const email = document.getElementById('email').value.trim();
    if (email) {
        showSuccess(`Password reset instructions will be sent to ${email} (feature coming soon)`);
    } else {
        showError('Please enter your email address first.');
    }
}

// Handle form submission on Enter key
document.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const form = document.querySelector('.login-form');
        if (form.contains(event.target)) {
            handleLogin(event);
        }
    }
});