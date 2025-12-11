/* ============================================
   ROLE BUTTON TOGGLE: Handles switching between STAFF and SUPPLIER roles
   ============================================ */
const roleButtons = document.querySelectorAll(".role-toggle button");

// Initialize body class based on default active button
const defaultActiveButton = document.querySelector(".role-toggle button.active");
if (defaultActiveButton && defaultActiveButton.dataset.role === "supplier") {
  document.body.classList.add("supplier-selected");
} else {
  document.body.classList.remove("supplier-selected");
}

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all role buttons
    roleButtons.forEach((b) => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
    
    // Update body class based on selected role
    if (btn.dataset.role === "supplier") {
      document.body.classList.add("supplier-selected");
    } else {
      document.body.classList.remove("supplier-selected");
    }
  });
});

/* ============================================
   PASSWORD VISIBILITY TOGGLE: Handles show/hide password functionality
   ============================================ */
const visibilityButtons = document.querySelectorAll(".toggle-visibility");

visibilityButtons.forEach((btn) => {
  const targetId = btn.dataset.target;
  const input = document.getElementById(targetId);
  const iconImg = btn.querySelector("img[aria-hidden='true']");

  if (!input || !iconImg) return;
  // Initialize icon and accessible state to reflect the current input type
  if (input.type === "text") {
    btn.dataset.state = "visible";
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "Hide password");
    iconImg.src = "image/sn_eyes_open.png";
  } else {
    btn.dataset.state = "hidden";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Show password");
    iconImg.src = "image/sn_eyes_closed.png";
  }

  btn.addEventListener("click", () => {
    const isCurrentlyVisible = input.type === "text";

    if (isCurrentlyVisible) {
      // Switch to hidden (password dots)
      input.type = "password";
      btn.dataset.state = "hidden";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Show password");
      iconImg.src = "image/sn_eyes_closed.png"; // Change to closed eye icon
    } else {
      // Switch to visible (plain text)
      input.type = "text";
      btn.dataset.state = "visible";
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Hide password");
      iconImg.src = "image/sn_eyes_open.png"; // Change to open eye icon
    }
  });
});

/* ============================================
   LOGIN FORM SUBMISSION: Handles authentication with Supabase
   ============================================ */
const loginForm = document.querySelector(".login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent default form submission

  // Clear previous errors
  clearAllErrors();

  // Get form values
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  
  // Get selected role (STAFF or SUPPLIER)
  const selectedRoleButton = document.querySelector(".role-toggle button.active");
  const role = selectedRoleButton ? selectedRoleButton.dataset.role : "staff"; // Default to staff

  // Get login button and form elements for UI feedback
  const loginButton = document.querySelector(".login");
  const originalButtonText = loginButton.textContent;
  
  // Validate inputs
  let hasError = false;
  
  if (!email) {
    showFieldError("email", "Email is required");
    hasError = true;
  } else if (!validateEmail(email)) {
    showFieldError("email", "Please enter a valid email address");
    hasError = true;
  }
  
  if (!password) {
    showFieldError("password", "Password is required");
    hasError = true;
  } else if (password.length < 6) {
    showFieldError("password", "Password must be at least 6 characters");
    hasError = true;
  }
  
  if (hasError) {
    loginButton.disabled = false;
    return;
  }

  // Disable button and show loading state
  loginButton.disabled = true;
  loginButton.textContent = "LOGGING IN...";

  try {
    // Check if Supabase client is available
    if (!window.supabase) {
      throw new Error("Supabase client not initialized. Please refresh the page.");
    }

    // Authenticate user with Supabase
    const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      throw authError;
    }

    // Check if user exists in the appropriate role table
    const tableName = role === "staff" ? "staff" : "supplier";
    const { data: userData, error: userError } = await window.supabase
      .from(tableName)
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      throw new Error(`User not found in ${role} table. Please check your credentials.`);
    }

    // Verify role matches
    if (userData.role !== role) {
      throw new Error(`Invalid role. You are registered as ${userData.role}, not ${role}.`);
    }

    // Store user session data
    sessionStorage.setItem("user", JSON.stringify({
      id: authData.user.id,
      email: authData.user.email,
      role: role,
      userData: userData
    }));

    // Success message
    loginButton.textContent = "LOGIN SUCCESSFUL!";
    loginButton.style.background = "#4caf50"; // Green color for success
    
    // Show success message (you can customize this)
    console.log("Login successful!", {
      user: authData.user,
      role: role,
      userData: userData
    });

    // Redirect to statistic page after 1.5 seconds
    setTimeout(() => {
      window.location.href = "statistic-page.html";
    }, 1500);

  } catch (error) {
    // Handle errors
    console.error("Login error:", error);
    
    // Show field-specific errors
    let hasFieldError = false;
    
    if (error.message) {
      if (error.message.includes("Email not confirmed")) {
        showFieldError("email", "Email not confirmed. Please check your inbox.");
        hasFieldError = true;
      } else if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
        showFieldError("email", "Invalid email or password");
        showFieldError("password", "Invalid email or password");
        hasFieldError = true;
      } else if (error.message.includes("not found")) {
        showFieldError("email", "User not found. Please check your email.");
        hasFieldError = true;
      }
    }
    
    // If no field-specific error, show button error
    if (!hasFieldError) {
      let errorMessage = "LOGIN FAILED";
      if (error.message) {
        errorMessage = error.message.toUpperCase().substring(0, 20);
      }
      loginButton.textContent = errorMessage;
      loginButton.style.background = "#f44336"; // Red color for error

      // Reset button after 3 seconds
      setTimeout(() => {
        loginButton.textContent = originalButtonText;
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || "#9D5858";
        loginButton.style.background = primaryColor;
        loginButton.disabled = false;
      }, 3000);
    } else {
      // Re-enable button if field errors shown
      loginButton.disabled = false;
      loginButton.textContent = originalButtonText;
    }
  }
});

