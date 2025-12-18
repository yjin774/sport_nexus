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
  // Generate a random number between 100000 and 999999 (6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000);
  // Ensure it's exactly 6 digits by padding with zeros if needed
  return otp.toString().padStart(6, '0');
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
      // Always use custom 6-digit OTP generation (not Supabase's built-in OTP)
      // Generate 6-digit OTP
      const otp = generateOTP();
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

      // Try to send email via Edge Function (if available) with timeout
      let emailSent = false;
      try {
        // Create a timeout promise (20 seconds - SMTP can take time, especially with STARTTLS)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 20000);
        });

        // Race between the Edge Function call and timeout
        const edgeFunctionPromise = window.supabase.functions.invoke('send-otp-email', {
          body: { email, otp }
        });

        const result = await Promise.race([edgeFunctionPromise, timeoutPromise]);
        const { data: emailData, error: emailError } = result;

        if (emailError) {
          console.error('Edge Function error:', emailError);
          // Reset button immediately
          requestOtpBtn.disabled = false;
          requestOtpBtn.textContent = originalText;
          
          // Check if it's a network error or function not found
          if (emailError.message && (emailError.message.includes('Failed to fetch') || emailError.message.includes('not found'))) {
            console.log(`Edge Function not deployed. OTP for ${email}: ${otp}`);
            alert(`OTP Code: ${otp}\n\n⚠️ Edge Function not deployed.\n\nTo enable email:\n1. Deploy send-otp-email Edge Function\n2. Set SMTP environment variables\n3. See SMTP_SETUP_INSTRUCTIONS.md`);
            return;
          } else {
            // Other error - might be SMTP configuration issue
            console.log(`Email sending failed. OTP for ${email}: ${otp}`);
            console.error('Email error details:', emailError);
            alert(`OTP Code: ${otp}\n\n⚠️ Email sending failed.\n\nCheck:\n1. Edge Function logs in Supabase Dashboard\n2. SMTP environment variables are set correctly\n3. See SMTP_SETUP_INSTRUCTIONS.md`);
            return;
          }
        } else if (emailData) {
          // Check response structure
          if (emailData.success === false || emailData.devMode) {
            // SMTP not configured - show OTP
            console.log(`SMTP not configured. OTP for ${email}: ${otp}`);
            requestOtpBtn.disabled = false;
            requestOtpBtn.textContent = originalText;
            
            if (emailData.otp) {
              alert(`OTP Code: ${emailData.otp}\n\n⚠️ Development Mode: SMTP not configured.\n\nTo enable email:\n1. Set SMTP environment variables in Edge Function settings\n2. See SMTP_SETUP_INSTRUCTIONS.md`);
            } else {
              alert(`OTP Code: ${otp}\n\n⚠️ Development Mode: SMTP not configured.\n\nTo enable email:\n1. Set SMTP environment variables in Edge Function settings\n2. See SMTP_SETUP_INSTRUCTIONS.md`);
            }
            return;
          } else {
            // Email sent successfully
            emailSent = true;
            console.log('✅ OTP email sent successfully via Edge Function');
          }
        } else {
          // No data returned - assume success if no error
          emailSent = true;
          console.log('OTP email sent via Edge Function (no response data)');
        }
      } catch (emailErr) {
        // Edge Function not available, timeout, or other error
        console.error('Edge Function invocation error:', emailErr);
        console.log(`OTP for ${email}: ${otp}`);
        
        // Reset button immediately
        requestOtpBtn.disabled = false;
        requestOtpBtn.textContent = originalText;
        
        // Check if it's a timeout
        if (emailErr.message && emailErr.message.includes('timeout')) {
          alert(`OTP Code: ${otp}\n\n⚠️ Request timeout (20 seconds).\n\nThe email may still be sent. Please check your inbox.\n\nIf the problem persists, check:\n1. Network connection\n2. Edge Function logs in Supabase Dashboard\n3. Try using port 465 instead of 587 for faster connection`);
        } else {
          alert(`OTP Code: ${otp}\n\n⚠️ Edge Function error.\n\nCheck:\n1. Function is deployed: send-otp-email\n2. Function logs in Supabase Dashboard\n3. See SMTP_SETUP_INSTRUCTIONS.md`);
        }
        return;
      }
      
      // Success - inform user and focus OTP input
      if (emailSent) {
        requestOtpBtn.textContent = 'OTP SENT ✓';
        if (otpInput) {
          otpInput.focus();
        }
        
        // Keep button disabled for short period to avoid re-click spam
        setTimeout(() => {
          requestOtpBtn.disabled = false;
          requestOtpBtn.textContent = originalText;
        }, 3000);
      }
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
      // Verify OTP from password_resets table (always use database method for 6-digit OTP)
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

        // OTP verified locally - now update password using Edge Function (requires Admin API)
        // The Edge Function will verify the OTP again and mark it as used after successful password update
        try {
          const { data: verifyData, error: verifyError } = await window.supabase.functions.invoke('verify-otp', {
            body: { 
              email: email,
              otp: otp,
              newPassword: newPassword
            }
          });

          if (verifyError) {
            console.error('Verify OTP error:', verifyError);
            
            // Try to extract the actual error message from the response
            let errorMessage = 'Failed to update password. Please try again.';
            
            // Check if error has a message property
            if (verifyError.message) {
              errorMessage = verifyError.message;
            }
            
            // Try to get error from context/response
            if (verifyError.context) {
              // Check if there's a response body we can parse
              if (verifyError.context.body) {
                try {
                  const errorBody = typeof verifyError.context.body === 'string' 
                    ? JSON.parse(verifyError.context.body) 
                    : verifyError.context.body;
                  if (errorBody.error) {
                    errorMessage = errorBody.error;
                  } else if (errorBody.message) {
                    errorMessage = errorBody.message;
                  }
                } catch (e) {
                  console.error('Failed to parse error body:', e);
                }
              }
              
              // Check response text if available
              if (verifyError.context.responseText) {
                try {
                  const errorBody = JSON.parse(verifyError.context.responseText);
                  if (errorBody.error) {
                    errorMessage = errorBody.error;
                  }
                } catch (e) {
                  // Not JSON, use as is
                  if (verifyError.context.responseText) {
                    errorMessage = verifyError.context.responseText;
                  }
                }
              }
            }
            
            throw new Error(errorMessage);
          }

          if (!verifyData || !verifyData.success) {
            const errorMsg = verifyData?.error || verifyData?.message || 'Failed to update password. Please try again.';
            throw new Error(errorMsg);
          }
        } catch (invokeError) {
          // If it's already our custom error, re-throw it
          if (invokeError.message && !invokeError.message.includes('non-2xx')) {
            throw invokeError;
          }
          
          // Otherwise, try to get more details
          console.error('Edge Function invocation failed:', invokeError);
          throw new Error(invokeError.message || 'Failed to update password. Please check Edge Function logs in Supabase Dashboard.');
        }

        // Success - password updated
        changeBtn.textContent = 'PASSWORD CHANGED';
        changeBtn.style.background = '#4caf50';
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      
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

