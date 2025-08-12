// Check if user is already logged in
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication status using backend API
    if (window.authAPI && window.authAPI.isAuthenticated()) {
        const isLoggedIn = await window.authAPI.checkAuthStatus();
        if (isLoggedIn) {
            window.location.href = 'dashboard-home.html';
            return;
        }
    }

    // Pre-fill email if provided in URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        document.getElementById('email').value = email;
    }

    // Add password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthDiv = document.createElement('div');
    strengthDiv.className = 'password-strength';
    passwordInput.parentNode.insertBefore(strengthDiv, passwordInput.nextSibling);

    passwordInput.addEventListener('input', function () {
        const strength = checkPasswordStrength(this.value);
        strengthDiv.textContent = strength.text;
        strengthDiv.className = `password-strength ${strength.class}`;
    });
});

function checkPasswordStrength(password) {
    if (password.length < 6) {
        return { text: 'Password too short', class: 'strength-weak' };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) {
        return { text: 'Weak password', class: 'strength-weak' };
    } else if (score < 4) {
        return { text: 'Medium strength', class: 'strength-medium' };
    } else {
        return { text: 'Strong password', class: 'strength-strong' };
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    const successDiv = document.getElementById('successMessage');
    successDiv.style.display = 'none';
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';

    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function showSuccessWithRedirect(email) {
    const loginModal = document.querySelector('.login-modal');

    loginModal.innerHTML = `
        <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f97316">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span class="logo-text">crowd</span>
        </div>
        
        <div class="success-redirect">
            <h1>Account Created Successfully! 🎉</h1>
            <div class="redirect-message">
                Welcome to Crowd! Your account has been created successfully.
            </div>
            <div class="redirect-countdown" id="countdownMessage">
                Redirecting you to login page in <span id="countdown">5</span> seconds...
            </div>
            <a href="login.html?email=${encodeURIComponent(email)}" class="redirect-btn">
                Go to Login Now
            </a>
        </div>
    `;

    // Start countdown
    let countdown = 5;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.location.href = `login.html?email=${encodeURIComponent(email)}`;
        }
    }, 1000);
}

async function handleSignup(event) {
    event.preventDefault();
    hideMessages();

    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const isOrganizer = document.getElementById('isOrganizer').checked;
    const signupBtn = document.getElementById('signupBtn');

    // Validation
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
        showError('Please fill in all fields.');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    // Show loading state
    signupBtn.textContent = 'Creating Account...';
    signupBtn.disabled = true;
    document.querySelector('.login-form').classList.add('loading');

    try {
        // Create user using backend API
        const result = await window.authAPI.signup({
            email,
            firstName,
            lastName,
            password,
            isOrganizer
        });

        if (result.success) {
            // Show success message and redirect to login
            showSuccessWithRedirect(email);
        } else {
            showError(result.error || 'Account creation failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
        // Reset button state only if there was an error
        if (document.getElementById('signupBtn')) {
            signupBtn.textContent = 'Create Account';
            signupBtn.disabled = false;
            document.querySelector('.login-form').classList.remove('loading');
        }
    }
}

// Handle form submission on Enter key
document.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const form = document.querySelector('.login-form');
        if (form && form.contains(event.target)) {
            handleSignup(event);
        }
    }
});