/* ============================================
   LOGO BUTTON: Track clicks to activate developer options
   ============================================ */
let logoClickCount = 0;
let logoClickTimeout = null;
const LOGO_CLICKS_NEEDED = 5;
const CLICK_TIMEOUT = 2000; // 2 seconds between clicks

const logoButton = document.getElementById('logo-button');
if (logoButton) {
  logoButton.addEventListener('click', () => {
    // Clear existing timeout
    if (logoClickTimeout) {
      clearTimeout(logoClickTimeout);
    }
    
    // Increment click count
    logoClickCount++;
    
    // Reset count if too much time has passed
    logoClickTimeout = setTimeout(() => {
      logoClickCount = 0;
    }, CLICK_TIMEOUT);
    
    // Check if we've reached the required number of clicks
    if (logoClickCount >= LOGO_CLICKS_NEEDED) {
      logoClickCount = 0;
      clearTimeout(logoClickTimeout);
      
      // Show developer popup
      showDeveloperPopup();
    }
  });
}

// Show developer popup and reveal developer options button
function showDeveloperPopup() {
  const popup = document.getElementById('developer-popup');
  const developerBtn = document.getElementById('developer-options-btn');
  
  if (popup) {
    popup.style.display = 'flex';
    
    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      popup.style.display = 'none';
      
      // Show developer options button
      if (developerBtn) {
        developerBtn.style.display = 'block';
      }
    }, 2000);
  }
}

/* ============================================
   FORGOT PASSWORD REDIRECT: Send user to forgot-password.html
   ============================================ */
const forgotButton = document.querySelector('.forgot-password-btn');
if (forgotButton) {
  forgotButton.addEventListener('click', () => {
    // Use a relative redirect so the static site can be served from root
    window.location.href = 'forgot-password.html';
  });
}

// Back button on forgot-password page: navigate back to index
const backButton = document.querySelector('.back-button');
if (backButton) {
  backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

/* ============================================
   VALIDATION UTILITIES: Reusable validation functions
   ============================================ */
// Show error on a field
function showFieldError(fieldId, errorMessage, scrollToField = true) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  // Add error class to field
  field.classList.add('error');
  
  // Check if error message element already exists
  let errorElement = document.getElementById(`${fieldId}-error`);
  
  if (errorElement) {
    // Update existing error message
    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';
  } else {
    // Create error message element
    errorElement = document.createElement('span');
    errorElement.id = `${fieldId}-error`;
    errorElement.className = 'error-message';
    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';
    
    // Insert error message after the input field (or after input-wrap if it exists)
    const inputWrap = field.closest('.input-wrap');
    if (inputWrap) {
      inputWrap.parentElement.insertBefore(errorElement, inputWrap.nextSibling);
    } else {
      field.parentElement.insertBefore(errorElement, field.nextSibling);
    }
  }
  
  // Scroll to field if requested
  if (scrollToField) {
    setTimeout(() => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus();
    }, 100);
  }
}

// Clear error from a field
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.classList.remove('error');
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.style.display = 'none';
    errorElement.textContent = '';
  }
}

// Clear all errors in a form
function clearAllErrors(formId) {
  // Clear all error classes
  const errorFields = document.querySelectorAll('.error');
  errorFields.forEach(field => {
    field.classList.remove('error');
  });
  
  // Hide all error messages
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(msg => {
    msg.style.display = 'none';
    msg.textContent = '';
  });
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic validation)
function validatePhone(phone) {
  const phoneRegex = /^[0-9+\-\s()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

// Clear errors when user starts typing
document.addEventListener('input', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.target.classList.contains('error')) {
      clearFieldError(e.target.id);
    }
  }
});

/* ============================================
   FORGOT-PASSWORD FLOW: Front-end wiring to server endpoints
   Endpoints (placeholders):
     POST ${ENDPOINT_BASE}/send-otp     -> { email }
     POST ${ENDPOINT_BASE}/verify-otp   -> { email, otp, newPassword }
   Configure ENDPOINT_BASE below to point to your deployed server/edge function.
   ============================================ */
