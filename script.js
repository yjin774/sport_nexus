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

    // Redirect based on role
    // Supplier users go to supplier portal, staff users go to statistic page
    const redirectUrl = role === "supplier" 
      ? "supplier-po-management.html" 
      : "statistic-page.html";
    
    setTimeout(() => {
      window.location.href = redirectUrl;
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
   FORGOT-PASSWORD FLOW: Using Supabase directly
   ============================================ */

// Only run forgot-password handlers when on the forgot page
const fpEmail = document.getElementById('fp-email');
const requestOtpBtn = document.querySelector('.request-otp');
const otpInput = document.getElementById('otp');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const changeBtn = document.querySelector('form.login-form .login');

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP using Supabase
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

    // Check if Supabase client is available
    if (!window.supabase) {
      alert('Supabase client not initialized. Please refresh the page.');
      return;
    }

    requestOtpBtn.disabled = true;
    const originalText = requestOtpBtn.textContent;
    requestOtpBtn.textContent = 'SENDING OTP...';

    try {
      // Try using Supabase's built-in signInWithOtp() first (if SMTP is configured)
      // This automatically generates a 6-digit OTP and sends it via email
      let useBuiltInOtp = false;
      let otp = null;
      
      try {
        const { data, error } = await window.supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false // Don't create user if doesn't exist
          }
        });

        if (!error && data) {
          // Success - Supabase sent the OTP via email
          useBuiltInOtp = true;
          console.log('OTP sent successfully via Supabase built-in email service');
        } else if (error) {
          // If SMTP is not configured, fall back to database storage method
          if (error.message.includes('magic link email') || error.message.includes('SMTP') || error.message.includes('email')) {
            console.log('Supabase SMTP not configured, using database storage method');
            useBuiltInOtp = false;
          } else {
            // Other errors (rate limit, invalid email, etc.)
            if (error.message.includes('rate limit') || error.message.includes('too many')) {
              throw new Error('Too many requests. Please wait a moment before requesting another OTP.');
            } else if (error.message.includes('invalid email')) {
              throw new Error('Invalid email address. Please check and try again.');
            } else {
              throw new Error(error.message || 'Failed to send OTP. Please try again.');
            }
          }
        }
      } catch (supabaseError) {
        // If signInWithOtp fails, fall back to database method
        console.log('Falling back to database storage method:', supabaseError);
        useBuiltInOtp = false;
      }

      // If Supabase's built-in OTP didn't work, use the database storage method
      if (!useBuiltInOtp) {
        // Generate OTP
        otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

        // Store OTP in password_resets table
        const { data: insertData, error: insertError } = await window.supabase
          .from('password_resets')
          .insert({
            email: email,
            otp_code: otp,
            expires_at: expiresAt,
            used: false
          })
          .select();

        if (insertError) {
          console.error('Full insert error:', insertError);
          
          // If table doesn't exist, show error with instructions
          if (insertError.message.includes('relation') || insertError.message.includes('does not exist') || insertError.message.includes('schema cache')) {
            throw new Error('OTP table not found. Please run setup-otp-table-simple.sql in your Supabase SQL Editor.');
          }
          // If column doesn't exist, show specific error
          if (insertError.message.includes('otp_code') || insertError.message.includes('column')) {
            throw new Error('OTP table schema is incorrect. Please run setup-otp-table-simple.sql in your Supabase SQL Editor.');
          }
          // If RLS policy issue
          if (insertError.message.includes('policy') || insertError.message.includes('permission') || insertError.message.includes('RLS')) {
            throw new Error('Permission denied. Please check Row Level Security policies.');
          }
          throw new Error('Failed to store OTP: ' + (insertError.message || 'Unknown error'));
        }

        // Try to send email via Edge Function (if available)
        try {
          const { data: emailData, error: emailError } = await window.supabase.functions.invoke('send-otp-email', {
            body: { email, otp }
          });

          if (emailError || (emailData && !emailData.success)) {
            // Email service not configured - show OTP in alert for development
            console.log(`OTP for ${email}: ${otp}`);
            alert(`OTP Code: ${otp}\n\n⚠️ Development Mode: Email service not configured.\n\nTo enable email:\n1. Configure SMTP in Supabase Dashboard > Settings > Auth > SMTP Settings\n2. Or deploy send-otp-email Edge Function with SENDGRID_API_KEY`);
          } else {
            console.log('OTP email sent via Edge Function');
          }
        } catch (emailErr) {
          // Edge Function not available - show OTP for development
          console.log(`OTP for ${email}: ${otp}`);
          alert(`OTP Code: ${otp}\n\n⚠️ Development Mode: Email service not configured.\n\nTo enable email:\n1. Configure SMTP in Supabase Dashboard > Settings > Auth > SMTP Settings\n2. Or deploy send-otp-email Edge Function with SENDGRID_API_KEY`);
        }
      }
      
      // Success - inform user and focus OTP input
      requestOtpBtn.textContent = 'OTP SENT';
      if (otpInput) {
        otpInput.focus();
      }
      
      // Keep button disabled for short period to avoid re-click spam
      setTimeout(() => {
        requestOtpBtn.disabled = false;
        requestOtpBtn.textContent = originalText;
      }, 3000);
    } catch (err) {
      console.error('send-otp error', err);
      alert('Failed to send OTP: ' + (err.message || 'Unknown error'));
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
    } else if (otp.length < 6) {
      showFieldError('otp', 'OTP code must be 6 digits');
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

    // Check if Supabase client is available
    if (!window.supabase) {
      alert('Supabase client not initialized. Please refresh the page.');
      changeBtn.disabled = false;
      return;
    }

    changeBtn.disabled = true;
    const oldText = changeBtn.textContent;
    changeBtn.textContent = 'CHANGING...';

    try {
      // Try to verify OTP using Supabase's built-in verifyOtp() first
      // This works if OTP was sent via signInWithOtp()
      let otpVerified = false;
      let verifiedUser = null;

      try {
        const { data: verifyData, error: verifyError } = await window.supabase.auth.verifyOtp({
          email: email,
          token: otp,
          type: 'email'
        });

        if (!verifyError && verifyData && verifyData.user) {
          // OTP verified successfully via Supabase Auth
          otpVerified = true;
          verifiedUser = verifyData.user;
          console.log('OTP verified successfully via Supabase Auth');
        } else if (verifyError) {
          // If verification fails, it might be because OTP was stored in database instead
          console.log('Supabase Auth OTP verification failed, trying database method:', verifyError.message);
          otpVerified = false;
        }
      } catch (verifyErr) {
        // If verifyOtp fails, try database method
        console.log('verifyOtp error, trying database method:', verifyErr);
        otpVerified = false;
      }

      // If Supabase Auth verification didn't work, try database method
      if (!otpVerified) {
        // Verify OTP from password_resets table
        const { data: otpRecords, error: otpError } = await window.supabase
          .from('password_resets')
          .select('*')
          .eq('email', email)
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (otpError) {
          throw new Error('Failed to verify OTP. Please try requesting a new one.');
        }

        if (!otpRecords || otpRecords.length === 0) {
          throw new Error('No valid OTP found. Please request a new OTP code.');
        }

        const otpRecord = otpRecords[0];

        // Check if OTP matches
        if (otpRecord.otp_code !== otp) {
          throw new Error('Invalid OTP code. Please check and try again.');
        }

        // Check if OTP is expired
        const now = new Date();
        const expiresAt = new Date(otpRecord.expires_at);
        if (expiresAt < now) {
          throw new Error('OTP code has expired. Please request a new one.');
        }

        // Check if OTP is already used
        if (otpRecord.used) {
          throw new Error('OTP code has already been used. Please request a new one.');
        }

        // Mark OTP as used
        const { error: updateError } = await window.supabase
          .from('password_resets')
          .update({ used: true })
          .eq('id', otpRecord.id);

        if (updateError) {
          console.error('Error marking OTP as used:', updateError);
        }

        otpVerified = true;
      }

      // Update password - use different methods based on how OTP was verified
      if (verifiedUser) {
        // OTP was verified via Supabase Auth, user is now authenticated
        // We can update password directly using updateUser()
        const { error: updatePasswordError } = await window.supabase.auth.updateUser({
          password: newPassword
        });

        if (updatePasswordError) {
          throw new Error(updatePasswordError.message || 'Failed to update password. Please try again.');
        }

        // Success - password updated
        changeBtn.textContent = 'PASSWORD CHANGED';
        changeBtn.style.background = '#4caf50';
        
        alert('Password changed successfully! You can now login with your new password.');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        // OTP was verified from database, use Edge Function to update password
        try {
          const { data: updateData, error: updatePasswordError } = await window.supabase.functions.invoke('update-password', {
            body: { 
              email: email,
              newPassword: newPassword,
              otp: otp
            }
          });

          if (updatePasswordError) {
            throw new Error(updatePasswordError.message || 'Failed to update password. Please try again.');
          }

          // Success - password updated
          changeBtn.textContent = 'PASSWORD CHANGED';
          changeBtn.style.background = '#4caf50';
          
          alert('Password changed successfully! You can now login with your new password.');
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
          
        } catch (updateErr) {
          // If Edge Function doesn't exist, fall back to Supabase's password reset email
          console.warn('Password update Edge Function not available, using fallback:', updateErr);
          
          // Fallback: Use Supabase's built-in password reset
          const { error: resetError } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/forgot-password.html?reset=true`
          });

          if (resetError) {
            throw new Error('Failed to update password. Please contact support.');
          }

          // Success - password reset email sent
          changeBtn.textContent = 'RESET EMAIL SENT';
          changeBtn.style.background = '#4caf50';
          
          alert('OTP verified! A password reset link has been sent to your email. Please check your inbox to complete the password change.');
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        }
      }
      
    } catch (err) {
      console.error('verify-otp error', err);
      
      // Show field-specific errors
      let hasFieldError = false;
      
      if (err.message) {
        if (err.message.includes('OTP') || err.message.includes('otp') || err.message.includes('Invalid')) {
          showFieldError('otp', err.message || 'Invalid OTP code');
          hasFieldError = true;
        } else if (err.message.includes('expired')) {
          showFieldError('otp', 'OTP code has expired. Please request a new one.');
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

