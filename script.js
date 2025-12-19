/* ============================================
   ROLE BUTTON TOGGLE: Handles switching between STAFF and SUPPLIER roles
   ============================================ */
const roleButtons = document.querySelectorAll(".role-toggle button");

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all role buttons
    roleButtons.forEach((b) => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
    
    // Toggle supplier-selected class on body for color theme
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

  // Get form values
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  
  // Get selected role (STAFF or SUPPLIER)
  const selectedRoleButton = document.querySelector(".role-toggle button.active");
  const role = selectedRoleButton ? selectedRoleButton.dataset.role : "staff"; // Default to staff

  // Get login button and form elements for UI feedback
  const loginButton = document.querySelector(".login");
  const originalButtonText = loginButton.textContent;

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

    // Redirect based on role after 1.5 seconds
    setTimeout(() => {
      if (role === "supplier") {
        window.location.href = "supplier-po-management.html";
      } else {
        window.location.href = "statistic-page.html";
      }
    }, 1500);

  } catch (error) {
    // Handle errors
    console.error("Login error:", error);
    
    // Show error message
    loginButton.textContent = "LOGIN FAILED";
    loginButton.style.background = "#f44336"; // Red color for error
  // Use the UI state to indicate failure (no popup alert)
  // Optionally log the error for debugging
  console.error('Login failed:', error);

    // Reset button after 2 seconds
    setTimeout(() => {
      loginButton.textContent = originalButtonText;
      loginButton.style.background = "#9D5858";
      loginButton.disabled = false;
    }, 2000);
  }
});

/* ============================================
   FORGOT PASSWORD REDIRECT: Send user to forgot-password.html
   ============================================ */
const forgotButton = document.querySelector('.forgot');
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
    const email = fpEmail.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      fpEmail.focus();
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

    const email = fpEmail.value.trim();
    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!email) { alert('Enter your email'); fpEmail.focus(); return; }
    if (!otp) { alert('Enter the OTP sent to your email'); otpInput.focus(); return; }
    if (!newPassword || newPassword.length < 6) { alert('New password must be at least 6 characters'); newPasswordInput.focus(); return; }
    if (newPassword !== confirmPassword) { alert('Passwords do not match'); confirmPasswordInput.focus(); return; }

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
      if (err instanceof TypeError) {
        alert('Unable to contact server. Deploy the server and set ENDPOINT_BASE in script.js');
      } else {
        alert('Failed to change password: ' + (err.message || 'Unknown error'));
      }
      changeBtn.disabled = false;
      changeBtn.textContent = oldText;
    }
  });
}