// Set this to your deployed server endpoint base (no trailing slash). Example:
// For Supabase Edge Functions the external URL needs the `/functions/v1` prefix.
// Use the project URL shown in your Supabase dashboard. Example value below:
const ENDPOINT_BASE = 'https://giksmtowehwmgqyymevp.supabase.co/functions/v1';

// Only run forgot-password handlers when on the forgot page
const fpEmail = document.getElementById('fp-email');
const requestOtpBtn = document.querySelector('.request-otp');
const otpInput = document.getElementById('otp');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const changeBtn = document.querySelector('form.login-form .login');

if (requestOtpBtn && fpEmail) {
  requestOtpBtn.addEventListener('click', async () => {
    // Clear previous errors
    clearFieldError('fp-email');
    
    const email = fpEmail.value.trim();
    if (!email) {
      showFieldError('fp-email', 'Email is required');
      return;
    }
    if (!validateEmail(email)) {
      showFieldError('fp-email', 'Please enter a valid email address');
      return;
    }

    requestOtpBtn.disabled = true;
    const originalText = requestOtpBtn.textContent;
    requestOtpBtn.textContent = 'SENDING OTP...';

    try {
      const endpoint = (ENDPOINT_BASE || '') + '/send-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed (${res.status})`);
      }

      // Success - inform user and focus OTP input
      requestOtpBtn.textContent = 'OTP SENT';
      if (otpInput) otpInput.focus();
      // keep button disabled for short period to avoid re-click spam
      setTimeout(() => {
        requestOtpBtn.disabled = false;
        requestOtpBtn.textContent = originalText;
      }, 3000);
    } catch (err) {
      console.error('send-otp error', err);
      // Network errors are common while server not deployed - give hint
      if (err instanceof TypeError) {
        alert('Unable to contact OTP server. Make sure you deployed the server and set ENDPOINT_BASE in script.js to its URL.');
      } else {
        alert('Failed to send OTP: ' + (err.message || 'Unknown error'));
      }
      requestOtpBtn.disabled = false;
      requestOtpBtn.textContent = originalText;
    }
  });
}

if (changeBtn && fpEmail && otpInput && newPasswordInput && confirmPasswordInput) {
  changeBtn.addEventListener('click', async (e) => {
    // prevent normal form submit - we'll handle it
    e.preventDefault();

    // Clear previous errors
    clearAllErrors();

    const email = fpEmail.value.trim();
    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validate inputs
    let hasError = false;
    
    if (!email) {
      showFieldError('fp-email', 'Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      showFieldError('fp-email', 'Please enter a valid email address');
      hasError = true;
    }
    
    if (!otp) {
      showFieldError('otp', 'OTP code is required');
      hasError = true;
    } else if (otp.length < 4) {
      showFieldError('otp', 'OTP code must be at least 4 digits');
      hasError = true;
    }
    
    if (!newPassword) {
      showFieldError('new-password', 'New password is required');
      hasError = true;
    } else if (newPassword.length < 6) {
      showFieldError('new-password', 'Password must be at least 6 characters');
      hasError = true;
    }
    
    if (!confirmPassword) {
      showFieldError('confirm-password', 'Please confirm your password');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      showFieldError('confirm-password', 'Passwords do not match');
      hasError = true;
    }
    
    if (hasError) {
      changeBtn.disabled = false;
      return;
    }

    changeBtn.disabled = true;
    const oldText = changeBtn.textContent;
    changeBtn.textContent = 'CHANGING...';

    try {
      const endpoint = (ENDPOINT_BASE || '') + '/verify-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed (${res.status})`);
      }

      // Success - redirect to login
      changeBtn.textContent = 'PASSWORD CHANGED';
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } catch (err) {
      console.error('verify-otp error', err);
      
      // Show field-specific errors
      let hasFieldError = false;
      
      if (err instanceof TypeError) {
        showFieldError('fp-email', 'Unable to contact server. Please check your connection.');
        hasFieldError = true;
      } else if (err.message) {
        if (err.message.includes('OTP') || err.message.includes('otp')) {
          showFieldError('otp', err.message || 'Invalid OTP code');
          hasFieldError = true;
        } else if (err.message.includes('password')) {
          showFieldError('new-password', err.message || 'Invalid password');
          hasFieldError = true;
        } else {
          showFieldError('fp-email', err.message || 'Failed to change password');
          hasFieldError = true;
        }
      }
      
      if (!hasFieldError) {
        changeBtn.textContent = 'CHANGE FAILED';
        changeBtn.style.background = '#f44336';
        setTimeout(() => {
          changeBtn.textContent = oldText;
          const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#9D5858';
          changeBtn.style.background = primaryColor;
          changeBtn.disabled = false;
        }, 2000);
      } else {
        changeBtn.disabled = false;
        changeBtn.textContent = oldText;
      }
    }
  });
}

