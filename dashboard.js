/* ============================================
   DASHBOARD COMMON FUNCTIONS
   ============================================ */

// Log Activity Function (for dashboard pages)
async function logActivity(activityType, entityType, entityId, description, userId, additionalData, reason = null) {
  try {
    if (!window.supabase) return;

    // Get user info from session or use provided userId
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const authUserId = userId || userSession.userData?.id;
    const userEmail = userSession.userData?.email;
    const userName = userSession.userData?.username || userSession.userData?.email || 'Unknown';

    if (!authUserId) {
      console.warn('No user ID available for logging activity');
      return;
    }

    // Try to find staff record
    let staffData = null;
    
    // Method 1: Try by user_id
    if (authUserId) {
      const result1 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('user_id', authUserId)
        .maybeSingle();
      if (result1.data) staffData = result1.data;
    }

    // Method 2: Try by email
    if (!staffData && userEmail) {
      const result2 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('email', userEmail)
        .maybeSingle();
      if (result2.data) staffData = result2.data;
    }

    // Method 3: Try if auth user ID is staff ID
    if (!staffData && authUserId) {
      const result3 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('id', authUserId)
        .maybeSingle();
      if (result3.data) staffData = result3.data;
    }

    // Use staff ID if found, otherwise fallback to auth user ID
    const staffId = staffData?.id || authUserId;
    const staffName = staffData ?
      (staffData.username ||
       (staffData.first_name && staffData.last_name ? `${staffData.first_name} ${staffData.last_name}` : null) ||
       staffData.email ||
       userName) :
      userName;

    // Prepare log entry - replace underscores with spaces in stored values
    const formatForLog = (value) => {
      if (typeof value === 'string') {
        return value.replace(/_/g, ' ');
      }
      if (typeof value === 'object' && value !== null) {
        const formatted = {};
        for (const key in value) {
          formatted[key.replace(/_/g, ' ')] = formatForLog(value[key]);
        }
        return formatted;
      }
      return value;
    };
    
    const formattedActivityType = formatForLog(activityType);
    const formattedEntityType = formatForLog(entityType);
    const formattedDescription = formatForLog(description);
    const formattedAdditionalData = typeof additionalData === 'object' && additionalData !== null 
      ? formatForLog(additionalData) 
      : (typeof additionalData === 'string' ? formatForLog(additionalData) : additionalData);
    
    const logEntry = {
      user_id: staffId,
      user_name: staffName,
      user_type: 'staff',
      activity_type: formattedActivityType,
      entity_type: formattedEntityType,
      entity_id: entityId,
      action_description: formattedDescription,
      old_value: typeof formattedAdditionalData === 'object' ? JSON.stringify(formattedAdditionalData) : formattedAdditionalData,
      new_value: null,
      source: 'website',
      status: 'success',
      timestamp: new Date().toISOString(),
      reason: reason || null
    };

    // Save to Supabase activity_logs table
    const { error } = await window.supabase
      .from('activity_logs')
      .insert(logEntry);

    if (error) {
      console.error('Error logging activity to Supabase:', error);
      // Fallback to localStorage if Supabase fails
      const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      logs.push({
        ...logEntry,
        id: Date.now().toString(),
        error: error.message
      });
      localStorage.setItem('activityLogs', JSON.stringify(logs));
    }
  } catch (error) {
    console.error('Error in logActivity function:', error);
    // Don't throw - logging errors should not break the main flow
  }
}

// Check user session and redirect if not logged in
async function checkUserSession() {
  const userData = sessionStorage.getItem("user");
  
  if (!userData) {
    window.location.href = "index.html";
    return null;
  }

  try {
    const user = JSON.parse(userData);
    
    // Debug: Log full user data structure
    console.log('=== USER SESSION DATA ===');
    console.log('Full user object:', user);
    console.log('user.userData:', user.userData);
    if (user.userData) {
      console.log('Available fields in userData:', Object.keys(user.userData));
      console.log('userData.username:', user.userData.username);
      console.log('userData.email:', user.userData.email);
    }
    console.log('user.email:', user.email);
    
    // Update current user display - try multiple times to ensure DOM is ready
    function updateCurrentUserDisplay() {
      const currentUserId = document.getElementById("current-user-id");
      if (!currentUserId) {
        console.warn('current-user-id element not found, will retry...');
        return false;
      }
      
      // Priority: username from userData > email prefix > user ID
      let displayName = null;
      
      if (user.userData) {
        const userDataFields = Object.keys(user.userData);
        const tableType = user.role || 'staff'; // Get table type from role
        
        console.log('=== CHECKING USER DATA FIELDS ===');
        console.log('Table type (role):', tableType);
        console.log('Available fields:', userDataFields);
        console.log('Full userData:', JSON.stringify(user.userData, null, 2));
        
        // Strategy based on table type (staff, member, supplier)
        if (tableType === 'supplier') {
          // Supplier table: use company_name or contact_person (NO username field)
          displayName = user.userData.company_name || 
                       user.userData.contact_person ||
                       (user.userData.email ? user.userData.email.split('@')[0] : null);
          console.log('Supplier - Display name:', displayName);
        } else {
          // Staff or Member table: use username field (which exists)
          displayName = user.userData.username || 
                       user.userData.user_name || 
                       user.userData.name ||
                       user.userData.userName ||
                       (user.userData.email ? user.userData.email.split('@')[0] : null);
          console.log('Staff/Member - Display name:', displayName);
        }
        
        // If still not found after role-specific checks, try generic field search
        if (!displayName) {
          console.log('Display name not found, checking all fields...');
          for (const key of userDataFields) {
            const value = user.userData[key];
            const lowerKey = key.toLowerCase();
            
            // Check for username-like fields
            if ((lowerKey === 'username' || lowerKey.includes('user') || lowerKey.includes('name')) && 
                typeof value === 'string' && 
                value && value.trim().length > 0 && 
                value.length < 50 &&
                !value.includes('@') &&  // Not an email
                !value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) { // Not a UUID
              displayName = value.trim();
              console.log(`  ✓ FOUND display name in field "${key}":`, displayName);
              break;
            }
          }
        }
      }
      
      // Fallback to email prefix or user ID
      if (!displayName) {
        displayName = user.email ? user.email.split('@')[0] : 
                     (user.id ? user.id.substring(0, 8) : 'USER');
        console.log('Using fallback display name:', displayName);
      }
      
      const oldText = currentUserId.textContent;
      currentUserId.textContent = displayName.toUpperCase();
      console.log('=== USER DISPLAY UPDATE ===');
      console.log('Old value:', oldText);
      console.log('New value:', displayName.toUpperCase());
      console.log('Element textContent after update:', currentUserId.textContent);
      console.log('Update successful:', currentUserId.textContent === displayName.toUpperCase());
      return true;
    }
    
    // Try to update immediately
    if (!updateCurrentUserDisplay()) {
      // If DOM not ready, retry multiple times with increasing delays
      let retryCount = 0;
      const maxRetries = 10;
      const retryInterval = setInterval(() => {
        retryCount++;
        if (updateCurrentUserDisplay() || retryCount >= maxRetries) {
          clearInterval(retryInterval);
          if (retryCount >= maxRetries) {
            console.warn('Failed to update current user display after', maxRetries, 'retries');
          }
        }
      }, 100);
    } else {
      // Also set up a delayed check to ensure it sticks (in case of race conditions)
      setTimeout(() => {
        const currentUserId = document.getElementById("current-user-id");
        if (currentUserId && currentUserId.textContent === 'ADMIN001') {
          console.log('Still showing ADMIN001, forcing update again...');
          updateCurrentUserDisplay();
        }
      }, 500);
    }
    
    return user;
  } catch (error) {
    console.error("Error parsing user data:", error);
    window.location.href = "index.html";
    return null;
  }
}

// Show logout confirmation dialog
function showLogoutDialog() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'logout-dialog-overlay';
  overlay.id = 'logout-dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'logout-dialog';
  
  // Create message
  const message = document.createElement('p');
  message.className = 'logout-dialog-message';
  message.textContent = 'ARE YOU SURE YOU WANT TO LOG OUT ?';
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'logout-dialog-buttons';
  
  // Create YES button
  const yesButton = document.createElement('button');
  yesButton.className = 'logout-dialog-btn';
  yesButton.textContent = 'YES';
  yesButton.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    confirmLogout();
  };
  
  // Create NO button
  const noButton = document.createElement('button');
  noButton.className = 'logout-dialog-btn';
  noButton.textContent = 'NO';
  noButton.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    dismissLogoutDialog();
  };
  
  // Assemble dialog
  buttonsContainer.appendChild(yesButton);
  buttonsContainer.appendChild(noButton);
  dialog.appendChild(message);
  dialog.appendChild(buttonsContainer);
  overlay.appendChild(dialog);
  
  // Add to body
  document.body.appendChild(overlay);
  
  // Blur the dashboard container
  const dashboardContainer = document.querySelector('.dashboard-container');
  if (dashboardContainer) {
    dashboardContainer.classList.add('blurred');
  }
}

// Dismiss logout dialog
function dismissLogoutDialog() {
  const overlay = document.getElementById('logout-dialog-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Remove blur from dashboard container
  const dashboardContainer = document.querySelector('.dashboard-container');
  if (dashboardContainer) {
    dashboardContainer.classList.remove('blurred');
  }
}

// Confirm logout and redirect
async function confirmLogout() {
  try {
    if (window.supabase) {
      await window.supabase.auth.signOut();
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  sessionStorage.removeItem("user");
  window.location.href = "index.html";
}

// Handle logout (shows confirmation dialog)
function handleLogout(event) {
  console.log('handleLogout function called', event);
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('Calling showLogoutDialog...');
  try {
    showLogoutDialog();
    console.log('✓ Logout dialog shown successfully');
  } catch (error) {
    console.error('❌ Error showing logout dialog:', error);
  }
}

// Toggle user submenu - make it globally accessible
function toggleUserSubmenu(event) {
  console.log('toggleUserSubmenu function called', event);
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const submenu = document.getElementById('user-submenu');
  console.log('Submenu element found:', !!submenu);
  
  if (submenu) {
    const hasShow = submenu.classList.contains('show');
    submenu.classList.toggle('show');
    const nowHasShow = submenu.classList.contains('show');
    
    console.log('✓ User submenu toggled successfully');
    console.log('  Before (has show):', hasShow);
    console.log('  After (has show):', nowHasShow);
    console.log('  All classes:', submenu.className);
    console.log('  Computed display:', window.getComputedStyle(submenu).display);
    console.log('  Computed visibility:', window.getComputedStyle(submenu).visibility);
    console.log('  Element visible:', submenu.offsetParent !== null);
    
    // Ensure it's actually visible
    if (nowHasShow && submenu.offsetParent === null) {
      console.warn('Submenu has show class but is not visible, checking z-index and positioning...');
    }
  } else {
    console.error('❌ User submenu element not found!');
    const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    console.error('Available elements with id:', allIds);
    console.error('Looking for: user-submenu');
  }
}

// CRITICAL: Expose functions to window IMMEDIATELY when script loads (before DOMContentLoaded)
// This ensures onclick handlers in HTML can find these functions
// Store references to the actual functions before assigning to window
const _toggleUserSubmenu = toggleUserSubmenu;
const _handleLogout = handleLogout;

// Assign the actual functions to window (not wrappers)
window.toggleUserSubmenu = _toggleUserSubmenu;
window.handleLogout = _handleLogout;

console.log('✓ Functions exposed to window immediately:', {
  toggleUserSubmenu: typeof window.toggleUserSubmenu,
  handleLogout: typeof window.handleLogout,
  'toggleUserSubmenu is function': typeof window.toggleUserSubmenu === 'function',
  'handleLogout is function': typeof window.handleLogout === 'function'
});

console.log('Functions exposed to window:', {
  toggleUserSubmenu: typeof window.toggleUserSubmenu,
  handleLogout: typeof window.handleLogout
});

// Close user submenu when clicking outside
document.addEventListener('click', function(event) {
  const userBtnWrapper = event.target.closest('.user-nav-wrapper');
  const userBtnWrapperOld = event.target.closest('.user-btn-wrapper'); // Support old class name
  const submenu = document.getElementById('user-submenu');

  if (!userBtnWrapper && !userBtnWrapperOld && submenu) {
    submenu.classList.remove('show');
  }
});

// Mobile menu toggle functionality
function toggleMobileMenu() {
  const navbarNav = document.querySelector('.navbar-nav');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  
  if (navbarNav && mobileMenuBtn) {
    navbarNav.classList.toggle('mobile-open');
    const isOpen = navbarNav.classList.contains('mobile-open');
    
    // Update button aria-label
    mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    
    // Update button icon (optional - you can add an X icon)
    if (isOpen) {
      mobileMenuBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      mobileMenuBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    }
  }
}

// Initialize mobile menu button
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    const navbarNav = document.querySelector('.navbar-nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (navbarNav && navbarNav.classList.contains('mobile-open')) {
      const isClickInsideNav = navbarNav.contains(event.target);
      const isClickOnButton = mobileMenuBtn && mobileMenuBtn.contains(event.target);
      
      if (!isClickInsideNav && !isClickOnButton) {
        navbarNav.classList.remove('mobile-open');
        if (mobileMenuBtn) {
          mobileMenuBtn.setAttribute('aria-label', 'Open menu');
          mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          `;
        }
      }
    }
  });
  
  // Close mobile menu when a nav link is clicked
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      const navbarNav = document.querySelector('.navbar-nav');
      if (navbarNav && navbarNav.classList.contains('mobile-open')) {
        navbarNav.classList.remove('mobile-open');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
          mobileMenuBtn.setAttribute('aria-label', 'Open menu');
          mobileMenuBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          `;
        }
      }
    });
  });
});

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async function() {
  // Ensure functions are still accessible (double-check)
  window.toggleUserSubmenu = toggleUserSubmenu;
  window.handleLogout = handleLogout;
  
  // Check user session and update display
  const user = await checkUserSession();
  
  // Force update the display using the proper logic from checkUserSession
  if (user) {
    // Use the same logic from checkUserSession to get display name
    let displayName = null;
    const tableType = user.role || 'staff';
    
    if (user.userData) {
      // According to SUPABASE_SCHEMA_REFERENCE.md:
      // - Staff/Member tables have 'username' field
      // - Supplier table has 'company_name' field (no username)
      if (tableType === 'supplier') {
        displayName = user.userData.company_name || 
                     user.userData.contact_person ||
                     (user.userData.email ? user.userData.email.split('@')[0] : null);
      } else {
        // Staff or Member: use username field (per schema reference)
        displayName = user.userData.username || 
                     user.userData.user_name || 
                     user.userData.name ||
                     (user.userData.email ? user.userData.email.split('@')[0] : null);
      }
    }
    
    if (!displayName) {
      displayName = user.email ? user.email.split('@')[0] : 'USER';
    }
    
    // Force update multiple times to ensure it sticks
    const updateDisplay = () => {
      const currentUserId = document.getElementById("current-user-id");
      if (currentUserId) {
        if (currentUserId.textContent === 'ADMIN001' || !currentUserId.textContent.trim()) {
          currentUserId.textContent = displayName.toUpperCase();
          console.log('✓ Force updated current user display to:', displayName.toUpperCase());
        }
      }
    };
    
    // Try immediately and with delays
    updateDisplay();
    setTimeout(updateDisplay, 100);
    setTimeout(updateDisplay, 300);
    setTimeout(updateDisplay, 500);
  }
  
  // Initialize sales chart if on statistic page
  if (document.getElementById('sales-chart')) {
    initializeSalesChart();
  }
  
  // Initialize histogram button toggle if on statistic page
  if (document.getElementById('histogram-btn')) {
    setupHistogramButtonToggle();
  }
  
  // Update active state for user submenu buttons
  updateActiveUserSubmenu();
  
  // Debug: Verify functions are accessible
  console.log('✓ DOMContentLoaded - Functions verified:', {
    toggleUserSubmenu: typeof window.toggleUserSubmenu,
    handleLogout: typeof window.handleLogout,
    'toggleUserSubmenu is function': typeof window.toggleUserSubmenu === 'function',
    'handleLogout is function': typeof window.handleLogout === 'function'
  });
  
  // Test if functions can be called
  if (typeof window.toggleUserSubmenu === 'function' && typeof window.handleLogout === 'function') {
    console.log('✅ All sidebar functions are ready and accessible!');
  } else {
    console.error('❌ Some sidebar functions are missing!');
  }
});

// Initialize sales chart (simple placeholder - you can use Chart.js or similar)
function initializeSalesChart() {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  
  // Simple line chart drawing
  ctx.strokeStyle = '#f0a5a5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, height - 50);
  ctx.lineTo(150, height - 100);
  ctx.lineTo(250, height - 80);
  ctx.lineTo(350, height - 120);
  ctx.lineTo(450, height - 90);
  ctx.stroke();
  
  // Dashed line for last month
  ctx.strokeStyle = '#e8d5e8';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(50, height - 60);
  ctx.lineTo(150, height - 110);
  ctx.lineTo(250, height - 90);
  ctx.lineTo(350, height - 130);
  ctx.lineTo(450, height - 100);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Y-axis labels
  ctx.fillStyle = '#1d1f2c';
  ctx.font = '12px Arial';
  ctx.fillText('25k', 10, 30);
  ctx.fillText('20k', 10, 80);
  ctx.fillText('15k', 10, 130);
  ctx.fillText('5k', 10, 180);
}

// Update active state for user submenu buttons
function updateActiveUserSubmenu() {
  const currentPage = window.location.pathname.split('/').pop();
  const submenuButtons = document.querySelectorAll('.user-submenu-btn');
  
  submenuButtons.forEach(btn => {
    btn.classList.remove('active');
    const href = btn.getAttribute('href');
    if (href && href.includes(currentPage)) {
      btn.classList.add('active');
      // Show submenu if one of the buttons is active
      const submenu = document.getElementById('user-submenu');
      if (submenu) {
        submenu.classList.add('show');
      }
    }
  });
}

/* ============================================
   USER DATA FETCHING AND DISPLAY
   ============================================ */

// Get position name from positions table
async function getPositionName(positionValue) {
  if (!positionValue || !window.supabase) {
    return positionValue || 'N/A';
  }
  
  try {
    // Normalize the position value for lookup (lowercase, replace spaces with hyphens)
    const normalizedValue = positionValue.toLowerCase().replace(/\s+/g, '-');
    
    // Try to find matching position in positions table
    const { data: positions, error } = await window.supabase
      .from('positions')
      .select('position_name')
      .eq('is_active', true);
    
    if (error || !positions) {
      return positionValue; // Return original if lookup fails
    }
    
    // Find matching position (case-insensitive, handle variations)
    const matchingPosition = positions.find(pos => {
      const posNormalized = pos.position_name.toLowerCase().replace(/\s+/g, '-');
      return posNormalized === normalizedValue || 
             pos.position_name.toLowerCase() === positionValue.toLowerCase();
    });
    
    // Return the position_name from positions table if found, otherwise return original
    return matchingPosition ? matchingPosition.position_name : positionValue;
  } catch (error) {
    console.error('Error looking up position:', error);
    return positionValue; // Return original on error
  }
}

// Cache for position names to avoid repeated lookups
let positionNameCache = null;

// Load all positions into cache
async function loadPositionNameCache() {
  if (positionNameCache) return positionNameCache;
  
  try {
    if (!window.supabase) return {};
    
    const { data: positions, error } = await window.supabase
      .from('positions')
      .select('position_name')
      .eq('is_active', true);
    
    if (error || !positions) {
      return {};
    }
    
    // Create a cache map: normalized position value -> actual position_name
    positionNameCache = {};
    positions.forEach(pos => {
      const normalized = pos.position_name.toLowerCase().replace(/\s+/g, '-');
      positionNameCache[normalized] = pos.position_name;
      // Also cache by exact lowercase match
      positionNameCache[pos.position_name.toLowerCase()] = pos.position_name;
      // Cache by singular/plural variations (e.g., 'manager' -> 'MANAGERS')
      const singular = pos.position_name.toLowerCase().replace(/s$/, '');
      if (singular !== pos.position_name.toLowerCase()) {
        positionNameCache[singular] = pos.position_name;
        positionNameCache[singular.replace(/\s+/g, '-')] = pos.position_name;
      }
    });
    
    return positionNameCache;
  } catch (error) {
    console.error('Error loading position cache:', error);
    return {};
  }
}

// Fetch and display staff data
async function loadStaffData() {
  const tbody = document.querySelector('.member-table tbody');
  if (!tbody) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Load position name cache
    await loadPositionNameCache();
    
    const { data, error } = await window.supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching staff data:', error);
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading staff data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">There are no staff members in the current system.</td></tr>';
      return;
    }
    
    // Sort staff data: active users first (is_active = true), then inactive, then by created_at descending
    data.sort((a, b) => {
      const aActive = a.is_active !== false; // Default to true if null/undefined
      const bActive = b.is_active !== false;
      
      // First sort by active status (active first)
      if (aActive !== bActive) {
        return bActive ? 1 : -1; // true (active) comes before false (inactive)
      }
      
      // If same status, sort by created_at descending
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    });
    
    // Process staff data and get position names from cache
    const staffRows = await Promise.all(data.map(async (staff) => {
      let positionDisplay = staff.position || 'N/A';
      
      // Look up position name from cache
      if (staff.position && positionNameCache) {
        const normalized = staff.position.toLowerCase().replace(/\s+/g, '-');
        // Try multiple lookup strategies
        let cachedName = positionNameCache[normalized] || 
                        positionNameCache[staff.position.toLowerCase()] ||
                        positionNameCache[staff.position.toLowerCase().replace(/\s+/g, '-')];
        
        // If not found, try singular/plural variations (e.g., 'manager' -> 'MANAGERS')
        if (!cachedName) {
          const singular = staff.position.toLowerCase().replace(/s$/, '');
          cachedName = positionNameCache[singular] || 
                      positionNameCache[singular.replace(/\s+/g, '-')];
        }
        
        if (cachedName) {
          positionDisplay = cachedName;
        }
      }
      
      // Determine status based on is_active field
      const isActive = staff.is_active !== false; // Default to true if null/undefined
      const statusClass = isActive ? 'active' : 'inactive';
      const statusText = isActive ? 'Active' : 'Inactive';
      
      return `
        <tr data-user-id="${staff.id || ''}" data-user-email="${staff.email || ''}">
          <td>${staff.user_code || 'N/A'}</td>
          <td>${staff.username || 'N/A'}</td>
          <td>${staff.email || 'N/A'}</td>
          <td>${staff.phone || staff.business_contact || 'N/A'}</td>
          <td>${positionDisplay}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}</td>
          <td>N/A</td>
          <td>None</td>
        </tr>
      `;
    }));
    
    tbody.innerHTML = staffRows.join('');
    
    // Restore action buttons if an action mode is selected
    if (window.currentActionMode) {
      setTimeout(() => {
        updateTableActionButtons(window.currentActionMode);
      }, 100);
    }
    
    // Set up real-time subscription
    setupStaffRealtime();
    
  } catch (error) {
    console.error('Error loading staff data:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading staff data. Please refresh the page.</td></tr>';
  }
}

// Fetch and display supplier data
async function loadSupplierData() {
  const tbody = document.querySelector('.member-table tbody');
  if (!tbody) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data, error } = await window.supabase
      .from('supplier')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching supplier data:', error);
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading supplier data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">There are no suppliers in the current system.</td></tr>';
      return;
    }
    
    // Sort supplier data: active users first (status = 'active'), then inactive, then by created_at descending
    data.sort((a, b) => {
      const aStatus = (a.status || 'active').toLowerCase();
      const bStatus = (b.status || 'active').toLowerCase();
      const aActive = aStatus === 'active';
      const bActive = bStatus === 'active';
      
      // First sort by active status (active first)
      if (aActive !== bActive) {
        return bActive ? 1 : -1; // active comes before inactive
      }
      
      // If same status, sort by created_at descending
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    });
    
    tbody.innerHTML = data.map(supplier => {
      // Determine status based on status field
      const status = supplier.status || 'active'; // Default to 'active' if null/undefined
      const isActive = status.toLowerCase() === 'active';
      const statusClass = isActive ? 'active' : 'inactive';
      const statusText = isActive ? 'Active' : 'Inactive';
      
      return `
        <tr data-user-id="${supplier.id || ''}" data-user-email="${supplier.email || ''}">
          <td>${supplier.user_code || 'N/A'}</td>
          <td>${supplier.company_name || 'N/A'}</td>
          <td>${supplier.email || 'N/A'}</td>
          <td>${supplier.contact_person || 'N/A'}</td>
          <td>${supplier.phone || supplier.business_contact || 'N/A'}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : 'N/A'}</td>
          <td>N/A</td>
          <td>None</td>
        </tr>
      `;
    }).join('');
    
    // Restore action buttons if an action mode is selected
    if (window.currentActionMode) {
      setTimeout(() => {
        updateTableActionButtons(window.currentActionMode);
      }, 100);
    }
    
    // Set up real-time subscription
    setupSupplierRealtime();
    
  } catch (error) {
    console.error('Error loading supplier data:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading supplier data. Please refresh the page.</td></tr>';
  }
}

// Fetch and display member data (assuming there's a member table, or use auth.users)
async function loadMemberData() {
  const tbody = document.querySelector('.member-table tbody');
  if (!tbody) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Try to fetch from member table if it exists, otherwise show message
    const { data, error } = await window.supabase
      .from('member')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // If member table doesn't exist, show appropriate message
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">There are no members in the current system.</td></tr>';
        return;
      }
      console.error('Error fetching member data:', error);
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading member data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">There are no members in the current system.</td></tr>';
      return;
    }
    
    // Sort member data: active users first (membership_status = 'active'), then inactive, then by created_at descending
    data.sort((a, b) => {
      const aStatus = (a.membership_status || 'active').toLowerCase();
      const bStatus = (b.membership_status || 'active').toLowerCase();
      const aActive = aStatus === 'active';
      const bActive = bStatus === 'active';
      
      // First sort by active status (active first)
      if (aActive !== bActive) {
        return bActive ? 1 : -1; // active comes before inactive
      }
      
      // If same status, sort by created_at descending
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    });
    
    tbody.innerHTML = data.map(member => {
      // Determine status based on membership_status field
      const status = member.membership_status || 'active';
      const isActive = status.toLowerCase() === 'active';
      const statusClass = isActive ? 'active' : 'inactive';
      const statusText = isActive ? 'Active' : 'Inactive';
      
      return `
      <tr data-user-id="${member.id || ''}" data-user-email="${member.email || ''}">
        <td>${member.user_code || 'N/A'}</td>
        <td>${member.username || member.first_name || 'N/A'}</td>
        <td>${member.email || 'N/A'}</td>
        <td>${member.phone || 'N/A'}</td>
        <td>${member.member_points !== null && member.member_points !== undefined ? member.member_points : 0}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>N/A</td>
        <td>None</td>
      </tr>
    `;
    }).join('');
    
    // Restore action buttons if an action mode is selected
    if (window.currentActionMode) {
      setTimeout(() => {
        updateTableActionButtons(window.currentActionMode);
      }, 100);
    }
    
    // Set up real-time subscription
    setupMemberRealtime();
    
  } catch (error) {
    console.error('Error loading member data:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading member data. Please refresh the page.</td></tr>';
  }
}

// Set up real-time subscription for staff table
function setupStaffRealtime() {
  if (!window.supabase) return;
  
  const channel = window.supabase
    .channel('staff-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'staff' },
      (payload) => {
        console.log('Staff data changed:', payload);
        loadStaffData(); // Reload data when changes occur
      }
    )
    .subscribe();
  
  return channel;
}

// Set up real-time subscription for supplier table
function setupSupplierRealtime() {
  if (!window.supabase) return;
  
  const channel = window.supabase
    .channel('supplier-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'supplier' },
      (payload) => {
        console.log('Supplier data changed:', payload);
        loadSupplierData(); // Reload data when changes occur
      }
    )
    .subscribe();
  
  return channel;
}

// Set up real-time subscription for member table
function setupMemberRealtime() {
  if (!window.supabase) return;
  
  const channel = window.supabase
    .channel('member-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'member' },
      (payload) => {
        console.log('Member data changed:', payload);
        loadMemberData(); // Reload data when changes occur
      }
    )
    .subscribe();
  
  return channel;
}

/* ============================================
   SEARCH FILTER FUNCTIONALITY
   ============================================ */

// Set up search filter for table rows
function setupSearchFilter(inputId) {
  const searchInput = document.getElementById(inputId);
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    applyFilters(searchTerm, null, null, null);
  });
}

/* ============================================
   HISTOGRAM BUTTON TOGGLE FUNCTIONALITY
   ============================================ */

// Set up histogram button toggle
function setupHistogramButtonToggle() {
  const histogramBtn = document.getElementById('histogram-btn');
  if (!histogramBtn) return;
  
  const histogramSubmenu = document.getElementById('histogram-submenu');
  if (!histogramSubmenu) return;
  
  histogramBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      // If already active, just close
      this.classList.remove('active');
      histogramSubmenu.classList.remove('show');
    } else {
      // Open submenu
      this.classList.add('active');
      histogramSubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!histogramBtn.contains(e.target) && !histogramSubmenu.contains(e.target)) {
      if (histogramBtn.classList.contains('active')) {
        histogramBtn.classList.remove('active');
        histogramSubmenu.classList.remove('show');
      }
    }
  });
  
  // Handle histogram option clicks
  const histogramOptions = histogramSubmenu.querySelectorAll('.histogram-option-btn');
  histogramOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const chartType = this.getAttribute('data-chart-type');
      
      // Remove active class from all options
      histogramOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      this.classList.add('active');
      
      // Here you can add logic to change the chart type
      console.log('Chart type selected:', chartType);
      // TODO: Implement chart type switching logic
    });
  });
}

/* ============================================
   STATUS BUTTON TOGGLE FUNCTIONALITY
   ============================================ */

// Set up status button toggle
function setupStatusButtonToggle() {
  const statusBtn = document.getElementById('status-filter-btn');
  if (!statusBtn) {
    console.warn('Status filter button not found');
    return;
  }
  
  const statusSubmenu = document.getElementById('status-submenu');
  if (!statusSubmenu) {
    console.warn('Status submenu not found');
    return;
  }
  
  // Prevent duplicate event listeners
  if (statusBtn._statusToggleSetup) {
    console.log('Status button toggle already set up, skipping...');
    return;
  }
  statusBtn._statusToggleSetup = true;
  
  statusBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      // If already active, just close (don't reset filter)
      this.classList.remove('active');
      statusSubmenu.classList.remove('show');
    } else {
      // Open submenu
      this.classList.add('active');
      statusSubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!statusBtn.contains(e.target) && !statusSubmenu.contains(e.target)) {
      if (statusBtn.classList.contains('active')) {
        statusBtn.classList.remove('active');
        statusSubmenu.classList.remove('show');
        // Don't reset filter when closing - keep the selected option active
      }
    }
  });
  
  // Handle status option clicks
  const statusOptions = statusSubmenu.querySelectorAll('.status-option-btn');
  console.log('Status options found:', statusOptions.length);
  
  if (statusOptions.length === 0) {
    console.warn('No status option buttons found!');
    return;
  }
  
  statusOptions.forEach(option => {
    // Remove existing listener if any (using a named function for easier removal)
    if (option._statusClickHandler) {
      option.removeEventListener('click', option._statusClickHandler);
    }
    
    // Create new handler
    const clickHandler = function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log('Status option clicked:', this.getAttribute('data-status'));
      
      const isCurrentlyActive = this.classList.contains('active');
      const selectedStatus = this.getAttribute('data-status');
      console.log('Selected status:', selectedStatus, 'Currently active:', isCurrentlyActive);
      
      if (isCurrentlyActive) {
        // If already active, deselect and remove filter
        this.classList.remove('active');
        // Reset status filter
        const productSearchInput = document.getElementById('product-search-input');
        if (productSearchInput) {
          // Product page - use applyProductFilters
          const searchTerm = productSearchInput.value.toLowerCase().trim();
          const categoryFilter = window.currentCategoryFilter || null;
          const dateRange = window.dateFilterRange || null;
          console.log('Resetting product filters (removing status filter)');
          applyProductFilters(searchTerm, null, categoryFilter, dateRange);
        } else {
          // Other pages - use applyFilters
          const searchInput = document.querySelector('.search-input');
          const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
          const dateRange = window.dateFilterRange || null;
          const activePositionOption = document.querySelector('.position-option-btn.active:not([data-position="edit"])');
          const positionFilter = activePositionOption ? activePositionOption.getAttribute('data-position') : null;
          applyFilters(searchTerm, null, positionFilter, dateRange);
        }
      } else {
        // Remove active class from all options
        statusOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        this.classList.add('active');
        // Get selected status and filter table
        console.log('Calling filterTableByStatus with:', selectedStatus);
        filterTableByStatus(selectedStatus);
      }
      
      // Close the submenu after selection
      statusBtn.classList.remove('active');
      statusSubmenu.classList.remove('show');
    };
    
    // Store handler reference and attach
    option._statusClickHandler = clickHandler;
    option.addEventListener('click', clickHandler);
  });
}

/* ============================================
   POSITION BUTTON TOGGLE FUNCTIONALITY
   ============================================ */

// Set up position button toggle
function setupPositionButtonToggle() {
  const positionBtn = document.getElementById('position-filter-btn');
  if (!positionBtn) return;
  
  const positionSubmenu = document.getElementById('position-submenu');
  if (!positionSubmenu) return;
  
  positionBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      // If already active, just close (don't reset filter)
      this.classList.remove('active');
      positionSubmenu.classList.remove('show');
    } else {
      // Load positions from Supabase before opening
      await loadPositionsIntoDropdown();
      // Open submenu
      this.classList.add('active');
      positionSubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!positionBtn.contains(e.target) && !positionSubmenu.contains(e.target)) {
      if (positionBtn.classList.contains('active')) {
        positionBtn.classList.remove('active');
        positionSubmenu.classList.remove('show');
        // Don't reset filter when closing - keep the selected option active
      }
    }
  });
  
  // Handle edit position button click (outside the scrollable frame)
  const editPositionBtn = positionSubmenu.querySelector('.position-option-btn[data-position="edit"]');
  if (editPositionBtn) {
    editPositionBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Remove active class from all position options
      const scrollableFrame = document.getElementById('position-list-scrollable-frame');
      if (scrollableFrame) {
        const allPositionOptions = scrollableFrame.querySelectorAll('.position-option-btn');
        allPositionOptions.forEach(opt => opt.classList.remove('active'));
      }
      // Add active class to edit button
      this.classList.add('active');
      // Show edit position popup
      showEditPositionPopup();
      // Close submenu
      positionBtn.classList.remove('active');
      positionSubmenu.classList.remove('show');
    });
  }
  
  // Note: Position option buttons are now loaded dynamically and handled in loadPositionsIntoDropdown()
}

/* ============================================
   STATUS FILTERING FUNCTIONALITY
   ============================================ */

// Apply search, status, position, and date filters
function applyFilters(searchTerm = '', statusFilter = null, positionFilter = null, dateRange = null) {
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  
  // Remove existing no-results message if it exists
  const existingNoResults = tbody.querySelector('.no-results-message');
  if (existingNoResults) {
    existingNoResults.remove();
  }
  
  // Get current status filter if not provided
  if (statusFilter === null) {
    const activeStatusOption = document.querySelector('.status-option-btn.active');
    if (activeStatusOption) {
      statusFilter = activeStatusOption.getAttribute('data-status');
    }
  }
  
  // Get current position filter if not provided
  if (positionFilter === null) {
    const activePositionOption = document.querySelector('.position-option-btn.active:not([data-position="edit"])');
    if (activePositionOption) {
      positionFilter = activePositionOption.getAttribute('data-position');
    }
  }
  
  // Get current date range if not provided
  if (dateRange === null && window.dateFilterRange) {
    dateRange = window.dateFilterRange;
  }
  
  const rows = tbody.querySelectorAll('tr:not(.no-results-message)');
  let visibleCount = 0;
  
  rows.forEach(row => {
    // Skip if this is already a no-results message row
    if (row.classList.contains('no-results-message')) {
      return;
    }
    
    // Check status filter
    let statusMatch = true;
    if (statusFilter) {
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        const rowStatus = statusBadge.textContent.trim().toLowerCase();
        if (statusFilter === 'active' && rowStatus !== 'active') {
          statusMatch = false;
        } else if (statusFilter === 'inactive' && rowStatus !== 'inactive') {
          statusMatch = false;
        } else if (statusFilter === 'banned' && rowStatus !== 'banned') {
          statusMatch = false;
        }
      } else {
        statusMatch = false;
      }
    }
    
    // Check position filter (Position column - 5th column, index 4)
    let positionMatch = true;
    if (positionFilter) {
      const cells = row.querySelectorAll('td');
      if (cells.length > 4) {
        const positionCell = cells[4]; // Position column
        const rowPosition = positionCell.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        // Normalize positionFilter (it's already in lowercase with hyphens)
        const normalizedFilter = positionFilter.toLowerCase().replace(/\s+/g, '-');
        // Compare normalized values
        if (rowPosition !== normalizedFilter) {
          positionMatch = false;
        }
      } else {
        positionMatch = false;
      }
    }
    
    // Check date filter (Joined Date column)
    let dateMatch = true;
    if (dateRange && dateRange.start && dateRange.end) {
      // Find the Joined Date cell (usually the 6th column, index 5)
      const cells = row.querySelectorAll('td');
      let joinedDateCell = null;
      
      // Try to find the date cell by looking for date-like content
      cells.forEach((cell, index) => {
        const cellText = cell.textContent.trim();
        // Check if it looks like a date (contains / or - and numbers)
        if (cellText.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) && index >= 5) {
          joinedDateCell = cell;
        }
      });
      
      if (joinedDateCell) {
        const dateText = joinedDateCell.textContent.trim();
        if (dateText !== 'N/A') {
          // Parse the date (format: MM/DD/YYYY or similar)
          const dateParts = dateText.split(/[\/\-]/);
          let parsedDate;
          
          if (dateParts.length === 3) {
            // Try different date formats
            const month = parseInt(dateParts[0]) - 1;
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            parsedDate = new Date(year, month, day);
            
            // Check if date is within range
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            parsedDate.setHours(0, 0, 0, 0);
            
            if (parsedDate < start || parsedDate > end) {
              dateMatch = false;
            }
          } else {
            dateMatch = false;
          }
        } else {
          dateMatch = false;
        }
      }
    }
    
    // Check search filter
    let searchMatch = true;
    if (searchTerm !== '') {
      const cells = row.querySelectorAll('td');
      let rowText = '';
      
      cells.forEach(cell => {
        const cellText = cell.textContent || cell.innerText || '';
        rowText += cellText.toLowerCase() + ' ';
      });
      
      if (!rowText.includes(searchTerm)) {
        searchMatch = false;
      }
    }
    
    // Show row only if all filters match
    if (statusMatch && positionMatch && searchMatch && dateMatch) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });
  
  // If no rows are visible, show no results message
  if (visibleCount === 0) {
    const colCount = table.querySelectorAll('thead th').length;
    const noResultsRow = document.createElement('tr');
    noResultsRow.className = 'no-results-message';
    let message = '';
    
    if (searchTerm !== '' && statusFilter && dateRange) {
      const statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      message = `No ${statusText} users found matching "${searchTerm}" in the selected date range.`;
    } else if (statusFilter && dateRange) {
      const statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      message = `No ${statusText} users found in the selected date range.`;
    } else if (dateRange) {
      message = 'No users found in the selected date range.';
    } else if (searchTerm !== '' && statusFilter) {
      const statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      message = `No ${statusText} users found matching "${searchTerm}".`;
    } else if (statusFilter) {
      const statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      message = `No ${statusText} users found in the database.`;
    } else if (searchTerm !== '') {
      message = `No results found for "${searchTerm}". The search term does not exist in the database.`;
    } else {
      message = 'No users found.';
    }
    
    noResultsRow.innerHTML = `<td colspan="${colCount}" class="no-data-message">${message}</td>`;
    tbody.appendChild(noResultsRow);
  }
}

// Filter table rows by status
function filterTableByStatus(status) {
  console.log('filterTableByStatus called with status:', status);
  
  // Check if we're on the product page (has product-search-input)
  const productSearchInput = document.getElementById('product-search-input');
  
  if (productSearchInput) {
    // Use product-specific filter function
    const searchTerm = productSearchInput.value.toLowerCase().trim();
    const categoryFilter = window.currentCategoryFilter || null;
    const dateRange = window.dateFilterRange || null;
    console.log('Applying product filters:', { searchTerm, status, categoryFilter, dateRange });
    applyProductFilters(searchTerm, status, categoryFilter, dateRange);
  } else {
    // Use generic filter function for other pages
    const searchInput = document.querySelector('.search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    applyFilters(searchTerm, status, null, null);
  }
}

// Filter table by position
function filterTableByPosition(position) {
  // Store the current position filter
  window.currentPositionFilter = position;
  
  // Get current search term
  const searchInput = document.querySelector('.search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // Get current status filter
  const activeStatusOption = document.querySelector('.status-option-btn.active');
  const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
  
  // Get current date range
  const dateRange = window.dateFilterRange || null;
  
  // Apply filters with the selected position
  applyFilters(searchTerm, statusFilter, position, dateRange);
}

/* ============================================
   DATE PICKER FUNCTIONALITY
   ============================================ */

// Set up date picker
function setupDatePicker() {
  const dateBtn = document.getElementById('date-filter-btn');
  if (!dateBtn) return;
  
  const datePicker = document.getElementById('date-picker');
  if (!datePicker) return;
  
  const monthSelect = document.getElementById('month-select');
  const yearSelect = document.getElementById('year-select');
  const daysContainer = document.getElementById('date-picker-days');
  const startDateInput = document.getElementById('start-date-input');
  const endDateInput = document.getElementById('end-date-input');
  const backBtn = datePicker.querySelector('.date-picker-back-btn');
  const applyBtn = datePicker.querySelector('.date-picker-apply-btn');
  
  let currentDate = new Date();
  let startDate = null;
  let endDate = null;
  let isSelectingStart = true;
  
  // Format date to DD/MM/YYYY
  function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Parse date from DD/MM/YYYY or DD-MM-YYYY format
  function parseDate(dateString) {
    if (!dateString || dateString.trim() === '') return null;
    
    // Remove any whitespace
    dateString = dateString.trim();
    
    // Validate format: must be DD/MM/YYYY or DD-MM-YYYY
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match = dateString.match(datePattern);
    
    if (!match) {
      return null; // Invalid format
    }
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(match[3], 10);
    
    // Validate day and month ranges
    if (day < 1 || day > 31 || month < 0 || month > 11) {
      return null;
    }
    
    // Handle 2-digit years
    const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
    
    // Validate year range (reasonable range)
    if (fullYear < 1900 || fullYear > 2100) {
      return null;
    }
    
    const date = new Date(fullYear, month, day);
    
    // Validate the date (check for invalid dates like Feb 30)
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === fullYear) {
      return date;
    }
    
    return null;
  }
  
  // Validate date range (start date must be <= end date)
  function validateDateRange(start, end) {
    if (!start || !end) return false;
    return start <= end;
  }
  
  // Show validation error message
  function showDateValidationError(message) {
    // Remove existing error message if any
    const existingError = document.querySelector('.date-validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'date-validation-error';
    errorElement.style.cssText = 'color: #dc3545; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem; background: #f8d7da; border-radius: 4px;';
    errorElement.textContent = message;
    
    // Insert error message after date picker inputs
    const datePickerInputs = datePicker.querySelector('.date-picker-inputs');
    if (datePickerInputs) {
      datePickerInputs.appendChild(errorElement);
    }
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);
  }
  
  // Update input fields from dates
  function updateInputFields() {
    if (startDateInput) {
      startDateInput.value = formatDate(startDate);
    }
    if (endDateInput) {
      endDateInput.value = formatDate(endDate);
    }
  }
  
  // Update calendar view to show the month of a date
  function navigateToDate(date) {
    if (!date) return;
    monthSelect.value = date.getMonth();
    yearSelect.value = date.getFullYear();
    renderCalendar();
  }
  
  // Initialize year dropdown (current year ± 10 years)
  function initYearSelect() {
    const currentYear = currentDate.getFullYear();
    yearSelect.innerHTML = '';
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      if (i === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }
  
  // Render calendar
  function renderCalendar() {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust starting day (Monday = 0)
    const adjustedStart = (startingDayOfWeek + 6) % 7;
    
    daysContainer.innerHTML = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dayElement = createDayElement(day, date, true);
      daysContainer.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayElement = createDayElement(day, date, false);
      daysContainer.appendChild(dayElement);
    }
    
    // Next month days to fill the grid (5 rows = 35 cells)
    const totalCells = daysContainer.children.length;
    const remainingCells = 35 - totalCells; // 5 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dayElement = createDayElement(day, date, true);
      daysContainer.appendChild(dayElement);
    }
  }
  
  // Create day element
  function createDayElement(day, date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'date-day';
    dayElement.textContent = day;
    dayElement.dataset.date = date.toISOString().split('T')[0];
    
    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }
    
    // Check if date is in range
    if (startDate && endDate) {
      const dateStr = date.toISOString().split('T')[0];
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      if (dateStr === startStr) {
        dayElement.classList.add('range-start');
      } else if (dateStr === endStr) {
        dayElement.classList.add('range-end');
      } else if (date >= startDate && date <= endDate) {
        dayElement.classList.add('in-range');
      }
    } else if (startDate) {
      const dateStr = date.toISOString().split('T')[0];
      const startStr = startDate.toISOString().split('T')[0];
      if (dateStr === startStr) {
        dayElement.classList.add('selected');
      }
    }
    
      dayElement.addEventListener('click', function() {
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);
      
      if (isSelectingStart || !startDate) {
        startDate = clickedDate;
        endDate = null;
        isSelectingStart = false;
      } else {
        if (clickedDate < startDate) {
          endDate = startDate;
          startDate = clickedDate;
        } else {
          endDate = clickedDate;
        }
        isSelectingStart = true;
      }
      
      updateInputFields();
      renderCalendar();
    });
    
    return dayElement;
  }
  
  // Handle start date input
  if (startDateInput) {
    startDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        startDate = null;
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newStartDate = parsedDate;
        newStartDate.setHours(0, 0, 0, 0);
        
        // Validate against end date if it exists
        if (endDate && newStartDate > endDate) {
          showDateValidationError('Start date must be before or equal to end date');
          this.value = formatDate(startDate);
          return;
        }
        
        startDate = newStartDate;
        this.value = formatDate(startDate);
        navigateToDate(startDate);
        renderCalendar();
      } else {
        // Invalid date format
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(startDate);
      }
    });
    
    startDateInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }
  
  // Handle end date input
  if (endDateInput) {
    endDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        endDate = null;
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newEndDate = parsedDate;
        newEndDate.setHours(23, 59, 59, 999);
        
        // Validate against start date if it exists
        if (startDate && newEndDate < startDate) {
          showDateValidationError('End date must be after or equal to start date');
          this.value = formatDate(endDate);
          return;
        }
        
        endDate = newEndDate;
        this.value = formatDate(endDate);
        navigateToDate(endDate);
        renderCalendar();
      } else {
        // Invalid date format
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(endDate);
      }
    });
    
    endDateInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }
  
  // Toggle date picker
  dateBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      // If already active, just close (don't reset filter)
      this.classList.remove('active');
      datePicker.classList.remove('show');
    } else {
      // Open date picker
      this.classList.add('active');
      datePicker.classList.add('show');
      currentDate = new Date();
      monthSelect.value = currentDate.getMonth();
      initYearSelect();
      updateInputFields();
      renderCalendar();
    }
  });
  
  // Month/Year change
  monthSelect.addEventListener('change', renderCalendar);
  yearSelect.addEventListener('change', renderCalendar);
  
  // Back button - only dismiss the date picker, don't reset dates
  backBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
    // Don't reset startDate and endDate - keep the current selection
    // Update input fields to show current selection
    updateInputFields();
  });
  
  // Apply button
  applyBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Remove any existing error messages
    const existingError = document.querySelector('.date-validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // If dates are in input fields but not set, parse them
    if (startDateInput && startDateInput.value.trim() !== '') {
      const parsedStart = parseDate(startDateInput.value);
      if (parsedStart) {
        startDate = parsedStart;
        startDate.setHours(0, 0, 0, 0);
      } else {
        showDateValidationError('Invalid start date format. Please use DD/MM/YYYY');
        return;
      }
    }
    
    if (endDateInput && endDateInput.value.trim() !== '') {
      const parsedEnd = parseDate(endDateInput.value);
      if (parsedEnd) {
        endDate = parsedEnd;
        endDate.setHours(23, 59, 59, 999);
      } else {
        showDateValidationError('Invalid end date format. Please use DD/MM/YYYY');
        return;
      }
    }
    
    // Validate date range
    if (startDate && endDate) {
      if (!validateDateRange(startDate, endDate)) {
        showDateValidationError('Start date must be before or equal to end date');
        return;
      }
      filterTableByDateRange(startDate, endDate);
    } else if (startDate) {
      filterTableByDateRange(startDate, startDate);
    }
    
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!dateBtn.contains(e.target) && !datePicker.contains(e.target)) {
      if (dateBtn.classList.contains('active')) {
        dateBtn.classList.remove('active');
        datePicker.classList.remove('show');
        // Don't reset filter when closing - keep the date range active
      }
    }
  });
  
  // Initialize
  initYearSelect();
}

/* ============================================
   ACTION BUTTON TOGGLE FUNCTIONALITY
   ============================================ */

// Set up action button toggle
function setupActionButtonToggle() {
  const actionBtn = document.getElementById('action-filter-btn');
  if (!actionBtn) return;
  
  const actionSubmenu = document.getElementById('action-submenu');
  if (!actionSubmenu) return;
  
  actionBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      // If already active, just close (don't reset filter)
      this.classList.remove('active');
      actionSubmenu.classList.remove('show');
    } else {
      // Open submenu
      this.classList.add('active');
      actionSubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!actionBtn.contains(e.target) && !actionSubmenu.contains(e.target)) {
      if (actionBtn.classList.contains('active')) {
        actionBtn.classList.remove('active');
        actionSubmenu.classList.remove('show');
        // Don't reset filter when closing - keep the selected option active
      }
    }
  });
  
  // Handle action option clicks
  const actionOptions = actionSubmenu.querySelectorAll('.action-option-btn');
  actionOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const selectedAction = this.getAttribute('data-action');
      const isCurrentlyActive = this.classList.contains('active');
      
      if (isCurrentlyActive) {
        // If already active, deselect and reset
        this.classList.remove('active');
        // Reset action mode and table action buttons
        window.currentActionMode = null;
        resetTableActionButtons();
      } else {
        // Remove active class from all options
        actionOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        this.classList.add('active');
        
        // Update table action buttons based on selected action
        if (selectedAction === 'edit') {
          updateTableActionButtons('edit');
        } else if (selectedAction === 'remove') {
          updateTableActionButtons('remove');
        } else if (selectedAction === 'add') {
          // Show add user popup
          const pageTitle = document.querySelector('.page-title');
          let tableType = 'staff';
          if (pageTitle) {
            const titleText = pageTitle.textContent.trim();
            if (titleText.includes('MEMBER')) {
              tableType = 'member';
            } else if (titleText.includes('SUPPLIER')) {
              tableType = 'supplier';
            } else if (titleText.includes('STAFF')) {
              tableType = 'staff';
            }
          }
          
          // Check if user is manager before showing add popup
          if (!isCurrentUserManager()) {
            showManagerVerificationDialog(() => {
              showAddUserPopup(tableType);
            });
          } else {
            showAddUserPopup(tableType);
          }
          
          // Reset to None for add action
          resetTableActionButtons();
        }
      }
      
      // Close submenu after selection
      actionBtn.classList.remove('active');
      actionSubmenu.classList.remove('show');
    });
  });
}

// Store current action mode globally
window.currentActionMode = null;

// Update table action buttons based on selected action mode
function updateTableActionButtons(actionType) {
  window.currentActionMode = actionType;
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const actionCell = row.querySelector('td:last-child');
    if (!actionCell) return;
    
    // Skip if it's a "no data" message row
    if (actionCell.classList.contains('no-data-message') || actionCell.getAttribute('colspan')) {
      return;
    }
    
    // Only update if the cell contains "None" or already has an action button
    const cellText = actionCell.textContent.trim();
    if (cellText === 'None' || actionCell.querySelector('.table-action-btn')) {
      // Get user data from row
      const cells = row.querySelectorAll('td');
      
      // Determine table type based on page
      const pageTitle = document.querySelector('.page-title');
      let tableType = 'staff';
      if (pageTitle) {
        const titleText = pageTitle.textContent.trim();
        if (titleText.includes('MEMBER')) {
          tableType = 'member';
        } else if (titleText.includes('SUPPLIER')) {
          tableType = 'supplier';
        }
      }
      
      // Extract user data based on table type
      // First try to get email from row data attribute, then from cell
      const rowEmail = row.getAttribute('data-user-email') || cells[2]?.textContent.trim() || '';
      let userData = {
        email: rowEmail,
        id: row.getAttribute('data-user-id') || '',
        _tableType: tableType
      };
      
      // Get status from status badge in the row (5th column, index 5)
      const statusBadge = row.querySelector('.status-badge');
      const isInactive = statusBadge && statusBadge.textContent.trim().toLowerCase() === 'inactive';
      userData.isInactive = isInactive;
      
      if (tableType === 'supplier') {
        // Supplier table structure: company_name, email, contact_person, phone, status, date, last_active, actions
        // Indices: 0=company_name, 1=email, 2=contact_person, 3=phone, 4=status
        userData.company_name = cells[0]?.textContent.trim() || '';
        userData.contact_person = cells[2]?.textContent.trim() || '';
        userData.phone = cells[3]?.textContent.trim() || '';
        userData.username = userData.company_name; // For display in dialog
        // Get status from status badge
        const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : 'active';
        userData.status = statusText === 'active' ? 'active' : 'inactive';
      } else if (tableType === 'member') {
        // Member table: Code, Username, Email, Phone, Points, Status, Joined Date, Last Active, Actions
        // Indices: 0=Code, 1=Username, 2=Email, 3=Phone
        userData.username = cells[1]?.textContent.trim() || '';
        userData.phone = cells[3]?.textContent.trim() || '';
      } else {
        // Staff table: Code, Username, Email, Phone, Position, Status, Created Date, Last Active, Actions
        // Indices: 0=Code, 1=Username, 2=Email, 3=Phone, 4=Position
        userData.username = cells[1]?.textContent.trim() || '';
        userData.phone = cells[3]?.textContent.trim() || '';
        userData.position = cells[4]?.textContent.trim() || '';
        // Get is_active from status badge
        userData.is_active = !isInactive;
      }
      
      // For remove action, skip inactive users
      if (actionType === 'remove' && isInactive) {
        // Don't show remove button for inactive users, keep as "None"
        return;
      }
      
      if (actionType === 'edit') {
        // Store user data in a way that can be retrieved
        const userDataJson = JSON.stringify(userData);
        actionCell.innerHTML = `
          <button class="table-action-btn edit-btn" data-user-email="${userData.email}" data-table-type="${tableType}">
            <img src="image/sn_icon_edit.png" alt="Edit" class="action-icon-default" style="opacity: 1;" />
            <img src="image/sn_icon_hover_edit.png" alt="Edit" class="action-icon-hover" style="opacity: 0;" />
          </button>
        `;
        // Add click handler for edit button
        const editBtn = actionCell.querySelector('.edit-btn');
        if (editBtn) {
          // Store userData in closure for this button
          editBtn._userData = userData;
          editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Retrieve userData from closure
            const data = this._userData || {
              email: this.getAttribute('data-user-email'),
              _tableType: this.getAttribute('data-table-type') || 'staff'
            };
            // Ensure status data is included
            if (!data.status && !data.is_active && data._tableType === 'supplier') {
              // Get status from status badge if not already set
              const statusBadge = row.querySelector('.status-badge');
              if (statusBadge) {
                data.status = statusBadge.textContent.trim().toLowerCase() === 'active' ? 'active' : 'inactive';
              }
            }
            if (data._tableType === 'staff' && data.is_active === undefined) {
              // Get is_active from status badge if not already set
              const statusBadge = row.querySelector('.status-badge');
              if (statusBadge) {
                data.is_active = statusBadge.textContent.trim().toLowerCase() === 'active';
              }
            }
            showEditUserPopup(data);
          });
        }
      } else if (actionType === 'remove') {
        actionCell.innerHTML = `
          <button class="table-action-btn remove-btn" data-user-email="${userData.email}">
            <img src="image/sn_icon_trash.png" alt="Remove" class="action-icon-default" style="opacity: 1;" />
            <img src="image/sn_icon_hover_trash.png" alt="Remove" class="action-icon-hover" style="opacity: 0;" />
          </button>
        `;
        // Add click handler for remove button
        const removeBtn = actionCell.querySelector('.remove-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const userEmail = this.getAttribute('data-user-email');
            if (userEmail) {
              showDeleteUserDialog(userEmail, userData.username || userData.company_name || 'THIS USER');
            }
          });
        }
      }
    }
  });
}

// Reset table action buttons back to "None"
function resetTableActionButtons() {
  window.currentActionMode = null;
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const actionCell = row.querySelector('td:last-child');
    if (!actionCell) return;
    
    // Skip if it's a "no data" message row
    if (actionCell.classList.contains('no-data-message') || actionCell.getAttribute('colspan')) {
      return;
    }
    
    // Reset to "None" if it contains an action button
    if (actionCell.querySelector('.table-action-btn')) {
      actionCell.textContent = 'None';
    }
  });
}

// Filter table by date range
function filterTableByDateRange(startDate, endDate) {
  // Store date range for filtering
  window.dateFilterRange = { start: startDate, end: endDate };
  
  // Get current search term and status filter
  const searchInput = document.querySelector('.search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeStatusOption = document.querySelector('.status-option-btn.active');
  const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
  
  // Apply all filters
  applyFilters(searchTerm, statusFilter, null, { start: startDate, end: endDate });
}


/* ============================================
   EDIT POSITION POPUP FUNCTIONALITY
   ============================================ */

// Store original positions for reset
let originalPositions = [];
let positionRealtimeChannel = null;

// Load positions from Supabase
async function loadPositionsFromSupabase() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return [];
    }
    
    const { data, error } = await window.supabase
      .from('positions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error loading positions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error loading positions:', error);
    return [];
  }
}

// Save positions to Supabase
async function savePositionsToSupabase(positions) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    // Get current positions from database
    const { data: currentPositions, error: fetchError } = await window.supabase
      .from('positions')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching current positions:', fetchError);
      return false;
    }
    
    // Create maps for easier lookup
    const currentMap = new Map(currentPositions.map(p => [p.position_name.toUpperCase(), p]));
    const newMap = new Map(positions.map((p, index) => [p.text.toUpperCase(), { ...p, index }]));
    
    // Delete positions that are no longer in the list
    for (const [name, pos] of currentMap) {
      if (!newMap.has(name)) {
        const { error: deleteError } = await window.supabase
          .from('positions')
          .delete()
          .eq('id', pos.id);
        
        if (deleteError) {
          console.error('Error deleting position:', deleteError);
        }
      }
    }
    
    // Update or insert positions
    for (const [name, posData] of newMap) {
      const existing = currentMap.get(name);
      
      if (existing) {
        // Update existing position
        if (existing.position_name.toUpperCase() !== posData.text.toUpperCase() || 
            existing.display_order !== posData.index + 1) {
          const { error: updateError } = await window.supabase
            .from('positions')
            .update({
              position_name: posData.text,
              display_order: posData.index + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('Error updating position:', updateError);
          }
        }
      } else {
        // Insert new position
        const { error: insertError } = await window.supabase
          .from('positions')
          .insert({
            position_name: posData.text,
            display_order: posData.index + 1,
            is_active: true
          });
        
        if (insertError) {
          console.error('Error inserting position:', insertError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving positions:', error);
    return false;
  }
}

// Set up real-time subscription for positions
function setupPositionsRealtime() {
  if (!window.supabase) return null;
  
  // Clean up existing channel if any
  if (positionRealtimeChannel) {
    window.supabase.removeChannel(positionRealtimeChannel);
  }
  
  const channel = window.supabase
    .channel('positions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'positions'
      },
      async (payload) => {
        console.log('Position change detected:', payload);
        // Clear position cache to force reload
        positionNameCache = null;
        // Reload positions when changes occur
        if (document.getElementById('edit-position-popup')?.style.display === 'flex') {
          await loadPositionsIntoPopup();
        }
        // Also reload dropdown if it's open
        const positionSubmenu = document.getElementById('position-submenu');
        if (positionSubmenu && positionSubmenu.classList.contains('show')) {
          await loadPositionsIntoDropdown();
        }
        // Reload staff data to update position displays with new position names
        await loadStaffData();
      }
    )
    .subscribe();
  
  positionRealtimeChannel = channel;
  return channel;
}

// Store current active position filter
window.currentPositionFilter = null;

// Load positions into dropdown (for position button submenu)
async function loadPositionsIntoDropdown() {
  const scrollableFrame = document.getElementById('position-list-scrollable-frame');
  if (!scrollableFrame) return;
  
  const positions = await loadPositionsFromSupabase();
  
  // Clear current list
  scrollableFrame.innerHTML = '';
  
  // Create position buttons
  positions.forEach((pos) => {
    const button = document.createElement('button');
    button.className = 'position-option-btn';
    const positionValue = pos.position_name.toLowerCase().replace(/\s+/g, '-');
    button.setAttribute('data-position', positionValue);
    button.textContent = pos.position_name;
    
    // Restore active state if this position is currently filtered
    if (window.currentPositionFilter === positionValue) {
      button.classList.add('active');
    }
    
    scrollableFrame.appendChild(button);
  });
  
  // Setup click handlers for dynamically created buttons
  const positionSubmenu = document.getElementById('position-submenu');
  const positionButtons = scrollableFrame.querySelectorAll('.position-option-btn');
  positionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const selectedPosition = this.getAttribute('data-position');
      const isCurrentlyActive = this.classList.contains('active');
      
      if (isCurrentlyActive) {
        // If already active, deselect and remove filter
        this.classList.remove('active');
        window.currentPositionFilter = null;
        // Reset position filter
        const searchInput = document.querySelector('.search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeStatusOption = document.querySelector('.status-option-btn.active');
        const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
        const dateRange = window.dateFilterRange || null;
        applyFilters(searchTerm, statusFilter, null, dateRange);
      } else {
        // Remove active class from all position options (except edit)
        if (positionSubmenu) {
          const allPositionOptions = positionSubmenu.querySelectorAll('.position-option-btn:not([data-position="edit"])');
          allPositionOptions.forEach(opt => opt.classList.remove('active'));
        }
        // Add active class to clicked option
        this.classList.add('active');
        window.currentPositionFilter = selectedPosition;
        // Filter by position
        filterTableByPosition(selectedPosition);
      }
    });
  });
}

// Load positions into popup
async function loadPositionsIntoPopup() {
  const positionFrame = document.getElementById('position-list-frame');
  if (!positionFrame) return;
  
  const positions = await loadPositionsFromSupabase();
  
  // Clear current list
  positionFrame.innerHTML = '';
  
  // Create position items
  positions.forEach((pos, index) => {
    const wrapper = createPositionItem(pos.position_name, pos.position_name.toLowerCase().replace(/\s+/g, '-'));
    positionFrame.appendChild(wrapper);
  });
  
  // Setup listeners
  setupPositionItemListeners();
  
  // Store as original positions
  originalPositions = positions.map((pos, index) => ({
    position: pos.position_name.toLowerCase().replace(/\s+/g, '-'),
    text: pos.position_name
  }));
}

// Show edit position popup
async function showEditPositionPopup() {
  const popup = document.getElementById('edit-position-popup');
  if (popup) {
    // Load positions from Supabase
    await loadPositionsIntoPopup();
    
    // Set up real-time subscription
    setupPositionsRealtime();
    
    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

// Hide edit position popup (discard changes)
async function hideEditPositionPopup() {
  const popup = document.getElementById('edit-position-popup');
  if (popup) {
    // Reset to original positions
    await resetPositionList();
    
    // Clean up real-time subscription
    if (positionRealtimeChannel) {
      window.supabase?.removeChannel(positionRealtimeChannel);
      positionRealtimeChannel = null;
    }
    
    popup.style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Reset position list to original state
async function resetPositionList() {
  const positionFrame = document.getElementById('position-list-frame');
  if (!positionFrame) return;
  
  // Reload from Supabase to get original state
  await loadPositionsIntoPopup();
  
  // Reset action buttons
  const addBtn = document.getElementById('add-position-btn');
  const removeBtn = document.getElementById('remove-position-btn');
  const editBtn = document.getElementById('edit-position-btn');
  if (addBtn) addBtn.classList.remove('active');
  if (removeBtn) removeBtn.classList.remove('active');
  if (editBtn) editBtn.classList.remove('active');
  
  // Hide all action icons
  hideAllActionIcons();
  
  // Remove any new position inputs
  const newPositionInputs = positionFrame.querySelectorAll('.position-list-item-wrapper.new-position');
  newPositionInputs.forEach(input => input.remove());
}

// Create a position item wrapper
function createPositionItem(text, position) {
  const wrapper = document.createElement('div');
  wrapper.className = 'position-list-item-wrapper';
  wrapper.setAttribute('data-position', position);
  
  const textSpan = document.createElement('span');
  textSpan.className = 'position-list-item-text';
  textSpan.textContent = text;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'position-list-item-input';
  input.value = text;
  input.style.textTransform = 'uppercase';
  
  const editBtn = document.createElement('button');
  editBtn.className = 'position-action-icon-btn position-edit-icon-btn';
  editBtn.setAttribute('data-action', 'edit-item');
  editBtn.style.display = 'none';
  editBtn.innerHTML = `
    <img src="image/sn_icon_edit.png" alt="Edit" class="position-action-icon" />
    <img src="image/sn_icon_hover_edit.png" alt="Edit" class="position-action-icon-hover" />
  `;
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'position-action-icon-btn position-remove-icon-btn';
  removeBtn.setAttribute('data-action', 'remove-item');
  removeBtn.style.display = 'none';
  removeBtn.innerHTML = `
    <img src="image/sn_icon_trash.png" alt="Remove" class="position-action-icon" />
    <img src="image/sn_icon_hover_trash.png" alt="Remove" class="position-action-icon-hover" />
  `;
  
  wrapper.appendChild(textSpan);
  wrapper.appendChild(input);
  wrapper.appendChild(editBtn);
  wrapper.appendChild(removeBtn);
  
  return wrapper;
}

// Hide all action icons
function hideAllActionIcons() {
  const positionFrame = document.getElementById('position-list-frame');
  if (!positionFrame) return;
  
  const editIcons = positionFrame.querySelectorAll('.position-edit-icon-btn');
  const removeIcons = positionFrame.querySelectorAll('.position-remove-icon-btn');
  
  editIcons.forEach(icon => icon.style.display = 'none');
  removeIcons.forEach(icon => icon.style.display = 'none');
}

// Set up position item event listeners
function setupPositionItemListeners() {
  const positionFrame = document.getElementById('position-list-frame');
  if (!positionFrame) return;
  
  // Handle edit icon clicks
  const editIcons = positionFrame.querySelectorAll('.position-edit-icon-btn');
  editIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && !wrapper.classList.contains('new-position')) {
        wrapper.classList.add('editing');
        const input = wrapper.querySelector('.position-list-item-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  });
  
  // Handle remove icon clicks
  const removeIcons = positionFrame.querySelectorAll('.position-remove-icon-btn');
  removeIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && !wrapper.classList.contains('new-position')) {
        wrapper.remove();
      }
    });
  });
  
  // Handle input field blur (save on blur)
  const inputs = positionFrame.querySelectorAll('.position-list-item-input');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && wrapper.classList.contains('editing')) {
        const newValue = this.value.trim().toUpperCase();
        if (newValue) {
          const textSpan = wrapper.querySelector('.position-list-item-text');
          if (textSpan) {
            textSpan.textContent = newValue;
          }
          wrapper.classList.remove('editing');
        } else {
          // If empty, restore original value
          const textSpan = wrapper.querySelector('.position-list-item-text');
          if (textSpan) {
            this.value = textSpan.textContent;
          }
          wrapper.classList.remove('editing');
        }
      }
    });
    
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  });
}

// Set up edit position popup
function setupEditPositionPopup() {
  const popup = document.getElementById('edit-position-popup');
  if (!popup) return;

  // Close button
  const closeBtn = document.getElementById('close-edit-position-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      await hideEditPositionPopup();
    });
  }

  // Close when clicking outside the dialog
  popup.addEventListener('click', async function(e) {
    if (e.target === popup) {
      await hideEditPositionPopup();
    }
  });

  // Setup position item listeners
  setupPositionItemListeners();

  // Add button
  const addBtn = document.getElementById('add-position-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const positionFrame = document.getElementById('position-list-frame');
      if (!positionFrame) return;
      
      // Check if new position input already exists
      const existingNew = positionFrame.querySelector('.position-list-item-wrapper.new-position');
      if (existingNew) {
        existingNew.remove();
        this.classList.remove('active');
      } else {
        // Create new position input
        const wrapper = document.createElement('div');
        wrapper.className = 'position-list-item-wrapper new-position';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'position-list-item-input';
        input.placeholder = 'ENTER NEW POSITION';
        input.style.textTransform = 'uppercase';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'position-confirm-btn';
        confirmBtn.textContent = 'CONFIRM';
        
        confirmBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const newValue = input.value.trim().toUpperCase();
          if (newValue) {
            // Create new position item
            const newItem = createPositionItem(newValue, newValue.toLowerCase().replace(/\s+/g, '-'));
            positionFrame.appendChild(newItem);
            setupPositionItemListeners();
            
            // Remove new position input
            wrapper.remove();
            addBtn.classList.remove('active');
          }
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(confirmBtn);
        positionFrame.appendChild(wrapper);
        
        // Focus input
        setTimeout(() => input.focus(), 100);
      }
    });
  }

  // Remove button
  const removeBtn = document.getElementById('remove-position-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const positionFrame = document.getElementById('position-list-frame');
      if (!positionFrame) return;
      
      const removeIcons = positionFrame.querySelectorAll('.position-remove-icon-btn');
      const isActive = this.classList.contains('active');
      
      removeIcons.forEach(icon => {
        const wrapper = icon.closest('.position-list-item-wrapper');
        if (wrapper && !wrapper.classList.contains('new-position')) {
          icon.style.display = isActive ? 'flex' : 'none';
        }
      });
      
      // Hide edit icons when remove is active
      if (isActive) {
        const editIcons = positionFrame.querySelectorAll('.position-edit-icon-btn');
        editIcons.forEach(icon => icon.style.display = 'none');
        const editBtn = document.getElementById('edit-position-btn');
        if (editBtn) editBtn.classList.remove('active');
      }
    });
  }

  // Edit button
  const editBtn = document.getElementById('edit-position-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const positionFrame = document.getElementById('position-list-frame');
      if (!positionFrame) return;
      
      const editIcons = positionFrame.querySelectorAll('.position-edit-icon-btn');
      const isActive = this.classList.contains('active');
      
      editIcons.forEach(icon => {
        const wrapper = icon.closest('.position-list-item-wrapper');
        if (wrapper && !wrapper.classList.contains('new-position')) {
          icon.style.display = isActive ? 'flex' : 'none';
        }
      });
      
      // Hide remove icons when edit is active
      if (isActive) {
        const removeIcons = positionFrame.querySelectorAll('.position-remove-icon-btn');
        removeIcons.forEach(icon => icon.style.display = 'none');
        const removeBtn = document.getElementById('remove-position-btn');
        if (removeBtn) removeBtn.classList.remove('active');
      }
    });
  }

  // Save Changes button
  const saveBtn = document.getElementById('save-position-changes-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      
      // Require staff authentication for all users
      try {
        await requireStaffAuthentication(
          async (authenticatedUser) => {
            await savePositionChangesInternal(authenticatedUser);
          },
          'Saved position changes',
          'positions',
          { action: 'save_position_changes' }
        );
      } catch (error) {
        if (error.message !== 'Authentication cancelled') {
          console.error('Authentication error:', error);
        }
      }
    });
  }
}

// Internal function to save position changes (after authentication)
async function savePositionChangesInternal(authenticatedUser) {
  const saveBtn = document.getElementById('save-position-changes-btn');
  const positionFrame = document.getElementById('position-list-frame');
  const popup = document.getElementById('edit-position-popup');
  
  if (!positionFrame) return;
  
  // Disable button and show loading state
  if (saveBtn) {
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'SAVING...';
    
    // Collect all current positions
    const currentPositions = Array.from(positionFrame.querySelectorAll('.position-list-item-wrapper:not(.new-position)')).map(wrapper => {
      const text = wrapper.querySelector('.position-list-item-text');
      return {
        position: wrapper.getAttribute('data-position'),
        text: text ? text.textContent.trim() : ''
      };
    });
    
    // Save to Supabase
    const success = await savePositionsToSupabase(currentPositions);
    
    if (success) {
      // Update original positions to current state
      originalPositions = currentPositions;
      
      // Show success message
      if (saveBtn) {
        saveBtn.textContent = 'SAVED!';
        saveBtn.style.background = '#4caf50';
      }
      
      setTimeout(async () => {
        // Close popup
        if (popup) {
          popup.style.display = 'none';
          document.body.classList.remove('popup-open');
          document.body.style.overflow = '';
        }
        
        const addBtn = document.getElementById('add-position-btn');
        const removeBtn = document.getElementById('remove-position-btn');
        const editBtn = document.getElementById('edit-position-btn');
        
        // Reset action buttons
        if (addBtn) addBtn.classList.remove('active');
        if (removeBtn) removeBtn.classList.remove('active');
        if (editBtn) editBtn.classList.remove('active');
        hideAllActionIcons();
        
        // Reset save button
        if (saveBtn) {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#9D5858';
          saveBtn.disabled = false;
        }
        
        // Reload positions in dropdown
        await loadPositionsIntoDropdown();
        
        // Reload staff data to update position names
        await loadStaffData();
      }, 1000);
    } else {
      // Show error message
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#9D5858';
          saveBtn.disabled = false;
        }, 2000);
      }
    }
  }
}

/* ============================================
   DELETE USER CONFIRMATION DIALOG
   ============================================ */

// Show delete user confirmation dialog
function showDeleteUserDialog(userEmail, username) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'logout-dialog-overlay';
  overlay.id = 'delete-user-dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'logout-dialog';
  
  // Create message
  const message = document.createElement('p');
  message.className = 'logout-dialog-message';
  message.textContent = `ARE YOU SURE YOU WANT TO DELETE ${username || 'THIS USER'} ?`;
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'logout-dialog-buttons';
  
  // Create YES button
  const yesButton = document.createElement('button');
  yesButton.className = 'logout-dialog-btn';
  yesButton.textContent = 'YES';
  yesButton.onclick = () => confirmDeleteUser(userEmail);
  
  // Create NO button
  const noButton = document.createElement('button');
  noButton.className = 'logout-dialog-btn';
  noButton.textContent = 'NO';
  noButton.onclick = dismissDeleteUserDialog;
  
  // Assemble dialog
  buttonsContainer.appendChild(yesButton);
  buttonsContainer.appendChild(noButton);
  dialog.appendChild(message);
  dialog.appendChild(buttonsContainer);
  overlay.appendChild(dialog);
  
  // Add to body
  document.body.appendChild(overlay);
  
  // Blur the main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('blurred');
  }
}

// Dismiss delete user dialog
function dismissDeleteUserDialog() {
  const overlay = document.getElementById('delete-user-dialog-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Remove blur
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.remove('blurred');
  }
}

// Confirm delete user (set status to inactive)
async function confirmDeleteUser(userEmail) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Determine which table to update based on current page
    const pageTitle = document.querySelector('.page-title');
    let tableName = 'staff'; // default
    let updateData = {};
    
    if (pageTitle) {
      const titleText = pageTitle.textContent.trim();
      if (titleText.includes('MEMBER')) {
        // Member table doesn't exist - skip or handle gracefully
        alert('Member table does not exist in the database.');
        dismissDeleteUserDialog();
        return;
      } else if (titleText.includes('SUPPLIER')) {
        tableName = 'supplier';
        updateData = { status: 'inactive' };
      } else if (titleText.includes('STAFF')) {
        tableName = 'staff';
        updateData = { is_active: false };
      }
    } else {
      // Default to staff if page title not found
      updateData = { is_active: false };
    }
    
    // Log the operation for debugging
    console.log('Deleting user:', {
      tableName,
      userEmail,
      updateData
    });
    
    // Update user status to inactive
    // Use email for matching
    let query = window.supabase
      .from(tableName)
      .update(updateData);
    
    if (userEmail && userEmail !== 'N/A') {
      query = query.eq('email', userEmail);
    } else {
      console.error('No valid email provided for deletion');
      alert('Error: No valid email found for this user.');
      dismissDeleteUserDialog();
      return;
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      console.error('Error deleting user:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Table:', tableName);
      console.error('Email:', userEmail);
      console.error('Update data:', updateData);
      
      // More specific error message
      let errorMsg = 'Error deleting user. ';
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
        errorMsg += 'Permission denied. Please check RLS policies in Supabase.';
      } else if (error.message.includes('does not exist')) {
        errorMsg += 'Table or column does not exist. Please check the database schema.';
      } else {
        errorMsg += error.message || 'Unknown error occurred.';
      }
      alert(errorMsg);
    } else {
      console.log('User deleted successfully:', data);
      // Reload data to reflect changes
      if (tableName === 'staff') {
        await loadStaffData();
      } else if (tableName === 'member') {
        await loadMemberData();
      } else if (tableName === 'supplier') {
        await loadSupplierData();
      }
      
      // Dismiss dialog only on success
      dismissDeleteUserDialog();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    alert('Error deleting user. Please try again.');
    dismissDeleteUserDialog();
  }
}

/* ============================================
   EDIT USER POPUP FUNCTIONALITY
   ============================================ */

// Store original user data for reset
let originalUserData = null;

// Show edit user popup
function showEditUserPopup(userData) {
  // Check if user is manager, if not show verification dialog
  if (!isCurrentUserManager()) {
    showManagerVerificationDialog(() => {
      // After verification, show the edit popup
      showEditUserPopupInternal(userData);
    });
    return;
  }
  
  showEditUserPopupInternal(userData);
}

// Internal function to show edit user popup (after verification)
function showEditUserPopupInternal(userData) {
  originalUserData = { ...userData };
  
  const popup = document.getElementById('edit-user-popup');
  if (!popup) return;
  
  // Populate form fields
  const usernameInput = document.getElementById('edit-user-username');
  const emailInput = document.getElementById('edit-user-email');
  const phoneInput = document.getElementById('edit-user-phone');
  const positionSelect = document.getElementById('edit-user-position');
  const statusSelect = document.getElementById('edit-user-status');
  
  // Update label based on table type
  const usernameLabel = usernameInput?.previousElementSibling;
  if (usernameLabel && userData._tableType === 'supplier') {
    usernameLabel.textContent = 'COMPANY NAME';
  } else if (usernameLabel) {
    usernameLabel.textContent = 'USERNAME';
  }
  
  // Populate fields based on table type
  if (userData._tableType === 'supplier') {
    if (usernameInput) usernameInput.value = userData.company_name || '';
    if (phoneInput) phoneInput.value = userData.phone || '';
    // Set status for supplier
    if (statusSelect) {
      const status = userData.status || 'active';
      statusSelect.value = status === 'active' ? 'active' : 'inactive';
    }
  } else {
    if (usernameInput) usernameInput.value = userData.username || '';
    if (phoneInput) phoneInput.value = userData.phone || '';
    // Set status for staff (is_active)
    if (statusSelect) {
      const isActive = userData.is_active !== false; // Default to true if null/undefined
      statusSelect.value = isActive ? 'active' : 'inactive';
    }
  }
  
  if (emailInput) emailInput.value = userData.email || '';
  
  // Load positions and set selected position (only for staff)
  if (positionSelect && userData._tableType === 'staff') {
    loadPositionsForEditUser(userData.position || '').then(() => {
      if (positionSelect) {
        // Set selected position
        const options = positionSelect.querySelectorAll('option');
        options.forEach(option => {
          if (userData.position && option.textContent.trim().toUpperCase() === userData.position.toUpperCase()) {
            option.selected = true;
          }
        });
      }
    });
  }
  
  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Hide edit user popup (discard changes)
function hideEditUserPopup() {
  const popup = document.getElementById('edit-user-popup');
  if (!popup) return;
  
  // Reset form to original values
  if (originalUserData) {
    const usernameInput = document.getElementById('edit-user-username');
    const emailInput = document.getElementById('edit-user-email');
    const phoneInput = document.getElementById('edit-user-phone');
    const positionSelect = document.getElementById('edit-user-position');
    
    if (usernameInput) usernameInput.value = originalUserData.username || '';
    if (emailInput) emailInput.value = originalUserData.email || '';
    if (phoneInput) phoneInput.value = originalUserData.phone || '';
    if (positionSelect) positionSelect.value = '';
  }
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  originalUserData = null;
}

// Load positions for edit user dropdown
async function loadPositionsForEditUser(currentPosition) {
  const positionSelect = document.getElementById('edit-user-position');
  if (!positionSelect) return;
  
  const positions = await loadPositionsFromSupabase();
  
  // Clear existing options
  positionSelect.innerHTML = '<option value="">Select Position</option>';
  
  // Add position options
  positions.forEach(pos => {
    const option = document.createElement('option');
    option.value = pos.position_name;
    option.textContent = pos.position_name;
    if (pos.position_name.toUpperCase() === currentPosition.toUpperCase()) {
      option.selected = true;
    }
    positionSelect.appendChild(option);
  });
}

// Save user changes
async function saveUserChanges() {
  // Require staff authentication for all users
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveUserChangesInternal(authenticatedUser);
      },
      'Updated user information',
      'user',
      { action: 'save_user_changes' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save user changes (after authentication)
async function saveUserChangesInternal(authenticatedUser) {
  const saveBtn = document.getElementById('save-user-changes-btn');
  const popup = document.getElementById('edit-user-popup');
  
  // Store original button state
  let originalText = 'SAVE CHANGES';
  let originalBackground = '';
  
  // Disable button and show loading state
  if (saveBtn) {
    originalText = saveBtn.textContent;
    originalBackground = saveBtn.style.background || '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
  }
  
  try {
      if (!window.supabase || !originalUserData) {
        console.error('Supabase client not initialized or no user data');
        if (saveBtn) {
          saveBtn.textContent = 'SAVE FAILED';
          saveBtn.style.background = '#f44336';
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = originalBackground;
            saveBtn.disabled = false;
          }, 2000);
        }
        return;
      }
      
      // Get form values
      const usernameInput = document.getElementById('edit-user-username');
      const emailInput = document.getElementById('edit-user-email');
      const phoneInput = document.getElementById('edit-user-phone');
      const positionSelect = document.getElementById('edit-user-position');
      const statusSelect = document.getElementById('edit-user-status');
      
      // Determine table type
      const tableType = originalUserData._tableType || 'staff';
      let updatedData = {};
      
      if (tableType === 'supplier') {
        // Supplier table: update company_name, phone, and status
        const companyName = usernameInput?.value.trim();
        const phone = phoneInput?.value.trim();
        if (companyName) updatedData.company_name = companyName;
        if (phone) updatedData.phone = phone;
        // Update status
        if (statusSelect && statusSelect.value) {
          updatedData.status = statusSelect.value;
        }
      } else if (tableType === 'member') {
        // Member table: update username and phone
        const username = usernameInput?.value.trim();
        const phone = phoneInput?.value.trim();
        if (username) updatedData.username = username;
        if (phone) updatedData.phone = phone;
      } else {
        // Staff table: update username, phone, position, and is_active
        const username = usernameInput?.value.trim();
        const phone = phoneInput?.value.trim();
        if (username) updatedData.username = username;
        if (phone) updatedData.phone = phone;
        // Only add position if position select exists (staff page only)
        if (positionSelect && positionSelect.value) {
          updatedData.position = positionSelect.value;
        }
        // Update is_active based on status select
        if (statusSelect && statusSelect.value) {
          updatedData.is_active = statusSelect.value === 'active';
        }
      }
      
      // Don't proceed if no data to update
      if (Object.keys(updatedData).length === 0) {
        if (saveBtn) {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }
        alert('No changes to save.');
        return;
      }
      
      // Determine which table to update - use tableType from originalUserData
      // This ensures we use the correct table regardless of page title
      // The tableType is set when the edit popup is opened, so it's always correct
      let tableName = tableType || 'staff';
      
      // Fallback: if tableType is not set, try to determine from page title
      if (!tableType) {
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
          const titleText = pageTitle.textContent.trim();
          if (titleText.includes('SUPPLIER')) {
            tableName = 'supplier';
          } else if (titleText.includes('MEMBER')) {
            tableName = 'member';
          } else if (titleText.includes('STAFF')) {
            tableName = 'staff';
          }
        }
      }
    
    // Log the operation for debugging
    console.log('Updating user:', {
      tableName,
      tableType,
      email: originalUserData.email,
      updatedData
    });
    
    // Update user data
    // Use email for matching
    let query = window.supabase
      .from(tableName)
      .update(updatedData);
    
    if (originalUserData.email && originalUserData.email !== 'N/A') {
      query = query.eq('email', originalUserData.email);
    } else if (originalUserData.id) {
      query = query.eq('id', originalUserData.id);
    } else {
      console.error('No valid email or ID provided for update');
      alert('Error: No valid email or ID found for this user.');
      return;
    }
    
      const { data, error } = await query.select();
      
      if (error) {
        console.error('Error updating user:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Table:', tableName);
        console.error('Email:', originalUserData.email);
        console.error('Update data:', updatedData);
        
        // Show error message with animation
        if (saveBtn) {
          saveBtn.textContent = 'SAVE FAILED';
          saveBtn.style.background = '#f44336';
          
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = originalBackground;
            saveBtn.disabled = false;
          }, 2000);
        }
        
        // More specific error message
        let errorMsg = 'Error updating user. ';
        if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMsg += 'Permission denied. Please check RLS policies in Supabase.';
        } else if (error.message.includes('does not exist')) {
          errorMsg += 'Table or column does not exist. Please check the database schema.';
        } else {
          errorMsg += error.message || 'Unknown error occurred.';
        }
        alert(errorMsg);
      } else {
        console.log('User updated successfully:', data);
        
        // Show success message with animation
        if (saveBtn) {
          saveBtn.textContent = 'SAVED!';
          saveBtn.style.background = '#4caf50';
        }
        
        // Reload data to reflect changes - use tableType to ensure correct reload
        const reloadTableType = tableType || tableName;
        if (reloadTableType === 'staff') {
          await loadStaffData();
        } else if (reloadTableType === 'member') {
          await loadMemberData();
        } else if (reloadTableType === 'supplier') {
          await loadSupplierData();
        }
        
        // Auto-dismiss popup after 1 second
        setTimeout(() => {
          if (popup) {
            popup.style.display = 'none';
            document.body.classList.remove('popup-open');
            document.body.style.overflow = '';
          }
          originalUserData = null;
          
          // Reset save button
          if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.style.background = originalBackground;
            saveBtn.disabled = false;
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving user changes:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show error message with animation
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }, 2000);
      }
      
      alert('Error saving changes. Please try again.');
    }
}

// Set up edit user popup
function setupEditUserPopup() {
  const popup = document.getElementById('edit-user-popup');
  if (!popup) return;

  // Close button
  const closeBtn = document.getElementById('close-edit-user-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hideEditUserPopup();
    });
  }

  // Close when clicking outside the dialog
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      hideEditUserPopup();
    }
  });

  // Save Changes button
  const saveBtn = document.getElementById('save-user-changes-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      await saveUserChanges();
    });
  }
}

/* ============================================
   MANAGER VERIFICATION FUNCTIONALITY
   ============================================ */

// Check if current user is a manager
function isCurrentUserManager() {
  try {
    const userData = sessionStorage.getItem("user");
    if (!userData) return false;
    
    const user = JSON.parse(userData);
    // Check if user's position is manager (case-insensitive)
    if (user.userData && user.userData.position) {
      return user.userData.position.toLowerCase().includes('manager');
    }
    return false;
  } catch (error) {
    console.error('Error checking manager status:', error);
    return false;
  }
}

// Show manager verification dialog
// ============================================
// GENERAL STAFF AUTHENTICATION SYSTEM
// ============================================

/**
 * Require staff authentication before performing database write operations
 * @param {Function} callback - Function to execute after successful authentication
 * @param {string} actionDescription - Description of the action being performed (for logging)
 * @param {string} entityType - Type of entity being modified (for logging)
 * @param {Object} actionData - Additional data about the action (for logging)
 * @returns {Promise} - Promise that resolves when authentication is complete
 */
async function requireStaffAuthentication(callback, actionDescription = 'Database operation', entityType = 'unknown', actionData = {}) {
  // Check if authentication dialog exists
  const overlay = document.getElementById('staff-authentication-overlay') || document.getElementById('manager-verification-overlay');
  if (!overlay) {
    console.error('Authentication overlay not found. Proceeding without authentication.');
    if (callback) callback();
    return;
  }
  
  // Clear previous inputs - try username first, then fallback to email for backward compatibility
  const usernameInput = document.getElementById('staff-auth-username') || 
                       document.getElementById('manager-verify-username') || 
                       document.getElementById('staff-auth-email') || 
                       document.getElementById('manager-verify-email');
  const passwordInput = document.getElementById('staff-auth-password') || document.getElementById('manager-verify-password');
  const reasonInput = document.getElementById('staff-auth-reason') || document.getElementById('manager-verify-reason');
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';
  if (reasonInput) reasonInput.value = '';
  
  overlay.style.display = 'flex';
  
  // Blur the main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('blurred');
  }
  
  // Set up verification button
  const verifyBtn = document.getElementById('staff-auth-verify') || document.getElementById('manager-verify-yes');
  const cancelBtn = document.getElementById('staff-auth-cancel') || document.getElementById('manager-verify-no');
  
  return new Promise((resolve, reject) => {
    const handleVerify = async () => {
      const username = usernameInput?.value.trim();
      const password = passwordInput?.value.trim();
      
      if (!username || !password) {
        alert('Please enter both username and password.');
        return;
      }
      
      try {
        // First, look up staff by username to get their email
        const { data: userData, error: userError } = await window.supabase
          .from('staff')
          .select('*')
          .eq('username', username)
          .single();
        
        if (userError || !userData) {
          alert('User not found or not authorized. Only staff members can perform this action.');
          hideStaffAuthenticationDialog();
          reject(new Error('User not authorized'));
          return;
        }
        
        // Check if user is active
        if (!userData.is_active) {
          alert('Your account is inactive. Please contact an administrator.');
          hideStaffAuthenticationDialog();
          reject(new Error('User account inactive'));
          return;
        }
        
        // Get email from staff record for Supabase auth
        const email = userData.email;
        if (!email) {
          alert('User account does not have an email address. Please contact an administrator.');
          hideStaffAuthenticationDialog();
          reject(new Error('No email found for user'));
          return;
        }
        
        // Verify staff credentials using email (Supabase Auth requires email)
        const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (authError) {
          alert('Invalid credentials. Please try again.');
          return;
        }
        
        // Verification successful - create authenticated user object
        const authenticatedUser = {
          email: email,
          id: userData.id,
          username: userData.username || username,
          position: userData.position || 'Staff'
        };
        
        // Get reason from input field
        const reason = reasonInput?.value.trim() || null;
        
        // Log the authenticated action (don't let logging errors prevent action execution)
        try {
          if (typeof logActivity === 'function') {
            await logActivity(
              'authenticated_action',
              entityType,
              null,
              actionDescription,
              authenticatedUser.id,
              {
                ...actionData,
                authenticated_by: authenticatedUser.email,
                authenticated_user_id: authenticatedUser.id,
                authenticated_username: authenticatedUser.username
              },
              reason
            );
          }
        } catch (logError) {
          console.warn('Error logging authenticated action (non-blocking):', logError);
          // Continue execution even if logging fails
        }
        
        // Hide dialog
        hideStaffAuthenticationDialog();
        
        // Execute callback with authenticated user info (await if async)
        if (callback) {
          try {
            console.log('Executing authenticated action callback for:', actionDescription);
            const result = callback(authenticatedUser);
            // If callback returns a promise, await it
            if (result && typeof result.then === 'function') {
              await result;
              console.log('Authenticated action completed successfully:', actionDescription);
            } else {
              console.log('Authenticated action callback executed (non-async):', actionDescription);
            }
          } catch (callbackError) {
            console.error('Error executing authenticated action callback:', callbackError);
            console.error('Error details:', {
              message: callbackError.message,
              stack: callbackError.stack,
              action: actionDescription
            });
            alert('Error executing action: ' + (callbackError.message || 'Unknown error'));
            reject(callbackError);
            return;
          }
        } else {
          console.warn('No callback provided for authenticated action:', actionDescription);
        }
        resolve(authenticatedUser);
        
      } catch (error) {
        console.error('Authentication error:', error);
        alert('Error verifying credentials. Please try again.');
        reject(error);
      }
    };
    
    // Remove old listeners and add new ones
    if (verifyBtn) {
      const newVerifyBtn = verifyBtn.cloneNode(true);
      verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
      newVerifyBtn.addEventListener('click', handleVerify);
    }
    
    if (cancelBtn) {
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      newCancelBtn.addEventListener('click', () => {
        hideStaffAuthenticationDialog();
        reject(new Error('Authentication cancelled'));
      });
    }
    
    // Allow Enter key to submit
    if (usernameInput) {
      usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleVerify();
        }
      });
    }
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleVerify();
        }
      });
    }
    
    // Initialize password visibility toggle for this dialog
    initializePasswordVisibilityToggle(overlay);
  });
}

// Initialize password visibility toggle for authentication dialogs
function initializePasswordVisibilityToggle(container) {
  const visibilityButtons = container.querySelectorAll(".toggle-visibility");
  
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
    
    // Remove any existing listeners by cloning the button
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Add click event listener
    newBtn.addEventListener("click", () => {
      const targetInput = document.getElementById(targetId);
      const targetIconImg = newBtn.querySelector("img[aria-hidden='true']");
      if (!targetInput || !targetIconImg) return;
      
      const isCurrentlyVisible = targetInput.type === "text";
      
      if (isCurrentlyVisible) {
        // Switch to hidden (password dots)
        targetInput.type = "password";
        newBtn.dataset.state = "hidden";
        newBtn.setAttribute("aria-pressed", "false");
        newBtn.setAttribute("aria-label", "Show password");
        targetIconImg.src = "image/sn_eyes_closed.png";
      } else {
        // Switch to visible (plain text)
        targetInput.type = "text";
        newBtn.dataset.state = "visible";
        newBtn.setAttribute("aria-pressed", "true");
        newBtn.setAttribute("aria-label", "Hide password");
        targetIconImg.src = "image/sn_eyes_open.png";
      }
    });
  });
}

// Hide staff authentication dialog
function hideStaffAuthenticationDialog() {
  const overlay = document.getElementById('staff-authentication-overlay') || document.getElementById('manager-verification-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Remove blur
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.remove('blurred');
  }
}

// Legacy function for backward compatibility (manager-only verification)
function showManagerVerificationDialog(callback) {
  return requireStaffAuthentication(callback, 'Manager verification required', 'system', { requires_manager: true });
}

// Hide manager verification dialog
function hideManagerVerificationDialog() {
  const overlay = document.getElementById('manager-verification-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Remove blur
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.remove('blurred');
  }
}

/* ============================================
   ADD USER POPUP FUNCTIONALITY
   ============================================ */

// Show add user popup
function showAddUserPopup(tableType) {
  const popup = document.getElementById('add-user-popup');
  if (!popup) return;
  
  // Set title based on table type
  const title = document.getElementById('add-user-title');
  if (title) {
    const typeText = tableType === 'staff' ? 'STAFF' : tableType === 'member' ? 'MEMBER' : 'SUPPLIER';
    title.textContent = `ADD ${typeText} SECTION`;
  }
  
  // Show/hide fields based on table type
  const positionGroup = document.getElementById('add-user-position-group');
  const pointsGroup = document.getElementById('add-user-points-group');
  
  if (positionGroup) {
    positionGroup.style.display = tableType === 'staff' ? 'flex' : 'none';
  }
  if (pointsGroup) {
    pointsGroup.style.display = tableType === 'member' ? 'flex' : 'none';
  }
  
  // Load positions for staff
  if (tableType === 'staff' && positionGroup) {
    loadPositionsForAddUser();
  }
  
  // Clear all fields
  const codeDisplay = document.getElementById('add-user-code');
  const generateBtn = document.getElementById('generate-code-btn');
  const usernameInput = document.getElementById('add-user-username');
  const emailInput = document.getElementById('add-user-email');
  const phoneInput = document.getElementById('add-user-phone');
  const positionSelect = document.getElementById('add-user-position');
  const pointsInput = document.getElementById('add-user-points');
  const statusSelect = document.getElementById('add-user-status');
  
  // Reset code display and generate button
  if (codeDisplay) codeDisplay.textContent = '-';
  if (generateBtn) {
    generateBtn.textContent = 'GENERATE';
    generateBtn.disabled = false;
    generateBtn.style.background = '#C8CCE9';
    generateBtn.style.cursor = 'pointer';
  }
  
  if (usernameInput) usernameInput.value = '';
  if (emailInput) emailInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (positionSelect) positionSelect.value = '';
  if (pointsInput) pointsInput.value = '0';
  if (statusSelect) statusSelect.value = 'active';
  
  // Store table type for save function
  popup.dataset.tableType = tableType;
  
  // Attach event listeners when popup is shown
  attachAddUserPopupListeners();
  
  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Hide add user popup
function hideAddUserPopup() {
  console.log('Hiding add user popup');
  const popup = document.getElementById('add-user-popup');
  if (!popup) {
    console.error('Add user popup not found!');
    return;
  }
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
}

// Generate code for user
function generateUserCode(tableType) {
  console.log('generateUserCode called with tableType:', tableType);
  const prefix = tableType === 'staff' ? 'STF' : tableType === 'member' ? 'MEM' : 'SUP';
  // Generate a 6-digit random number (100000 to 999999)
  const sixDigitCode = Math.floor(100000 + Math.random() * 900000).toString();
  const code = `${prefix}${sixDigitCode}`;
  
  const codeDisplay = document.getElementById('add-user-code');
  const generateBtn = document.getElementById('generate-code-btn');
  
  console.log('Code display element:', codeDisplay);
  console.log('Generate button element:', generateBtn);
  
  if (codeDisplay) {
    codeDisplay.textContent = code;
    console.log('Code generated and displayed:', code);
  } else {
    console.error('Code display element not found!');
    alert('Error: Code display element not found. Please refresh the page.');
    return;
  }
  
  if (generateBtn) {
    generateBtn.textContent = 'GENERATED';
    generateBtn.disabled = true;
    generateBtn.style.background = '#4caf50';
    generateBtn.style.cursor = 'not-allowed';
    console.log('Generate button updated to GENERATED');
  } else {
    console.error('Generate button element not found!');
    alert('Error: Generate button not found. Please refresh the page.');
  }
}

// Load positions for add user (staff only)
async function loadPositionsForAddUser() {
  const positionSelect = document.getElementById('add-user-position');
  if (!positionSelect) return;
  
  const positions = await loadPositionsFromSupabase();
  
  // Clear existing options
  positionSelect.innerHTML = '<option value="">Select Position</option>';
  
  // Add position options
  positions.forEach(pos => {
    const option = document.createElement('option');
    option.value = pos.position_name;
    option.textContent = pos.position_name;
    positionSelect.appendChild(option);
  });
}

// Save new user
async function saveNewUser() {
  // Require staff authentication for all users
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveNewUserInternal(authenticatedUser);
      },
      'Created new user',
      'user',
      { action: 'save_new_user' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save new user (after authentication)
async function saveNewUserInternal(authenticatedUser) {
  const saveBtn = document.getElementById('save-add-user-btn');
  const popup = document.getElementById('add-user-popup');
  
  // Store original button state
  let originalText = 'SAVE CHANGES';
  let originalBackground = '';
  
  if (saveBtn) {
    originalText = saveBtn.textContent;
    originalBackground = saveBtn.style.background || '';
    // Disable button and show loading state
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
  }
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }, 2000);
      }
      return;
    }
    
    if (!popup) return;
    
    const tableType = popup.dataset.tableType || 'staff';
    
    // Get form values
    const codeDisplay = document.getElementById('add-user-code');
    const usernameInput = document.getElementById('add-user-username');
    const emailInput = document.getElementById('add-user-email');
    const phoneInput = document.getElementById('add-user-phone');
    const positionSelect = document.getElementById('add-user-position');
    const pointsInput = document.getElementById('add-user-points');
    const statusSelect = document.getElementById('add-user-status');
    
    // Validate required fields
    const email = emailInput?.value.trim();
    if (!email) {
      if (saveBtn) {
        saveBtn.textContent = originalText;
        saveBtn.style.background = originalBackground;
        saveBtn.disabled = false;
      }
      alert('Email is required.');
      return;
    }
    
    // Get generated code
    const generatedCode = codeDisplay?.textContent.trim();
    if (!generatedCode || generatedCode === '-') {
      if (saveBtn) {
        saveBtn.textContent = originalText;
        saveBtn.style.background = originalBackground;
        saveBtn.disabled = false;
      }
      alert('Please generate a code before saving.');
      return;
    }
    
    // Prepare user data
    let userData = {
      email: email,
      phone: phoneInput?.value.trim() || null,
      user_code: generatedCode, // Add user_code for all table types
    };
    
    // Default password for auth account creation
    const defaultPassword = 'sportnexus';
    
    // Create auth user for staff and supplier (not members)
    if (tableType === 'staff' || tableType === 'supplier') {
      try {
        // Create user in Supabase Auth with default password
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
          email: email,
          password: defaultPassword,
        });
        
        if (authError) {
          console.error('Error creating auth user:', authError);
          
          // If user already exists in auth, continue without linking user_id
          // The user_id field is optional, so we can still create the supplier record
          if (authError.message && authError.message.includes('already registered')) {
            console.log('Auth user already exists for this email. Continuing to create supplier record without user_id link.');
            // Continue without user_id - it's optional
          } else {
            // For other auth errors, show error and return
            if (saveBtn) {
              saveBtn.textContent = 'SAVE FAILED';
              saveBtn.style.background = '#f44336';
              setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = originalBackground;
                saveBtn.disabled = false;
              }, 2000);
            }
            alert('Error creating authentication account: ' + authError.message);
            return;
          }
        } else {
          // Link auth user ID to user record if available
          if (authData && authData.user && authData.user.id) {
            userData.user_id = authData.user.id;
          }
          console.log('Auth user created successfully:', authData?.user?.id);
        }
      } catch (authErr) {
        console.error('Error during auth creation:', authErr);
        if (saveBtn) {
          saveBtn.textContent = 'SAVE FAILED';
          saveBtn.style.background = '#f44336';
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = originalBackground;
            saveBtn.disabled = false;
          }, 2000);
        }
        alert('Error creating authentication account. Please try again.');
        return;
      }
    }
    
    // Prepare user data based on table type
    if (tableType === 'staff') {
      userData.username = usernameInput?.value.trim() || null;
      userData.position = positionSelect?.value || null;
      userData.is_active = statusSelect?.value === 'active';
      userData.role = 'staff';
    } else if (tableType === 'member') {
      userData.member_code = generatedCode; // Also keep member_code for backward compatibility
      userData.username = usernameInput?.value.trim() || null;
      userData.member_points = parseInt(pointsInput?.value) || 0;
      userData.membership_status = statusSelect?.value || 'active';
    } else if (tableType === 'supplier') {
      // Supplier-specific fields
      userData.company_name = usernameInput?.value.trim() || null;
      userData.status = statusSelect?.value || 'active';
      userData.role = 'supplier';
      // Note: supplier_code column may not exist in all databases
      // Using user_code instead which is the standard field
      // userData.supplier_code = generatedCode || null; // Removed - column doesn't exist
      
      // For supplier table, only include user_id if it was successfully set
      // If schema cache issue occurs, retry without user_id
      if (!userData.user_id) {
        // Remove user_id from supplier data if not set (to avoid schema cache errors)
        delete userData.user_id;
      }
    }
    
    // Check if email already exists in the target table before inserting
    const { data: existingUser, error: checkError } = await window.supabase
      .from(tableType)
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
      console.error('Error checking existing user:', checkError);
    }
    
    if (existingUser) {
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }, 2000);
      }
      alert('This email already exists in the ' + tableType + ' table. Please use a different email.');
      return;
    }
    
    // Insert user into database
    console.log('Inserting user data:', userData);
    console.log('Table type:', tableType);
    
    let { data, error } = await window.supabase
      .from(tableType)
      .insert(userData)
      .select();
    
    // If error is related to schema cache or user_id column, retry without user_id
    if (error && tableType === 'supplier' && (
      error.message.includes('user_id') || 
      error.message.includes('schema cache') ||
      error.message.includes('COULD NOT FIND') ||
      error.code === 'PGRST301' // Schema cache error code
    )) {
      console.log('Schema cache error detected. Retrying without user_id...');
      
      // Remove user_id and retry
      const retryData = { ...userData };
      delete retryData.user_id;
      
      console.log('Retrying insert without user_id:', retryData);
      
      const retryResult = await window.supabase
        .from(tableType)
        .insert(retryData)
        .select();
      
      data = retryResult.data;
      error = retryResult.error;
      
      if (!error) {
        console.log('Retry successful without user_id');
      }
    }
    
    if (error) {
      console.error('Error adding user:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Show error message with animation
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }, 2000);
      }
      
      // Provide specific error messages
      let errorMessage = 'Error adding user. ';
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique') || error.message.includes('already exists')) {
          errorMessage += 'This email already exists in the database.';
        } else if (error.message.includes('null value') || error.message.includes('NOT NULL')) {
          errorMessage += 'Required fields are missing.';
        } else if (error.message.includes('permission') || error.message.includes('RLS')) {
          errorMessage += 'Permission denied. Please check RLS policies.';
        } else if (error.message.includes('schema cache') || error.message.includes('COULD NOT FIND')) {
          errorMessage += 'Database schema cache issue. Please try again in a moment.';
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    } else {
      console.log('User added successfully:', data);
      
      // Show success message with animation
      if (saveBtn) {
        saveBtn.textContent = 'SAVED!';
        saveBtn.style.background = '#4caf50';
      }
      
      // Reload data to reflect changes
      if (tableType === 'staff') {
        await loadStaffData();
      } else if (tableType === 'member') {
        await loadMemberData();
      } else if (tableType === 'supplier') {
        await loadSupplierData();
      }
      
      // Auto-dismiss popup after 1 second
      setTimeout(() => {
        if (popup) {
          popup.style.display = 'none';
          document.body.classList.remove('popup-open');
          document.body.style.overflow = '';
        }
        
        // Reset save button
        if (saveBtn) {
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          saveBtn.disabled = false;
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error saving new user:', error);
    
    // Show error message with animation
    if (saveBtn) {
      saveBtn.textContent = 'SAVE FAILED';
      saveBtn.style.background = '#f44336';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = originalBackground;
        saveBtn.disabled = false;
      }, 2000);
    }
    
    alert('Error saving new user. Please try again.');
  }
}

// Set up add user popup - attach listeners directly to elements
function setupAddUserPopup() {
  console.log('Setting up add user popup event listeners');
  
  // Attach listeners immediately and also when popup is shown
  attachAddUserPopupListeners();
}

// Attach event listeners to add user popup elements
function attachAddUserPopupListeners() {
  const popup = document.getElementById('add-user-popup');
  if (!popup) {
    console.error('Add user popup not found when attaching listeners');
    return;
  }
  
  // Use event delegation on the popup dialog container
  const dialog = popup.querySelector('.edit-position-dialog');
  if (!dialog) {
    console.error('Dialog container not found');
    return;
  }
  
  // Remove old listener if exists
  if (dialog._addUserClickHandler) {
    dialog.removeEventListener('click', dialog._addUserClickHandler);
  }
  
  // Create new click handler for the dialog
  const clickHandler = function(e) {
    // Check if close button was clicked (button or its children)
    if (e.target.closest('#close-add-user-btn')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Close button clicked');
      hideAddUserPopup();
      return;
    }
    
    // Check if generate button was clicked
    if (e.target.closest('#generate-code-btn')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Generate button clicked');
      const generateBtn = e.target.closest('#generate-code-btn');
      if (generateBtn && !generateBtn.disabled) {
        const tableType = popup.dataset.tableType || 'staff';
        generateUserCode(tableType);
      }
      return;
    }
    
    // Check if save button was clicked
    if (e.target.closest('#save-add-user-btn')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Save button clicked');
      saveNewUser();
      return;
    }
  };
  
  dialog._addUserClickHandler = clickHandler;
  dialog.addEventListener('click', clickHandler);
  
  // Close when clicking outside the dialog (on the popup overlay)
  if (popup._outsideClickHandler) {
    popup.removeEventListener('click', popup._outsideClickHandler);
  }
  
  const outsideClickHandler = function(e) {
    if (e.target === popup) {
      hideAddUserPopup();
    }
  };
  popup._outsideClickHandler = outsideClickHandler;
  popup.addEventListener('click', outsideClickHandler);
  
  console.log('Add user popup listeners attached successfully');
}

/* ============================================
   MANAGE PRODUCT PAGE FUNCTIONALITY
   ============================================ */

// Set up category button toggle for manage product page
function setupCategoryButtonToggle() {
  const categoryBtn = document.getElementById('category-filter-btn');
  if (!categoryBtn) return;
  
  const categorySubmenu = document.getElementById('category-submenu');
  if (!categorySubmenu) return;
  
  categoryBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      this.classList.remove('active');
      categorySubmenu.classList.remove('show');
    } else {
      // Load categories from Supabase before opening
      await loadCategoriesIntoDropdown();
      // Open submenu
      this.classList.add('active');
      categorySubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!categoryBtn.contains(e.target) && !categorySubmenu.contains(e.target)) {
      if (categoryBtn.classList.contains('active')) {
        categoryBtn.classList.remove('active');
        categorySubmenu.classList.remove('show');
      }
    }
  });
  
  // Handle edit category button click
  const editCategoryBtn = categorySubmenu.querySelector('.category-edit-btn');
  if (editCategoryBtn) {
    editCategoryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('Edit category clicked');
      // TODO: Implement edit category popup
      categoryBtn.classList.remove('active');
      categorySubmenu.classList.remove('show');
    });
  }
}

// Set up product card selection
function setupProductCardSelection() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    // Remove old listeners if they exist
    if (card._clickHandler) {
      card.removeEventListener('click', card._clickHandler);
    }
    
    card._clickHandler = function(e) {
      // Don't trigger selection if clicking on action buttons, remove button, or edit button
      if (e.target.closest('.product-action-btn') || e.target.closest('.product-card-remove-btn') || e.target.closest('.product-card-edit-btn')) {
        return;
      }
      
      // If in remove or edit mode, don't allow selection
      if (window.productRemoveMode || window.productEditMode) {
        return;
      }
      
      // Toggle selection
      const isSelected = this.classList.contains('selected');
      if (isSelected) {
        this.classList.remove('selected');
      } else {
        // Deselect all other cards first
        productCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
      }
    };
    
    card.addEventListener('click', card._clickHandler);
  });
}

// Deactivate all product action buttons
function deactivateAllProductActionButtons() {
  const addBtn = document.getElementById('add-product-btn');
  const removeBtn = document.getElementById('remove-product-btn');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const editProductBtn = document.getElementById('edit-product-btn');
  
  // Remove active class from all buttons
  if (addBtn) addBtn.classList.remove('active');
  if (removeBtn) removeBtn.classList.remove('active');
  if (addCategoryBtn) addCategoryBtn.classList.remove('active');
  if (editProductBtn) editProductBtn.classList.remove('active');
  
  // Exit any active modes - always call both to ensure complete cleanup
  if (window.productRemoveMode) {
    exitProductRemoveMode();
  }
  if (window.productEditMode) {
    exitProductEditMode();
  }
  
  // Explicitly reset all state variables to ensure clean state
  window.productRemoveMode = false;
  window.productEditMode = false;
  window.currentActionMode = null;
  
  // Reset table action buttons to ensure they're in default state
  resetProductTableActionButtons();
}

// Set up product action buttons
function setupProductActionButtons() {
  const addBtn = document.getElementById('add-product-btn');
  const removeBtn = document.getElementById('remove-product-btn');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const editProductBtn = document.getElementById('edit-product-btn');
  
  if (addBtn) {
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Deactivate all other buttons first and ensure all modes are cleared
      deactivateAllProductActionButtons();
      // Ensure all state variables are reset
      window.productRemoveMode = false;
      window.productEditMode = false;
      window.currentActionMode = null;
      // Add Product opens popup, so we don't need to set active state
      showAddProductPopup();
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Check if this button is already active
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // If already active, deactivate it
        deactivateAllProductActionButtons();
        // Ensure all state variables are reset
        window.productRemoveMode = false;
        window.productEditMode = false;
        window.currentActionMode = null;
      } else {
        // Deactivate all buttons first and ensure all modes are cleared
        deactivateAllProductActionButtons();
        // Ensure all state variables are reset before entering new mode
        window.productEditMode = false;
        window.currentActionMode = null;
        // Then activate this one
        enterProductRemoveMode();
        this.classList.add('active');
      }
    });
  }
  
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Deactivate all other buttons first and ensure all modes are cleared
      deactivateAllProductActionButtons();
      // Ensure all state variables are reset
      window.productRemoveMode = false;
      window.productEditMode = false;
      window.currentActionMode = null;
      // Add Category opens popup, so we don't need to set active state
      showAddCategoryPopup();
    });
  }
  
  if (editProductBtn) {
    editProductBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Check if this button is already active
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // If already active, deactivate it
        deactivateAllProductActionButtons();
        // Ensure all state variables are reset
        window.productRemoveMode = false;
        window.productEditMode = false;
        window.currentActionMode = null;
      } else {
        // Deactivate all buttons first and ensure all modes are cleared
        deactivateAllProductActionButtons();
        // Ensure all state variables are reset before entering new mode
        window.productRemoveMode = false;
        window.currentActionMode = null;
        // Then activate this one
        enterProductEditMode();
        this.classList.add('active');
      }
    });
  }
}

// Helper function to normalize image URLs
function normalizeImageUrl(url) {
  if (!url) return 'image/sportNexusLatestLogo.png';
  
  // If it's already a full URL (http/https), use it as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path starting with 'image/', use it as-is
  if (url.startsWith('image/')) {
    return url;
  }
  
  // If it's a relative path without 'image/', prepend 'image/'
  // But only if it doesn't look like a Supabase Storage path
  if (!url.includes('/storage/') && !url.includes('supabase.co')) {
    return `image/${url}`;
  }
  
  // Otherwise, return as-is (might be a valid path)
  return url;
}

// Load products from Supabase
async function loadProductsData() {
  const tbody = document.querySelector('.member-table tbody');
  const productCardsContainer = document.getElementById('product-cards-container');
  
  if (!tbody) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Load categories cache first
    await loadCategoriesIntoDropdown();
    
    const { data: products, error: productsError } = await window.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      tbody.innerHTML = '<tr><td colspan="8" class="no-data-message">Error loading products data. Please try again.</td></tr>';
      return;
    }
    
    // Load categories separately and map them
    const { data: categories, error: categoriesError } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code');
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }
    
    // Create category map
    const categoryMap = {};
    if (categories) {
      categories.forEach(cat => {
        categoryMap[cat.id] = cat;
      });
    }
    
    // Map products with category names
    const data = products ? products.map(product => ({
      ...product,
      category: categoryMap[product.category_id] || null
    })) : [];
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data-message">There are no available products in the system yet.</td></tr>';
      if (productCardsContainer) {
        productCardsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No products available</p>';
      }
      return;
    }
    
    // Load product variants to get stock quantities and prices
    const { data: variants, error: variantsError } = await window.supabase
      .from('product_variants')
      .select('product_id, current_stock, selling_price');
    
    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
    }
    
    // Calculate total stock per product
    const stockMap = {};
    if (variants) {
      variants.forEach(variant => {
        if (!stockMap[variant.product_id]) {
          stockMap[variant.product_id] = 0;
        }
        stockMap[variant.product_id] += variant.current_stock || 0;
      });
    }
    
    // Sort products BEFORE creating cards: active first, then inactive, then by created_at descending
    data.sort((a, b) => {
      const aStatus = (a.status || 'active').toLowerCase();
      const bStatus = (b.status || 'active').toLowerCase();
      const aActive = aStatus === 'active';
      const bActive = bStatus === 'active';
      
      if (aActive !== bActive) {
        return bActive ? 1 : -1;
      }
      
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    });
    
    // Update product cards if container exists
    if (productCardsContainer && data.length > 0) {
      // Filter to only active products for the cards display (exclude inactive status)
      // This ensures product-display-section only shows active products
      const activeProducts = data.filter(p => {
        const status = (p.status || 'active').toLowerCase();
        return status === 'active';
      });
      
      // Display ALL active products (no limit, including products with 0 quantity)
      const productsToDisplay = activeProducts;
      
      if (productsToDisplay.length === 0) {
        productCardsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No active products available</p>';
      } else {
        productCardsContainer.innerHTML = productsToDisplay.map((product, index) => {
        const totalStock = stockMap[product.id] || 0;
        const rawImageUrl = product.image_url || (product.image_urls && product.image_urls[0]) || null;
        const imageUrl = normalizeImageUrl(rawImageUrl);
        const fallbackImage = 'image/sportNexusLatestLogo.png';
        
        // Ensure category_id is converted to string for consistent comparison
        const categoryIdStr = product.category_id ? String(product.category_id) : '';
        
        // Get category name
        const categoryName = product.category ? product.category.category_name : 'N/A';
        
        return `
          <div class="product-card" data-product-id="${product.id}" data-category-id="${categoryIdStr}">
            <div class="product-image-wrapper">
              <img src="${imageUrl}" alt="${product.product_name}" class="product-image" onerror="this.onerror=null; this.src='${fallbackImage}'" />
            </div>
            <div class="product-info">
              <p class="product-name">NAME : ${product.product_name || 'N/A'}</p>
              <p class="product-category">CATEGORY : ${categoryName}</p>
              <p class="product-quantity">QUANTITY : ${totalStock}</p>
            </div>
          </div>
        `;
        }).join('');
        
        // Re-setup product card selection after loading
        setupProductCardSelection();
        
        // Apply category filter if one is active, otherwise show all products
        // Reset to show all products initially (no filter)
        if (window.currentCategoryFilter && window.currentCategoryFilter !== 'all') {
          filterProductCards(window.currentCategoryFilter);
        } else {
          // Ensure all cards are visible when no filter or "all" is selected
          filterProductCards(null);
        }
      }
    } else if (productCardsContainer) {
      productCardsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No products available</p>';
    }
    
    // Get prices from variants
    const priceMap = {};
    if (variants) {
      variants.forEach(variant => {
        const productId = variant.product_id;
        if (!priceMap[productId]) {
          priceMap[productId] = [];
        }
        priceMap[productId].push(parseFloat(variant.selling_price) || 0);
      });
    }
    
    tbody.innerHTML = data.map(product => {
      const status = product.status || 'active';
      const isActive = status.toLowerCase() === 'active';
      const statusClass = isActive ? 'active' : 'inactive';
      const statusText = isActive ? 'Active' : 'Inactive';
      const categoryName = product.category ? product.category.category_name : 'N/A';
      const categoryId = product.category_id || '';
      
      // Get price from variants (lowest price or N/A)
      const prices = priceMap[product.id] || [];
      let priceDisplay = 'N/A';
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          priceDisplay = `RM ${minPrice.toFixed(2)}`;
        } else {
          priceDisplay = `RM ${minPrice.toFixed(2)} - RM ${maxPrice.toFixed(2)}`;
        }
      }
      
      return `
        <tr data-product-id="${product.id || ''}" data-product-code="${product.product_code || ''}" data-category-id="${categoryId}">
          <td>${product.product_code || 'N/A'}</td>
          <td>${product.product_name || 'N/A'}</td>
          <td>${product.brand || 'N/A'}</td>
          <td>${categoryName}</td>
          <td>${priceDisplay}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}</td>
          <td>None</td>
        </tr>
      `;
    }).join('');
    
    // Restore action buttons if an action mode is selected
    if (window.currentActionMode) {
      setTimeout(() => {
        updateProductTableActionButtons(window.currentActionMode);
        // If in remove mode, also show product card buttons
        if (window.currentActionMode === 'remove' || window.productRemoveMode) {
          showProductCardRemoveButtons();
        }
        if (window.currentActionMode === 'edit' || window.productEditMode) {
          showProductCardEditButtons();
        }
      }, 100);
    }
    
    // Set up real-time subscription
    setupProductsRealtime();
    
  } catch (error) {
    console.error('Error loading products data:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="no-data-message">Error loading products data. Please refresh the page.</td></tr>';
  }
}

// Set up real-time subscription for products table
function setupProductsRealtime() {
  if (!window.supabase) return;
  
  // Remove existing subscription if any
  if (window.productsRealtimeChannel) {
    window.supabase.removeChannel(window.productsRealtimeChannel);
  }
  
  const channel = window.supabase
    .channel('products-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('Products data changed:', payload);
        loadProductsData();
      }
    )
    .subscribe();
  
  window.productsRealtimeChannel = channel;
  return channel;
}

// Load categories into dropdown (similar to positions)
let categoryNameCache = {};

async function loadCategoriesIntoDropdown() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code, is_active')
      .eq('is_active', true)
      .order('category_name', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    
    // Build cache
    categoryNameCache = {};
    if (categories) {
      categories.forEach(cat => {
        categoryNameCache[cat.id] = cat.category_name;
        categoryNameCache[cat.category_code] = cat.category_name;
      });
    }
    
    // Update category dropdown
    const categoryFrame = document.getElementById('category-list-scrollable-frame');
    if (categoryFrame) {
      if (!categories || categories.length === 0) {
        categoryFrame.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">No categories available</p>';
        return;
      }
      
      categoryFrame.innerHTML = categories.map(cat => `
        <button class="category-option-btn" data-category="${cat.id}" data-category-code="${cat.category_code}">
          ${cat.category_name}
        </button>
      `).join('');
      
      // Add click handlers
      const categoryOptions = categoryFrame.querySelectorAll('.category-option-btn');
      categoryOptions.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const categoryId = this.dataset.category;
          
          // Remove active class from all options
          categoryOptions.forEach(opt => opt.classList.remove('active'));
          // Add active class to clicked option
          this.classList.add('active');
          window.currentCategoryFilter = categoryId;
          
          // Filter by category
          filterProductsByCategory(categoryId);
        });
      });
    }
    
    return categoryNameCache;
  } catch (error) {
    console.error('Error loading categories:', error);
    return {};
  }
}

// Filter products by category
function filterProductsByCategory(categoryId) {
  window.currentCategoryFilter = categoryId;
  
  const searchInput = document.getElementById('product-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeStatusOption = document.querySelector('.status-option-btn.active');
  const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
  
  const dateRange = window.dateFilterRange || null;
  
  applyProductFilters(searchTerm, statusFilter, categoryId, dateRange);
  filterProductCards(categoryId);
}

// Filter product cards by category
function filterProductCards(categoryId) {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const cardCategoryId = card.getAttribute('data-category-id');
    
    // Convert both to strings for consistent comparison
    const cardCategoryIdStr = cardCategoryId ? String(cardCategoryId) : '';
    const categoryIdStr = categoryId ? String(categoryId) : '';
    
    if (categoryId && categoryId !== 'all' && categoryIdStr !== '') {
      // Show card if category matches
      if (cardCategoryIdStr === categoryIdStr) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    } else {
      // Show all cards when no filter or "all" is selected
      card.style.display = '';
    }
  });
}

// Set up category display button toggle
function setupCategoryDisplayButtonToggle() {
  const categoryDisplayBtn = document.getElementById('category-display-btn');
  if (!categoryDisplayBtn) return;
  
  const categoryDisplaySubmenu = document.getElementById('category-display-submenu');
  if (!categoryDisplaySubmenu) return;
  
  categoryDisplayBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      this.classList.remove('active');
      categoryDisplaySubmenu.classList.remove('show');
    } else {
      // Load categories from Supabase before opening
      await loadCategoriesIntoDisplayDropdown();
      // Open submenu
      this.classList.add('active');
      categoryDisplaySubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!categoryDisplayBtn.contains(e.target) && !categoryDisplaySubmenu.contains(e.target)) {
      if (categoryDisplayBtn.classList.contains('active')) {
        categoryDisplayBtn.classList.remove('active');
        categoryDisplaySubmenu.classList.remove('show');
      }
    }
  });
}

// Load categories into display dropdown
async function loadCategoriesIntoDisplayDropdown() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code, is_active')
      .eq('is_active', true)
      .order('category_name', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    
    const categoryFrame = document.getElementById('category-display-list-scrollable-frame');
    if (categoryFrame) {
      if (!categories || categories.length === 0) {
        categoryFrame.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">No categories available</p>';
        return;
      }
      
      // Add "All Categories" option
      categoryFrame.innerHTML = `
        <button class="category-option-btn" data-category="all">
          ALL CATEGORIES
        </button>
        ${categories.map(cat => `
          <button class="category-option-btn" data-category="${cat.id}" data-category-code="${cat.category_code}">
            ${cat.category_name}
          </button>
        `).join('')}
      `;
      
      // Add click handlers
      const categoryOptions = categoryFrame.querySelectorAll('.category-option-btn');
      categoryOptions.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const categoryId = this.dataset.category;
          const categoryName = this.textContent.trim();
          
          // Update display text
          const displayText = document.getElementById('category-display-text');
          if (displayText) {
            displayText.textContent = categoryName;
          }
          
          // Remove active class from all options
          categoryOptions.forEach(opt => opt.classList.remove('active'));
          // Add active class to clicked option
          this.classList.add('active');
          
          // Close submenu
          const categoryDisplayBtn = document.getElementById('category-display-btn');
          const categoryDisplaySubmenu = document.getElementById('category-display-submenu');
          if (categoryDisplayBtn) categoryDisplayBtn.classList.remove('active');
          if (categoryDisplaySubmenu) categoryDisplaySubmenu.classList.remove('show');
          
          // Filter products
          if (categoryId === 'all') {
            window.currentCategoryFilter = null;
            filterProductCards(null);
            const searchInput = document.getElementById('product-search-input');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const activeStatusOption = document.querySelector('.status-option-btn.active');
            const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
            const dateRange = window.dateFilterRange || null;
            applyProductFilters(searchTerm, statusFilter, null, dateRange);
          } else {
            filterProductsByCategory(categoryId);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Apply filters to products table
function applyProductFilters(searchTerm = '', statusFilter = null, categoryFilter = null, dateRange = null) {
  console.log('applyProductFilters called with:', { searchTerm, statusFilter, categoryFilter, dateRange });
  
  const table = document.querySelector('.member-table');
  if (!table) {
    console.warn('Product table not found');
    return;
  }
  
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    console.warn('Product table tbody not found');
    return;
  }
  
  const existingNoResults = tbody.querySelector('.no-results-message');
  if (existingNoResults) {
    existingNoResults.remove();
  }
  
  // Get all rows, excluding message rows
  const allRows = tbody.querySelectorAll('tr');
  console.log('Total rows found:', allRows.length);
  
  const rows = Array.from(allRows).filter(row => {
    // Exclude message rows and rows with insufficient cells
    const cellCount = row.querySelectorAll('td').length;
    const isMessageRow = row.classList.contains('no-data-message') || row.classList.contains('no-results-message');
    const isValid = !isMessageRow && cellCount >= 8;
    if (!isValid) {
      console.log('Filtered out row:', { isMessageRow, cellCount, isValid });
    }
    return isValid;
  });
  
  console.log('Valid product rows after filtering:', rows.length);
  
  let visibleCount = 0;
  
  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');
    console.log(`Processing row ${index}, cells count: ${cells.length}`);
    
    let shouldShow = true;
    
    // Search filter
    if (searchTerm !== '') {
      let rowText = '';
      cells.forEach(cell => {
        rowText += cell.textContent.toLowerCase() + ' ';
      });
      if (!rowText.includes(searchTerm)) {
        shouldShow = false;
      }
    }
    
    // Status filter - check this FIRST before other filters
    if (statusFilter) {
      const statusCell = cells[6]; // Status is in column 6 (0-indexed)
      if (statusCell) {
        const statusBadge = statusCell.querySelector('.status-badge');
        let statusText = '';
        if (statusBadge) {
          statusText = statusBadge.textContent.trim().toLowerCase();
          console.log(`Row ${index} - Status badge found, text: "${statusBadge.textContent.trim()}", lowercase: "${statusText}"`);
        } else {
          // Fallback: check cell text content directly
          statusText = statusCell.textContent.trim().toLowerCase();
          console.log(`Row ${index} - No badge, using cell text: "${statusCell.textContent.trim()}", lowercase: "${statusText}"`);
        }
        
        const filterStatus = statusFilter.toLowerCase().trim();
        const statusMatch = filterStatus === statusText;
        
        console.log(`Row ${index} - Status comparison: Filter="${filterStatus}" vs Row="${statusText}", Match=${statusMatch}, shouldShow before=${shouldShow}, after=${statusMatch ? shouldShow : false}`);
        
        if (!statusMatch) {
          shouldShow = false;
        }
      } else {
        // If status cell doesn't exist, hide the row if status filter is active
        console.warn(`Row ${index} - Status cell (index 6) not found, cells.length=${cells.length}`);
        shouldShow = false;
      }
    }
    
    // Category filter
    if (categoryFilter && shouldShow) {
      const rowCategoryId = row.getAttribute('data-category-id');
      if (rowCategoryId !== categoryFilter) {
        shouldShow = false;
      }
    }
    
    // Date filter
    if (dateRange && shouldShow) {
      const dateCell = cells[7];
      const dateText = dateCell.textContent.trim();
      if (dateText !== 'N/A') {
        const dateParts = dateText.split(/[\/\-]/);
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1;
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          const parsedDate = new Date(year, month, day);
          
          const start = new Date(dateRange.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          parsedDate.setHours(0, 0, 0, 0);
          
          if (parsedDate < start || parsedDate > end) {
            shouldShow = false;
          }
        }
      }
    }
    
    // Product table: Product Code (0), Product Name (1), Brand (2), ...
    const productName = cells.length > 1 ? cells[1].textContent.trim() : 'Unknown';
    if (shouldShow) {
      row.style.display = '';
      row.style.visibility = 'visible';
      visibleCount++;
      console.log(`Row ${index} (${productName}) - SHOWING`);
    } else {
      row.style.display = 'none';
      row.style.visibility = 'hidden';
      console.log(`Row ${index} (${productName}) - HIDING`);
    }
  });
  
  console.log(`Filter applied - Total rows: ${rows.length}, Visible: ${visibleCount}, Status filter: ${statusFilter}`);
  
    if (visibleCount === 0 && rows.length > 0 && !tbody.querySelector('.no-data-message')) {
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-results-message';
      noResultsRow.innerHTML = '<td colspan="8" class="no-data-message">No products match the selected filters.</td>';
      tbody.appendChild(noResultsRow);
    }
}

// Filter products by status
function filterProductsByStatus(status) {
  const searchInput = document.getElementById('product-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // Category filter removed from filter bar - only available in AVAILABLE PRODUCT section
  const categoryFilter = null;
  
  const dateRange = window.dateFilterRange || null;
  
  applyProductFilters(searchTerm, status, categoryFilter, dateRange);
}

// Enter product remove mode
function enterProductRemoveMode() {
  window.productRemoveMode = true;
  window.currentActionMode = 'remove';
  
  // Update table action buttons
  updateProductTableActionButtons('remove');
  
  // Show trash icons on product cards
  showProductCardRemoveButtons();
}

// Exit product remove mode
function exitProductRemoveMode() {
  window.productRemoveMode = false;
  window.currentActionMode = null;
  
  // Reset table action buttons
  resetProductTableActionButtons();
  
  // Hide trash icons on product cards
  hideProductCardRemoveButtons();
  
  // Remove active class from action menu and bottom button
  const actionRemoveBtn = document.querySelector('.action-option-btn[data-action="remove"]');
  if (actionRemoveBtn) {
    actionRemoveBtn.classList.remove('active');
  }
  const bottomRemoveBtn = document.getElementById('remove-product-btn');
  if (bottomRemoveBtn) {
    bottomRemoveBtn.classList.remove('active');
  }
}

// Enter product edit mode
function enterProductEditMode() {
  window.productEditMode = true;
  window.currentActionMode = 'edit';
  
  // Update table action buttons
  updateProductTableActionButtons('edit');
  
  // Show edit icons on product cards
  showProductCardEditButtons();
}

// Exit product edit mode
function exitProductEditMode() {
  window.productEditMode = false;
  window.currentActionMode = null;
  
  // Reset table action buttons
  resetProductTableActionButtons();
  
  // Hide edit icons on product cards
  hideProductCardEditButtons();
  
  // Remove active class from action menu and bottom button
  const actionEditBtn = document.querySelector('.action-option-btn[data-action="edit"]');
  if (actionEditBtn) {
    actionEditBtn.classList.remove('active');
  }
  const bottomEditBtn = document.getElementById('edit-product-btn');
  if (bottomEditBtn) {
    bottomEditBtn.classList.remove('active');
  }
}

// Show edit icons on product cards
function showProductCardEditButtons() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    // Check if button already exists
    let editBtn = card.querySelector('.product-card-edit-btn');
    if (!editBtn) {
      // Create edit button
      editBtn = document.createElement('button');
      editBtn.className = 'product-card-edit-btn';
      editBtn.innerHTML = `
        <img src="image/sn_icon_edit_product.png" alt="Edit" class="product-card-edit-icon-default" />
        <img src="image/sn_icon_edit_product.png" alt="Edit" class="product-card-edit-icon-hover" />
      `;
      
      const productId = card.getAttribute('data-product-id');
      editBtn.setAttribute('data-product-id', productId || '');
      
      // Add click handler
      editBtn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const productId = this.getAttribute('data-product-id');
        if (productId) {
          await showEditProductPopup(productId);
        }
      });
      
      card.appendChild(editBtn);
    }
    editBtn.style.display = 'flex';
  });
}

// Hide edit icons on product cards
function hideProductCardEditButtons() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const editBtn = card.querySelector('.product-card-edit-btn');
    if (editBtn) {
      editBtn.style.display = 'none';
    }
  });
}

// Show trash icons on product cards
function showProductCardRemoveButtons() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    // Check if button already exists
    let removeBtn = card.querySelector('.product-card-remove-btn');
    if (!removeBtn) {
      // Create remove button
      removeBtn = document.createElement('button');
      removeBtn.className = 'product-card-remove-btn';
      removeBtn.innerHTML = `
        <img src="image/sn_icon_trash.png" alt="Remove" class="product-card-remove-icon-default" />
        <img src="image/sn_icon_hover_trash.png" alt="Remove" class="product-card-remove-icon-hover" />
      `;
      
      const productId = card.getAttribute('data-product-id');
      removeBtn.setAttribute('data-product-id', productId || '');
      
      // Add click handler
      removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const productId = this.getAttribute('data-product-id');
        const productName = card.querySelector('.product-name')?.textContent.replace('NAME : ', '').trim() || 'THIS PRODUCT';
        if (productId) {
          showDeleteProductDialog(productId, productName);
        }
      });
      
      card.appendChild(removeBtn);
    }
    removeBtn.style.display = 'flex';
  });
}

// Hide trash icons on product cards
function hideProductCardRemoveButtons() {
  const removeButtons = document.querySelectorAll('.product-card-remove-btn');
  removeButtons.forEach(btn => {
    btn.style.display = 'none';
  });
}

// Update product table action buttons (similar to user list)
function updateProductTableActionButtons(actionType) {
  window.currentActionMode = actionType;
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const actionCell = row.querySelector('td:last-child');
    if (!actionCell) return;
    
    if (actionCell.classList.contains('no-data-message') || actionCell.getAttribute('colspan')) {
      return;
    }
    
    const cellText = actionCell.textContent.trim();
    if (cellText === 'None' || actionCell.querySelector('.table-action-btn')) {
      const cells = row.querySelectorAll('td');
      const productId = row.getAttribute('data-product-id');
      const productCode = row.getAttribute('data-product-code');
      
      const productData = {
        id: productId,
        product_code: productCode,
        // Product table: Product Code, Product Name, Brand, Category, Price, Status, Created Date, Actions
        // Indices: 0=Product Code, 1=Product Name, 2=Brand, 3=Category, 4=Price, 5=Status
        product_name: cells[1] ? cells[1].textContent.trim() : '',
        brand: cells[2] ? cells[2].textContent.trim() : '',
        category: cells[3] ? cells[3].textContent.trim() : '',
        status: cells[5] ? cells[5].querySelector('.status-badge')?.textContent.trim() : '',
        _tableType: 'products'
      };
      
      if (actionType === 'edit') {
        actionCell.innerHTML = `
          <button class="table-action-btn edit-btn" data-product-id="${productData.id}" data-table-type="products">
            <img src="image/sn_icon_edit_product.png" alt="Edit" class="action-icon-default" style="opacity: 1;" />
            <img src="image/sn_icon_edit_product.png" alt="Edit" class="action-icon-hover" style="opacity: 0;" />
          </button>
        `;
        const editBtn = actionCell.querySelector('.edit-btn');
        if (editBtn) {
          editBtn._productData = productData;
          editBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            if (productId) {
              await showEditProductPopup(productId);
            }
          });
        }
      } else if (actionType === 'remove') {
        actionCell.innerHTML = `
          <button class="table-action-btn remove-btn" data-product-id="${productData.id}">
            <img src="image/sn_icon_trash.png" alt="Remove" class="action-icon-default" style="opacity: 1;" />
            <img src="image/sn_icon_hover_trash.png" alt="Remove" class="action-icon-hover" style="opacity: 0;" />
          </button>
        `;
        const removeBtn = actionCell.querySelector('.remove-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            const productName = productData.product_name || 'THIS PRODUCT';
            if (productId) {
              showDeleteProductDialog(productId, productName);
            }
          });
        }
      }
    }
  });
}

// Reset product table action buttons
function resetProductTableActionButtons() {
  window.currentActionMode = null;
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const actionCell = row.querySelector('td:last-child');
    if (!actionCell) return;
    
    if (actionCell.classList.contains('no-data-message') || actionCell.getAttribute('colspan')) {
      return;
    }
    
    if (actionCell.querySelector('.table-action-btn')) {
      actionCell.textContent = 'None';
    }
  });
}

// Show delete product dialog
function showDeleteProductDialog(productId, productName) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'logout-dialog-overlay';
  overlay.id = 'delete-product-dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'logout-dialog';
  
  // Create message
  const message = document.createElement('p');
  message.className = 'logout-dialog-message';
  message.textContent = `ARE YOU SURE YOU WANT TO REMOVE ${productName.toUpperCase()} ?`;
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'logout-dialog-buttons';
  
  // Create YES button
  const yesButton = document.createElement('button');
  yesButton.className = 'logout-dialog-btn';
  yesButton.textContent = 'YES';
  yesButton.onclick = () => {
    dismissDeleteProductDialog(); // Dismiss confirmation dialog first
    confirmDeleteProduct(productId); // Then proceed with authentication
  };
  
  // Create NO button
  const noButton = document.createElement('button');
  noButton.className = 'logout-dialog-btn';
  noButton.textContent = 'NO';
  noButton.onclick = dismissDeleteProductDialog;
  
  // Assemble dialog
  buttonsContainer.appendChild(yesButton);
  buttonsContainer.appendChild(noButton);
  dialog.appendChild(message);
  dialog.appendChild(buttonsContainer);
  overlay.appendChild(dialog);
  
  // Add to body
  document.body.appendChild(overlay);
  
  // Blur the main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('blurred');
  }
}

// Dismiss delete product dialog
function dismissDeleteProductDialog() {
  const overlay = document.getElementById('delete-product-dialog-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Remove blur
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.remove('blurred');
  }
}

// Confirm delete product (actually sets status to inactive)
async function confirmDeleteProduct(productId) {
  // Require staff authentication before removing
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await confirmDeleteProductInternal(authenticatedUser, productId);
      },
      'Removed product',
      'product',
      { action: 'remove_product', product_id: productId }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
    // Dialog already dismissed when YES was clicked, no need to dismiss again
  }
}

// Internal function to confirm delete product (after authentication)
async function confirmDeleteProductInternal(authenticatedUser, productId) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      dismissDeleteProductDialog();
      return;
    }
    
    if (!productId) {
      alert('Product ID is missing. Cannot remove product.');
      dismissDeleteProductDialog();
      return;
    }
    
    console.log('Removing product (setting to inactive):', productId);
    
    // Update product status to inactive instead of deleting
    const { data, error } = await window.supabase
      .from('products')
      .update({ status: 'inactive' })
      .eq('id', productId)
      .select();
    
    if (error) {
      console.error('Error updating product status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Error removing product. ';
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS')) {
        errorMsg += 'Permission denied. Please check RLS policies in Supabase.';
      } else if (error.message) {
        errorMsg += error.message;
      } else {
        errorMsg += 'Please check the console for details.';
      }
      
      alert(errorMsg);
      dismissDeleteProductDialog();
      return;
    }
    
    console.log('Product status updated to inactive successfully:', data);
    
    // Exit remove mode
    exitProductRemoveMode();
    
    // Reload products data
    await loadProductsData();
    
    // Dismiss dialog
    dismissDeleteProductDialog();
    
  } catch (error) {
    console.error('Error removing product:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    alert('Error removing product. Please try again.');
    dismissDeleteProductDialog();
  }
}

// Initialize manage product page
function initializeManageProductPage() {
  // Load products data
  loadProductsData();
  
  // Set up filter buttons
  setupCategoryButtonToggle();
  setupCategoryDisplayButtonToggle();
  setupStatusButtonToggle();
  setupDatePicker();
  
  // Set up product display
  setupProductCardSelection();
  setupProductActionButtons();
  
  // Set up search functionality
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      const activeStatusOption = document.querySelector('.status-option-btn.active');
      const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
      // Category filter removed from filter bar - only available in AVAILABLE PRODUCT section
      const categoryFilter = null;
      const dateRange = window.dateFilterRange || null;
      applyProductFilters(searchTerm, statusFilter, categoryFilter, dateRange);
    });
  }
  
  // Status filter is handled by setupStatusButtonToggle() which is called above
  // No need for duplicate handler here - it will work the same as user-staff.html
  
  // Handle action submenu clicks
  const actionSubmenu = document.getElementById('action-submenu');
  if (actionSubmenu) {
    const actionOptions = actionSubmenu.querySelectorAll('.action-option-btn');
    actionOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.dataset.action;
        
        // Remove active class from all options
        actionOptions.forEach(opt => opt.classList.remove('active'));
        
        if (action === 'add') {
          // Show add product popup
          showAddProductPopup();
        } else if (action === 'remove') {
          // Add active class and update table buttons
          this.classList.add('active');
          enterProductRemoveMode();
          // Also update the bottom remove button
          const bottomRemoveBtn = document.getElementById('remove-product-btn');
          if (bottomRemoveBtn) {
            bottomRemoveBtn.classList.add('active');
          }
        } else if (action === 'edit') {
          // Add active class and update table buttons
          this.classList.add('active');
          enterProductEditMode();
          // Also update the bottom edit button
          const bottomEditBtn = document.getElementById('edit-product-btn');
          if (bottomEditBtn) {
            bottomEditBtn.classList.add('active');
          }
        } else {
          // Reset if clicking same action again
          window.currentActionMode = null;
          resetProductTableActionButtons();
        }
        
        const actionBtn = document.getElementById('action-filter-btn');
        if (actionBtn) {
          actionBtn.classList.remove('active');
        }
        actionSubmenu.classList.remove('show');
      });
    });
  }
}

/* ============================================
   ADD PRODUCT POPUP FUNCTIONALITY
   ============================================ */

// Show add product popup
function showAddProductPopup() {
  const popup = document.getElementById('add-product-popup');
  if (!popup) return;
  
  // Reset form
  resetAddProductForm();
  
  // Load categories into dropdown
  loadCategoriesForProductForm();
  
  // Show popup
  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
  
  // Attach event listeners
  attachAddProductPopupListeners();
}

// Hide add product popup
function hideAddProductPopup() {
  const popup = document.getElementById('add-product-popup');
  if (!popup) return;
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  
  // Reset form
  resetAddProductForm();
}

// Reset add product form
function resetAddProductForm() {
  // Reset image
  const preview = document.getElementById('product-image-preview');
  const imageInput = document.getElementById('product-image-input');
  if (preview) {
    preview.classList.remove('has-image');
    const img = preview.querySelector('img');
    if (img) img.remove();
  }
  if (imageInput) {
    imageInput.value = '';
  }
  
  // Reset form fields
  const codeDisplay = document.getElementById('add-product-code');
  const nameInput = document.getElementById('add-product-name');
  const brandInput = document.getElementById('add-product-brand');
  const categorySelect = document.getElementById('add-product-category');
  const descriptionTextarea = document.getElementById('add-product-description');
  const quantityInput = document.getElementById('add-product-quantity');
  const statusSelect = document.getElementById('add-product-status');
  
  if (codeDisplay) codeDisplay.textContent = '-';
  if (nameInput) nameInput.value = '';
  if (brandInput) brandInput.value = '';
  if (categorySelect) categorySelect.value = '';
  if (descriptionTextarea) descriptionTextarea.value = '';
  if (quantityInput) quantityInput.value = '';
  if (statusSelect) statusSelect.value = 'active';
}

// Load categories for product form
async function loadCategoriesForProductForm() {
  const categorySelect = document.getElementById('add-product-category');
  if (!categorySelect) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code')
      .eq('is_active', true)
      .order('category_name', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    
    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    // Add categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Generate product code
function generateProductCode() {
  const prefix = 'PRD';
  const sixDigitCode = Math.floor(100000 + Math.random() * 900000).toString();
  const code = `${prefix}${sixDigitCode}`;
  
  const codeDisplay = document.getElementById('add-product-code');
  if (codeDisplay) {
    codeDisplay.textContent = code;
  }
}

// Attach event listeners to add product popup
function attachAddProductPopupListeners() {
  const popup = document.getElementById('add-product-popup');
  if (!popup) return;
  
  const dialog = popup.querySelector('.edit-position-dialog');
  if (!dialog) return;
  
  // Remove old listeners if they exist
  if (dialog._addProductClickHandler) {
    dialog.removeEventListener('click', dialog._addProductClickHandler);
  }
  
  // Create click handler
  const clickHandler = function(e) {
    // Close button
    if (e.target.closest('#close-add-product-btn')) {
      e.preventDefault();
      e.stopPropagation();
      hideAddProductPopup();
      return;
    }
    
    // Generate code button
    if (e.target.closest('#generate-product-code-btn')) {
      e.preventDefault();
      e.stopPropagation();
      generateProductCode();
      return;
    }
    
    // Save button
    if (e.target.closest('#save-add-product-btn')) {
      e.preventDefault();
      e.stopPropagation();
      saveNewProduct();
      return;
    }
  };
  
  dialog._addProductClickHandler = clickHandler;
  dialog.addEventListener('click', clickHandler);
  
  // Image upload functionality
  const imageFrame = document.getElementById('product-image-upload-frame');
  const imageInput = document.getElementById('product-image-input');
  const uploadBtn = document.getElementById('product-image-upload-btn');
  
  if (imageFrame && imageInput) {
    // Click on frame or button to trigger file input
    const triggerFileInput = () => {
      imageInput.click();
    };
    
    if (imageFrame._clickHandler) {
      imageFrame.removeEventListener('click', imageFrame._clickHandler);
    }
    imageFrame._clickHandler = triggerFileInput;
    imageFrame.addEventListener('click', triggerFileInput);
    
    if (uploadBtn && uploadBtn._clickHandler) {
      uploadBtn.removeEventListener('click', uploadBtn._clickHandler);
    }
    if (uploadBtn) {
      uploadBtn._clickHandler = (e) => {
        e.stopPropagation();
        triggerFileInput();
      };
      uploadBtn.addEventListener('click', uploadBtn._clickHandler);
    }
    
    // Handle file selection
    if (imageInput._changeHandler) {
      imageInput.removeEventListener('change', imageInput._changeHandler);
    }
    imageInput._changeHandler = function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file.');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB.');
          return;
        }
        
        // Display preview
        const reader = new FileReader();
        reader.onload = function(event) {
          const preview = document.getElementById('product-image-preview');
          if (preview) {
            // Remove existing image if any
            const existingImg = preview.querySelector('img');
            if (existingImg) existingImg.remove();
            
            // Create and add new image
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Product image preview';
            preview.appendChild(img);
            preview.classList.add('has-image');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    imageInput.addEventListener('change', imageInput._changeHandler);
  }
  
  // Close when clicking outside
  if (popup._outsideClickHandler) {
    popup.removeEventListener('click', popup._outsideClickHandler);
  }
  const outsideClickHandler = function(e) {
    if (e.target === popup) {
      hideAddProductPopup();
    }
  };
  popup._outsideClickHandler = outsideClickHandler;
  popup.addEventListener('click', outsideClickHandler);
}

// Save new product
async function saveNewProduct() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveNewProductInternal(authenticatedUser);
      },
      'Created new product',
      'product',
      { action: 'save_new_product' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save new product (after authentication)
async function saveNewProductInternal(authenticatedUser) {
  const saveBtn = document.getElementById('save-add-product-btn');
  if (!saveBtn) return;
  
  // Get form values
  const codeDisplay = document.getElementById('add-product-code');
  const nameInput = document.getElementById('add-product-name');
  const brandInput = document.getElementById('add-product-brand');
  const categorySelect = document.getElementById('add-product-category');
  const descriptionTextarea = document.getElementById('add-product-description');
  const quantityInput = document.getElementById('add-product-quantity');
  const statusSelect = document.getElementById('add-product-status');
  const imageInput = document.getElementById('product-image-input');
  
  const productCode = codeDisplay ? codeDisplay.textContent.trim() : '';
  const productName = nameInput ? nameInput.value.trim() : '';
  const brand = brandInput ? brandInput.value.trim() : '';
  const categoryId = categorySelect ? categorySelect.value : '';
  const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
  const quantity = quantityInput ? parseInt(quantityInput.value, 10) : null;
  const status = statusSelect ? statusSelect.value : 'active';
  const imageFile = imageInput ? imageInput.files[0] : null;
  
  // Validation
  if (productCode === '-' || !productCode) {
    alert('Please generate a product code.');
    return;
  }
  
  if (!productName) {
    alert('Please enter a product name.');
    return;
  }
  
  // Validate quantity (required field - must be at least 1)
  if (quantityInput && (quantityInput.value === '' || quantity === null || isNaN(quantity) || quantity < 1)) {
    alert('Please enter a valid quantity (must be at least 1).');
    quantityInput.focus();
    return;
  }
  
  // Store original button state
  const originalText = saveBtn.textContent;
  const originalBackground = saveBtn.style.background || '';
  
  // Disable button and show loading
  saveBtn.disabled = true;
  saveBtn.textContent = 'SAVING...';
  
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Upload image if provided (make it optional - don't fail if upload fails)
    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadProductImageToSupabase(imageFile, productCode);
        console.log('Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Ask user if they want to continue without image
        const continueWithoutImage = confirm('Failed to upload image. Do you want to continue saving the product without an image?');
        if (!continueWithoutImage) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
          saveBtn.style.background = originalBackground;
          return;
        }
        // Continue without image
        imageUrl = null;
      }
    }
    
    // Prepare product data
    const productData = {
      product_code: productCode,
      product_name: productName,
      brand: brand || null,
      category_id: (categoryId && categoryId !== '') ? categoryId : null,
      description: description || null,
      image_url: imageUrl,
      status: status
    };
    
    // Remove null/undefined values that might cause issues
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });
    
    console.log('Inserting product with data:', productData);
    
    // Insert product into database
    const { data, error } = await window.supabase
      .from('products')
      .insert(productData)
      .select();
    
    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show more specific error message
      let errorMessage = 'Error saving product. ';
      if (error.code === 'PGRST116') {
        errorMessage += 'The products table does not exist. Please run the SQL script to create it.';
      } else if (error.code === '42501') {
        errorMessage += 'Permission denied. Please check RLS policies.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check the console for details.';
      }
      
      throw new Error(errorMessage);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Product was not created. No data returned.');
    }
    
    console.log('Product saved successfully:', data);
    
    // Get the newly created product ID
    const newProductId = data[0].id;
    
    // Generate a unique default SKU from product code with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const defaultSku = `${productCode}-DEFAULT-${timestamp}-${randomSuffix}`;
    
    // Create a default product variant with N/A for unfilled columns
    // Note: barcode is set to null instead of 'N/A' because it has a UNIQUE constraint
    // Use the quantity from the form, default to 0 if not provided
    const variantData = {
      product_id: newProductId,
      sku: defaultSku,
      barcode: null, // Set to null to avoid unique constraint violation (barcode is optional)
      variant_name: 'N/A',
      size: 'N/A',
      color: 'N/A',
      weight: 'N/A',
      grip: 'N/A',
      material: 'N/A',
      cost_price: 0.00,
      selling_price: 0.00,
      discount_price: null,
      min_selling_price: null,
      current_stock: (quantity !== null && !isNaN(quantity) && quantity >= 0) ? quantity : 0,
      reorder_level: 0,
      reorder_quantity: 0,
      max_stock: null,
      unit_of_measure: 'pcs',
      location: 'N/A',
      status: 'active',
      last_sold_date: null,
      total_sold: 0
    };
    
    console.log('Inserting default product variant with data:', variantData);
    
    // Insert default variant into product_variants table
    const { data: variantDataResult, error: variantError } = await window.supabase
      .from('product_variants')
      .insert(variantData)
      .select();
    
    if (variantError) {
      console.error('Error saving product variant:', variantError);
      console.error('Variant error details:', JSON.stringify(variantError, null, 2));
      // Show alert to user about variant creation failure
      alert(`Product was saved successfully, but failed to create default variant. Error: ${variantError.message || 'Unknown error'}. You can add variants manually in the edit product section.`);
    } else {
      console.log('Product variant saved successfully:', variantDataResult);
    }
    
    // Success
    saveBtn.textContent = 'SAVED!';
    saveBtn.style.background = '#4caf50';
    
    // Reload products
    setTimeout(async () => {
      await loadProductsData();
      hideAddProductPopup();
      
      // Reset button
      saveBtn.textContent = originalText;
      saveBtn.style.background = originalBackground;
      saveBtn.disabled = false;
    }, 1000);
    
  } catch (error) {
    console.error('Error saving product:', error);
    console.error('Full error object:', error);
    
    saveBtn.textContent = 'SAVE FAILED';
    saveBtn.style.background = '#f44336';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = originalBackground;
      saveBtn.disabled = false;
    }, 2000);
    
    // Show detailed error message
    const errorMessage = error.message || 'Error saving product. Please try again.';
    alert(errorMessage);
  }
}

// Upload product image to Supabase Storage
async function uploadProductImageToSupabase(imageFile, productCode) {
  if (!window.supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    // Create a unique filename using product code and timestamp
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${productCode}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // Store directly in bucket root, not in subfolder
    
    console.log('Uploading image:', fileName, 'to bucket: product-images');
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('product-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      
      // Provide more specific error messages
      if (uploadError.message && uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket "product-images" not found. Please create it in Supabase Storage.');
      } else if (uploadError.message && uploadError.message.includes('new row violates row-level security')) {
        throw new Error('Permission denied. Please check RLS policies for the storage bucket.');
      } else {
        throw uploadError;
      }
    }
    
    console.log('Image uploaded successfully:', uploadData);
    
    // Get public URL for the uploaded image
    const { data: urlData } = window.supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    console.log('Public URL data:', urlData);
    
    if (urlData && urlData.publicUrl) {
      return urlData.publicUrl;
    } else {
      throw new Error('Failed to get public URL for uploaded image');
    }
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

// Upload variant image to Supabase Storage
async function uploadVariantImageToSupabase(imageFile, variantSku) {
  if (!window.supabase) {
    throw new Error('Supabase client not initialized');
  }

  if (!imageFile) {
    throw new Error('No image file provided');
  }

  try {
    // Create a unique filename using variant SKU and timestamp
    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    const sanitizedSku = (variantSku || 'variant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `variant_${sanitizedSku}_${Date.now()}.${fileExt}`;
    const filePath = `variants/${fileName}`; // Store in variants subfolder

    console.log('Uploading variant image:', {
      fileName,
      filePath,
      bucket: 'product-images',
      fileSize: imageFile.size,
      fileType: imageFile.type,
      sku: variantSku
    });

    // Upload file to Supabase Storage
    // Use upsert: true to allow overwriting if file exists
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('product-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));

      // Provide more specific error messages
      if (uploadError.message && uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket "product-images" not found. Please create it in Supabase Storage.');
      } else if (uploadError.message && uploadError.message.includes('new row violates row-level security') || 
                 uploadError.message && uploadError.message.includes('RLS')) {
        throw new Error('Permission denied. Please check RLS policies for the "product-images" storage bucket. The bucket needs INSERT and SELECT permissions.');
      } else if (uploadError.message && uploadError.message.includes('JWT')) {
        throw new Error('Authentication error. Please check your Supabase credentials.');
      } else {
        throw new Error(`Upload failed: ${uploadError.message || JSON.stringify(uploadError)}`);
      }
    }

    console.log('Variant image uploaded successfully:', uploadData);

    // Get public URL for the uploaded image
    const { data: urlData } = window.supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('Public URL data:', urlData);

    if (urlData && urlData.publicUrl) {
      console.log('Variant image public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } else {
      throw new Error('Failed to get public URL for uploaded variant image');
    }
  } catch (error) {
    console.error('Error uploading variant image to Supabase:', error);
    throw error;
  }
}

/* ============================================
   EDIT PRODUCT POPUP FUNCTIONALITY
   ============================================ */

// Show edit product popup
async function showEditProductPopup(productId) {
  const popup = document.getElementById('edit-product-popup');
  if (!popup) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Load product data from Supabase
    const { data: product, error } = await window.supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('Error loading product:', error);
      alert('Error loading product data. Please try again.');
      return;
    }
    
    if (!product) {
      alert('Product not found.');
      return;
    }
    
    // Load product data into form
    loadProductDataIntoEditForm(product);
    
    // Load variants
    await loadProductVariantsForEdit(productId);
    
    // Load categories into dropdown
    await loadCategoriesForEditProductForm();
    
    // Show popup
    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
    
    // Attach event listeners
    attachEditProductPopupListeners(productId);
    
    // Set up tab switching (this will also set up variant listeners when variants tab is clicked)
    setupEditProductTabs();
    
    // Ensure variant listeners are set up initially (in case variants tab is visible)
    attachVariantItemListeners();
    
  } catch (error) {
    console.error('Error showing edit product popup:', error);
    alert('Error loading product. Please try again.');
  }
}

// Hide edit product popup
function hideEditProductPopup() {
  const popup = document.getElementById('edit-product-popup');
  if (!popup) return;
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  
  // Reset form
  resetEditProductForm();
}

// Load product data into edit form
function loadProductDataIntoEditForm(product) {
  // Product code (read-only)
  const codeDisplay = document.getElementById('edit-product-code');
  if (codeDisplay) codeDisplay.textContent = product.product_code || '-';
  
  // Product name
  const nameInput = document.getElementById('edit-product-name');
  if (nameInput) nameInput.value = product.product_name || '';
  
  // Brand
  const brandInput = document.getElementById('edit-product-brand');
  if (brandInput) brandInput.value = product.brand || '';
  
  // Category
  const categorySelect = document.getElementById('edit-product-category');
  if (categorySelect && product.category_id) {
    categorySelect.value = product.category_id;
  }
  
  // Description
  const descriptionTextarea = document.getElementById('edit-product-description');
  if (descriptionTextarea) descriptionTextarea.value = product.description || '';
  
  // Status
  const statusSelect = document.getElementById('edit-product-status');
  if (statusSelect) statusSelect.value = product.status || 'active';
  
  // Image
  const preview = document.getElementById('edit-product-image-preview');
  if (preview) {
    const rawImageUrl = product.image_url || (product.image_urls && product.image_urls[0]) || null;
    const imageUrl = normalizeImageUrl(rawImageUrl);
    preview.innerHTML = `<img src="${imageUrl}" alt="${product.product_name}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='image/sportNexusLatestLogo.png'" />`;
    preview.classList.add('has-image');
  }
}

// Reset edit product form
function resetEditProductForm() {
  // Reset tabs to GENERAL
  const generalTab = document.getElementById('edit-product-tab-general');
  const variantsTab = document.getElementById('edit-product-tab-variants');
  const generalFrame = document.getElementById('edit-product-general-frame');
  const variantsFrame = document.getElementById('edit-product-variants-frame');
  
  if (generalTab && variantsTab && generalFrame && variantsFrame) {
    generalTab.classList.add('active');
    variantsTab.classList.remove('active');
    generalFrame.style.display = 'block';
    variantsFrame.style.display = 'none';
  }
  
  // Reset image
  const preview = document.getElementById('edit-product-image-preview');
  const imageInput = document.getElementById('edit-product-image-input');
  if (preview) {
    preview.classList.remove('has-image');
    preview.innerHTML = `
      <div class="product-image-placeholder">
        <span class="product-image-placeholder-icon">📷</span>
        <span class="product-image-placeholder-text">Click to upload product image</span>
      </div>
    `;
  }
  if (imageInput) {
    imageInput.value = '';
  }
  
  // Reset form fields
  const codeDisplay = document.getElementById('edit-product-code');
  const nameInput = document.getElementById('edit-product-name');
  const brandInput = document.getElementById('edit-product-brand');
  const categorySelect = document.getElementById('edit-product-category');
  const descriptionTextarea = document.getElementById('edit-product-description');
  const statusSelect = document.getElementById('edit-product-status');
  
  if (codeDisplay) codeDisplay.textContent = '-';
  if (nameInput) nameInput.value = '';
  if (brandInput) brandInput.value = '';
  if (categorySelect) categorySelect.value = '';
  if (descriptionTextarea) descriptionTextarea.value = '';
  if (statusSelect) statusSelect.value = 'active';
  
  // Reset variants list
  const variantsList = document.getElementById('edit-product-variants-list');
  if (variantsList) {
    variantsList.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No variants found. Click "ADD VARIANT" to create one.</p>';
  }
}

// Load categories for edit product form
async function loadCategoriesForEditProductForm() {
  const categorySelect = document.getElementById('edit-product-category');
  if (!categorySelect) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code')
      .eq('is_active', true)
      .order('category_name', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    
    // Clear existing options except the first one
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    // Add categories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
    }
    
    // Restore previous value
    if (currentValue) {
      categorySelect.value = currentValue;
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Set up edit product tabs
function setupEditProductTabs() {
  const generalTab = document.getElementById('edit-product-tab-general');
  const variantsTab = document.getElementById('edit-product-tab-variants');
  const generalFrame = document.getElementById('edit-product-general-frame');
  const variantsFrame = document.getElementById('edit-product-variants-frame');
  
  if (generalTab && variantsTab && generalFrame && variantsFrame) {
    generalTab.addEventListener('click', function() {
      generalTab.classList.add('active');
      variantsTab.classList.remove('active');
      generalFrame.style.display = 'block';
      variantsFrame.style.display = 'none';
    });
    
    variantsTab.addEventListener('click', function() {
      variantsTab.classList.add('active');
      generalTab.classList.remove('active');
      variantsFrame.style.display = 'block';
      generalFrame.style.display = 'none';
      
      // Set up variant listeners when variants tab is shown
      attachVariantItemListeners();
    });
  }
}

// Load product variants for editing
async function loadProductVariantsForEdit(productId) {
  const variantsList = document.getElementById('edit-product-variants-list');
  if (!variantsList) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: variants, error } = await window.supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading variants:', error);
      variantsList.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">Error loading variants</p>';
      return;
    }
    
    if (!variants || variants.length === 0) {
      variantsList.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No variants found. Click "ADD VARIANT" to create one.</p>';
      // Still attach listeners so add variant button works
      attachVariantItemListeners();
      return;
    }
    
    variantsList.innerHTML = variants.map((variant, index) => createVariantItemHTML(variant, index)).join('');
    
    // Attach event listeners to variant items
    attachVariantItemListeners();
    
  } catch (error) {
    console.error('Error loading variants:', error);
    variantsList.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">Error loading variants</p>';
  }
}

// Create variant item HTML
function createVariantItemHTML(variant, index) {
  const variantImageUrl = variant.image_url || variant.variant_image || '';
  const hasImage = variantImageUrl && variantImageUrl.trim() !== '';
  
  return `
    <div class="variant-item" data-variant-id="${variant.id || ''}" data-variant-index="${index}">
      <div class="variant-item-header">
        <span class="variant-item-title">Variant ${index + 1}</span>
        <button type="button" class="variant-remove-btn" data-variant-id="${variant.id || ''}">Remove</button>
      </div>
      
      <!-- Variant Image Upload Section -->
      <div class="variant-image-upload-section">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1d1f2c;">Variant Image</label>
        <div class="variant-image-upload-frame" data-variant-index="${index}">
          <input type="file" class="variant-image-input" accept="image/*" data-variant-index="${index}" style="display: none;" />
          <div class="variant-image-preview" data-variant-index="${index}">
            ${hasImage ? 
              `<img src="${variantImageUrl}" alt="Variant ${index + 1}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />` :
              `<div class="variant-image-placeholder">
                <span class="variant-image-placeholder-icon">📷</span>
                <span class="variant-image-placeholder-text">Click to upload variant image</span>
              </div>`
            }
          </div>
          <div class="variant-image-upload-overlay" data-variant-index="${index}">
            <button type="button" class="variant-image-upload-btn" data-variant-index="${index}">
              <span>UPLOAD IMAGE</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="variant-fields-grid">
        <div class="variant-field-group">
          <label>SKU</label>
          <input type="text" class="variant-sku" value="${variant.sku || ''}" placeholder="Enter SKU" />
        </div>
        <div class="variant-field-group">
          <label>Barcode</label>
          <input type="text" class="variant-barcode" value="${variant.barcode || ''}" placeholder="Enter barcode" />
        </div>
        <div class="variant-field-group">
          <label>Variant Name</label>
          <input type="text" class="variant-name" value="${variant.variant_name || ''}" placeholder="Enter variant name" />
        </div>
        <div class="variant-field-group">
          <label>Size</label>
          <input type="text" class="variant-size" value="${variant.size || ''}" placeholder="Enter size" />
        </div>
        <div class="variant-field-group">
          <label>Color</label>
          <input type="text" class="variant-color" value="${variant.color || ''}" placeholder="Enter color" />
        </div>
        <div class="variant-field-group">
          <label>Weight</label>
          <input type="text" class="variant-weight" value="${variant.weight || ''}" placeholder="Enter weight" />
        </div>
        <div class="variant-field-group">
          <label>Grip</label>
          <input type="text" class="variant-grip" value="${variant.grip || ''}" placeholder="Enter grip" />
        </div>
        <div class="variant-field-group">
          <label>Material</label>
          <input type="text" class="variant-material" value="${variant.material || ''}" placeholder="Enter material" />
        </div>
        <div class="variant-field-group">
          <label>Cost Price (RM)</label>
          <input type="number" step="0.01" class="variant-cost-price" value="${variant.cost_price || '0.00'}" placeholder="0.00" />
        </div>
        <div class="variant-field-group">
          <label>Selling Price (RM)</label>
          <input type="number" step="0.01" class="variant-selling-price" value="${variant.selling_price || '0.00'}" placeholder="0.00" />
        </div>
        <div class="variant-field-group">
          <label>Discount Price (RM)</label>
          <input type="number" step="0.01" class="variant-discount-price" value="${variant.discount_price || ''}" placeholder="Optional" />
        </div>
        <div class="variant-field-group">
          <label>Min Selling Price (RM)</label>
          <input type="number" step="0.01" class="variant-min-selling-price" value="${variant.min_selling_price || ''}" placeholder="Optional" />
        </div>
        <div class="variant-field-group">
          <label>Current Stock</label>
          <input type="number" class="variant-stock" value="${variant.current_stock || 0}" placeholder="0" />
        </div>
        <div class="variant-field-group">
          <label>Reorder Level</label>
          <input type="number" class="variant-reorder-level" value="${variant.reorder_level || 0}" placeholder="0" />
        </div>
        <div class="variant-field-group">
          <label>Reorder Quantity</label>
          <input type="number" class="variant-reorder-quantity" value="${variant.reorder_quantity || 0}" placeholder="0" />
        </div>
        <div class="variant-field-group">
          <label>Max Stock</label>
          <input type="number" class="variant-max-stock" value="${variant.max_stock || ''}" placeholder="Optional" />
        </div>
        <div class="variant-field-group">
          <label>Unit of Measure</label>
          <select class="variant-unit">
            <option value="pcs" ${variant.unit_of_measure === 'pcs' ? 'selected' : ''}>Pieces</option>
            <option value="kg" ${variant.unit_of_measure === 'kg' ? 'selected' : ''}>Kilograms</option>
            <option value="g" ${variant.unit_of_measure === 'g' ? 'selected' : ''}>Grams</option>
            <option value="m" ${variant.unit_of_measure === 'm' ? 'selected' : ''}>Meters</option>
            <option value="cm" ${variant.unit_of_measure === 'cm' ? 'selected' : ''}>Centimeters</option>
          </select>
        </div>
        <div class="variant-field-group">
          <label>Location</label>
          <input type="text" class="variant-location" value="${variant.location || ''}" placeholder="Enter location" />
        </div>
        <div class="variant-field-group">
          <label>Status</label>
          <select class="variant-status">
            <option value="active" ${variant.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${variant.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="out_of_stock" ${variant.status === 'out_of_stock' ? 'selected' : ''}>Out of Stock</option>
            <option value="discontinued" ${variant.status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

// Attach event listeners to variant items
function attachVariantItemListeners() {
  // Remove variant buttons - remove old listeners first to prevent duplicates
  const removeButtons = document.querySelectorAll('.variant-remove-btn');
  removeButtons.forEach(btn => {
    // Remove existing listener if it exists
    if (btn._removeHandler) {
      btn.removeEventListener('click', btn._removeHandler);
    }
    
    btn._removeHandler = function(e) {
      e.stopPropagation();
      const variantItem = this.closest('.variant-item');
      if (variantItem) {
        variantItem.remove();
        // Update variant indices
        updateVariantIndices();
      }
    };
    
    btn.addEventListener('click', btn._removeHandler);
  });
  
  // Variant image upload functionality
  const variantImageFrames = document.querySelectorAll('.variant-image-upload-frame');
  variantImageFrames.forEach(frame => {
    const variantIndex = frame.getAttribute('data-variant-index');
    const imageInput = frame.querySelector('.variant-image-input[data-variant-index="' + variantIndex + '"]');
    const uploadBtn = frame.querySelector('.variant-image-upload-btn[data-variant-index="' + variantIndex + '"]');
    const preview = frame.querySelector('.variant-image-preview[data-variant-index="' + variantIndex + '"]');
    
    if (!imageInput || !preview) return;
    
    // Remove existing handlers
    if (frame._clickHandler) {
      frame.removeEventListener('click', frame._clickHandler);
    }
    if (uploadBtn && uploadBtn._clickHandler) {
      uploadBtn.removeEventListener('click', uploadBtn._clickHandler);
    }
    if (imageInput._changeHandler) {
      imageInput.removeEventListener('change', imageInput._changeHandler);
    }
    
    // Trigger file input
    const triggerFileInput = (e) => {
      if (e) e.stopPropagation();
      imageInput.click();
    };
    
    // Frame click handler
    frame._clickHandler = triggerFileInput;
    frame.addEventListener('click', frame._clickHandler);
    
    // Upload button click handler
    if (uploadBtn) {
      uploadBtn._clickHandler = (e) => {
        e.stopPropagation();
        triggerFileInput();
      };
      uploadBtn.addEventListener('click', uploadBtn._clickHandler);
    }
    
    // File input change handler
    imageInput._changeHandler = function(e) {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file.');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB.');
          return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Variant preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`;
            preview.classList.add('has-image');
            
            // Store the file in the variant item for later upload
            const variantItem = frame.closest('.variant-item');
            if (variantItem) {
              variantItem._imageFile = file;
              variantItem._imagePreview = e.target.result;
              console.log('Variant image file stored for variant item:', variantItem.getAttribute('data-variant-id') || 'new variant', 'File:', file.name, 'Size:', file.size);
            } else {
              console.error('Could not find variant item to store image file');
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
    imageInput.addEventListener('change', imageInput._changeHandler);
  });
  
  // Add variant button - remove old listener first to prevent duplicates
  const addVariantBtn = document.getElementById('add-variant-btn');
  if (addVariantBtn) {
    // Remove existing listener if it exists
    if (addVariantBtn._addHandler) {
      addVariantBtn.removeEventListener('click', addVariantBtn._addHandler);
    }
    
    addVariantBtn._addHandler = function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log('Add variant button clicked');
      addNewVariantItem();
    };
    
    addVariantBtn.addEventListener('click', addVariantBtn._addHandler);
    console.log('Add variant button listener attached');
  } else {
    console.warn('Add variant button not found');
  }
}

// Add new variant item
function addNewVariantItem() {
  const variantsList = document.getElementById('edit-product-variants-list');
  if (!variantsList) {
    console.error('Variants list element not found');
    return;
  }
  
  // Remove the "No variants found" message if it exists
  const noVariantsMsg = variantsList.querySelector('p');
  if (noVariantsMsg && noVariantsMsg.textContent.includes('No variants found')) {
    noVariantsMsg.remove();
  }
  
  const existingVariants = variantsList.querySelectorAll('.variant-item');
  const newIndex = existingVariants.length;
  
  const newVariant = {
    id: null,
    sku: '',
    barcode: '',
    variant_name: '',
    size: '',
    color: '',
    weight: '',
    grip: '',
    material: '',
    cost_price: '0.00',
    selling_price: '0.00',
    discount_price: '',
    min_selling_price: '',
    current_stock: 0,
    reorder_level: 0,
    reorder_quantity: 0,
    max_stock: '',
    unit_of_measure: 'pcs',
    location: '',
    status: 'active'
  };
  
  const variantHTML = createVariantItemHTML(newVariant, newIndex);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = variantHTML;
  const variantElement = tempDiv.firstElementChild;
  
  variantsList.appendChild(variantElement);
  
  // Attach listeners to the new variant
  attachVariantItemListeners();
  updateVariantIndices();
}

// Update variant indices
function updateVariantIndices() {
  const variantsList = document.getElementById('edit-product-variants-list');
  if (!variantsList) return;
  
  const variantItems = variantsList.querySelectorAll('.variant-item');
  variantItems.forEach((item, index) => {
    item.setAttribute('data-variant-index', index);
    const title = item.querySelector('.variant-item-title');
    if (title) {
      title.textContent = `Variant ${index + 1}`;
    }
    
    // Update data-variant-index on all image upload elements
    const imageFrame = item.querySelector('.variant-image-upload-frame');
    const imageInput = item.querySelector('.variant-image-input');
    const imagePreview = item.querySelector('.variant-image-preview');
    const imageOverlay = item.querySelector('.variant-image-upload-overlay');
    const imageUploadBtn = item.querySelector('.variant-image-upload-btn');
    
    if (imageFrame) imageFrame.setAttribute('data-variant-index', index);
    if (imageInput) imageInput.setAttribute('data-variant-index', index);
    if (imagePreview) imagePreview.setAttribute('data-variant-index', index);
    if (imageOverlay) imageOverlay.setAttribute('data-variant-index', index);
    if (imageUploadBtn) imageUploadBtn.setAttribute('data-variant-index', index);
  });
  
  // Re-attach listeners after updating indices
  attachVariantItemListeners();
}

// Save product variants
async function saveProductVariants(productId) {
  const variantsList = document.getElementById('edit-product-variants-list');
  if (!variantsList) return;
  
  const variantItems = variantsList.querySelectorAll('.variant-item');
  if (variantItems.length === 0) return;
  
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    // Get existing variants with image_url to preserve existing images
    const { data: existingVariants, error: fetchError } = await window.supabase
      .from('product_variants')
      .select('id, image_url, variant_image')
      .eq('product_id', productId);
    
    if (fetchError) {
      console.error('Error fetching existing variants:', fetchError);
      return;
    }
    
    // Create a map of existing variant image URLs
    const existingVariantImageMap = new Map();
    (existingVariants || []).forEach(v => {
      const imageUrl = v.image_url || v.variant_image || null;
      if (imageUrl) {
        existingVariantImageMap.set(v.id, imageUrl);
      }
    });
    
    const existingVariantIds = new Set((existingVariants || []).map(v => v.id));
    const currentVariantIds = new Set();
    
    // Process each variant item
    const variantsToInsert = [];
    const variantsToUpdate = [];
    
    // Process each variant item and upload images first
    for (const item of variantItems) {
      const variantId = item.getAttribute('data-variant-id');
      let sku = item.querySelector('.variant-sku')?.value.trim() || '';
      
      console.log('Processing variant item:', { variantId, sku, hasImageFile: !!item._imageFile });
      const barcode = item.querySelector('.variant-barcode')?.value.trim() || '';
      const variantName = item.querySelector('.variant-name')?.value.trim() || '';
      const size = item.querySelector('.variant-size')?.value.trim() || '';
      const color = item.querySelector('.variant-color')?.value.trim() || '';
      const weight = item.querySelector('.variant-weight')?.value.trim() || '';
      const grip = item.querySelector('.variant-grip')?.value.trim() || '';
      const material = item.querySelector('.variant-material')?.value.trim() || '';
      const costPrice = parseFloat(item.querySelector('.variant-cost-price')?.value || '0') || 0;
      const sellingPrice = parseFloat(item.querySelector('.variant-selling-price')?.value || '0') || 0;
      const discountPrice = item.querySelector('.variant-discount-price')?.value.trim();
      const minSellingPrice = item.querySelector('.variant-min-selling-price')?.value.trim();
      const currentStock = parseInt(item.querySelector('.variant-stock')?.value || '0') || 0;
      const reorderLevel = parseInt(item.querySelector('.variant-reorder-level')?.value || '0') || 0;
      const reorderQuantity = parseInt(item.querySelector('.variant-reorder-quantity')?.value || '0') || 0;
      const maxStock = item.querySelector('.variant-max-stock')?.value.trim();
      const unitOfMeasure = item.querySelector('.variant-unit')?.value || 'pcs';
      const location = item.querySelector('.variant-location')?.value.trim() || '';
      const status = item.querySelector('.variant-status')?.value || 'active';
      
      // Generate default SKU if empty (for new variants)
      if (!sku && !variantId) {
        // Get product code to generate SKU
        const productCodeDisplay = document.getElementById('edit-product-code');
        const productCode = productCodeDisplay ? productCodeDisplay.textContent.trim() : 'PROD';
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        sku = `${productCode}-V${existingVariants.length + variantsToInsert.length + 1}-${timestamp}-${randomSuffix}`;
      }
      
      // Skip only if it's an existing variant without SKU (shouldn't happen, but safety check)
      if (!sku && variantId) {
        console.warn('Skipping existing variant without SKU:', variantId);
        continue;
      }
      
      // Upload variant image if a new image was selected
      let imageUrl = null;
      const imageInput = item.querySelector('.variant-image-input');
      const preview = item.querySelector('.variant-image-preview img');
      
      // Check for new image file - prioritize input element files (most reliable)
      let imageFile = null;
      if (imageInput && imageInput.files && imageInput.files.length > 0) {
        imageFile = imageInput.files[0];
        console.log('Found image file in input element for SKU:', sku, 'File:', imageFile.name, 'Size:', imageFile.size);
      } else if (item._imageFile) {
        imageFile = item._imageFile;
        console.log('Found image file in _imageFile property for SKU:', sku, 'File:', imageFile.name, 'Size:', imageFile.size);
      } else if (preview && preview.src && preview.src.startsWith('data:')) {
        // Data URL indicates a new image was selected but file might be lost
        console.warn('Preview shows data URL but no file found for SKU:', sku, '- image may not be saved. Please reselect the image.');
      }
      
      // If we have a new image file, upload it
      if (imageFile) {
        // Ensure SKU is available for file naming
        if (!sku || sku.trim() === '') {
          console.warn('Cannot upload variant image: SKU is empty. Generating temporary SKU...');
          // Generate a temporary SKU for the upload
          const productCodeDisplay = document.getElementById('edit-product-code');
          const productCode = productCodeDisplay ? productCodeDisplay.textContent.trim() : 'PROD';
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          sku = `${productCode}-V${timestamp}-${randomSuffix}`;
          console.log('Using temporary SKU for image upload:', sku);
        }
        
        try {
          console.log('Uploading new variant image for SKU:', sku, 'File:', imageFile.name, 'Size:', imageFile.size);
          imageUrl = await uploadVariantImageToSupabase(imageFile, sku);
          console.log('Variant image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Error uploading variant image:', uploadError);
          console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
          // Show detailed error message
          const errorMessage = uploadError.message || 'Unknown error occurred';
          const continueWithoutImage = confirm(`Failed to upload image for variant ${sku}.\n\nError: ${errorMessage}\n\nDo you want to continue saving the variant without the image?`);
          if (!continueWithoutImage) {
            throw new Error('Variant image upload cancelled');
          }
        }
      } else if (preview && preview.src && !preview.src.startsWith('data:')) {
        // Keep existing image URL (not a data URL, so it's a real URL)
        imageUrl = preview.src;
        console.log('Keeping existing variant image URL:', imageUrl);
      }
      
      // Use default values for empty fields
      const finalVariantName = variantName || 'N/A';
      const finalSize = size || 'N/A';
      const finalColor = color || 'N/A';
      const finalWeight = weight || 'N/A';
      const finalGrip = grip || 'N/A';
      const finalMaterial = material || 'N/A';
      const finalLocation = location || 'N/A';
      
      const variantData = {
        product_id: productId,
        sku: sku,
        barcode: barcode || null,
        variant_name: finalVariantName,
        size: finalSize,
        color: finalColor,
        weight: finalWeight,
        grip: finalGrip,
        material: finalMaterial,
        cost_price: costPrice,
        selling_price: sellingPrice,
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        min_selling_price: minSellingPrice ? parseFloat(minSellingPrice) : null,
        current_stock: currentStock,
        reorder_level: reorderLevel,
        reorder_quantity: reorderQuantity,
        max_stock: maxStock ? parseInt(maxStock) : null,
        unit_of_measure: unitOfMeasure,
        location: finalLocation,
        status: status,
        updated_at: new Date().toISOString()
      };
      
      // Add image URL if available, or preserve existing image for updates
      if (imageUrl) {
        variantData.image_url = imageUrl;
        variantData.variant_image = imageUrl; // Support both column names
        console.log('Image URL added to variant data for SKU:', sku, 'URL:', imageUrl);
      } else if (variantId && existingVariantImageMap.has(variantId)) {
        // Preserve existing image URL when updating without new image
        const existingImageUrl = existingVariantImageMap.get(variantId);
        variantData.image_url = existingImageUrl;
        variantData.variant_image = existingImageUrl; // Support both column names
        console.log('Preserving existing image URL for variant SKU:', sku, 'URL:', existingImageUrl);
      } else {
        console.log('No image URL to add for variant SKU:', sku);
      }
      
      if (variantId && existingVariantIds.has(variantId)) {
        // Update existing variant
        variantsToUpdate.push({ id: variantId, data: variantData });
        currentVariantIds.add(variantId);
      } else {
        // Insert new variant
        variantsToInsert.push(variantData);
      }
    }
    
    // Delete variants that were removed
    const variantsToDelete = Array.from(existingVariantIds).filter(id => !currentVariantIds.has(id));
    if (variantsToDelete.length > 0) {
      const { error: deleteError } = await window.supabase
        .from('product_variants')
        .delete()
        .in('id', variantsToDelete);
      
      if (deleteError) {
        console.error('Error deleting variants:', deleteError);
      }
    }
    
    // Update existing variants
    for (const variant of variantsToUpdate) {
      console.log('Updating variant:', variant.id, 'with data:', variant.data);
      const { data: updateData, error: updateError } = await window.supabase
        .from('product_variants')
        .update(variant.data)
        .eq('id', variant.id)
        .select();
      
      if (updateError) {
        console.error('Error updating variant:', variant.id, updateError);
        throw new Error(`Failed to update variant ${variant.id}: ${updateError.message}`);
      } else {
        console.log('Variant updated successfully:', updateData);
      }
    }
    
    // Insert new variants
    if (variantsToInsert.length > 0) {
      console.log('Inserting new variants:', variantsToInsert);
      const { data: insertData, error: insertError } = await window.supabase
        .from('product_variants')
        .insert(variantsToInsert)
        .select();
      
      if (insertError) {
        console.error('Error inserting variants:', insertError);
        throw new Error(`Failed to insert variants: ${insertError.message}`);
      } else {
        console.log('Variants inserted successfully:', insertData);
      }
    }
    
    console.log('Variants saved successfully');
    
  } catch (error) {
    console.error('Error saving variants:', error);
  }
}

// Attach event listeners to edit product popup
function attachEditProductPopupListeners(productId) {
  const popup = document.getElementById('edit-product-popup');
  if (!popup) return;
  
  const dialog = popup.querySelector('.edit-position-dialog');
  if (!dialog) return;
  
  // Remove old listeners if they exist
  if (dialog._editProductClickHandler) {
    dialog.removeEventListener('click', dialog._editProductClickHandler);
  }
  
  // Create click handler
  const clickHandler = function(e) {
    // Close button
    if (e.target.closest('#close-edit-product-btn')) {
      e.preventDefault();
      e.stopPropagation();
      hideEditProductPopup();
      return;
    }
    
    // Save button
    if (e.target.closest('#save-edit-product-btn')) {
      e.preventDefault();
      e.stopPropagation();
      saveEditedProduct(productId);
      return;
    }
  };
  
  dialog._editProductClickHandler = clickHandler;
  dialog.addEventListener('click', clickHandler);
  
  // Image upload functionality (similar to add product)
  const imageFrame = document.getElementById('edit-product-image-upload-frame');
  const imageInput = document.getElementById('edit-product-image-input');
  const uploadBtn = document.getElementById('edit-product-image-upload-btn');
  
  if (imageFrame && imageInput) {
    const triggerFileInput = () => {
      imageInput.click();
    };
    
    if (imageFrame._clickHandler) {
      imageFrame.removeEventListener('click', imageFrame._clickHandler);
    }
    imageFrame._clickHandler = triggerFileInput;
    imageFrame.addEventListener('click', triggerFileInput);
    
    if (uploadBtn && uploadBtn._clickHandler) {
      uploadBtn.removeEventListener('click', uploadBtn._clickHandler);
    }
    if (uploadBtn) {
      uploadBtn._clickHandler = (e) => {
        e.stopPropagation();
        triggerFileInput();
      };
      uploadBtn.addEventListener('click', uploadBtn._clickHandler);
    }
    
    // Handle file selection
    if (imageInput._changeHandler) {
      imageInput.removeEventListener('change', imageInput._changeHandler);
    }
    imageInput._changeHandler = function(e) {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file.');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB.');
          return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('edit-product-image-preview');
          if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Product preview" style="width: 100%; height: 100%; object-fit: contain;" />`;
            preview.classList.add('has-image');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    imageInput.addEventListener('change', imageInput._changeHandler);
  }
}

// Save edited product
async function saveEditedProduct(productId) {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveEditedProductInternal(productId, authenticatedUser);
      },
      'Updated product',
      'product',
      { action: 'save_edited_product', product_id: productId }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save edited product (after authentication)
async function saveEditedProductInternal(productId, authenticatedUser) {
  const saveBtn = document.getElementById('save-edit-product-btn');
  if (!saveBtn) return;
  
  // Disable button and show loading
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  const originalBackground = saveBtn.style.background;
  saveBtn.textContent = 'SAVING...';
  
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Get form values
    const codeDisplay = document.getElementById('edit-product-code');
    const nameInput = document.getElementById('edit-product-name');
    const brandInput = document.getElementById('edit-product-brand');
    const categorySelect = document.getElementById('edit-product-category');
    const descriptionTextarea = document.getElementById('edit-product-description');
    const statusSelect = document.getElementById('edit-product-status');
    const imageInput = document.getElementById('edit-product-image-input');
    
    const productCode = codeDisplay ? codeDisplay.textContent.trim() : '';
    const productName = nameInput ? nameInput.value.trim() : '';
    const brand = brandInput ? brandInput.value.trim() : '';
    const categoryId = categorySelect ? categorySelect.value : '';
    const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
    const status = statusSelect ? statusSelect.value : 'active';
    
    // Validate required fields
    if (!productName) {
      throw new Error('Product name is required.');
    }
    
    // Prepare update data
    const updateData = {
      product_name: productName,
      brand: brand || null,
      category_id: categoryId || null,
      description: description || null,
      status: status,
      updated_at: new Date().toISOString()
    };
    
    // Handle image upload if a new image was selected
    if (imageInput && imageInput.files && imageInput.files[0]) {
      try {
        const imageUrl = await uploadProductImageToSupabase(imageInput.files[0], productCode);
        updateData.image_url = imageUrl;
      } catch (imageError) {
        console.warn('Image upload failed, continuing without image update:', imageError);
        // Continue without image if upload fails
      }
    }
    
    // Update product in Supabase
    const { data, error } = await window.supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select();
    
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('Product was not updated. No data returned.');
    }
    
    console.log('Product updated successfully:', data);
    
    // Save variants
    await saveProductVariants(productId);
    
    // Success
    saveBtn.textContent = 'SAVED!';
    saveBtn.style.background = '#4caf50';
    
    // Reload products
    setTimeout(async () => {
      await loadProductsData();
      hideEditProductPopup();
      exitProductEditMode();
      
      // Reset button
      saveBtn.textContent = originalText;
      saveBtn.style.background = originalBackground;
      saveBtn.disabled = false;
    }, 1000);
    
  } catch (error) {
    console.error('Error saving product:', error);
    
    saveBtn.textContent = 'SAVE FAILED';
    saveBtn.style.background = '#f44336';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = originalBackground;
      saveBtn.disabled = false;
    }, 2000);
    
    const errorMessage = error.message || 'Error saving product. Please try again.';
    alert(errorMessage);
  }
}

/* ============================================
   ADD CATEGORY POPUP FUNCTIONALITY (Similar to Position Popup)
   ============================================ */

// Store original categories for reset
let originalCategories = [];
let categoryRealtimeChannel = null;

// Load categories from Supabase
async function loadCategoriesFromSupabase() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return [];
    }
    
    const { data, error } = await window.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

// Load categories into popup
async function loadCategoriesIntoPopup() {
  const categoryFrame = document.getElementById('category-list-frame');
  if (!categoryFrame) return;
  
  const categories = await loadCategoriesFromSupabase();
  
  // Clear current list
  categoryFrame.innerHTML = '';
  
  // Create category items
  categories.forEach((cat, index) => {
    const wrapper = createCategoryItem(cat.category_name, cat.category_name.toLowerCase().replace(/\s+/g, '-'));
    categoryFrame.appendChild(wrapper);
  });
  
  // Setup listeners
  setupCategoryItemListeners();
  
  // Store as original categories
  originalCategories = categories.map((cat, index) => ({
    category: cat.category_name.toLowerCase().replace(/\s+/g, '-'),
    text: cat.category_name
  }));
}

// Create a category item wrapper (similar to position item)
function createCategoryItem(text, category) {
  const wrapper = document.createElement('div');
  wrapper.className = 'position-list-item-wrapper';
  wrapper.setAttribute('data-category', category);
  
  const textSpan = document.createElement('span');
  textSpan.className = 'position-list-item-text';
  textSpan.textContent = text;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'position-list-item-input';
  input.value = text;
  input.style.textTransform = 'uppercase';
  
  const editBtn = document.createElement('button');
  editBtn.className = 'position-action-icon-btn position-edit-icon-btn';
  editBtn.setAttribute('data-action', 'edit-item');
  editBtn.style.display = 'none';
  editBtn.innerHTML = `
    <img src="image/sn_icon_edit.png" alt="Edit" class="position-action-icon" />
    <img src="image/sn_icon_hover_edit.png" alt="Edit" class="position-action-icon-hover" />
  `;
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'position-action-icon-btn position-remove-icon-btn';
  removeBtn.setAttribute('data-action', 'remove-item');
  removeBtn.style.display = 'none';
  removeBtn.innerHTML = `
    <img src="image/sn_icon_trash.png" alt="Remove" class="position-action-icon" />
    <img src="image/sn_icon_hover_trash.png" alt="Remove" class="position-action-icon-hover" />
  `;
  
  wrapper.appendChild(textSpan);
  wrapper.appendChild(input);
  wrapper.appendChild(editBtn);
  wrapper.appendChild(removeBtn);
  
  return wrapper;
}

// Hide all category action icons
function hideAllCategoryActionIcons() {
  const categoryFrame = document.getElementById('category-list-frame');
  if (!categoryFrame) return;
  
  const editIcons = categoryFrame.querySelectorAll('.position-edit-icon-btn');
  const removeIcons = categoryFrame.querySelectorAll('.position-remove-icon-btn');
  
  editIcons.forEach(icon => icon.style.display = 'none');
  removeIcons.forEach(icon => icon.style.display = 'none');
}

// Set up category item event listeners
function setupCategoryItemListeners() {
  const categoryFrame = document.getElementById('category-list-frame');
  if (!categoryFrame) return;
  
  // Handle edit icon clicks
  const editIcons = categoryFrame.querySelectorAll('.position-edit-icon-btn');
  editIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && !wrapper.classList.contains('new-position')) {
        wrapper.classList.add('editing');
        const input = wrapper.querySelector('.position-list-item-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });
  });
  
  // Handle remove icon clicks
  const removeIcons = categoryFrame.querySelectorAll('.position-remove-icon-btn');
  removeIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && !wrapper.classList.contains('new-position')) {
        wrapper.remove();
      }
    });
  });
  
  // Handle input field blur (save on blur)
  const inputs = categoryFrame.querySelectorAll('.position-list-item-input');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      const wrapper = this.closest('.position-list-item-wrapper');
      if (wrapper && wrapper.classList.contains('editing')) {
        const newValue = this.value.trim().toUpperCase();
        if (newValue) {
          const textSpan = wrapper.querySelector('.position-list-item-text');
          if (textSpan) {
            textSpan.textContent = newValue;
          }
          wrapper.classList.remove('editing');
        }
      }
    });
    
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  });
}

// Show add category popup
async function showAddCategoryPopup() {
  const popup = document.getElementById('add-category-popup');
  if (popup) {
    // Load categories from Supabase
    await loadCategoriesIntoPopup();
    
    // Set up real-time subscription
    setupCategoriesRealtime();
    
    // Set up popup listeners
    setupAddCategoryPopupListeners();
    
    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  }
}

// Hide add category popup
async function hideAddCategoryPopup() {
  const popup = document.getElementById('add-category-popup');
  if (popup) {
    // Reset to original categories
    await resetCategoryList();
    
    // Clean up real-time subscription
    if (categoryRealtimeChannel) {
      window.supabase?.removeChannel(categoryRealtimeChannel);
      categoryRealtimeChannel = null;
    }
    
    popup.style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
  }
}

// Reset category list to original state
async function resetCategoryList() {
  const categoryFrame = document.getElementById('category-list-frame');
  if (!categoryFrame) return;
  
  // Reload from Supabase to get original state
  await loadCategoriesIntoPopup();
  
  // Reset action buttons
  const addBtn = document.getElementById('add-category-popup-btn');
  const removeBtn = document.getElementById('remove-category-popup-btn');
  const editBtn = document.getElementById('edit-category-popup-btn');
  if (addBtn) addBtn.classList.remove('active');
  if (removeBtn) removeBtn.classList.remove('active');
  if (editBtn) editBtn.classList.remove('active');
  
  // Hide all action icons
  hideAllCategoryActionIcons();
  
  // Remove any new category inputs
  const newCategoryInputs = categoryFrame.querySelectorAll('.position-list-item-wrapper.new-position');
  newCategoryInputs.forEach(input => input.remove());
}

// Save categories to Supabase
async function saveCategoriesToSupabase(categories) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    // Get current categories from database
    const { data: currentCategories, error: fetchError } = await window.supabase
      .from('categories')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching current categories:', fetchError);
      return false;
    }
    
    // Create maps for easier lookup
    const currentMap = new Map(currentCategories.map(c => [c.category_name.toUpperCase(), c]));
    const newMap = new Map(categories.map((c, index) => [c.text.toUpperCase(), { ...c, index }]));
    
    // Delete categories that are no longer in the list
    for (const [name, cat] of currentMap) {
      if (!newMap.has(name)) {
        const { error: deleteError } = await window.supabase
          .from('categories')
          .update({ is_active: false })
          .eq('id', cat.id);
        
        if (deleteError) {
          console.error('Error deleting category:', deleteError);
        }
      }
    }
    
    // Update or insert categories
    for (const [name, catData] of newMap) {
      const existing = currentMap.get(name);
      
      if (existing) {
        // Update existing category
        if (existing.category_name.toUpperCase() !== catData.text.toUpperCase() || 
            existing.display_order !== catData.index + 1) {
          const { error: updateError } = await window.supabase
            .from('categories')
            .update({
              category_name: catData.text,
              display_order: catData.index + 1,
              updated_at: new Date().toISOString(),
              is_active: true
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('Error updating category:', updateError);
          }
        }
      } else {
        // Insert new category
        // Generate category code from name
        const categoryCode = catData.text.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
        
        const { error: insertError } = await window.supabase
          .from('categories')
          .insert({
            category_code: categoryCode,
            category_name: catData.text,
            display_order: catData.index + 1,
            is_active: true
          });
        
        if (insertError) {
          console.error('Error inserting category:', insertError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }
}

// Set up real-time subscription for categories
function setupCategoriesRealtime() {
  if (!window.supabase) return;
  
  // Remove existing subscription if any
  if (categoryRealtimeChannel) {
    window.supabase.removeChannel(categoryRealtimeChannel);
  }
  
  const channel = window.supabase
    .channel('categories-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'categories' },
      async (payload) => {
        console.log('Categories data changed:', payload);
        // Reload categories in popup if it's open
        if (document.getElementById('add-category-popup')?.style.display === 'flex') {
          await loadCategoriesIntoPopup();
        }
        // Also reload dropdown if it's open
        const categorySubmenu = document.getElementById('category-submenu');
        if (categorySubmenu && categorySubmenu.classList.contains('show')) {
          await loadCategoriesIntoDropdown();
        }
        // Reload products data to update category displays
        if (window.location.pathname.includes('manage-product-page.html')) {
          await loadProductsData();
        }
      }
    )
    .subscribe();
  
  categoryRealtimeChannel = channel;
  return channel;
}

// Set up add category popup listeners
function setupAddCategoryPopupListeners() {
  const popup = document.getElementById('add-category-popup');
  if (!popup) return;

  // Close button
  const closeBtn = document.getElementById('close-add-category-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      await hideAddCategoryPopup();
    });
  }

  // Close when clicking outside the dialog
  popup.addEventListener('click', async function(e) {
    if (e.target === popup) {
      await hideAddCategoryPopup();
    }
  });

  // Setup category item listeners
  setupCategoryItemListeners();

  // Add button
  const addBtn = document.getElementById('add-category-popup-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const categoryFrame = document.getElementById('category-list-frame');
      if (!categoryFrame) return;
      
      // Check if new category input already exists
      const existingNew = categoryFrame.querySelector('.position-list-item-wrapper.new-position');
      if (existingNew) {
        existingNew.remove();
        this.classList.remove('active');
      } else {
        // Create new category input
        const wrapper = document.createElement('div');
        wrapper.className = 'position-list-item-wrapper new-position';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'position-list-item-input';
        input.placeholder = 'ENTER NEW CATEGORY';
        input.style.textTransform = 'uppercase';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'position-confirm-btn';
        confirmBtn.textContent = 'CONFIRM';
        
        confirmBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const newValue = input.value.trim().toUpperCase();
          if (newValue) {
            // Create new category item
            const newItem = createCategoryItem(newValue, newValue.toLowerCase().replace(/\s+/g, '-'));
            categoryFrame.appendChild(newItem);
            setupCategoryItemListeners();
            wrapper.remove();
            addBtn.classList.remove('active');
          }
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(confirmBtn);
        categoryFrame.appendChild(wrapper);
        input.focus();
      }
    });
  }

  // Remove button
  const removeBtn = document.getElementById('remove-category-popup-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const categoryFrame = document.getElementById('category-list-frame');
      if (!categoryFrame) return;
      
      const removeIcons = categoryFrame.querySelectorAll('.position-remove-icon-btn');
      const isActive = this.classList.contains('active');
      
      removeIcons.forEach(icon => {
        const wrapper = icon.closest('.position-list-item-wrapper');
        if (wrapper && !wrapper.classList.contains('new-position')) {
          icon.style.display = isActive ? 'flex' : 'none';
        }
      });
      
      // Hide edit icons when remove is active
      if (isActive) {
        const editIcons = categoryFrame.querySelectorAll('.position-edit-icon-btn');
        editIcons.forEach(icon => icon.style.display = 'none');
        const editBtn = document.getElementById('edit-category-popup-btn');
        if (editBtn) editBtn.classList.remove('active');
      }
    });
  }

  // Edit button
  const editBtn = document.getElementById('edit-category-popup-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      
      const categoryFrame = document.getElementById('category-list-frame');
      if (!categoryFrame) return;
      
      const editIcons = categoryFrame.querySelectorAll('.position-edit-icon-btn');
      const isActive = this.classList.contains('active');
      
      editIcons.forEach(icon => {
        const wrapper = icon.closest('.position-list-item-wrapper');
        if (wrapper && !wrapper.classList.contains('new-position')) {
          icon.style.display = isActive ? 'flex' : 'none';
        }
      });
      
      // Hide remove icons when edit is active
      if (isActive) {
        const removeIcons = categoryFrame.querySelectorAll('.position-remove-icon-btn');
        removeIcons.forEach(icon => icon.style.display = 'none');
        const removeBtn = document.getElementById('remove-category-popup-btn');
        if (removeBtn) removeBtn.classList.remove('active');
      }
    });
  }

  // Save Changes button
  const saveBtn = document.getElementById('save-category-changes-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      // Require staff authentication
      try {
        await requireStaffAuthentication(
          async (authenticatedUser) => {
            await saveCategoryChangesInternal(authenticatedUser);
          },
          'Saved category changes',
          'category',
          { action: 'save_category_changes' }
        );
      } catch (error) {
        if (error.message !== 'Authentication cancelled') {
          console.error('Authentication error:', error);
        }
      }
    });
  }
}

// Internal function to save category changes (after authentication)
async function saveCategoryChangesInternal(authenticatedUser) {
  const saveBtn = document.getElementById('save-category-changes-btn');
  const categoryFrame = document.getElementById('category-list-frame');
  const popup = document.getElementById('add-category-popup');
  
  if (!categoryFrame) return;
  
  // Disable button and show loading state
  if (saveBtn) {
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'SAVING...';
    
    // Collect all current categories
    const currentCategories = Array.from(categoryFrame.querySelectorAll('.position-list-item-wrapper:not(.new-position)')).map(wrapper => {
      const text = wrapper.querySelector('.position-list-item-text');
      return {
        category: wrapper.getAttribute('data-category'),
        text: text ? text.textContent.trim() : ''
      };
    });
    
    // Save to Supabase
    const success = await saveCategoriesToSupabase(currentCategories);
    
    if (success) {
      // Update original categories to current state
      originalCategories = currentCategories;
      
      // Show success message
      if (saveBtn) {
        saveBtn.textContent = 'SAVED!';
        saveBtn.style.background = '#4caf50';
      }
      
      setTimeout(async () => {
        // Close popup
        if (popup) {
          popup.style.display = 'none';
          document.body.classList.remove('popup-open');
          document.body.style.overflow = '';
        }
        
        const addBtn = document.getElementById('add-category-popup-btn');
        const removeBtn = document.getElementById('remove-category-popup-btn');
        const editBtn = document.getElementById('edit-category-popup-btn');
        
        // Reset action buttons
        if (addBtn) addBtn.classList.remove('active');
        if (removeBtn) removeBtn.classList.remove('active');
        if (editBtn) editBtn.classList.remove('active');
        hideAllCategoryActionIcons();
        
        // Reset save button
        if (saveBtn) {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#9D5858';
          saveBtn.disabled = false;
        }
        
        // Reload categories in dropdown
        await loadCategoriesIntoDropdown();
        
        // Reload products data to update category names
        if (window.location.pathname.includes('manage-product-page.html')) {
          await loadProductsData();
        }
      }, 1000);
    } else {
      // Show error message
      if (saveBtn) {
        saveBtn.textContent = 'SAVE FAILED';
        saveBtn.style.background = '#f44336';
        
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '#9D5858';
          saveBtn.disabled = false;
        }, 2000);
      }
    }
  }
}

// Auto-initialize if on manage product page
if (window.location.pathname.includes('manage-product-page.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    initializeManageProductPage();
  });
}

/* ============================================
   PURCHASE ORDER PAGE FUNCTIONALITY
   ============================================ */

// Initialize Purchase Order Page
function initializePurchaseOrderPage() {
  loadLowStockProducts();
  loadPurchaseOrders();
  setupPOEventListeners();
  setupCategoryFilterForLowStock();
  setupSupplierFilter();
  setupPOStatusFilter();
  setupPODateFilter();
  setupPOSorting();
  setupClearFilters();
  updateActiveFiltersDisplay();
  updatePOBadge();
  updateCartBadge();
  
  // Allow clicking on low stock products to add to PO
  setupLowStockProductSelection();
  
  // Initialize cart from sessionStorage
  initializeCart();
  
  // Run auto-cancel check on page load
  autoCancelUnpaidPOs();
  // Set up periodic auto-cancel check (every hour)
  setInterval(autoCancelUnpaidPOs, 60 * 60 * 1000);
}

// Setup Low Stock Product Selection
function setupLowStockProductSelection() {
  // This will be called after low stock products are loaded
  // The click handlers are already set up in displayLowStockProducts
}

// Load low stock products
async function loadLowStockProducts() {
  const container = document.getElementById('low-stock-products-container');
  if (!container) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get all product variants and filter for low stock
    const { data: variants, error } = await window.supabase
      .from('product_variants')
      .select(`
        *,
        products (
          id,
          product_name,
          category_id,
          image_url,
          image_urls,
          status,
          categories (
            id,
            category_name
          )
        )
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading low stock products:', error);
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Error loading low stock products</p>';
      return;
    }

    // Filter variants where current_stock <= reorder_level and product is active
    const lowStockVariants = (variants || []).filter(v => {
      const product = v.products;
      if (!product || product.status !== 'active') {
        return false;
      }
      const stock = v.current_stock || 0;
      const reorderLevel = v.reorder_level || 0;
      return stock <= reorderLevel;
    });

    // Group variants by product_id to avoid duplicates
    const productMap = new Map();
    lowStockVariants.forEach(variant => {
      const productId = variant.products?.id;
      if (!productId) return;
      
      if (!productMap.has(productId)) {
        // Store the variant with the lowest stock for each product
        productMap.set(productId, variant);
      } else {
        // If this variant has lower stock, replace it
        const existingVariant = productMap.get(productId);
        const existingStock = existingVariant.current_stock || 0;
        const currentStock = variant.current_stock || 0;
        if (currentStock < existingStock) {
          productMap.set(productId, variant);
        }
      }
    });

    // Convert map values to array for display
    const uniqueLowStockProducts = Array.from(productMap.values());

    displayLowStockProducts(uniqueLowStockProducts, container);
  } catch (error) {
    console.error('Error loading low stock products:', error);
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Error loading low stock products</p>';
    }
  }
}

// Display low stock products
function displayLowStockProducts(variants, container) {
  if (!variants || variants.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No low stock products</p>';
    return;
  }

  container.innerHTML = variants.map(variant => {
    const product = variant.products;
    const category = product?.categories;
    const imageUrl = normalizeImageUrl(product?.image_url || (product?.image_urls && product.image_urls[0]) || null);
    const fallbackImage = 'image/sportNexusLatestLogo.png';

    return `
      <div class="low-stock-product-card" data-variant-id="${variant.id}" data-product-id="${product?.id || ''}" data-category-id="${product?.category_id || ''}">
        <div class="low-stock-product-image-wrapper">
          <img src="${imageUrl}" alt="${product?.product_name || 'Product'}" class="low-stock-product-image" onerror="this.onerror=null; this.src='${fallbackImage}'" />
        </div>
        <div class="low-stock-product-info">
          <p class="low-stock-product-name">NAME : ${product?.product_name || 'N/A'}</p>
          <p class="low-stock-product-category">CATEGORY : ${category?.category_name || 'N/A'}</p>
          <p class="low-stock-product-quantity">QUANTITY : ${variant.current_stock || 0}</p>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers for product selection
  const productCards = container.querySelectorAll('.low-stock-product-card');
  productCards.forEach(card => {
    card.addEventListener('click', function() {
      // Remove selection from all cards
      productCards.forEach(c => c.classList.remove('selected'));
      // Select this card
      this.classList.add('selected');
      // Load product into add PO form and show popup
      loadProductIntoPOForm(this);
    });
  });
}


// Load selected product into PO form
async function loadProductIntoPOForm(card) {
  const variantId = card.getAttribute('data-variant-id');
  const productId = card.getAttribute('data-product-id');
  const productName = card.querySelector('.low-stock-product-name')?.textContent.replace('NAME : ', '').trim() || 'N/A';
  const productStock = card.querySelector('.low-stock-product-quantity')?.textContent.replace('QUANTITY : ', '').trim() || '0';
  const productCategory = card.querySelector('.low-stock-product-category')?.textContent.replace('CATEGORY : ', '').trim() || 'N/A';
  const productImage = card.querySelector('.low-stock-product-image')?.src || 'image/sportNexusLatestLogo.png';

  // Update form
  const productNameElement = document.getElementById('po-selected-product-name');
  if (productNameElement) {
    productNameElement.textContent = productName;
    productNameElement.setAttribute('data-product-id', productId);
  }
  document.getElementById('po-selected-product-stock').textContent = productStock;
  document.getElementById('po-selected-product-category').textContent = productCategory;

  // Update image
  const imageContainer = document.querySelector('.po-product-image-container');
  if (imageContainer) {
    imageContainer.innerHTML = `<img src="${productImage}" alt="${productName}" style="width: 100%; height: 100%; object-fit: contain;" />`;
  }

  // Store selected variant and product IDs
  window.selectedVariantId = variantId;
  window.selectedProductId = productId;
  window.selectedVariants = []; // Array to store selected variants for PO

  // Load product variants
  await loadProductVariantsForPO(productId);

  // Show add PO popup
  showAddPOPopup();
}

// Load product variants for PO form
async function loadProductVariantsForPO(productId) {
  const variantsSection = document.getElementById('po-variants-section');
  const variantsContainer = document.getElementById('po-variants-container');
  
  if (!variantsSection || !variantsContainer || !productId) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Fetch all variants for this product
    const { data: variants, error } = await window.supabase
      .from('product_variants')
      .select('id, color, size, variant_name, current_stock, cost_price, sku')
      .eq('product_id', productId)
      .eq('status', 'active')
      .order('color', { ascending: true })
      .order('size', { ascending: true });

    if (error) {
      console.error('Error loading product variants:', error);
      variantsSection.style.display = 'none';
      return;
    }

    if (!variants || variants.length === 0) {
      variantsSection.style.display = 'none';
      // Show amount input if no variants
      const amountInput = document.getElementById('po-amount-input');
      if (amountInput) {
        const amountGroup = amountInput.closest('.po-form-group');
        if (amountGroup) amountGroup.style.display = 'flex';
      }
      return;
    }

    // Show variants section and hide amount input (since we use variant-specific quantities)
    variantsSection.style.display = 'block';
    const amountInput = document.getElementById('po-amount-input');
    if (amountInput) {
      const amountGroup = amountInput.closest('.po-form-group');
      if (amountGroup) amountGroup.style.display = 'none';
    }
    variantsContainer.innerHTML = '';

    // Group variants by color
    const variantsByColor = {};
    variants.forEach(variant => {
      const color = variant.color || 'N/A';
      if (!variantsByColor[color]) {
        variantsByColor[color] = [];
      }
      variantsByColor[color].push(variant);
    });

    // Create UI for each color group
    Object.keys(variantsByColor).forEach(color => {
      const colorGroup = document.createElement('div');
      colorGroup.className = 'po-variant-color-group';
      
      const colorHeader = document.createElement('div');
      colorHeader.className = 'po-variant-color-header';
      colorHeader.innerHTML = `<strong>Color: ${color}</strong>`;
      colorGroup.appendChild(colorHeader);

      const sizesContainer = document.createElement('div');
      sizesContainer.className = 'po-variant-sizes-container';

      variantsByColor[color].forEach(variant => {
        const variantItem = document.createElement('div');
        variantItem.className = 'po-variant-item';
        const unitCost = parseFloat(variant.cost_price) || 0;
        variantItem.innerHTML = `
          <div class="po-variant-info">
            <span class="po-variant-size">Size: ${variant.size || 'N/A'}</span>
            <span class="po-variant-sku">SKU: ${variant.sku || 'N/A'}</span>
            <span class="po-variant-stock">Stock: ${variant.current_stock || 0}</span>
            <span class="po-variant-price">Price: RM ${unitCost.toFixed(2)}</span>
          </div>
          <div class="po-variant-quantity-wrapper">
            <div class="po-variant-quantity">
              <label>Quantity:</label>
              <input type="number" 
                     class="po-variant-qty-input" 
                     data-variant-id="${variant.id}"
                     data-variant-color="${color}"
                     data-variant-size="${variant.size || ''}"
                     min="0" 
                     value="0"
                     placeholder="0" />
            </div>
            <div class="po-variant-unit-toggle">
              <button type="button" class="po-variant-unit-btn active" data-unit="pieces" data-variant-id="${variant.id}">PIECES</button>
              <button type="button" class="po-variant-unit-btn" data-unit="bundle" data-variant-id="${variant.id}">BUNDLE</button>
            </div>
            <div class="po-variant-unit-hint">1 Bundle = 12 Pieces</div>
          </div>
        `;
        sizesContainer.appendChild(variantItem);
        
        // Add event listeners for unit toggle buttons
        const unitButtons = variantItem.querySelectorAll('.po-variant-unit-btn');
        unitButtons.forEach(btn => {
          btn.addEventListener('click', function() {
            const variantId = this.getAttribute('data-variant-id');
            // Remove active class from all buttons for this variant
            variantItem.querySelectorAll('.po-variant-unit-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
          });
        });
      });

      colorGroup.appendChild(sizesContainer);
      variantsContainer.appendChild(colorGroup);
    });

  } catch (error) {
    console.error('Error loading product variants:', error);
    variantsSection.style.display = 'none';
  }
}

// Show Add PO Popup
function showAddPOPopup() {
  const popup = document.getElementById('add-po-popup');
  if (!popup) return;

  // Load suppliers
  loadSuppliersForPO();

  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Hide Add PO Popup
function hideAddPOPopup() {
  const popup = document.getElementById('add-po-popup');
  if (!popup) return;

  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';

  // Reset form
  resetPOForm();
}

// Reset PO Form
function resetPOForm() {
  document.getElementById('po-amount-input').value = '';
  document.getElementById('po-supplier-select').value = '';
  document.getElementById('po-remarks-textarea').value = '';
  const piecesBtn = document.querySelector('.po-unit-btn[data-unit="pieces"]');
  const boxBtn = document.querySelector('.po-unit-btn[data-unit="box"]');
  if (piecesBtn) piecesBtn.classList.add('active');
  if (boxBtn) boxBtn.classList.remove('active');
  window.selectedVariantId = null;
  window.selectedProductId = null;
  window.selectedVariants = [];
  window.editingPOId = null;
  window.editingPOItems = null;
  
  // Hide and clear variants section
  const variantsSection = document.getElementById('po-variants-section');
  const variantsContainer = document.getElementById('po-variants-container');
  if (variantsSection) variantsSection.style.display = 'none';
  if (variantsContainer) variantsContainer.innerHTML = '';
  
  // Show amount input again
  const amountInput = document.getElementById('po-amount-input');
  if (amountInput) {
    const amountGroup = amountInput.closest('.po-form-group');
    if (amountGroup) amountGroup.style.display = 'flex';
  }
  
  // Reset button
  const addToCartBtn = document.getElementById('po-add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.textContent = 'ADD TO CART';
    addToCartBtn.style.background = '#9D5858';
    addToCartBtn.onclick = handleAddToCart;
  }
}

// Load suppliers for PO dropdown
async function loadSuppliersForPO() {
  const select = document.getElementById('po-supplier-select');
  if (!select) return;

  try {
    if (!window.supabase) return;

    const { data: suppliers, error } = await window.supabase
      .from('supplier')
      .select('id, company_name, user_code')
      .eq('status', 'active')
      .order('company_name', { ascending: true });

    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }

    // Clear existing options except first
    select.innerHTML = '<option value="">Select Supplier</option>';

    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.company_name || supplier.user_code || 'Supplier';
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading suppliers:', error);
  }
}

// Load Purchase Orders
async function loadPurchaseOrders() {
  const tbody = document.getElementById('po-table-body');
  if (!tbody) {
    console.warn('PO table body not found');
    return;
  }

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Supabase client not initialized. Please refresh the page.</td></tr>';
      return;
    }

    // Query purchase orders - exclude draft status
    let { data: purchaseOrders, error } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading purchase orders:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      tbody.innerHTML = `<tr><td colspan="9" class="no-data-message">Error loading purchase orders: ${error.message || 'Unknown error'}. Please check console for details.</td></tr>`;
      return;
    }

    // If we have purchase orders, fetch supplier information separately
    if (purchaseOrders && purchaseOrders.length > 0) {
      const supplierIds = [...new Set(purchaseOrders.map(po => po.supplier_id).filter(Boolean))];
      
      if (supplierIds.length > 0) {
        const { data: suppliers, error: supplierError } = await window.supabase
          .from('supplier')
          .select('id, company_name, supplier_code')
          .in('id', supplierIds);

        if (!supplierError && suppliers) {
          // Create a map of supplier data
          const supplierMap = {};
          suppliers.forEach(supplier => {
            supplierMap[supplier.id] = supplier;
          });

          // Attach supplier data to purchase orders
          purchaseOrders = purchaseOrders.map(po => ({
            ...po,
            supplier: supplierMap[po.supplier_id] || null
          }));
        }
      }
      
      // Sort purchase orders by priority
      purchaseOrders.sort((a, b) => {
        const statusA = a.status || '';
        const statusB = b.status || '';
        
        // Helper function to get priority number
        const getPriority = (status) => {
          // Highest priority: arrived
          if (status === 'arrived') return 1;
          
          // Second: price_proposed (needs manager review)
          if (status === 'price_proposed') return 2;
          
          // Third: Days in transit (e.g., "5 days", "10 days")
          // Extract number of days and use it for sorting (fewer days = higher priority)
          const daysMatch = status.match(/^(\d+)\s+days$/i);
          if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            // Return priority 3 + days (so 5 days = 8, 10 days = 13, etc.)
            // This ensures fewer days appear first
            return 3 + days;
          }
          
          // Third: payment_pending (high priority - needs payment)
          if (status === 'payment_pending') return 3;
          
          // Fourth: Other active statuses (processing, partially_received, pending)
          if (['processing', 'partially_received', 'pending'].includes(status)) {
            return 100; // All have same priority, will be sorted by date
          }
          
          // Lowest: completed
          if (status === 'completed') return 999;
          
          // Unknown statuses go to bottom
          return 1000;
        };
        
        const priorityA = getPriority(statusA);
        const priorityB = getPriority(statusB);
        
        // First sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority and both are days format, sort by number of days (fewer first)
        const daysMatchA = statusA.match(/^(\d+)\s+days$/i);
        const daysMatchB = statusB.match(/^(\d+)\s+days$/i);
        if (daysMatchA && daysMatchB) {
          const daysA = parseInt(daysMatchA[1], 10);
          const daysB = parseInt(daysMatchB[1], 10);
          return daysA - daysB; // Ascending: fewer days first
        }
        
        // If same priority, sort by created_at (newest first)
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    }

    if (!purchaseOrders || purchaseOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">No purchase orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = purchaseOrders.map(po => {
      const supplier = po.supplier || {};
      const status = po.status || 'draft';
      // Determine status class - payment_pending gets warning color
      let statusClass = 'active';
      if (status === 'completed') {
        statusClass = 'active';
      } else if (status === 'cancelled') {
        statusClass = 'inactive';
      } else if (status === 'payment_pending') {
        statusClass = 'warning'; // Orange/Yellow for payment pending
      } else if (status === 'arrived') {
        statusClass = 'active';
      }
      // Handle days format status (e.g., "5 days")
      let statusText = status.toUpperCase().replace(/_/g, ' ');
      if (/^\d+\s+days$/.test(status)) {
        statusText = status.toUpperCase();
      }

      // Get creator info - use created_by UUID or show N/A
      // Note: We removed the created_by_user join as auth.users may not be accessible
      const creatorInitials = po.created_by ? po.created_by.substring(0, 8).toUpperCase() : 'N/A';

      const supplierName = supplier.company_name || supplier.user_code || 'N/A';
      const orderDate = po.order_date ? new Date(po.order_date).toISOString() : '';
      const expectedDate = po.expected_delivery_date ? new Date(po.expected_delivery_date).toISOString() : '';
      
      return `
        <tr class="po-table-row" 
            data-po-id="${po.id}" 
            data-supplier-id="${po.supplier_id || ''}" 
            data-supplier-name="${supplierName}"
            data-order-date="${orderDate}"
            data-expected-delivery-date="${expectedDate}"
            data-total-amount="${po.total_amount || 0}"
            data-status="${status}"
            style="cursor: pointer;">
          <td>${po.po_number || 'N/A'}</td>
          <td>${supplierName}</td>
          <td>${po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</td>
          <td>RM ${parseFloat(po.total_amount || 0).toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</td>
          <td>${creatorInitials}</td>
        </tr>
      `;
    }).join('');

    // Add click handlers to table rows
    const poRows = tbody.querySelectorAll('.po-table-row');
    poRows.forEach(row => {
      row.addEventListener('click', function(e) {
        // Don't trigger if clicking on status badge
        if (e.target.closest('.status-badge')) return;
        const poId = this.getAttribute('data-po-id');
        if (poId) {
          showPODetails(poId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading purchase orders:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Error loading purchase orders. Please refresh the page.</td></tr>';
    }
  }
}

// Setup PO Event Listeners
function setupPOEventListeners() {
  // Manage PO Button (changed from New PO)
  const managePOBtn = document.getElementById('manage-po-btn');
  if (managePOBtn) {
    managePOBtn.addEventListener('click', () => {
      showManagePOPopup();
    });
  }

  // Close Manage PO Popup
  const closeManagePOBtn = document.getElementById('close-manage-po-btn');
  if (closeManagePOBtn) {
    closeManagePOBtn.addEventListener('click', hideManagePOPopup);
  }

  // Close PO Details Popup
  const closePODetailsBtn = document.getElementById('close-po-details-btn');
  if (closePODetailsBtn) {
    closePODetailsBtn.addEventListener('click', hidePODetailsPopup);
  }

  // Clear All Draft POs
  const clearAllBtn = document.getElementById('po-clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllDraftPOs);
  }

  // Cart Icon Click
  const cartIcon = document.getElementById('po-cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      showCartPreview();
    });
  }

  // Finalize Cart Button
  const finalizeBtn = document.getElementById('po-finalize-cart-btn');
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', handleFinalizeCart);
  }

  // Bulk Approve Button
  const bulkApproveBtn = document.getElementById('po-bulk-approve-btn');
  if (bulkApproveBtn) {
    bulkApproveBtn.addEventListener('click', handleBulkApprove);
  }

  // Close Add PO Popup
  const closeBtn = document.getElementById('close-add-po-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideAddPOPopup);
  }

  // Unit Toggle Buttons
  const unitButtons = document.querySelectorAll('.po-unit-btn');
  unitButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      unitButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Add to Draft Button
  const addToDraftBtn = document.getElementById('po-add-to-draft-btn');
  if (addToDraftBtn) {
    addToDraftBtn.addEventListener('click', handleAddToDraft);
  }

  // Create New Draft Button
  const createNewDraftBtn = document.getElementById('po-create-new-draft-btn');
  if (createNewDraftBtn) {
    createNewDraftBtn.addEventListener('click', handleCreateNewDraft);
  }

  // Save Changes Button
  const saveChangesBtn = document.getElementById('po-save-changes-btn');
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener('click', handleSaveDraftChanges);
  }

  // Search Input
  const searchInput = document.getElementById('po-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value;
      const activeSupplierOption = document.querySelector('#supplier-submenu .supplier-option-btn.active');
      const supplierId = activeSupplierOption && activeSupplierOption.dataset.supplier !== 'all' 
        ? activeSupplierOption.dataset.supplier 
        : null;
      const activeStatusOption = document.querySelector('#po-status-submenu .status-option-btn.active');
      const status = activeStatusOption && activeStatusOption.dataset.status !== 'all'
        ? activeStatusOption.dataset.status
        : null;
      filterPurchaseOrders(searchTerm, supplierId, status);
      updateActiveFiltersDisplay();
    });
  }
}

// ============================================
// SHOPPING CART SYSTEM (SessionStorage)
// ============================================

// Initialize Cart
function initializeCart() {
  if (!sessionStorage.getItem('poCart')) {
    sessionStorage.setItem('poCart', JSON.stringify([]));
  }
  updateCartBadge();
  updateFinalizeButton();
}

// Get Cart
function getCart() {
  const cartStr = sessionStorage.getItem('poCart');
  return cartStr ? JSON.parse(cartStr) : [];
}

// Save Cart
function saveCart(cart) {
  sessionStorage.setItem('poCart', JSON.stringify(cart));
  updateCartBadge();
  updateFinalizeButton();
}

// Add Item to Cart
function addItemToCart(item) {
  const cart = getCart();
  cart.push(item);
  saveCart(cart);
}

// Remove Item from Cart
function removeItemFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

// Clear Cart
function clearCart() {
  sessionStorage.removeItem('poCart');
  updateCartBadge();
  updateFinalizeButton();
}

// Update Cart Badge
function updateCartBadge() {
  const cart = getCart();
  const badge = document.getElementById('po-cart-badge');
  const icon = document.getElementById('po-cart-icon');
  
  if (badge) {
    badge.textContent = cart.length;
  }
  
  if (icon) {
    icon.style.display = cart.length > 0 ? 'flex' : 'none';
  }
}

// Update Finalize Button
function updateFinalizeButton() {
  const cart = getCart();
  const finalizeBtn = document.getElementById('po-finalize-cart-btn');
  if (finalizeBtn) {
    finalizeBtn.style.display = cart.length > 0 ? 'block' : 'none';
  }
}

// Group Cart by Supplier
function groupCartBySupplier() {
  const cart = getCart();
  const grouped = {};
  
  cart.forEach((item, index) => {
    const supplierId = item.supplierId;
    if (!grouped[supplierId]) {
      grouped[supplierId] = {
        supplierId: supplierId,
        supplierName: item.supplierName,
        items: []
      };
    }
    grouped[supplierId].items.push({ ...item, cartIndex: index });
  });
  
  return Object.values(grouped);
}

// Show Cart Preview
function showCartPreview() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  const grouped = groupCartBySupplier();
  let message = `CART PREVIEW (${cart.length} items)\n\n`;
  
  grouped.forEach(group => {
    message += `Supplier: ${group.supplierName}\n`;
    message += `Items: ${group.items.length}\n`;
    const totalQty = group.items.reduce((sum, item) => sum + item.quantity, 0);
    message += `Total Quantity: ${totalQty}\n\n`;
  });
  
  message += 'Click "FINALIZE CART" to create draft purchase orders.';
  alert(message);
}

// Handle Finalize Cart (Create Draft POs grouped by supplier)
async function handleFinalizeCart() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  // Require staff authentication before finalizing
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await handleFinalizeCartInternal(authenticatedUser);
      },
      'Finalized cart and created draft purchase orders',
      'purchase_order',
      { action: 'finalize_cart', cart_items: cart.length }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to handle finalize cart (after authentication)
async function handleFinalizeCartInternal(authenticatedUser) {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  if (!confirm(`Create ${groupCartBySupplier().length} draft purchase order(s) from ${cart.length} item(s)?`)) {
    return;
  }
  
  const finalizeBtn = document.getElementById('po-finalize-cart-btn');
  if (finalizeBtn) {
    finalizeBtn.disabled = true;
    finalizeBtn.textContent = 'CREATING...';
  }
  
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const userId = authenticatedUser.id;
    const grouped = groupCartBySupplier();
    
    let createdCount = 0;
    
    // Create one PO per supplier
    for (const group of grouped) {
      // Calculate totals for this supplier's items
      let subtotal = 0;
      const poItems = [];
      
      for (const item of group.items) {
        const lineTotal = item.quantity * item.unitCost;
        subtotal += lineTotal;
        poItems.push({
          product_variant_id: item.variantId,
          quantity_ordered: item.quantity,
          unit_cost: item.unitCost,
          line_total: lineTotal,
          notes: item.notes || null,
          discount_percentage: 0
        });
      }
      
      // Get supplier lead time
      const { data: supplier } = await window.supabase
        .from('supplier')
        .select('lead_time_days')
        .eq('id', group.supplierId)
        .single();
      
      const orderDate = new Date();
      const leadTimeDays = supplier?.lead_time_days || 7;
      const expectedDeliveryDate = new Date(orderDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + leadTimeDays);
      
      // Generate PO number
      const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}-${createdCount}`;
      
      // Create Purchase Order
      const { data: newPO, error: poError } = await window.supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: group.supplierId,
          order_date: orderDate.toISOString().split('T')[0],
          expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
          status: 'draft',
          subtotal: subtotal,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: subtotal,
          currency: 'MYR',
          notes: group.items[0].remarks || null,
          created_by: userId || null
        })
        .select()
        .single();
      
      if (poError) {
        throw new Error('Error creating purchase order: ' + poError.message);
      }
      
      // Create Purchase Order Items
      const poItemsWithPOId = poItems.map(item => ({
        ...item,
        purchase_order_id: newPO.id
      }));
      
      const { error: itemError } = await window.supabase
        .from('purchase_order_items')
        .insert(poItemsWithPOId);
      
      if (itemError) {
        throw new Error('Error creating purchase order items: ' + itemError.message);
      }
      
      createdCount++;
    }
    
    // Clear cart
    clearCart();
    
    // Success
    if (finalizeBtn) {
      finalizeBtn.textContent = 'CREATED!';
      finalizeBtn.style.background = '#4caf50';
    }
    
    setTimeout(() => {
      if (finalizeBtn) {
        finalizeBtn.textContent = 'FINALIZE CART & CREATE DRAFTS';
        finalizeBtn.style.background = '#4caf50';
        finalizeBtn.disabled = false;
      }
      hideAddPOPopup();
      loadPurchaseOrders();
      loadLowStockProducts();
      updatePOBadge();
      alert(`Successfully created ${createdCount} draft purchase order(s)!`);
    }, 1500);
    
  } catch (error) {
    console.error('Error finalizing cart:', error);
    alert('Error creating purchase orders: ' + error.message);
    if (finalizeBtn) {
      finalizeBtn.disabled = false;
      finalizeBtn.textContent = 'FINALIZE CART & CREATE DRAFTS';
      finalizeBtn.style.background = '#4caf50';
    }
  }
}

// Store current item being added to draft
window.currentDraftItem = null;

// Handle Add to Draft - Opens manage popup with item ready to add
async function handleAddToDraft() {
  const addToDraftBtn = document.getElementById('po-add-to-draft-btn');
  if (!addToDraftBtn) return;

  // Validate inputs
  const supplierId = document.getElementById('po-supplier-select').value;
  const remarks = document.getElementById('po-remarks-textarea').value;

  if (!supplierId) {
    alert('Please select a supplier.');
    return;
  }

  // Collect selected variants with quantities
  const variantInputs = document.querySelectorAll('.po-variant-qty-input');
  const selectedVariants = [];
  
  variantInputs.forEach(input => {
    const quantity = parseInt(input.value) || 0;
    if (quantity > 0) {
      const variantId = input.getAttribute('data-variant-id');
      const unitBtn = document.querySelector(`.po-variant-unit-btn.active[data-variant-id="${variantId}"]`);
      const unit = unitBtn ? unitBtn.getAttribute('data-unit') : 'pieces';
      const quantityInPieces = unit === 'bundle' ? quantity * 12 : quantity;
      
      selectedVariants.push({
        variantId: variantId,
        quantity: quantityInPieces,
        color: input.getAttribute('data-variant-color'),
        size: input.getAttribute('data-variant-size')
      });
    }
  });

  if (selectedVariants.length === 0) {
    alert('Please select at least one variant and enter quantity.');
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get supplier info
    const { data: supplier, error: supplierError } = await window.supabase
      .from('supplier')
      .select('id, company_name, user_code, lead_time_days')
      .eq('id', supplierId)
      .single();

    if (supplierError) {
      throw new Error('Error fetching supplier: ' + supplierError.message);
    }

    const supplierName = supplier.company_name || supplier.user_code || 'Unknown Supplier';

    // Fetch all variant cost prices and product info
    const variantIds = selectedVariants.map(v => v.variantId);
    const { data: variants, error: variantError } = await window.supabase
      .from('product_variants')
      .select(`
        id,
        cost_price,
        products (
          product_name
        )
      `)
      .in('id', variantIds);

    if (variantError) {
      throw new Error('Error fetching product variants: ' + variantError.message);
    }

    // Get selected product info
    const productId = document.getElementById('po-selected-product-name')?.getAttribute('data-product-id');
    const productName = document.getElementById('po-selected-product-name')?.textContent || 'Unknown Product';

    // Prepare item data for draft
    const draftItemData = {
      productId: productId,
      productName: productName,
      variants: selectedVariants.map(selected => {
        const variant = variants.find(v => v.id === selected.variantId);
        const unitCost = parseFloat(variant?.cost_price) || 0;
        return {
          variantId: selected.variantId,
          color: selected.color,
          size: selected.size,
          quantity: selected.quantity,
          unitCost: unitCost,
          notes: `${selected.color} - ${selected.size}`
        };
      }),
      supplierId: supplierId,
      supplierName: supplierName,
      remarks: remarks || null,
      leadTimeDays: supplier.lead_time_days || 7
    };

    // Disable button and show loading state
    addToDraftBtn.disabled = true;
    addToDraftBtn.textContent = 'ADDING TO DRAFT...';

    try {
      // Check if there's an existing draft with the same supplier (not finalized)
      const { data: existingDrafts, error: draftsError } = await window.supabase
        .from('purchase_orders')
        .select('id, po_number, supplier_id, finalized_at, subtotal, total_amount')
        .eq('status', 'draft')
        .eq('supplier_id', supplierId)
        .is('finalized_at', null) // Only non-finalized drafts
        .order('created_at', { ascending: false })
        .limit(1);

      if (draftsError) {
        throw new Error('Error checking existing drafts: ' + draftsError.message);
      }

      let resultPO;
      
      if (existingDrafts && existingDrafts.length > 0) {
        // Add to existing draft with same supplier
        const existingPO = existingDrafts[0];
        resultPO = await addItemToExistingDraft(existingPO.id, draftItemData);
        
        // Close add PO popup
        hideAddPOPopup();
        
        // Show success message
        alert(`Item added to existing draft PO: ${existingPO.po_number}`);
      } else {
        // Create a new draft PO
        resultPO = await createDraftWithItem(draftItemData);
        
        // Close add PO popup
        hideAddPOPopup();
        
        // Show success message
        alert(`Item added to new draft PO: ${resultPO.po_number}`);
      }
      
      // Refresh the purchase orders list if needed
      if (typeof loadPurchaseOrders === 'function') {
        await loadPurchaseOrders();
      }
    } catch (error) {
      console.error('Error adding to draft:', error);
      alert('Error: ' + error.message);
    } finally {
      // Re-enable button
      addToDraftBtn.disabled = false;
      addToDraftBtn.textContent = 'ADD TO DRAFT';
    }

  } catch (error) {
    console.error('Error preparing draft item:', error);
    alert('Error: ' + error.message);
  }
}

// Old handleAddToCart function (kept for reference, will be removed)
async function handleAddToCart() {
  const addToCartBtn = document.getElementById('po-add-to-draft-btn');
  if (!addToCartBtn) return;

  // Validate inputs
  const supplierId = document.getElementById('po-supplier-select').value;
  const remarks = document.getElementById('po-remarks-textarea').value;

  if (!supplierId) {
    alert('Please select a supplier.');
    return;
  }

  // Collect selected variants with quantities
  const variantInputs = document.querySelectorAll('.po-variant-qty-input');
  const selectedVariants = [];
  
  variantInputs.forEach(input => {
    const quantity = parseInt(input.value) || 0;
    if (quantity > 0) {
      const variantId = input.getAttribute('data-variant-id');
      // Get the selected unit for this variant
      const unitBtn = document.querySelector(`.po-variant-unit-btn.active[data-variant-id="${variantId}"]`);
      const unit = unitBtn ? unitBtn.getAttribute('data-unit') : 'pieces';
      
      // Convert to pieces if bundle is selected (1 bundle = 12 pieces)
      const quantityInPieces = unit === 'bundle' ? quantity * 12 : quantity;
      
      selectedVariants.push({
        variantId: variantId,
        quantity: quantityInPieces,
        color: input.getAttribute('data-variant-color'),
        size: input.getAttribute('data-variant-size')
      });
    }
  });

  if (selectedVariants.length === 0) {
    alert('Please select at least one variant and enter quantity.');
    return;
  }

  addToCartBtn.disabled = true;
  addToCartBtn.textContent = 'ADDING...';

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get supplier info
    const { data: supplier, error: supplierError } = await window.supabase
      .from('supplier')
      .select('id, company_name, user_code, lead_time_days')
      .eq('id', supplierId)
      .single();

    if (supplierError) {
      throw new Error('Error fetching supplier: ' + supplierError.message);
    }

    const supplierName = supplier.company_name || supplier.user_code || 'Unknown Supplier';

    // Fetch all variant cost prices and product info
    const variantIds = selectedVariants.map(v => v.variantId);
    const { data: variants, error: variantError } = await window.supabase
      .from('product_variants')
      .select(`
        id,
        cost_price,
        products (
          product_name
        )
      `)
      .in('id', variantIds);

    if (variantError) {
      throw new Error('Error fetching product variants: ' + variantError.message);
    }

    // Get selected product info
    const productId = document.getElementById('po-selected-product-name')?.getAttribute('data-product-id');
    const productName = document.getElementById('po-selected-product-name')?.textContent || 'Unknown Product';

    // Add each variant to cart
    selectedVariants.forEach(selected => {
      const variant = variants.find(v => v.id === selected.variantId);
      const unitCost = parseFloat(variant?.cost_price) || 0;
      
      const cartItem = {
        productId: productId,
        productName: productName,
        variantId: selected.variantId,
        color: selected.color,
        size: selected.size,
        quantity: selected.quantity,
        unitCost: unitCost,
        supplierId: supplierId,
        supplierName: supplierName,
        remarks: remarks || null,
        notes: `${selected.color} - ${selected.size}`,
        addedAt: new Date().toISOString()
      };
      
      addItemToCart(cartItem);
    });

    // Success - Added to cart
    addToCartBtn.textContent = 'ADDED!';
    addToCartBtn.style.background = '#4caf50';

    setTimeout(() => {
      // Keep popup open, just reset form
      resetPOForm();
      addToCartBtn.textContent = 'ADD TO CART';
      addToCartBtn.style.background = '#9D5858';
      addToCartBtn.disabled = false;
      
      // Show success message
      const cart = getCart();
      alert(`Item added to cart! (${cart.length} items in cart)\n\nClick "FINALIZE CART" when ready to create draft purchase orders.`);
    }, 1500);

  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Error adding to cart: ' + error.message);
    addToCartBtn.disabled = false;
    addToCartBtn.textContent = 'ADD TO CART';
    addToCartBtn.style.background = '#9D5858';
  }
}

// Setup Category Filter for Low Stock
// Set up category filter for low stock (matching manage-product-page style)
function setupCategoryFilterForLowStock() {
  const categoryBtn = document.getElementById('low-stock-category-btn');
  if (!categoryBtn) return;
  
  const categorySubmenu = document.getElementById('low-stock-category-submenu');
  if (!categorySubmenu) return;
  
  categoryBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      this.classList.remove('active');
      categorySubmenu.classList.remove('show');
    } else {
      // Load categories from Supabase before opening
      await loadCategoriesIntoLowStockDropdown();
      // Open submenu
      this.classList.add('active');
      categorySubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!categoryBtn.contains(e.target) && !categorySubmenu.contains(e.target)) {
      if (categoryBtn.classList.contains('active')) {
        categoryBtn.classList.remove('active');
        categorySubmenu.classList.remove('show');
      }
    }
  });
}

// Load categories into low stock dropdown (matching manage-product-page style)
async function loadCategoriesIntoLowStockDropdown() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name, category_code, is_active')
      .eq('is_active', true)
      .order('category_name', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    
    const categoryFrame = document.getElementById('low-stock-category-list');
    if (categoryFrame) {
      if (!categories || categories.length === 0) {
        categoryFrame.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">No categories available</p>';
        return;
      }
      
      // Add "All Categories" option
      categoryFrame.innerHTML = `
        <button class="category-option-btn" data-category="all">
          ALL CATEGORIES
        </button>
        ${categories.map(cat => `
          <button class="category-option-btn" data-category="${cat.id}" data-category-code="${cat.category_code}">
            ${cat.category_name}
          </button>
        `).join('')}
      `;
      
      // Add click handlers
      const categoryOptions = categoryFrame.querySelectorAll('.category-option-btn');
      categoryOptions.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const categoryId = this.dataset.category;
          const categoryName = this.textContent.trim();
          
          // Update display text
          const displayText = document.getElementById('low-stock-category-text');
          if (displayText) {
            displayText.textContent = categoryName;
          }
          
          // Remove active class from all options
          categoryOptions.forEach(opt => opt.classList.remove('active'));
          // Add active class to clicked option
          this.classList.add('active');
          
          // Close submenu
          const categoryBtn = document.getElementById('low-stock-category-btn');
          const categorySubmenu = document.getElementById('low-stock-category-submenu');
          if (categoryBtn) categoryBtn.classList.remove('active');
          if (categorySubmenu) categorySubmenu.classList.remove('show');
          
          // Filter low stock products
          if (categoryId === 'all') {
            filterLowStockByCategory(null);
          } else {
            filterLowStockByCategory(categoryId);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Filter Low Stock by Category
function filterLowStockByCategory(categoryId) {
  const cards = document.querySelectorAll('.low-stock-product-card');
  cards.forEach(card => {
    const cardCategoryId = card.getAttribute('data-category-id');
    
    // Convert both to strings for consistent comparison
    const cardCategoryIdStr = cardCategoryId ? String(cardCategoryId) : '';
    const categoryIdStr = categoryId ? String(categoryId) : '';
    
    if (categoryId && categoryId !== 'all' && categoryIdStr !== '') {
      // Show card if category matches
      if (cardCategoryIdStr === categoryIdStr) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    } else {
      // Show all cards when no filter or "all" is selected
      card.style.display = '';
    }
  });
}

// Setup Supplier Filter
function setupSupplierFilter() {
  const supplierBtn = document.getElementById('supplier-filter-btn');
  const supplierSubmenu = document.getElementById('supplier-submenu');
  
  if (!supplierBtn || !supplierSubmenu) return;

  supplierBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');

    if (isActive) {
      this.classList.remove('active');
      supplierSubmenu.classList.remove('show');
    } else {
      // Load suppliers before opening submenu
      await loadSuppliersForFilter();
      this.classList.add('active');
      supplierSubmenu.classList.add('show');
    }
  });
  
  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!supplierBtn.contains(e.target) && !supplierSubmenu.contains(e.target)) {
      if (supplierBtn.classList.contains('active')) {
        supplierBtn.classList.remove('active');
        supplierSubmenu.classList.remove('show');
      }
    }
  });
}

// Load Suppliers for Filter
async function loadSuppliersForFilter() {
  const supplierList = document.getElementById('supplier-list-scrollable-frame');
  const supplierBtn = document.getElementById('supplier-filter-btn');
  const supplierSubmenu = document.getElementById('supplier-submenu');
  
  if (!supplierList) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const { data: suppliers, error } = await window.supabase
      .from('supplier')
      .select('id, company_name, user_code')
      .eq('status', 'active')
      .order('company_name', { ascending: true });

    if (error) {
      console.error('Error loading suppliers:', error);
      supplierList.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">Error loading suppliers</p>';
      return;
    }

    if (!suppliers || suppliers.length === 0) {
      supplierList.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">No suppliers available</p>';
      return;
    }

    supplierList.innerHTML = `
      <button class="supplier-option-btn" data-supplier="all">ALL SUPPLIERS</button>
      ${suppliers.map(supplier => `
        <button class="supplier-option-btn" data-supplier="${supplier.id}">${supplier.company_name || supplier.user_code || 'N/A'}</button>
      `).join('')}
    `;

    // Add click handlers
    const supplierOptions = supplierList.querySelectorAll('.supplier-option-btn');
    supplierOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const supplierId = this.dataset.supplier;
        
        // Filter purchase orders
        filterPurchaseOrdersBySupplier(supplierId === 'all' ? null : supplierId);
        
        // Close submenu
        if (supplierBtn) supplierBtn.classList.remove('active');
        if (supplierSubmenu) supplierSubmenu.classList.remove('show');
        
        // Remove active class from all options
        supplierOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        this.classList.add('active');
        
        // Update active filters display
        updateActiveFiltersDisplay();
      });
    });
  } catch (error) {
    console.error('Error loading suppliers:', error);
    if (supplierList) {
      supplierList.innerHTML = '<p style="padding: 0.5rem; color: #999; text-align: center;">Error loading suppliers</p>';
    }
  }
}

// Setup PO Status Filter
function setupPOStatusFilter() {
  const statusBtn = document.getElementById('po-status-filter-btn');
  if (!statusBtn) return;

  statusBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    if (isActive) {
      this.classList.remove('active');
      document.getElementById('po-status-submenu').classList.remove('show');
    } else {
      this.classList.add('active');
      document.getElementById('po-status-submenu').classList.add('show');
    }
  });

  const statusOptions = document.querySelectorAll('#po-status-submenu .status-option-btn');
  statusOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const status = this.dataset.status;
      filterPurchaseOrdersByStatus(status === 'all' ? null : status);
      statusOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      statusBtn.classList.remove('active');
      document.getElementById('po-status-submenu').classList.remove('show');
      updateActiveFiltersDisplay();
    });
  });
}

// Setup PO Date Filter
function setupPODateFilter() {
  setupPODatePicker();
}

// Setup PO Date Picker (exact same structure as setupDatePicker but with PO-specific IDs)
function setupPODatePicker() {
  const dateBtn = document.getElementById('po-date-filter-btn');
  if (!dateBtn) return;
  
  const datePicker = document.getElementById('po-date-picker');
  if (!datePicker) return;
  
  const monthSelect = document.getElementById('po-month-select');
  const yearSelect = document.getElementById('po-year-select');
  const daysContainer = document.getElementById('po-date-picker-days');
  const startDateInput = document.getElementById('po-start-date-input');
  const endDateInput = document.getElementById('po-end-date-input');
  const backBtn = datePicker.querySelector('.date-picker-back-btn');
  const applyBtn = datePicker.querySelector('.date-picker-apply-btn');
  
  let currentDate = new Date();
  let startDate = null;
  let endDate = null;
  let isSelectingStart = true;
  
  // Format date to DD/MM/YYYY
  function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Parse date from DD/MM/YYYY or DD-MM-YYYY format
  function parseDate(dateString) {
    if (!dateString || dateString.trim() === '') return null;
    
    dateString = dateString.trim();
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match = dateString.match(datePattern);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    
    if (day < 1 || day > 31 || month < 0 || month > 11) return null;
    
    const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
    if (fullYear < 1900 || fullYear > 2100) return null;
    
    const date = new Date(fullYear, month, day);
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === fullYear) {
      return date;
    }
    
    return null;
  }
  
  // Validate date range
  function validateDateRange(start, end) {
    if (!start || !end) return false;
    return start <= end;
  }
  
  // Show validation error
  function showDateValidationError(message) {
    const existingError = datePicker.querySelector('.date-validation-error');
    if (existingError) existingError.remove();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'date-validation-error';
    errorElement.style.cssText = 'color: #dc3545; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem; background: #f8d7da; border-radius: 4px;';
    errorElement.textContent = message;
    
    const datePickerInputs = datePicker.querySelector('.date-picker-inputs');
    if (datePickerInputs) {
      datePickerInputs.appendChild(errorElement);
    }
    
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);
  }
  
  // Update input fields from dates
  function updateInputFields() {
    if (startDateInput) {
      startDateInput.value = formatDate(startDate);
    }
    if (endDateInput) {
      endDateInput.value = formatDate(endDate);
    }
  }
  
  // Update calendar view to show the month of a date
  function navigateToDate(date) {
    if (!date) return;
    monthSelect.value = date.getMonth();
    yearSelect.value = date.getFullYear();
    renderCalendar();
  }
  
  // Initialize year dropdown (current year ± 10 years)
  function initYearSelect() {
    const currentYear = currentDate.getFullYear();
    yearSelect.innerHTML = '';
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      if (i === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }
  
  // Render calendar
  function renderCalendar() {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust starting day (Monday = 0)
    const adjustedStart = (startingDayOfWeek + 6) % 7;
    
    daysContainer.innerHTML = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dayElement = createDayElement(day, date, true);
      daysContainer.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayElement = createDayElement(day, date, false);
      daysContainer.appendChild(dayElement);
    }
    
    // Next month days to fill the grid (5 rows = 35 cells)
    const totalCells = daysContainer.children.length;
    const remainingCells = 35 - totalCells; // 5 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dayElement = createDayElement(day, date, true);
      daysContainer.appendChild(dayElement);
    }
  }
  
  // Create day element
  function createDayElement(day, date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'date-day';
    dayElement.textContent = day;
    dayElement.dataset.date = date.toISOString().split('T')[0];
    
    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }
    
    // Check if date is in range
    if (startDate && endDate) {
      const dateStr = date.toISOString().split('T')[0];
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      if (dateStr === startStr) {
        dayElement.classList.add('range-start');
      } else if (dateStr === endStr) {
        dayElement.classList.add('range-end');
      } else if (date >= startDate && date <= endDate) {
        dayElement.classList.add('in-range');
      }
    } else if (startDate) {
      const dateStr = date.toISOString().split('T')[0];
      const startStr = startDate.toISOString().split('T')[0];
      if (dateStr === startStr) {
        dayElement.classList.add('selected');
      }
    }
    
    dayElement.addEventListener('click', function() {
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);
      
      if (isSelectingStart || !startDate) {
        startDate = clickedDate;
        endDate = null;
        isSelectingStart = false;
      } else {
        if (clickedDate < startDate) {
          endDate = startDate;
          startDate = clickedDate;
        } else {
          endDate = clickedDate;
        }
        isSelectingStart = true;
      }
      
      updateInputFields();
      renderCalendar();
    });
    
    return dayElement;
  }
  
  // Handle start date input
  if (startDateInput) {
    startDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        startDate = null;
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newStartDate = parsedDate;
        newStartDate.setHours(0, 0, 0, 0);
        
        // Validate against end date if it exists
        if (endDate && newStartDate > endDate) {
          showDateValidationError('Start date must be before or equal to end date');
          this.value = formatDate(startDate);
          return;
        }
        
        startDate = newStartDate;
        this.value = formatDate(startDate);
        navigateToDate(startDate);
        renderCalendar();
      } else {
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(startDate);
      }
    });
    
    startDateInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }
  
  // Handle end date input
  if (endDateInput) {
    endDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        endDate = null;
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newEndDate = parsedDate;
        newEndDate.setHours(23, 59, 59, 999);
        
        // Validate against start date if it exists
        if (startDate && newEndDate < startDate) {
          showDateValidationError('End date must be after or equal to start date');
          this.value = formatDate(endDate);
          return;
        }
        
        endDate = newEndDate;
        this.value = formatDate(endDate);
        navigateToDate(endDate);
        renderCalendar();
      } else {
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(endDate);
      }
    });
    
    endDateInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }
  
  // Toggle date picker
  dateBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');
    
    if (isActive) {
      this.classList.remove('active');
      datePicker.classList.remove('show');
    } else {
      this.classList.add('active');
      datePicker.classList.add('show');
      currentDate = new Date();
      monthSelect.value = currentDate.getMonth();
      initYearSelect();
      updateInputFields();
      renderCalendar();
    }
  });
  
  // Month/Year change
  monthSelect.addEventListener('change', renderCalendar);
  yearSelect.addEventListener('change', renderCalendar);
  
  // Back button - only dismiss the date picker, don't reset dates
  backBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
    updateInputFields();
  });
  
  // Apply button
  applyBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Remove any existing error messages
    const existingError = datePicker.querySelector('.date-validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // If dates are in input fields but not set, parse them
    if (startDateInput && startDateInput.value.trim() !== '') {
      const parsedStart = parseDate(startDateInput.value);
      if (parsedStart) {
        startDate = parsedStart;
        startDate.setHours(0, 0, 0, 0);
      } else {
        showDateValidationError('Invalid start date format. Please use DD/MM/YYYY');
        return;
      }
    }
    
    if (endDateInput && endDateInput.value.trim() !== '') {
      const parsedEnd = parseDate(endDateInput.value);
      if (parsedEnd) {
        endDate = parsedEnd;
        endDate.setHours(23, 59, 59, 999);
      } else {
        showDateValidationError('Invalid end date format. Please use DD/MM/YYYY');
        return;
      }
    }
    
    // Validate date range
    if (startDate && endDate) {
      if (!validateDateRange(startDate, endDate)) {
        showDateValidationError('Start date must be before or equal to end date');
        return;
      }
      filterPurchaseOrdersByDateRange(startDate, endDate);
    } else if (startDate) {
      filterPurchaseOrdersByDateRange(startDate, startDate);
    }
    
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
    updateActiveFiltersDisplay();
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!dateBtn.contains(e.target) && !datePicker.contains(e.target)) {
      if (dateBtn.classList.contains('active')) {
        dateBtn.classList.remove('active');
        datePicker.classList.remove('show');
      }
    }
  });
  
  // Initialize
  initYearSelect();
}

// Filter Purchase Orders by Date Range
function filterPurchaseOrdersByDateRange(startDate, endDate) {
  window.poDateFilterRange = { start: startDate, end: endDate };
  
  const searchInput = document.getElementById('po-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeStatusOption = document.querySelector('#po-status-submenu .status-option-btn.active');
  const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
  const finalStatus = statusFilter === 'all' ? null : statusFilter;
  
  const rows = document.querySelectorAll('#po-table-body tr');
  rows.forEach(row => {
    if (row.classList.contains('no-data-message')) return;
    
    let shouldShow = true;
    
    // Search filter
    if (searchTerm && !row.textContent.toLowerCase().includes(searchTerm)) {
      shouldShow = false;
    }
    
    // Status filter
    if (finalStatus && shouldShow) {
      const statusCell = row.querySelector('.status-badge');
      if (statusCell && !statusCell.textContent.toLowerCase().includes(finalStatus.toLowerCase())) {
        shouldShow = false;
      }
    }
    
    // Date filter
    if (shouldShow && startDate && endDate) {
      const dateCell = row.querySelector('td:nth-child(3)'); // Date column
      if (dateCell) {
        const dateText = dateCell.textContent.trim();
        const rowDate = parsePODate(dateText);
        if (rowDate) {
          const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
          const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          if (rowDateOnly < startOnly || rowDateOnly > endOnly) {
            shouldShow = false;
          }
        }
      }
    }
    
    row.style.display = shouldShow ? '' : 'none';
  });
  
  updatePOResultsCount();
}

// Parse PO date from table cell
function parsePODate(dateString) {
  if (!dateString) return null;
  
  // Try DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  return null;
}

// Filter Purchase Orders by Supplier
function filterPurchaseOrdersBySupplier(supplierId) {
  window.currentSupplierFilter = supplierId;
  
  const searchInput = document.getElementById('po-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeStatusOption = document.querySelector('#po-status-submenu .status-option-btn.active');
  const statusFilter = activeStatusOption ? activeStatusOption.getAttribute('data-status') : null;
  const finalStatus = statusFilter === 'all' ? null : statusFilter;
  
  filterPurchaseOrders(searchTerm, supplierId, finalStatus);
}

// Filter Purchase Orders
function filterPurchaseOrders(searchTerm = '', supplierId = null, status = null) {
  const rows = document.querySelectorAll('#po-table-body tr');
  rows.forEach(row => {
    if (row.classList.contains('no-data-message')) return;

    let shouldShow = true;
    const rowText = row.textContent.toLowerCase();

    // Search filter
    if (searchTerm && !rowText.includes(searchTerm.toLowerCase())) {
      shouldShow = false;
    }

    // Supplier filter
    if (supplierId && shouldShow) {
      const rowSupplierId = row.getAttribute('data-supplier-id');
      if (rowSupplierId && rowSupplierId !== supplierId) {
        shouldShow = false;
      }
    }

    // Status filter
    if (status && shouldShow) {
      const statusCell = row.querySelector('.status-badge');
      if (statusCell && !statusCell.textContent.toLowerCase().includes(status.toLowerCase())) {
        shouldShow = false;
      }
    }

    row.style.display = shouldShow ? '' : 'none';
  });
  
  // Update results count
  updatePOResultsCount();
  // Update active filters display
  updateActiveFiltersDisplay();
}

// Filter by supplier (already defined above, keeping for reference)

// Filter by status
function filterPurchaseOrdersByStatus(status) {
  window.currentStatusFilter = status;
  const searchTerm = document.getElementById('po-search-input')?.value || '';
  filterPurchaseOrders(searchTerm, window.currentSupplierFilter, status);
}

// Update Active Filters Display
function updateActiveFiltersDisplay() {
  const container = document.getElementById('active-filters-container');
  const chipsContainer = document.getElementById('active-filters-chips');
  if (!container || !chipsContainer) return;
  
  const activeFilters = [];
  
  // Check supplier filter
  const activeSupplierOption = document.querySelector('#supplier-submenu .supplier-option-btn.active');
  if (activeSupplierOption && activeSupplierOption.dataset.supplier !== 'all') {
    activeFilters.push({
      type: 'supplier',
      label: 'Supplier',
      value: activeSupplierOption.textContent.trim(),
      id: activeSupplierOption.dataset.supplier
    });
  }
  
  // Check status filter
  const activeStatusOption = document.querySelector('#po-status-submenu .status-option-btn.active');
  if (activeStatusOption && activeStatusOption.dataset.status !== 'all') {
    activeFilters.push({
      type: 'status',
      label: 'Status',
      value: activeStatusOption.textContent.trim(),
      id: activeStatusOption.dataset.status
    });
  }
  
  // Check date filter
  const startDate = document.getElementById('po-start-date-input')?.value;
  const endDate = document.getElementById('po-end-date-input')?.value;
  if (startDate || endDate) {
    const dateRange = [startDate, endDate].filter(Boolean).join(' - ');
    activeFilters.push({
      type: 'date',
      label: 'Date',
      value: dateRange,
      id: 'date'
    });
  }
  
  // Check search filter
  const searchInput = document.getElementById('po-search-input');
  if (searchInput && searchInput.value.trim()) {
    activeFilters.push({
      type: 'search',
      label: 'Search',
      value: searchInput.value.trim(),
      id: 'search'
    });
  }
  
  // Update display
  if (activeFilters.length > 0) {
    container.style.display = 'flex';
    chipsContainer.innerHTML = activeFilters.map(filter => `
      <div class="filter-chip" data-filter-type="${filter.type}" data-filter-id="${filter.id}">
        <span>${filter.label}: ${filter.value}</span>
        <span class="chip-remove" onclick="removeFilter('${filter.type}', '${filter.id}')">×</span>
      </div>
    `).join('');
  } else {
    container.style.display = 'none';
    chipsContainer.innerHTML = '';
  }
}

// Remove individual filter
window.removeFilter = function(type, id) {
  if (type === 'supplier') {
    const allOption = document.querySelector('#supplier-submenu .supplier-option-btn[data-supplier="all"]');
    if (allOption) allOption.click();
  } else if (type === 'status') {
    const allOption = document.querySelector('#po-status-submenu .status-option-btn[data-status="all"]');
    if (allOption) allOption.click();
  } else if (type === 'date') {
    const startInput = document.getElementById('po-start-date-input');
    const endInput = document.getElementById('po-end-date-input');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    filterPurchaseOrders();
  } else if (type === 'search') {
    const searchInput = document.getElementById('po-search-input');
    if (searchInput) {
      searchInput.value = '';
      filterPurchaseOrders();
    }
  }
  updateActiveFiltersDisplay();
};

// Clear all filters
function setupClearFilters() {
  const clearBtn = document.getElementById('clear-all-filters-btn');
  if (!clearBtn) return;
  
  clearBtn.addEventListener('click', function() {
    // Reset supplier filter
    const allSupplierOption = document.querySelector('#supplier-submenu .supplier-option-btn[data-supplier="all"]');
    if (allSupplierOption) allSupplierOption.click();
    
    // Reset status filter
    const allStatusOption = document.querySelector('#po-status-submenu .status-option-btn[data-status="all"]');
    if (allStatusOption) allStatusOption.click();
    
    // Reset date filter
    const startInput = document.getElementById('po-start-date-input');
    const endInput = document.getElementById('po-end-date-input');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    
    // Reset search
    const searchInput = document.getElementById('po-search-input');
    if (searchInput) searchInput.value = '';
    
    // Reset sort
    const sortSelect = document.getElementById('po-sort-select');
    if (sortSelect) sortSelect.value = 'date-desc';
    
    // Apply filters
    filterPurchaseOrders();
    updateActiveFiltersDisplay();
  });
}

// Update PO Results Count
function updatePOResultsCount() {
  const countElement = document.getElementById('po-results-count');
  if (!countElement) return;
  
  const visibleRows = document.querySelectorAll('#po-table-body tr:not(.no-data-message)').length;
  const totalRows = Array.from(document.querySelectorAll('#po-table-body tr:not(.no-data-message)')).filter(row => 
    row.style.display !== 'none'
  ).length;
  
  countElement.textContent = totalRows;
}

// Setup PO Table Sorting
function setupPOSorting() {
  const sortSelect = document.getElementById('po-sort-select');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', function() {
    const sortValue = this.value;
    sortPOTable(sortValue);
  });
  
  // Setup column header sorting
  const sortableHeaders = document.querySelectorAll('.po-table th.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortField = this.dataset.sort;
      const currentSort = this.classList.contains('sort-asc') ? 'asc' : 
                         this.classList.contains('sort-desc') ? 'desc' : null;
      
      // Remove sort classes from all headers
      sortableHeaders.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      // Apply new sort
      if (currentSort === 'asc') {
        this.classList.add('sort-desc');
        sortPOTableByField(sortField, 'desc');
      } else {
        this.classList.add('sort-asc');
        sortPOTableByField(sortField, 'asc');
      }
    });
  });
}

// Sort PO Table by dropdown value
function sortPOTable(sortValue) {
  const tbody = document.getElementById('po-table-body');
  if (!tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll('tr:not(.no-data-message)'));
  
  rows.sort((a, b) => {
    let aValue, bValue;
    
    switch(sortValue) {
      case 'date-desc':
        aValue = new Date(a.dataset.orderDate || 0);
        bValue = new Date(b.dataset.orderDate || 0);
        return bValue - aValue;
      case 'date-asc':
        aValue = new Date(a.dataset.orderDate || 0);
        bValue = new Date(b.dataset.orderDate || 0);
        return aValue - bValue;
      case 'amount-desc':
        aValue = parseFloat(a.dataset.totalAmount || 0);
        bValue = parseFloat(b.dataset.totalAmount || 0);
        return bValue - aValue;
      case 'amount-asc':
        aValue = parseFloat(a.dataset.totalAmount || 0);
        bValue = parseFloat(b.dataset.totalAmount || 0);
        return aValue - bValue;
      case 'supplier-asc':
        aValue = (a.dataset.supplierName || '').toLowerCase();
        bValue = (b.dataset.supplierName || '').toLowerCase();
        return aValue.localeCompare(bValue);
      case 'supplier-desc':
        aValue = (a.dataset.supplierName || '').toLowerCase();
        bValue = (b.dataset.supplierName || '').toLowerCase();
        return bValue.localeCompare(aValue);
      case 'status-asc':
        aValue = (a.dataset.status || '').toLowerCase();
        bValue = (b.dataset.status || '').toLowerCase();
        return aValue.localeCompare(bValue);
      case 'status-desc':
        aValue = (a.dataset.status || '').toLowerCase();
        bValue = (b.dataset.status || '').toLowerCase();
        return bValue.localeCompare(aValue);
      default:
        return 0;
    }
  });
  
  rows.forEach(row => tbody.appendChild(row));
}

// Sort PO Table by field
function sortPOTableByField(field, direction) {
  const tbody = document.getElementById('po-table-body');
  if (!tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll('tr:not(.no-data-message)'));
  
  rows.sort((a, b) => {
    let aValue, bValue;
    
    if (field === 'order_date' || field === 'expected_delivery_date') {
      aValue = new Date(a.dataset[field] || 0);
      bValue = new Date(b.dataset[field] || 0);
    } else if (field === 'total_amount') {
      aValue = parseFloat(a.dataset[field] || 0);
      bValue = parseFloat(b.dataset[field] || 0);
    } else {
      aValue = (a.dataset[field] || '').toLowerCase();
      bValue = (b.dataset[field] || '').toLowerCase();
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
  
  rows.forEach(row => tbody.appendChild(row));
}

// Show PO Details Popup
async function showPODetails(poId) {
  if (!poId) {
    alert('Purchase order ID is missing.');
    return;
  }

  // Check if this is a payment_pending PO - show payment popup instead
  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    const { data: poCheck } = await window.supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', poId)
      .single();

    if (poCheck && poCheck.status === 'payment_pending') {
      await showPaymentPopup(poId);
      return;
    }
  } catch (error) {
    console.error('Error checking PO status:', error);
  }

  const popup = document.getElementById('po-details-popup');
  const content = document.getElementById('po-details-content');
  const title = document.getElementById('po-details-title');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    // Fetch purchase order with related data
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier (
          id,
          company_name,
          user_code
        )
      `)
      .eq('id', poId)
      .single();
    
    // Ensure new fields exist (for backward compatibility)
    if (po) {
      po.finalized_at = po.finalized_at || null;
      po.rejection_reason = po.rejection_reason || null;
    }

    if (poError) {
      console.error('Error fetching PO:', poError);
      alert('Error loading purchase order: ' + poError.message);
      return;
    }

    if (!po) {
      alert('Purchase order not found.');
      return;
    }

    // Fetch purchase order items
    const { data: items, error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        *,
        product_variants (
          id,
          sku,
          size,
          color,
          variant_name,
          products (
            product_name,
            image_url
          )
        )
      `)
      .eq('purchase_order_id', poId);

    if (itemsError) {
      console.error('Error fetching PO items:', itemsError);
    }

    const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
    // Handle status display - check if it's a days format (e.g., "5 days") or delayed
    let status = po.status || 'draft';
    let statusDisplay = status.toUpperCase().replace(/_/g, ' ');
    
    // If status is in "X days" format, display it as is
    if (/^\d+\s+days$/.test(status)) {
      statusDisplay = status.toUpperCase();
    } else if (status === 'delayed') {
      statusDisplay = 'DELAYED';
    }
    
    // Determine status class - delayed and cancelled get red (inactive)
    const statusClass = po.status === 'completed' ? 'active' : 
                       (po.status === 'cancelled' || po.status === 'delayed') ? 'inactive' : 'active';
    
    // Check if user is staff/manager (not supplier)
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isStaff = userSession.role === 'staff' || userSession.role === 'manager';

    // Build PO details HTML
    let itemsHTML = '';
    if (items && items.length > 0) {
      itemsHTML = items.map(item => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
        
        const quantityOrdered = item.quantity_ordered || 0;
        const quantityReceived = item.quantity_received || 0;
        const isComplete = quantityReceived === quantityOrdered && quantityOrdered > 0;
        const isMissing = quantityReceived < quantityOrdered && quantityReceived > 0;
        const missingQty = quantityOrdered - quantityReceived;
        
        // Status indicator
        let statusIndicator = '';
        if (isComplete) {
          statusIndicator = '<span class="po-item-status po-item-complete" title="Item arrived correctly">✓</span>';
        } else if (isMissing) {
          statusIndicator = `<span class="po-item-status po-item-missing" title="Missing ${missingQty} items">✗ ${missingQty}</span>`;
        } else if (quantityReceived === 0 && quantityOrdered > 0) {
          statusIndicator = '<span class="po-item-status po-item-pending" title="Not yet received">○</span>';
        }
        
        return `
          <div class="po-detail-item">
            <div class="po-detail-item-image">
              <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
            </div>
            <div class="po-detail-item-info">
              <h4>${productName}</h4>
              <p class="po-detail-variant">${variantInfo}</p>
              <p class="po-detail-sku">SKU: ${variant?.sku || 'N/A'}</p>
            </div>
            <div class="po-detail-item-quantity">
              <p>Quantity: <strong>${quantityOrdered}</strong></p>
              <p>Received: <strong>${quantityReceived}</strong></p>
              ${statusIndicator}
            </div>
            <div class="po-detail-item-price">
              <p>Unit Cost: <strong>RM ${(item.unit_cost || 0).toFixed(2)}</strong></p>
              <p>Line Total: <strong>RM ${(item.line_total || 0).toFixed(2)}</strong></p>
            </div>
          </div>
        `;
      }).join('');
    } else {
      itemsHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No items in this purchase order</p>';
    }

    content.innerHTML = `
      <div class="po-details-info-section">
        <div class="po-details-row">
          <div class="po-details-field">
            <label>PO Number</label>
            <p>${po.po_number || 'N/A'}</p>
          </div>
          <div class="po-details-field">
            <label>Status</label>
            <p><span class="status-badge ${statusClass}">${statusDisplay}</span></p>
          </div>
        </div>
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Supplier</label>
            <p>${supplierName}</p>
          </div>
          <div class="po-details-field">
            <label>Order Date</label>
            <p>${po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Expected Delivery</label>
            <p>${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div class="po-details-field">
            <label>Created By</label>
            <p>${po.created_by ? po.created_by.substring(0, 8).toUpperCase() : 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div class="po-details-items-section">
        <h3 class="po-section-title">ITEMS</h3>
        <div class="po-details-items-list">
          ${itemsHTML}
        </div>
      </div>
      
      <div class="po-details-summary-section">
        <div class="po-details-summary-row">
          <span>Subtotal:</span>
          <strong>RM ${(po.subtotal || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row">
          <span>Tax:</span>
          <strong>RM ${(po.tax_amount || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row">
          <span>Discount:</span>
          <strong>RM ${(po.discount_amount || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row po-details-total">
          <span>Total Amount:</span>
          <strong>RM ${(po.total_amount || 0).toFixed(2)}</strong>
        </div>
      </div>
      
      ${parseDeliveryStatus(po.notes, po.expected_delivery_date, po.status)}
      
      ${po.notes ? `
      <div class="po-details-notes-section">
        <h3 class="po-section-title">NOTES</h3>
        <p>${po.notes}</p>
      </div>
      ` : ''}
      
      ${po.rejection_reason ? `
      <div class="po-details-rejection-section" style="background: #ffebee; border: 2px solid #FB5928; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
        <h3 class="po-section-title" style="color: #FB5928;">REJECTION REASON</h3>
        <p style="color: #c62828; font-weight: 500;">${po.rejection_reason}</p>
      </div>
      ` : ''}
      
      ${po.status === 'price_proposed' && isStaff ? `
      <div class="po-details-actions-section">
        <button type="button" class="po-view-invoice-btn" onclick="viewPriceProposalInvoice('${po.id}')">VIEW INVOICE</button>
        <p class="po-view-invoice-hint">Review supplier's price proposal</p>
      </div>
      ` : ''}
      
      ${po.status === 'out_for_delivery' && isStaff ? `
      <div class="po-details-actions-section">
        <div class="po-arrived-actions-buttons">
          <button type="button" class="po-complete-btn" onclick="completePurchaseOrder('${po.id}')">COMPLETE ORDER</button>
          <button type="button" class="po-missing-stock-btn" onclick="reportMissingStock('${po.id}')">MISSING STOCK</button>
        </div>
        <p class="po-complete-hint">Complete order to update stock quantities, or report missing/damaged stock</p>
      </div>
      ` : ''}
      
      ${po.status === 'draft' && !po.finalized_at ? `
      <div class="po-details-actions">
        <button type="button" class="po-delete-btn" onclick="deleteDraftPO('${po.id}')">DELETE</button>
      </div>
      ` : ''}
    `;

    if (title) {
      title.textContent = `PURCHASE ORDER: ${po.po_number || 'N/A'}`;
    }

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error viewing PO:', error);
    alert('Error viewing purchase order: ' + error.message);
  }
}

// Parse delivery status from notes
function parseDeliveryStatus(notes, expectedDeliveryDate, poStatus) {
  if (!notes) return '';
  
  // Extract delivery order information
  const doMatch = notes.match(/Delivery Order Generated: (DO-\d+-\d+)/);
  const trackingMatch = notes.match(/Tracking: ([^.]+)/);
  const carrierMatch = notes.match(/Carrier: ([^.]+)/);
  
  // Extract delivery status updates
  const statusUpdates = [];
  const statusRegex = /Delivery Status Update: ([^.]+\d+[^.]*|Out for delivery|Arrived|DELAYED[^.]*) on ([^.]+\d+[^.]*)/g;
  let match;
  while ((match = statusRegex.exec(notes)) !== null) {
    statusUpdates.push({
      status: match[1],
      date: match[2]
    });
  }
  
  // Extract delay reasons and days for delayed status
  const delayReasons = [];
  const delayRegex = /Delay Reason: ([^\n]+)/g;
  while ((match = delayRegex.exec(notes)) !== null) {
    delayReasons.push(match[1].trim());
  }
  
  // Extract days from delayed status update
  let delayedDays = null;
  if (poStatus === 'delayed') {
    const delayedStatusMatch = notes.match(/DELAYED - (\d+) days in transit/);
    if (delayedStatusMatch) {
      delayedDays = delayedStatusMatch[1];
    }
  }
  
  // Check if delivery is delayed
  let isDelayed = false;
  if (expectedDeliveryDate) {
    const expectedDate = new Date(expectedDeliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);
    isDelayed = today > expectedDate;
  }
  
  if (!doMatch && statusUpdates.length === 0) {
    return '';
  }
  
  let deliveryHTML = `
    <div class="po-details-delivery-section">
      <h3 class="po-section-title">DELIVERY STATUS</h3>
      <div class="po-notes-timeline">
  `;
  
  if (doMatch) {
    deliveryHTML += `
      <div class="po-note-card po-note-delivery-order">
        <div class="po-note-card-header">
          <div class="po-note-card-icon-wrapper po-note-icon-delivery">
            <span class="po-note-icon">📦</span>
          </div>
          <div class="po-note-card-title-group">
            <h4 class="po-note-card-title">Delivery Order</h4>
          </div>
        </div>
        <div class="po-note-card-body">
          <div class="po-note-info-row">
            <span class="po-note-label">DO Number:</span>
            <span class="po-note-value">${doMatch[1]}</span>
          </div>
          ${trackingMatch ? `
          <div class="po-note-info-row">
            <span class="po-note-label">Tracking:</span>
            <span class="po-note-value">${trackingMatch[1].trim()}</span>
          </div>
          ` : ''}
          ${carrierMatch ? `
          <div class="po-note-info-row">
            <span class="po-note-label">Carrier:</span>
            <span class="po-note-value">${carrierMatch[1].trim()}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  if (expectedDeliveryDate) {
    const expectedDate = new Date(expectedDeliveryDate);
    deliveryHTML += `
      <div class="po-note-card">
        <div class="po-note-card-header">
          <div class="po-note-card-icon-wrapper po-note-icon-status">
            <span class="po-note-icon">📅</span>
          </div>
          <div class="po-note-card-title-group">
            <h4 class="po-note-card-title">Expected Delivery</h4>
          </div>
        </div>
        <div class="po-note-card-body">
          <div class="po-note-info-row">
            <span class="po-note-label">Date:</span>
            <span class="po-note-value">${expectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            ${isDelayed ? `<span style="color: #FB5928; font-weight: 600; margin-left: auto;">⚠️ DELAYED</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  if (statusUpdates.length > 0) {
    statusUpdates.forEach(update => {
      const isDelayedUpdate = update.status.includes('DELAYED') || update.status.includes('Delayed');
      deliveryHTML += `
        <div class="po-note-card po-note-status-update ${isDelayedUpdate ? 'po-note-delayed' : ''}">
          <div class="po-note-card-header">
            <div class="po-note-card-icon-wrapper po-note-icon-status">
              <span class="po-note-icon">🚚</span>
            </div>
            <div class="po-note-card-title-group">
              <h4 class="po-note-card-title">${update.status}</h4>
              <span class="po-note-card-date">${update.date}</span>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // Show delayed status prominently if PO is delayed
  if (poStatus === 'delayed') {
    deliveryHTML += `
      <div class="po-note-card po-note-delayed">
        <div class="po-note-card-header">
          <div class="po-note-card-icon-wrapper po-note-icon-warning">
            <span class="po-note-icon">⚠️</span>
          </div>
          <div class="po-note-card-title-group">
            <h4 class="po-note-card-title">DELAYED DELIVERY</h4>
          </div>
        </div>
        <div class="po-note-card-body">
          ${delayedDays ? `
          <div class="po-note-info-row">
            <span class="po-note-label">Days in Transit:</span>
            <span class="po-note-value" style="color: #FB5928; font-weight: 600;">${delayedDays} days</span>
          </div>
          ` : ''}
          ${delayReasons.length > 0 ? `
          <div class="po-note-alert po-note-alert-delay">
            <span class="po-note-alert-icon">⚠️</span>
            <div class="po-note-alert-content">
              <strong>Delay Reason(s):</strong>
              ${delayReasons.map(reason => `<p>${reason}</p>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (delayReasons.length > 0) {
    deliveryHTML += `
      <div class="po-note-card po-note-missing-stock">
        <div class="po-note-card-header">
          <div class="po-note-card-icon-wrapper po-note-icon-warning">
            <span class="po-note-icon">⚠️</span>
          </div>
          <div class="po-note-card-title-group">
            <h4 class="po-note-card-title">Delay Reasons</h4>
          </div>
        </div>
        <div class="po-note-card-body">
          <div class="po-note-alert po-note-alert-warning">
            <span class="po-note-alert-icon">⚠️</span>
            <div class="po-note-alert-content">
              ${delayReasons.map(reason => `<p>${reason}</p>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  deliveryHTML += `</div></div>`;
  
  return deliveryHTML;
}

// Complete Purchase Order (Staff/Manager Only)
// Updates status to completed and adds stock quantities
window.completePurchaseOrder = async function(poId) {
  if (!confirm('Complete this purchase order? This will:\n- Mark the order as completed\n- Update stock quantities for all items\n- This action cannot be undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Check user is staff/manager
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (userSession.role !== 'staff' && userSession.role !== 'manager') {
      throw new Error('Only staff and managers can complete purchase orders.');
    }

    // Fetch PO with items
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          product_variant_id,
          quantity_ordered,
          quantity_received
        )
      `)
      .eq('id', poId)
      .in('status', ['out_for_delivery', 'arrived'])
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found or not in "out for delivery" status.');
    }

    if (!po.purchase_order_items || po.purchase_order_items.length === 0) {
      throw new Error('No items found in this purchase order.');
    }

    // Update stock quantities for each item
    for (const item of po.purchase_order_items) {
      const quantityToAdd = item.quantity_ordered - (item.quantity_received || 0);
      
      if (quantityToAdd > 0) {
        // Get current stock
        const { data: variant, error: variantError } = await window.supabase
          .from('product_variants')
          .select('current_stock')
          .eq('id', item.product_variant_id)
          .single();

        if (variantError) {
          console.error(`Error fetching variant ${item.product_variant_id}:`, variantError);
          continue;
        }

        const currentStock = variant?.current_stock || 0;
        const newStock = currentStock + quantityToAdd;

        // Update variant stock
        const { error: updateStockError } = await window.supabase
          .from('product_variants')
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_variant_id);

        if (updateStockError) {
          console.error(`Error updating stock for variant ${item.product_variant_id}:`, updateStockError);
          throw new Error(`Error updating stock: ${updateStockError.message}`);
        }

        // Update quantity_received in purchase_order_items
        const { error: updateItemError } = await window.supabase
          .from('purchase_order_items')
          .update({
            quantity_received: item.quantity_ordered,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateItemError) {
          console.error(`Error updating item ${item.id}:`, updateItemError);
        }
      }
    }

    // Update PO status to completed
    const { error: updatePOError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        notes: `${po.notes ? po.notes + '\n\n' : ''}COMPLETED: ${new Date().toLocaleString()} by ${userSession.userData?.email || 'Staff'}`
      })
      .eq('id', poId);

    if (updatePOError) {
      throw new Error('Error updating purchase order: ' + updatePOError.message);
    }

    alert('Purchase order completed successfully! Stock quantities have been updated.');
    
    // Refresh PO details and table
    await showPODetails(poId);
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error completing purchase order:', error);
    alert('Error completing purchase order: ' + error.message);
  }
};

// Report Missing Stock (for arrived POs) - Opens item verification popup
window.reportMissingStock = async function(poId) {
  if (!poId) {
    alert('Purchase order ID is missing.');
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Check user is staff/manager
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (userSession.role !== 'staff' && userSession.role !== 'manager') {
      throw new Error('Only staff and managers can verify received items.');
    }

    // Fetch PO with items
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          line_total,
          product_variants (
            id,
            sku,
            size,
            color,
            variant_name,
            products (
              product_name,
              image_url
            )
          )
        )
      `)
      .eq('id', poId)
      .in('status', ['out_for_delivery', 'arrived'])
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found or not in "out for delivery" status.');
    }

    // Show item verification popup
    showItemVerificationPopup(po);
  } catch (error) {
    console.error('Error opening item verification:', error);
    alert('Error: ' + error.message);
  }
};

// Show Item Verification Popup
function showItemVerificationPopup(po) {
  const popup = document.getElementById('item-verification-popup');
  const content = document.getElementById('item-verification-content');
  const title = document.getElementById('item-verification-title');
  
  if (!popup || !content) return;

  const items = po.purchase_order_items || [];
  
  // Build items HTML with checkboxes and quantity inputs
  let itemsHTML = '';
  if (items.length > 0) {
    itemsHTML = items.map((item, index) => {
      const variant = item.product_variants;
      const product = variant?.products;
      const productName = product?.product_name || 'N/A';
      const variantInfo = variant ? 
        `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
        'N/A';
      const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
      const quantityOrdered = item.quantity_ordered || 0;
      const quantityReceived = item.quantity_received || 0;
      const itemId = item.id;
      
      // Default: if quantity_received equals quantity_ordered, item is checked
      const isChecked = quantityReceived === quantityOrdered && quantityReceived > 0;
      
      return `
        <div class="po-verification-item" data-item-id="${itemId}">
          <div class="po-verification-item-header">
            <div class="po-verification-item-image">
              <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
            </div>
            <div class="po-verification-item-info">
              <h4>${productName}</h4>
              <p class="po-detail-variant">${variantInfo}</p>
              <p class="po-detail-sku">SKU: ${variant?.sku || 'N/A'}</p>
              <p class="po-verification-ordered">Ordered: <strong>${quantityOrdered}</strong></p>
            </div>
          </div>
          <div class="po-verification-item-controls">
            <label class="po-verification-checkbox-label">
              <input type="checkbox" class="po-verification-checkbox" data-item-id="${itemId}" ${isChecked ? 'checked' : ''} />
              <span>Item Arrived Correctly</span>
            </label>
            <div class="po-verification-quantity-group" style="display: ${isChecked ? 'none' : 'flex'};">
              <label for="received-qty-${itemId}">Received Quantity:</label>
              <input 
                type="number" 
                id="received-qty-${itemId}" 
                class="po-verification-qty-input" 
                data-item-id="${itemId}"
                min="0" 
                max="${quantityOrdered}" 
                value="${quantityReceived || 0}"
                placeholder="Enter received quantity"
              />
              <span class="po-verification-missing" id="missing-${itemId}" style="display: none;">
                Missing: <strong id="missing-amount-${itemId}">0</strong>
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    itemsHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No items in this purchase order</p>';
  }

  content.innerHTML = `
    <div class="po-details-info-section">
      <div class="po-details-row">
        <div class="po-details-field">
          <label>PO Number</label>
          <p>${po.po_number || 'N/A'}</p>
        </div>
        <div class="po-details-field">
          <label>Total Items</label>
          <p>${items.length}</p>
        </div>
      </div>
    </div>
    
    <div class="po-details-items-section" style="margin-top: 1rem;">
      <h3 class="po-section-title">VERIFY ITEMS</h3>
      <div class="po-verification-items-list">
        ${itemsHTML}
      </div>
    </div>
  `;

  if (title) {
    title.textContent = `VERIFY RECEIVED ITEMS: ${po.po_number || 'N/A'}`;
  }

  // Store PO ID for saving
  window.currentVerificationPOId = po.id;

  // Setup event listeners
  setupItemVerificationListeners();

  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Setup Item Verification Event Listeners
function setupItemVerificationListeners() {
  // Close button
  const closeBtn = document.getElementById('close-item-verification-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      document.getElementById('item-verification-popup').style.display = 'none';
      document.body.classList.remove('popup-open');
      document.body.style.overflow = '';
      window.currentVerificationPOId = null;
    };
  }

  // Checkbox change handlers
  const checkboxes = document.querySelectorAll('.po-verification-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const itemId = this.dataset.itemId;
      const quantityGroup = this.closest('.po-verification-item').querySelector('.po-verification-quantity-group');
      const qtyInput = document.getElementById(`received-qty-${itemId}`);
      const missingSpan = document.getElementById(`missing-${itemId}`);
      
      if (this.checked) {
        // Item arrived correctly - set received = ordered
        const item = this.closest('.po-verification-item');
        const orderedQty = parseInt(item.querySelector('.po-verification-ordered strong').textContent, 10);
        if (qtyInput) {
          qtyInput.value = orderedQty;
        }
        if (quantityGroup) quantityGroup.style.display = 'none';
        if (missingSpan) missingSpan.style.display = 'none';
      } else {
        // Item missing - show quantity input
        if (quantityGroup) quantityGroup.style.display = 'flex';
        updateMissingAmount(itemId);
      }
    });
  });

  // Quantity input change handlers
  const qtyInputs = document.querySelectorAll('.po-verification-qty-input');
  qtyInputs.forEach(input => {
    input.addEventListener('input', function() {
      const itemId = this.dataset.itemId;
      updateMissingAmount(itemId);
    });
  });

  // Save button
  const saveBtn = document.getElementById('save-item-verification-btn');
  if (saveBtn) {
    saveBtn.onclick = saveItemVerification;
  }
}

// Update missing amount display
function updateMissingAmount(itemId) {
  const item = document.querySelector(`[data-item-id="${itemId}"]`);
  if (!item) return;
  
  const orderedQty = parseInt(item.querySelector('.po-verification-ordered strong').textContent, 10);
  const qtyInput = document.getElementById(`received-qty-${itemId}`);
  const receivedQty = parseInt(qtyInput?.value || '0', 10);
  const missingQty = orderedQty - receivedQty;
  
  const missingSpan = document.getElementById(`missing-${itemId}`);
  const missingAmount = document.getElementById(`missing-amount-${itemId}`);
  
  if (missingSpan && missingAmount) {
    if (missingQty > 0) {
      missingSpan.style.display = 'inline';
      missingAmount.textContent = missingQty;
    } else {
      missingSpan.style.display = 'none';
    }
  }
}

// Save Item Verification
async function saveItemVerification() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveItemVerificationInternal(authenticatedUser);
      },
      'Saved item verification',
      'purchase_order',
      { action: 'save_item_verification', po_id: window.currentVerificationPOId }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save item verification (after authentication)
async function saveItemVerificationInternal(authenticatedUser) {
  const poId = window.currentVerificationPOId;
  if (!poId) {
    alert('Purchase order ID is missing.');
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Check user is staff/manager
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (userSession.role !== 'staff' && userSession.role !== 'manager') {
      throw new Error('Only staff and managers can verify received items.');
    }

    // Collect verification data
    const verificationItems = [];
    const items = document.querySelectorAll('.po-verification-item');
    let allComplete = true;
    let anyMissing = false;

    items.forEach(item => {
      const itemId = item.dataset.itemId;
      const checkbox = item.querySelector('.po-verification-checkbox');
      const qtyInput = document.getElementById(`received-qty-${itemId}`);
      const orderedQty = parseInt(item.querySelector('.po-verification-ordered strong').textContent, 10);
      const receivedQty = checkbox?.checked ? orderedQty : parseInt(qtyInput?.value || '0', 10);
      
      if (receivedQty < 0 || receivedQty > orderedQty) {
        throw new Error(`Invalid received quantity for item. Must be between 0 and ${orderedQty}.`);
      }

      verificationItems.push({
        itemId: itemId,
        quantityReceived: receivedQty,
        isComplete: receivedQty === orderedQty
      });

      if (receivedQty < orderedQty) {
        allComplete = false;
        anyMissing = true;
      }
    });

    // Update purchase_order_items
    for (const item of verificationItems) {
      const { error: updateError } = await window.supabase
        .from('purchase_order_items')
        .update({
          quantity_received: item.quantityReceived,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.itemId);

      if (updateError) {
        throw new Error(`Error updating item: ${updateError.message}`);
      }
    }

    // Update PO status
    // If items are verified but not all complete, set to partially_received
    // Otherwise keep current status (out_for_delivery) until user clicks COMPLETE ORDER
    let newStatus = null; // Don't change status, keep it as out_for_delivery
    if (anyMissing) {
      newStatus = 'partially_received';
    }
    // If all complete, keep status as out_for_delivery (user will complete via COMPLETE ORDER button)

    // Add verification notes
    const userEmail = userSession.userData?.email || userSession.email || 'Staff';
    const verificationNote = `ITEM VERIFICATION: ${new Date().toLocaleString()} by ${userEmail}\n` +
      verificationItems.map(item => {
        const itemElement = document.querySelector(`[data-item-id="${item.itemId}"]`);
        const productName = itemElement?.querySelector('h4')?.textContent || 'Item';
        const orderedQty = parseInt(itemElement?.querySelector('.po-verification-ordered strong')?.textContent || '0', 10);
        const status = item.isComplete ? '✓ Complete' : `✗ Missing ${orderedQty - item.quantityReceived}`;
        return `  ${productName}: ${item.quantityReceived}/${orderedQty} ${status}`;
      }).join('\n');

    // Fetch current PO to get notes
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    const updatedNotes = currentPO?.notes 
      ? `${currentPO.notes}\n\n${verificationNote}`
      : verificationNote;

    // Prepare update object - only include status if it should change
    const updateData = {
      notes: updatedNotes,
      updated_at: new Date().toISOString()
    };
    
    // Only update status if there are missing items (set to partially_received)
    // Otherwise keep current status (out_for_delivery) until user clicks COMPLETE ORDER
    if (newStatus) {
      updateData.status = newStatus;
    }

    const { error: poUpdateError } = await window.supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', poId);

    if (poUpdateError) {
      throw new Error(`Error updating purchase order: ${poUpdateError.message}`);
    }

    alert(`Item verification saved successfully! ${anyMissing ? 'Some items are missing. PO status updated to "Partially Received".' : 'All items verified. You can now complete the order.'}`);
    
    // Close popup and refresh
    document.getElementById('item-verification-popup').style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
    window.currentVerificationPOId = null;
    
    // Refresh PO details and list
    hidePODetailsPopup();
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error saving item verification:', error);
    alert('Error saving verification: ' + error.message);
  }
}

// View Price Proposal Invoice (Retailer/Manager)
window.viewPriceProposalInvoice = async function(poId) {
  // Close PO details popup first
  hidePODetailsPopup();
  
  const popup = document.getElementById('view-invoice-popup');
  const content = document.getElementById('view-invoice-content');
  const title = document.getElementById('view-invoice-title');
  
  if (!popup || !content) return;

  // Store the PO ID so we can reopen the details popup when closing invoice
  window.currentInvoicePOId = poId;

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Check user is staff/manager
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (userSession.role !== 'staff' && userSession.role !== 'manager') {
      throw new Error('Only staff and managers can view price proposals.');
    }

    // Fetch PO with items and proposals
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          unit_cost,
          line_total,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              id,
              product_name,
              image_url
            )
          )
        )
      `)
      .eq('id', poId)
      .eq('status', 'price_proposed')
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found or not in price_proposed status.');
    }

    // Fetch latest price proposals
    const proposalNumber = po.price_proposal_count || 1;
    const { data: proposals, error: proposalsError } = await window.supabase
      .from('po_price_proposals')
      .select('*')
      .eq('purchase_order_id', poId)
      .eq('proposal_number', proposalNumber)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
    }

    // Create proposal map
    const proposalMap = {};
    if (proposals) {
      proposals.forEach(p => {
        proposalMap[p.purchase_order_item_id] = p;
      });
    }

    // Build comparison view
    let itemsHTML = '';
    let originalTotal = 0;
    let proposedTotal = 0;

    if (po.purchase_order_items && po.purchase_order_items.length > 0) {
      itemsHTML = po.purchase_order_items.map((item, index) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
        
        const originalPrice = parseFloat(item.unit_cost) || 0;
        const originalLineTotal = parseFloat(item.line_total) || 0;
        
        const proposal = proposalMap[item.id];
        const proposedPrice = proposal ? parseFloat(proposal.proposed_unit_cost) : originalPrice;
        const proposedLineTotal = proposal ? parseFloat(proposal.proposed_line_total) : originalLineTotal;
        
        originalTotal += originalLineTotal;
        proposedTotal += proposedLineTotal;
        
        const priceChange = proposedPrice - originalPrice;
        const totalChange = proposedLineTotal - originalLineTotal;
        const priceChangePercent = originalPrice > 0 ? ((priceChange / originalPrice) * 100).toFixed(1) : 0;
        
        const isIncrease = priceChange > 0;
        const changeClass = isIncrease ? 'price-increase' : priceChange < 0 ? 'price-decrease' : 'price-no-change';

        return `
          <div class="invoice-comparison-item">
            <div class="invoice-item-header">
              <div class="invoice-item-image">
                <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
              </div>
              <div class="invoice-item-info">
                <h4>${productName}</h4>
                <p>${variantInfo}</p>
                <p>SKU: ${variant?.sku || 'N/A'}</p>
                <p>Quantity: ${item.quantity_ordered}</p>
              </div>
            </div>
            <div class="invoice-price-comparison">
              <div class="invoice-price-original">
                <label>Original Price</label>
                <p class="invoice-price-value">RM ${originalPrice.toFixed(2)}</p>
                <p class="invoice-price-total">Total: RM ${originalLineTotal.toFixed(2)}</p>
              </div>
              <div class="invoice-price-arrow">→</div>
              <div class="invoice-price-proposed">
                <label>Proposed Price</label>
                <p class="invoice-price-value ${changeClass}">RM ${proposedPrice.toFixed(2)}</p>
                <p class="invoice-price-total">Total: RM ${proposedLineTotal.toFixed(2)}</p>
                ${priceChange !== 0 ? `
                <p class="invoice-price-change ${changeClass}">
                  ${isIncrease ? '+' : ''}RM ${Math.abs(priceChange).toFixed(2)} (${isIncrease ? '+' : ''}${priceChangePercent}%)
                </p>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const totalDifference = proposedTotal - originalTotal;
    const totalDifferencePercent = originalTotal > 0 ? ((totalDifference / originalTotal) * 100).toFixed(1) : 0;
    const isTotalIncrease = totalDifference > 0;

    if (title) {
      title.textContent = `PRICE PROPOSAL INVOICE - Round ${proposalNumber}`;
    }

    content.innerHTML = `
      <div class="invoice-comparison-form">
        <div class="po-form-group">
          <label>PO Number: <strong>${po.po_number || 'N/A'}</strong></label>
          <label>Proposal Round: <strong>${proposalNumber}</strong></label>
          ${po.last_price_proposal_at ? `
          <label>Proposed On: <strong>${new Date(po.last_price_proposal_at).toLocaleString()}</strong></label>
          ` : ''}
        </div>
        <div class="invoice-items-list">
          ${itemsHTML}
        </div>
        <div class="invoice-summary-section">
          <div class="invoice-summary-row">
            <span>Original Total:</span>
            <strong>RM ${originalTotal.toFixed(2)}</strong>
          </div>
          <div class="invoice-summary-row">
            <span>Proposed Total:</span>
            <strong class="${isTotalIncrease ? 'price-increase' : totalDifference < 0 ? 'price-decrease' : ''}">RM ${proposedTotal.toFixed(2)}</strong>
          </div>
          <div class="invoice-summary-row invoice-difference ${isTotalIncrease ? 'price-increase' : totalDifference < 0 ? 'price-decrease' : ''}">
            <span>Total Difference:</span>
            <strong>${isTotalIncrease ? '+' : ''}RM ${Math.abs(totalDifference).toFixed(2)} (${isTotalIncrease ? '+' : ''}${totalDifferencePercent}%)</strong>
          </div>
        </div>
        ${po.price_proposal_notes ? `
        <div class="invoice-notes-section">
          <h3 class="po-section-title">Supplier Notes</h3>
          <p>${po.price_proposal_notes}</p>
        </div>
        ` : ''}
        <div class="invoice-actions-section">
          <button type="button" class="po-reject-btn" onclick="rejectPriceProposal('${poId}', ${proposalNumber})">REJECT PROPOSAL</button>
          <button type="button" class="po-accept-btn" onclick="acceptPriceProposal('${poId}', ${proposalNumber})">ACCEPT PROPOSAL</button>
        </div>
      </div>
    `;

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
    
    // Setup back button event listener (ensure it's attached when popup is shown)
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const closeViewInvoiceBtn = document.getElementById('close-view-invoice-btn');
      if (closeViewInvoiceBtn) {
        // Remove any existing listeners by cloning the button
        const newBtn = closeViewInvoiceBtn.cloneNode(true);
        closeViewInvoiceBtn.parentNode.replaceChild(newBtn, closeViewInvoiceBtn);
        
        // Add fresh event listener - handle clicks on button or image inside
        newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Close invoice button clicked'); // Debug log
          
          const invoicePopup = document.getElementById('view-invoice-popup');
          if (invoicePopup) {
            invoicePopup.style.display = 'none';
          }
          document.body.classList.remove('popup-open');
          document.body.style.overflow = '';
          
          // Reopen PO details popup if we have a stored PO ID
          if (window.currentInvoicePOId) {
            const poId = window.currentInvoicePOId;
            window.currentInvoicePOId = null; // Clear it
            showPODetails(poId);
          }
        });
        
        // Also handle clicks on the image inside the button
        const img = newBtn.querySelector('img');
        if (img) {
          img.style.pointerEvents = 'none'; // Ensure clicks pass through
        }
      }
    }, 50);
  } catch (error) {
    console.error('Error loading price proposal invoice:', error);
    alert('Error loading price proposal: ' + error.message);
  }
};

// Accept Price Proposal (Manager)
window.acceptPriceProposal = async function(poId, proposalNumber) {
  if (!confirm('Accept this price proposal? This will update all item prices and the order will be ready for supplier acceptance.')) {
    return;
  }

  // Require staff authentication before accepting
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await acceptPriceProposalInternal(authenticatedUser, poId, proposalNumber);
      },
      'Accepted price proposal',
      'purchase_order',
      { action: 'accept_price_proposal', po_id: poId, proposal_number: proposalNumber }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
};

// Internal function to accept price proposal (after authentication)
async function acceptPriceProposalInternal(authenticatedUser, poId, proposalNumber) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Fetch proposals
    const { data: proposals, error: proposalsError } = await window.supabase
      .from('po_price_proposals')
      .select('*')
      .eq('purchase_order_id', poId)
      .eq('proposal_number', proposalNumber)
      .eq('status', 'pending');

    if (proposalsError || !proposals || proposals.length === 0) {
      throw new Error('Price proposals not found.');
    }

    // Update purchase_order_items with proposed prices
    let newSubtotal = 0;
    for (const proposal of proposals) {
      const { error: updateItemError } = await window.supabase
        .from('purchase_order_items')
        .update({
          unit_cost: proposal.proposed_unit_cost,
          line_total: proposal.proposed_line_total,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.purchase_order_item_id);

      if (updateItemError) {
        throw new Error('Error updating item prices: ' + updateItemError.message);
      }

      newSubtotal += parseFloat(proposal.proposed_line_total);
    }

    // Update proposal status to accepted
    const { error: updateProposalsError } = await window.supabase
      .from('po_price_proposals')
      .update({
        status: 'accepted',
        reviewed_at: new Date().toISOString(),
        reviewed_by: authenticatedUser.id
      })
      .eq('purchase_order_id', poId)
      .eq('proposal_number', proposalNumber)
      .eq('status', 'pending');

    if (updateProposalsError) {
      console.error('Error updating proposal status:', updateProposalsError);
    }

    // Fetch current PO to get tax and discount
    const { data: currentPO, error: fetchPOError } = await window.supabase
      .from('purchase_orders')
      .select('tax_amount, discount_amount, notes')
      .eq('id', poId)
      .single();

    if (fetchPOError) {
      throw new Error('Error fetching purchase order: ' + fetchPOError.message);
    }

    // Update PO totals and status
    const taxAmount = parseFloat(currentPO?.tax_amount) || 0;
    const discountAmount = parseFloat(currentPO?.discount_amount) || 0;
    const newTotal = newSubtotal + taxAmount - discountAmount;

    const { error: updatePOError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'pending',
        subtotal: newSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString(),
        notes: `${currentPO?.notes ? currentPO.notes + '\n\n' : ''}PRICE PROPOSAL ACCEPTED: Round ${proposalNumber} on ${new Date().toLocaleString()} by ${authenticatedUser.username || authenticatedUser.email || 'Manager'}. Prices updated.`
      })
      .eq('id', poId);

    if (updatePOError) {
      throw new Error('Error updating purchase order: ' + updatePOError.message);
    }

    alert('Price proposal accepted! Prices have been updated. Order is now ready for supplier acceptance.');
    
    // Close popup and refresh
    document.getElementById('view-invoice-popup').style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
    window.currentInvoicePOId = null; // Clear stored PO ID
    await showPODetails(poId);
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error accepting price proposal:', error);
    alert('Error accepting price proposal: ' + error.message);
  }
};

// Reject Price Proposal (Manager)
window.rejectPriceProposal = async function(poId, proposalNumber) {
  const reason = prompt('Please provide a reason for rejecting this price proposal:');
  if (!reason || reason.trim() === '') {
    alert('Rejection reason is required.');
    return;
  }

  if (!confirm(`Reject this price proposal? The supplier can revise and resubmit.`)) {
    return;
  }

  // Require staff authentication before rejecting
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await rejectPriceProposalInternal(authenticatedUser, poId, proposalNumber, reason);
      },
      'Rejected price proposal',
      'purchase_order',
      { action: 'reject_price_proposal', po_id: poId, proposal_number: proposalNumber, reason: reason.trim() }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
};

// Internal function to reject price proposal (after authentication)
async function rejectPriceProposalInternal(authenticatedUser, poId, proposalNumber, reason) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Update proposal status to rejected
    const { error: updateProposalsError } = await window.supabase
      .from('po_price_proposals')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: authenticatedUser.id,
        review_notes: reason.trim()
      })
      .eq('purchase_order_id', poId)
      .eq('proposal_number', proposalNumber)
      .eq('status', 'pending');

    if (updateProposalsError) {
      throw new Error('Error updating proposal status: ' + updateProposalsError.message);
    }

    // Update PO status back to pending (supplier can revise)
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    const { error: updatePOError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
        notes: `${currentPO?.notes || ''}\n\nPRICE PROPOSAL REJECTED: Round ${proposalNumber} on ${new Date().toLocaleString()} by ${authenticatedUser.username || authenticatedUser.email || 'Manager'}. Reason: ${reason.trim()}. Supplier can revise and resubmit.`
      })
      .eq('id', poId);

    if (updatePOError) {
      throw new Error('Error updating purchase order: ' + updatePOError.message);
    }

    alert('Price proposal rejected. Supplier can revise and resubmit.');
    
    // Close popup and refresh
    document.getElementById('view-invoice-popup').style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
    window.currentInvoicePOId = null; // Clear stored PO ID
    await showPODetails(poId);
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error rejecting price proposal:', error);
    alert('Error rejecting price proposal: ' + error.message);
  }
};

// Manual Status Update (Option 3: Emergency Override)
window.showManualStatusUpdate = function(poId, currentStatus) {
  // Only allow specific transitions for emergency cases
  const allowedTransitions = {
    'processing': ['cancelled'],
    'partially_received': ['cancelled']
  };

  const transitions = allowedTransitions[currentStatus] || [];
  
  if (transitions.length === 0) {
    alert('Manual status update not available for this status.');
    return;
  }

  const newStatus = prompt(`Current status: ${currentStatus}\n\nAllowed transitions: ${transitions.join(', ')}\n\nEnter new status:`);
  
  if (!newStatus || !transitions.includes(newStatus.toLowerCase())) {
    alert(`Invalid status. Allowed: ${transitions.join(', ')}`);
    return;
  }

  const reason = prompt('Please provide a reason for this status change (required):');
  if (!reason || reason.trim() === '') {
    alert('Reason is required for manual status updates.');
    return;
  }

  if (!confirm(`Change status from "${currentStatus}" to "${newStatus}"?\n\nReason: ${reason}`)) {
    return;
  }

  updatePOStatusManually(poId, currentStatus, newStatus.toLowerCase(), reason);
};

// Update PO Status Manually (with restrictions)
async function updatePOStatusManually(poId, oldStatus, newStatus, reason) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Check user is staff/manager
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (userSession.role !== 'staff' && userSession.role !== 'manager') {
      throw new Error('Only staff and managers can manually update status.');
    }

    // Get current PO
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    // Update status with reason logged
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        notes: `${currentPO?.notes || ''}\n\nMANUAL STATUS UPDATE: ${oldStatus} → ${newStatus} on ${new Date().toLocaleString()} by ${userSession.userData?.email || 'Staff'}. Reason: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', oldStatus);

    if (error) {
      throw new Error('Error updating status: ' + error.message);
    }

    alert('Status updated successfully.');
    
    // Refresh
    await showPODetails(poId);
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating status: ' + error.message);
  }
}

// Hide PO Details Popup
function hidePODetailsPopup() {
  const popup = document.getElementById('po-details-popup');
  if (!popup) return;
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
}

// Show Payment Popup
async function showPaymentPopup(poId) {
  const popup = document.getElementById('payment-popup');
  const content = document.getElementById('payment-invoice-content');
  const title = document.getElementById('payment-title');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    // Fetch purchase order with related data
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier (
          id,
          company_name,
          user_code
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      alert('Error loading purchase order: ' + (poError?.message || 'Purchase order not found'));
      return;
    }

    // Fetch purchase order items
    const { data: items, error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        *,
        product_variants (
          id,
          sku,
          size,
          color,
          variant_name,
          products (
            product_name
          )
        )
      `)
      .eq('purchase_order_id', poId);

    if (itemsError) {
      console.error('Error fetching PO items:', itemsError);
    }

    const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
    const totalAmount = parseFloat(po.total_amount) || 0;
    const subtotal = parseFloat(po.subtotal) || 0;
    const taxAmount = parseFloat(po.tax_amount) || 0;
    const discountAmount = parseFloat(po.discount_amount) || 0;

    // Calculate payment due date (30 days from acceptance)
    const acceptedDate = new Date(po.updated_at || po.created_at);
    const paymentDueDate = new Date(acceptedDate);
    paymentDueDate.setDate(paymentDueDate.getDate() + 30);
    const daysRemaining = Math.ceil((paymentDueDate - new Date()) / (1000 * 60 * 60 * 24));

    // Build invoice HTML
    let itemsHTML = '';
    if (items && items.length > 0) {
      itemsHTML = items.map((item, index) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const quantity = item.quantity_ordered || 0;
        const unitCost = parseFloat(item.unit_cost) || 0;
        const lineTotal = parseFloat(item.line_total) || (quantity * unitCost);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${productName}<br><small style="color: #666;">${variantInfo}</small></td>
            <td style="text-align: center;">${quantity}</td>
            <td style="text-align: right;">RM ${unitCost.toFixed(2)}</td>
            <td style="text-align: right;">RM ${lineTotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    content.innerHTML = `
      <div class="po-details-info-section">
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Invoice Number</label>
            <p>INV-${po.po_number || 'N/A'}</p>
          </div>
          <div class="po-details-field">
            <label>PO Number</label>
            <p>${po.po_number || 'N/A'}</p>
          </div>
          <div class="po-details-field">
            <label>Date</label>
            <p>${new Date(po.order_date || po.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Supplier</label>
            <p>${supplierName}</p>
          </div>
          <div class="po-details-field">
            <label>Payment Due Date</label>
            <p style="color: ${daysRemaining <= 7 ? '#FB5928' : '#ff9800'}; font-weight: 600;">
              ${paymentDueDate.toLocaleDateString()} (${daysRemaining} days remaining)
            </p>
          </div>
        </div>
      </div>
      
      <div class="po-details-items-section" style="margin-top: 1.5rem;">
        <h3 class="po-section-title">INVOICE ITEMS</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
          <thead>
            <tr style="background: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
              <th style="padding: 0.75rem; text-align: left; font-weight: 600;">#</th>
              <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Product</th>
              <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Quantity</th>
              <th style="padding: 0.75rem; text-align: right; font-weight: 600;">Unit Price</th>
              <th style="padding: 0.75rem; text-align: right; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #e0e0e0;">
          <div style="display: flex; justify-content: flex-end;">
            <div style="min-width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                <span>Subtotal:</span>
                <strong>RM ${subtotal.toFixed(2)}</strong>
              </div>
              ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; color: #4caf50;">
                  <span>Discount:</span>
                  <strong>-RM ${discountAmount.toFixed(2)}</strong>
                </div>
              ` : ''}
              ${taxAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                  <span>Tax:</span>
                  <strong>RM ${taxAmount.toFixed(2)}</strong>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-top: 2px solid #1d1f2c; margin-top: 0.5rem;">
                <span style="font-size: 1.1rem; font-weight: 600;">Total Amount:</span>
                <strong style="font-size: 1.1rem; color: #1d1f2c;">RM ${totalAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (title) {
      title.textContent = `PAYMENT REQUIRED - ${po.po_number || 'N/A'}`;
    }

    // Store PO ID for payment
    window.currentPaymentPOId = poId;
    window.currentPaymentAmount = totalAmount;

    // Reset Pay Now button state (ensure it's visible and enabled)
    const payBtn = document.getElementById('pay-now-btn');
    if (payBtn) {
      payBtn.style.display = 'block';
      payBtn.disabled = false;
      payBtn.textContent = 'PAY NOW';
    }

    // Setup payment button
    setupPaymentButton(poId, totalAmount);

    // Setup PDF export
    const exportBtn = document.getElementById('export-payment-pdf-btn');
    if (exportBtn) {
      exportBtn.onclick = () => exportPaymentInvoicePDF(po, items, supplierName);
    }

    // Setup close button
    const closeBtn = document.getElementById('close-payment-btn');
    if (closeBtn) {
      closeBtn.onclick = hidePaymentPopup;
    }

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error showing payment popup:', error);
    alert('Error: ' + error.message);
  }
}

// Hide Payment Popup
function hidePaymentPopup() {
  const popup = document.getElementById('payment-popup');
  if (!popup) return;
  
  // Clear PayPal container
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) {
    paypalContainer.innerHTML = '';
    paypalContainer.style.display = 'none';
  }
  
  // Reset Pay Now button state when closing popup
  const payBtn = document.getElementById('pay-now-btn');
  if (payBtn) {
    payBtn.style.display = 'block';
    payBtn.disabled = false;
    payBtn.textContent = 'PAY NOW';
  }
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  window.currentPaymentPOId = null;
  window.currentPaymentAmount = null;
}

// Setup Payment Button with PayPal
function setupPaymentButton(poId, amount) {
  const payBtn = document.getElementById('pay-now-btn');
  const paypalContainer = document.getElementById('paypal-button-container');
  
  if (!payBtn || !paypalContainer) return;

  // Ensure Pay Now button is visible and reset
  payBtn.style.display = 'block';
  payBtn.disabled = false;
  payBtn.textContent = 'PAY NOW';

  // Clear previous PayPal buttons
  paypalContainer.innerHTML = '';
  paypalContainer.style.display = 'none';

  payBtn.onclick = async function() {
    payBtn.disabled = true;
    payBtn.textContent = 'LOADING...';

    try {
      // Initialize online banking payment interface
      initializePayPal(poId, amount, paypalContainer, payBtn);
    } catch (error) {
      console.error('Error setting up payment:', error);
      alert('Error setting up payment: ' + error.message);
      payBtn.disabled = false;
      payBtn.textContent = 'PAY NOW';
      payBtn.style.display = 'block'; // Ensure button is visible on error
    }
  };
}

  // Initialize Payment Gateway
function initializePayPal(poId, amount, container, payBtn) {
  // Hide the pay button and show payment container
  payBtn.style.display = 'none';
  container.style.display = 'block';

  // Start custom payment flow with bank selection
  setupCustomPaymentFlow(poId, amount, container, payBtn);
}

// Custom Payment Flow with Bank Selection, Account Number, and OTP
function setupCustomPaymentFlow(poId, amount, container, payBtn) {
  const paymentId = 'PAY' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  const refNo = poId;
  const amountFormatted = amount.toFixed(2);

  // Store payment data
  const paymentData = {
    poId: poId,
    paymentId: paymentId,
    refNo: refNo,
    amount: amount,
    timestamp: new Date().toISOString()
  };
  sessionStorage.setItem('pending_payment_' + paymentId, JSON.stringify(paymentData));

  // Malaysian banks list
  const banks = [
    { code: 'MBB', name: 'Maybank' },
    { code: 'CIMB', name: 'CIMB Bank' },
    { code: 'PBB', name: 'Public Bank' },
    { code: 'RHB', name: 'RHB Bank' },
    { code: 'HLB', name: 'Hong Leong Bank' },
    { code: 'AMB', name: 'AmBank' },
    { code: 'UOB', name: 'UOB Bank' },
    { code: 'OCBC', name: 'OCBC Bank' },
    { code: 'HSBC', name: 'HSBC Bank' },
    { code: 'SCB', name: 'Standard Chartered' }
  ];

  // Step 1: Bank Selection
  showBankSelectionStep(poId, amount, amountFormatted, paymentId, refNo, banks, container);
}

// Step 1: Bank Selection
function showBankSelectionStep(poId, amount, amountFormatted, paymentId, refNo, banks, container) {
  const banksHTML = banks.map(bank => 
    `<option value="${bank.code}">${bank.name}</option>`
  ).join('');

  container.innerHTML = `
    <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
      <h3 style="margin: 0 0 1rem 0; color: #1d1f2c;">Online Banking Payment</h3>
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding: 0.75rem; background: #fff; border-radius: 8px;">
          <span style="color: #666;">Amount to Pay:</span>
          <strong style="color: #1d1f2c; font-size: 1.2rem;">RM ${amountFormatted}</strong>
        </div>
        <div class="gateway-form-group" style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333;">Select Bank:</label>
          <select id="payment-bank-select" class="gateway-input" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
            <option value="">-- Select your bank --</option>
            ${banksHTML}
          </select>
        </div>
        <div class="gateway-form-group" style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333;">Account Number:</label>
          <input type="text" id="payment-account-number" class="gateway-input" placeholder="Enter your account number" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;" maxlength="20" />
          <small style="color: #666; font-size: 0.85rem; margin-top: 0.25rem; display: block;">Format: 10-16 digits (e.g., 1234567890)</small>
        </div>
      </div>
      <button type="button" class="gateway-submit-btn" id="proceed-to-otp-btn" style="width: 100%;">
        PROCEED TO PAYMENT
      </button>
    </div>
  `;

  const proceedBtn = document.getElementById('proceed-to-otp-btn');
  const bankSelect = document.getElementById('payment-bank-select');
  const accountInput = document.getElementById('payment-account-number');

  if (proceedBtn) {
    proceedBtn.onclick = async function() {
      const selectedBank = bankSelect?.value;
      const accountNumber = accountInput?.value.trim();

      if (!selectedBank) {
        alert('Please select a bank');
        return;
      }

      if (!accountNumber) {
        alert('Please enter your account number');
        return;
      }

      // Validate account number format (10-16 digits)
      if (!/^\d{10,16}$/.test(accountNumber)) {
        alert('Invalid account number format. Please enter 10-16 digits.');
        return;
      }

      // Proceed to OTP step
      await showOTPStep(poId, amount, amountFormatted, paymentId, refNo, selectedBank, accountNumber, banks, container);
    };
  }
}

// Generate 6-digit OTP (same as forgot password)
function generatePaymentOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString().padStart(6, '0');
}

// Send Payment OTP Email via Supabase Edge Function (same approach as forgot password)
async function sendPaymentOTPEmail(email, otp, amount, bankName) {
  try {
    // Check if Supabase client is available
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Try to send email via Edge Function (if available) with timeout
    let emailSent = false;
    try {
      // Create a timeout promise (20 seconds - SMTP can take time)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 20000);
      });

      // Race between the Edge Function call and timeout
      const edgeFunctionPromise = window.supabase.functions.invoke('send-payment-otp', {
        body: { email, otp, amount, bankName }
      });

      const result = await Promise.race([edgeFunctionPromise, timeoutPromise]);
      const { data: emailData, error: emailError } = result;

      if (emailError) {
        console.error('Edge Function error:', emailError);
        
        // Check if it's a network error or function not found
        if (emailError.message && (emailError.message.includes('Failed to fetch') || emailError.message.includes('not found'))) {
          console.log(`Edge Function not deployed. Payment OTP for ${email}: ${otp}`);
          return { success: false, devMode: true, otp: otp };
        } else {
          // Other error - might be SMTP configuration issue
          console.log(`Email sending failed. Payment OTP for ${email}: ${otp}`);
          console.error('Email error details:', emailError);
          return { success: false, devMode: true, otp: otp };
        }
      }

      if (emailData && emailData.success) {
        console.log('✅ Payment OTP email sent successfully via Edge Function to', email);
        emailSent = true;
        return { success: true };
      } else if (emailData && emailData.devMode) {
        // SMTP not configured - dev mode
        console.log(`[DEV MODE] Payment OTP for ${email}: ${emailData.otp || otp}`);
        return { success: false, devMode: true, otp: emailData.otp || otp };
      } else {
        console.log(`Email sending failed. Payment OTP for ${email}: ${otp}`);
        return { success: false, devMode: true, otp: otp };
      }
    } catch (timeoutError) {
      console.error('Edge Function timeout or error:', timeoutError);
      return { success: false, devMode: true, otp: otp };
    }
  } catch (error) {
    console.error('Error sending payment OTP email:', error);
    return { success: false, devMode: true, otp: otp };
  }
}

// Step 2: OTP Verification
async function showOTPStep(poId, amount, amountFormatted, paymentId, refNo, bankCode, accountNumber, banks, container) {
  const selectedBank = banks.find(b => b.code === bankCode);
  const bankName = selectedBank ? selectedBank.name : bankCode;
  
  // Get logged-in user's email
  const userData = sessionStorage.getItem('user');
  let userEmail = null;
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userEmail = user.email || (user.userData && user.userData.email);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (!userEmail) {
    alert('Unable to retrieve user email. Please log in again.');
    return;
  }
  
  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="processing-spinner" style="margin: 0 auto 2rem;"></div>
      <h3 style="color: #1d1f2c; margin-bottom: 0.5rem;">Sending OTP...</h3>
      <p style="color: #666;">Please wait while we send the OTP to your email.</p>
    </div>
  `;
  
  // Generate a 6-digit OTP (same as forgot password)
  const generatedOTP = generatePaymentOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

  // Store OTP in password_resets table (same as forgot password)
  let otpStored = false;
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: insertData, error: insertError } = await window.supabase
      .from('password_resets')
      .insert({
        email: userEmail,
        otp_code: generatedOTP,
        expires_at: expiresAt,
        used: false
      })
      .select();

    if (insertError) {
      console.error('Failed to store payment OTP:', insertError);
      alert('Failed to store OTP. Please try again.');
      return;
    }
    otpStored = true;
  } catch (error) {
    console.error('Error storing payment OTP:', error);
    alert('Failed to store OTP. Please try again.');
    return;
  }
  
  // Send OTP to user's email via Edge Function
  const emailResult = await sendPaymentOTPEmail(userEmail, generatedOTP, amountFormatted, bankName);
  const emailSent = emailResult && emailResult.success === true;
  
  // If email not sent, show OTP in UI for testing
  const showOTPForTesting = !emailSent;

  container.innerHTML = `
    <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
      <h3 style="margin: 0 0 1rem 0; color: #1d1f2c;">Verify Payment</h3>
      <div style="background: #fff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e0e0e0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #666;">Bank:</span>
          <strong style="color: #1d1f2c;">${bankName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #666;">Account:</span>
          <strong style="color: #1d1f2c;">${accountNumber.replace(/\d(?=\d{4})/g, '*')}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">Amount:</span>
          <strong style="color: #1d1f2c; font-size: 1.1rem;">RM ${amountFormatted}</strong>
        </div>
      </div>
      <div class="gateway-form-group" style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333;">Enter OTP Code:</label>
        <input type="text" id="payment-otp-input" class="gateway-input" placeholder="Enter 6-digit OTP" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; text-align: center; letter-spacing: 0.5em;" maxlength="6" />
        <small style="color: #666; font-size: 0.85rem; margin-top: 0.25rem; display: block; text-align: center;">
          ${emailSent ? `OTP has been sent to your registered email: <strong>${userEmail}</strong>` : `Email service not configured. OTP shown below for testing.`}
        </small>
        ${showOTPForTesting ? `
        <div style="background: #fff3cd; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; text-align: center; border: 1px solid #ffc107;">
          <small style="color: #856404; font-weight: 600; display: block; margin-bottom: 0.25rem;">⚠️ Testing Mode - Email Not Configured</small>
          <small style="color: #856404; font-size: 0.9rem;">Your OTP Code: <strong style="font-size: 1.1rem; letter-spacing: 0.2em;">${emailResult && emailResult.otp ? emailResult.otp : generatedOTP}</strong></small>
        </div>
        ` : ''}
        <div style="background: #e8f5e9; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; text-align: center; border: 1px solid #4caf50;">
          <small style="color: #2e7d32; font-weight: 500;">📧 ${emailSent ? 'Please check your email inbox for the OTP code' : 'Configure EmailJS in dashboard.js to enable email sending'}</small>
        </div>
        <div style="text-align: center; margin-top: 0.5rem;">
          <button type="button" id="resend-otp-btn" style="background: none; border: none; color: #7C79BE; text-decoration: underline; cursor: pointer; font-size: 0.85rem; padding: 0.25rem;">
            Resend OTP
          </button>
        </div>
      </div>
      <button type="button" class="gateway-submit-btn" id="verify-otp-btn" style="width: 100%;">
        VERIFY & PAY
      </button>
      <button type="button" class="po-complete-btn" id="back-to-bank-btn" style="width: 100%; margin-top: 0.5rem; background: #666; color: #fff;">
        BACK
      </button>
    </div>
  `;

  const verifyBtn = document.getElementById('verify-otp-btn');
  const otpInput = document.getElementById('payment-otp-input');
  const backBtn = document.getElementById('back-to-bank-btn');
  const resendBtn = document.getElementById('resend-otp-btn');

  // Resend OTP button
  if (resendBtn) {
    resendBtn.onclick = async function() {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
      
      try {
        // Generate new 6-digit OTP
        const newOTP = generatePaymentOTP();
        const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        // Store new OTP in database
        if (!window.supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { error: insertError } = await window.supabase
          .from('password_resets')
          .insert({
            email: userEmail,
            otp_code: newOTP,
            expires_at: newExpiresAt,
            used: false
          });

        if (insertError) {
          console.error('Failed to store new payment OTP:', insertError);
          alert('Failed to generate new OTP. Please try again.');
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend OTP';
          return;
        }
        
        // Resend email
        const emailResult = await sendPaymentOTPEmail(userEmail, newOTP, amountFormatted, bankName);
        
        if (emailResult && emailResult.success) {
          alert('OTP has been resent to your email.');
        } else {
          alert(`OTP Code: ${emailResult && emailResult.otp ? emailResult.otp : newOTP}\n\n⚠️ Email service not configured. OTP shown above.`);
        }
      } catch (error) {
        console.error('Error resending OTP:', error);
        alert('Failed to resend OTP. Please try again.');
      }
      
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend OTP';
    };
  }

  if (verifyBtn) {
    verifyBtn.onclick = async function() {
      const enteredOTP = otpInput?.value.trim();

      if (!enteredOTP) {
        alert('Please enter the OTP code');
        return;
      }

      if (enteredOTP.length !== 6 || !/^\d+$/.test(enteredOTP)) {
        alert('Please enter a valid 6-digit OTP code');
        return;
      }

      // Validate OTP from database (same as forgot password)
      try {
        if (!window.supabase) {
          throw new Error('Supabase client not initialized');
        }

        // Get latest unused OTP for this email
        const { data: otpRecords, error: fetchError } = await window.supabase
          .from('password_resets')
          .select('*')
          .eq('email', userEmail)
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('Error fetching OTP:', fetchError);
          alert('Error validating OTP. Please try again.');
          return;
        }

        if (!otpRecords || otpRecords.length === 0) {
          alert('No valid OTP found. Please request a new OTP.');
          otpInput.value = '';
          return;
        }

        const otpRecord = otpRecords[0];

        // Check if OTP is expired
        const now = new Date();
        const expiresAt = new Date(otpRecord.expires_at);
        if (expiresAt < now) {
          alert('OTP has expired. Please request a new OTP.');
          otpInput.value = '';
          return;
        }

        // Verify OTP matches
        if (enteredOTP !== otpRecord.otp_code) {
          alert('Invalid OTP code. Please try again.');
          otpInput.value = '';
          return;
        }

        // Mark OTP as used
        const { error: updateError } = await window.supabase
          .from('password_resets')
          .update({ used: true })
          .eq('id', otpRecord.id);

        if (updateError) {
          console.error('Error marking OTP as used:', updateError);
          // Continue anyway - OTP is valid
        }

        // OTP valid - process payment
        processPaymentSuccess(poId, amount, amountFormatted, paymentId, refNo, bankCode, accountNumber, container);
      } catch (error) {
        console.error('Error validating payment OTP:', error);
        alert('Error validating OTP. Please try again.');
      }
    };
  }

  if (backBtn) {
    backBtn.onclick = function() {
      showBankSelectionStep(poId, amount, amountFormatted, paymentId, refNo, banks, container);
    };
  }

  // Auto-focus OTP input
  if (otpInput) {
    setTimeout(() => otpInput.focus(), 100);
  }
}

// Process Payment Success
async function processPaymentSuccess(poId, amount, amountFormatted, paymentId, refNo, bankCode, accountNumber, container) {
  // Show processing
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="processing-spinner" style="margin: 0 auto 2rem;"></div>
      <h2 style="color: #1d1f2c; margin-bottom: 0.5rem;">Processing Payment...</h2>
      <p style="color: #666;">Please wait while we process your payment.</p>
    </div>
  `;

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Process payment
  const transId = 'TXN' + Date.now();
  
  // Simulate payment response
  simulatePaymentResponse(paymentId, refNo, amountFormatted, '1', transId);
}

// Simulate payment response
function simulatePaymentResponse(paymentId, refNo, amount, status, transId) {
  // Build response URL with parameters
  const params = new URLSearchParams({
    Status: status,
    PaymentId: paymentId,
    RefNo: refNo,
    Amount: amount,
    Currency: 'MYR',
    Signature: 'SIMULATED_SIGNATURE_' + Date.now(), // Simulated signature
    TransId: transId || ''
  });

  // Redirect to payment response page
  window.location.href = `payment-response.html?${params.toString()}`;
}

// Show Payment Gateway
function showPaymentGateway(poId, amount, bankCode, accountNumber, bankName) {
  const gatewayPopup = document.getElementById('payment-gateway-popup');
  const gatewayContent = document.getElementById('payment-gateway-content');
  const gatewayLogo = document.getElementById('payment-gateway-logo');
  const bankNameSpan = document.getElementById('payment-gateway-bank-name');
  
  if (!gatewayPopup || !gatewayContent) return;

  // Set bank name
  if (bankNameSpan) {
    bankNameSpan.textContent = bankName + ' Payment Gateway';
  }

  // Bank logos mapping
  const bankLogos = {
    'maybank': '🏦',
    'cimb': '🏛️',
    'public': '🏢',
    'rhb': '🏦',
    'hongleong': '🏛️',
    'ambank': '🏢'
  };

  // Set bank logo
  const logoPlaceholder = gatewayLogo?.querySelector('.bank-logo-placeholder');
  if (logoPlaceholder) {
    logoPlaceholder.textContent = bankLogos[bankCode] || '🏦';
  }

  // Build payment gateway content
  gatewayContent.innerHTML = `
    <div class="payment-gateway-step" id="payment-gateway-step-1">
      <div class="payment-gateway-info">
        <h2>Payment Details</h2>
        <div class="payment-gateway-details-grid">
          <div class="payment-detail-item">
            <span class="payment-detail-label">Merchant:</span>
            <span class="payment-detail-value">Sport Nexus</span>
          </div>
          <div class="payment-detail-item">
            <span class="payment-detail-label">Amount:</span>
            <span class="payment-detail-value amount-highlight">RM ${amount.toFixed(2)}</span>
          </div>
          <div class="payment-detail-item">
            <span class="payment-detail-label">Account:</span>
            <span class="payment-detail-value">${accountNumber.replace(/\d(?=\d{4})/g, '*')}</span>
          </div>
          <div class="payment-detail-item">
            <span class="payment-detail-label">Transaction ID:</span>
            <span class="payment-detail-value">TXN-${Date.now()}</span>
          </div>
        </div>
      </div>

      <div class="payment-gateway-form">
        <h3>Secure Login</h3>
        <div class="gateway-form-group">
          <label>Username / User ID</label>
          <input type="text" id="gateway-username" class="gateway-input" placeholder="Enter your username" />
        </div>
        <div class="gateway-form-group">
          <label>Password</label>
          <input type="password" id="gateway-password" class="gateway-input" placeholder="Enter your password" />
        </div>
        <div class="gateway-form-group">
          <label>Transaction PIN / TAC</label>
          <input type="password" id="gateway-pin" class="gateway-input" placeholder="Enter 6-digit PIN" maxlength="6" />
        </div>
        <button type="button" class="gateway-submit-btn" id="gateway-submit-btn">
          AUTHORIZE PAYMENT
        </button>
        <p class="gateway-security-note">
          🔒 Your payment is secured with SSL encryption
        </p>
      </div>
    </div>

    <div class="payment-gateway-step" id="payment-gateway-step-2" style="display: none;">
      <div class="payment-processing">
        <div class="processing-spinner"></div>
        <h2>Processing Payment...</h2>
        <p>Please wait while we process your payment. Do not close this window.</p>
      </div>
    </div>

    <div class="payment-gateway-step" id="payment-gateway-step-3" style="display: none;">
      <div class="payment-success">
        <div class="success-icon">✓</div>
        <h2>Payment Successful!</h2>
        <p>Your payment of <strong>RM ${amount.toFixed(2)}</strong> has been processed successfully.</p>
        <div class="payment-receipt">
          <div class="receipt-item">
            <span>Transaction ID:</span>
            <span id="receipt-txn-id">TXN-${Date.now()}</span>
          </div>
          <div class="receipt-item">
            <span>Date & Time:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div class="receipt-item">
            <span>Amount:</span>
            <span>RM ${amount.toFixed(2)}</span>
          </div>
        </div>
        <button type="button" class="gateway-submit-btn" id="gateway-close-btn" style="background: #4caf50;">
          RETURN TO MERCHANT
        </button>
      </div>
    </div>
  `;

  // Show popup
  gatewayPopup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';

  // Setup close button
  const closeBtn = document.getElementById('close-payment-gateway-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (confirm('Are you sure you want to cancel this payment?')) {
        hidePaymentGateway();
      }
    };
  }

  // Setup submit button
  const submitBtn = document.getElementById('gateway-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = async function() {
      const username = document.getElementById('gateway-username')?.value;
      const password = document.getElementById('gateway-password')?.value;
      const pin = document.getElementById('gateway-pin')?.value;

      if (!username || !password || !pin) {
        alert('Please fill in all fields');
        return;
      }

      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        alert('Please enter a valid 6-digit PIN');
        return;
      }

      // Show processing step
      document.getElementById('payment-gateway-step-1').style.display = 'none';
      document.getElementById('payment-gateway-step-2').style.display = 'block';

      // Simulate payment processing (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Show success step
      document.getElementById('payment-gateway-step-2').style.display = 'none';
      document.getElementById('payment-gateway-step-3').style.display = 'block';

      // Disable return button initially
      const returnBtn = document.getElementById('gateway-close-btn');
      if (returnBtn) {
        returnBtn.disabled = true;
        returnBtn.textContent = 'PROCESSING...';
      }

      // Process payment after a short delay
      setTimeout(async () => {
        const mockDetails = {
          id: 'ONLINE_BANKING_' + Date.now(),
          status: 'COMPLETED',
          payer: {
            name: { given_name: 'Online', surname: 'Banking' }
          },
          payment_method: 'Online Banking',
          bank: bankCode,
          account_number: accountNumber
        };

        await handlePaymentSuccess(poId, mockDetails);
        
        // Enable return button after payment is processed
        const returnBtnAfter = document.getElementById('gateway-close-btn');
        if (returnBtnAfter) {
          returnBtnAfter.disabled = false;
          returnBtnAfter.textContent = 'RETURN TO MERCHANT';
          returnBtnAfter.onclick = () => {
            hidePaymentGateway();
            hidePaymentPopup();
          };
        }
      }, 2000);
    };
  }
}

// Hide Payment Gateway
function hidePaymentGateway() {
  const gatewayPopup = document.getElementById('payment-gateway-popup');
  if (gatewayPopup) {
    gatewayPopup.style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
  }
  
  // Reset Pay Now button when payment gateway is closed/canceled
  const payBtn = document.getElementById('pay-now-btn');
  if (payBtn) {
    payBtn.style.display = 'block';
    payBtn.disabled = false;
    payBtn.textContent = 'PAY NOW';
  }
  
  // Hide PayPal container
  const paypalContainer = document.getElementById('paypal-button-container');
  if (paypalContainer) {
    paypalContainer.innerHTML = '';
    paypalContainer.style.display = 'none';
  }
}

// Handle Payment Success
async function handlePaymentSuccess(poId, paymentDetails) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available');
    }

    // Get current PO to preserve notes
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    // Update PO status from payment_pending to processing (directly start processing after payment)
    const { error: updateError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
        notes: `${currentPO?.notes || ''}\n\nPAYMENT COMPLETED: ${new Date().toLocaleString()}. Payment ID: ${paymentDetails.id}. Payment Method: Online Banking.`
      })
      .eq('id', poId)
      .eq('status', 'payment_pending');

    if (updateError) {
      throw new Error('Error updating purchase order: ' + updateError.message);
    }

    // Record payment in a payments table (if it exists) or in notes
    // For now, we'll store it in the PO notes and can create a payments table later

    alert('Payment successful! Purchase order status updated to PROCESSING. The order is now being processed.');
    
    // Close popup and refresh
    hidePaymentPopup();
    await loadPurchaseOrders();
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('Error processing payment: ' + error.message);
  }
}

// Export Payment Invoice PDF
function exportPaymentInvoicePDF(po, items, supplierName) {
  // This would use jsPDF to generate PDF
  // For now, we'll show an alert
  alert('PDF export functionality will be implemented. Invoice details:\n\n' +
        `PO: ${po.po_number}\n` +
        `Supplier: ${supplierName}\n` +
        `Amount: RM ${(parseFloat(po.total_amount) || 0).toFixed(2)}`);
}

// Show Manage PO Popup
async function showManagePOPopup() {
  const popup = document.getElementById('manage-po-popup');
  if (!popup) return;
  
  // Clear any current draft item (drafts are now auto-created in handleAddToDraft)
  window.currentDraftItem = null;
  
  // Set up tabs
  setupManagePOTabs();
  
  // Update badge counts
  await updatePOTabBadges();
  
  // Load default tab (draft)
  await loadDraftPOs('draft');
  
  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Hide Manage PO Popup
function hideManagePOPopup() {
  const popup = document.getElementById('manage-po-popup');
  if (!popup) return;
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
}

// Update PO Tab Badges
async function updatePOTabBadges() {
  const finalizedBadge = document.getElementById('finalized-badge');
  const rejectedBadge = document.getElementById('rejected-badge');
  
  if (!finalizedBadge || !rejectedBadge) return;
  
  try {
    if (!window.supabase) {
      return;
    }
    
    // Count finalized POs (have finalized_at but not rejected)
    const { count: finalizedCount, error: finalizedError } = await window.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .not('finalized_at', 'is', null)
      .is('rejection_reason', null);
    
    // Count rejected POs
    const { count: rejectedCount, error: rejectedError } = await window.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .not('rejection_reason', 'is', null);
    
    // Update finalized badge
    if (!finalizedError && finalizedCount !== null) {
      if (finalizedCount > 0) {
        finalizedBadge.textContent = finalizedCount;
        finalizedBadge.style.display = 'inline-flex';
      } else {
        finalizedBadge.style.display = 'none';
      }
    }
    
    // Update rejected badge
    if (!rejectedError && rejectedCount !== null) {
      if (rejectedCount > 0) {
        rejectedBadge.textContent = rejectedCount;
        rejectedBadge.style.display = 'inline-flex';
      } else {
        rejectedBadge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error updating PO tab badges:', error);
  }
}

// Set up Manage PO tabs (only once)
let managePOTabsSetup = false;
function setupManagePOTabs() {
  if (managePOTabsSetup) return; // Already set up
  
  const draftTab = document.getElementById('manage-po-tab-draft');
  const finalizedTab = document.getElementById('manage-po-tab-finalized');
  const rejectedTab = document.getElementById('manage-po-tab-rejected');
  const headerTitle = document.querySelector('#manage-po-popup .developer-page-title h1');
  
  if (!draftTab || !finalizedTab || !rejectedTab) return;
  
  managePOTabsSetup = true;
  
  // Draft tab click handler
  draftTab.addEventListener('click', async function() {
    draftTab.classList.add('active');
    finalizedTab.classList.remove('active');
    rejectedTab.classList.remove('active');
    
    if (headerTitle) {
      headerTitle.textContent = 'MANAGE PURCHASE ORDER';
    }
    
    await loadDraftPOs('draft');
    await updatePOTabBadges();
  });
  
  // Finalized tab click handler
  finalizedTab.addEventListener('click', async function() {
    finalizedTab.classList.add('active');
    draftTab.classList.remove('active');
    rejectedTab.classList.remove('active');
    
    if (headerTitle) {
      headerTitle.textContent = 'MANAGE PURCHASE ORDER - FINALIZED';
    }
    
    await loadDraftPOs('finalized');
    await updatePOTabBadges();
  });
  
  // Rejected tab click handler
  rejectedTab.addEventListener('click', async function() {
    rejectedTab.classList.add('active');
    draftTab.classList.remove('active');
    finalizedTab.classList.remove('active');
    
    if (headerTitle) {
      headerTitle.textContent = 'MANAGE PURCHASE ORDER - REJECTED';
    }
    
    await loadDraftPOs('rejected');
    await updatePOTabBadges();
  });
}

// Load Draft POs (Cart) - with tab filtering
async function loadDraftPOs(tabFilter = 'draft') {
  const container = document.getElementById('po-cart-container');
  if (!container) return;
  
  // Update section header and clear button visibility
  const sectionTitle = document.querySelector('.po-cart-header .po-section-title');
  const clearAllBtn = document.getElementById('po-clear-all-btn');
  
  if (sectionTitle) {
    if (tabFilter === 'finalized') {
      sectionTitle.textContent = 'FINALIZED PURCHASE ORDERS';
    } else if (tabFilter === 'rejected') {
      sectionTitle.textContent = 'REJECTED PURCHASE ORDERS';
    } else {
      sectionTitle.textContent = 'DRAFT PURCHASE ORDERS';
    }
  }
  
  // Only show CLEAR ALL button for draft tab
  if (clearAllBtn) {
    clearAllBtn.style.display = tabFilter === 'draft' ? 'block' : 'none';
  }

  try {
    if (!window.supabase) {
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Database connection not available</p>';
      return;
    }

    // Build query based on tab filter
    let query = window.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier (
          id,
          company_name,
          user_code
        )
      `)
      .eq('status', 'draft'); // Only fetch drafts

    // Apply additional filters based on tab
    if (tabFilter === 'finalized') {
      // Finalized drafts (have finalized_at but not rejected)
      query = query.not('finalized_at', 'is', null)
                    .is('rejection_reason', null);
    } else if (tabFilter === 'rejected') {
      // Rejected finalized drafts
      query = query.not('rejection_reason', 'is', null);
    } else {
      // Normal drafts (not finalized, not rejected)
      query = query.is('finalized_at', null)
                   .is('rejection_reason', null);
    }

    const { data: draftPOs, error } = await query.order('created_at', { ascending: false });
    
    // Ensure new fields exist (for backward compatibility)
    if (draftPOs) {
      draftPOs.forEach(po => {
        po.finalized_at = po.finalized_at || null;
        po.rejection_reason = po.rejection_reason || null;
      });
    }

    if (error) {
      console.error('Error loading draft POs:', error);
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Error loading draft purchase orders</p>';
      return;
    }

    // Hide summary and bulk approve button initially
    const summaryContainer = document.getElementById('po-cart-summary');
    const bulkApproveBtn = document.getElementById('po-bulk-approve-btn');
    if (summaryContainer) {
      summaryContainer.style.display = 'none';
    }
    if (bulkApproveBtn) {
      bulkApproveBtn.style.display = 'none';
    }

    // Set empty message based on tab
    let emptyMessage = '';
    if (tabFilter === 'finalized') {
      emptyMessage = '<p style="text-align: center; color: #999; padding: 2rem;">No finalized purchase orders.</p>';
    } else if (tabFilter === 'rejected') {
      emptyMessage = '<p style="text-align: center; color: #999; padding: 2rem;">No rejected purchase orders.</p>';
    } else {
      emptyMessage = '<p style="text-align: center; color: #999; padding: 2rem;">No draft purchase orders. Add items to create a purchase order.</p>';
    }

    if (!draftPOs || draftPOs.length === 0) {
      container.innerHTML = emptyMessage;
      return;
    }

    // Fetch items for each draft PO
    const poIds = draftPOs.map(po => po.id);
    const { data: allItems, error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        *,
        product_variants (
          id,
          sku,
          size,
          color,
          variant_name,
          products (
            product_name
          )
        )
      `)
      .in('purchase_order_id', poIds);

    if (itemsError) {
      console.error('Error loading PO items:', itemsError);
    }

    // Group items by PO
    const itemsByPO = {};
    if (allItems) {
      allItems.forEach(item => {
        if (!itemsByPO[item.purchase_order_id]) {
          itemsByPO[item.purchase_order_id] = [];
        }
        itemsByPO[item.purchase_order_id].push(item);
      });
    }

    // Group POs by supplier
    const groupedBySupplier = {};
    draftPOs.forEach(po => {
      const supplierId = po.supplier?.id || 'unknown';
      const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
      
      if (!groupedBySupplier[supplierId]) {
        groupedBySupplier[supplierId] = {
          supplierId: supplierId,
          supplierName: supplierName,
          pos: []
        };
      }
      
      const items = itemsByPO[po.id] || [];
      groupedBySupplier[supplierId].pos.push({
        ...po,
        items: items,
        itemsCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0)
      });
    });

    // Calculate summary statistics (only if we have draft POs)
    const totalPOs = draftPOs.length;
    const totalValue = draftPOs.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
    const totalItems = Object.values(itemsByPO).reduce((sum, items) => sum + items.length, 0);
    const totalQuantity = draftPOs.reduce((sum, po) => {
      const items = itemsByPO[po.id] || [];
      return sum + items.reduce((itemSum, item) => itemSum + (item.quantity_ordered || 0), 0);
    }, 0);

    // Display summary (only show if we have draft POs)
    if (summaryContainer && totalPOs > 0) {
      summaryContainer.style.display = 'block';
      
      // Set summary label based on tab
      let summaryLabel = 'Total Draft POs';
      if (tabFilter === 'finalized') {
        summaryLabel = 'Total Finalized POs';
      } else if (tabFilter === 'rejected') {
        summaryLabel = 'Total Rejected POs';
      }
      
      summaryContainer.innerHTML = `
        <div class="po-cart-summary-content">
          <div class="po-cart-summary-stats">
            <div class="po-cart-summary-stat">
              <div class="po-cart-summary-stat-label">${summaryLabel}</div>
              <div class="po-cart-summary-stat-value">${totalPOs}</div>
            </div>
            <div class="po-cart-summary-stat">
              <div class="po-cart-summary-stat-label">Total Items</div>
              <div class="po-cart-summary-stat-value">${totalItems}</div>
            </div>
            <div class="po-cart-summary-stat">
              <div class="po-cart-summary-stat-label">Total Quantity</div>
              <div class="po-cart-summary-stat-value">${totalQuantity}</div>
            </div>
            <div class="po-cart-summary-stat">
              <div class="po-cart-summary-stat-label">Total Value</div>
              <div class="po-cart-summary-stat-value">RM ${totalValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Display draft POs with new workflow
    let html = '';
    const hasCurrentItem = window.currentDraftItem !== null;
    const actionsBottom = document.getElementById('po-draft-actions-bottom');
    
    if (actionsBottom) {
      actionsBottom.style.display = hasCurrentItem ? 'flex' : 'none';
    }
    
    draftPOs.forEach(po => {
      const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
      const items = itemsByPO[po.id] || [];
      const itemsCount = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
      
      // Check if draft is finalized (has finalized_at timestamp)
      const isFinalized = po.finalized_at !== null;
      const isRejected = po.rejection_reason !== null;
      const rejectionReason = po.rejection_reason || '';
      
      // Determine button set based on state
      let buttonsHTML = '';
      if (isFinalized && !isRejected) {
        // Finalized - show VIEW, EDIT, APPROVE/REJECT (can edit before approval)
        buttonsHTML = `
          <button type="button" class="po-cart-view-btn" onclick="showPODetails('${po.id}')">VIEW</button>
          <button type="button" class="po-cart-edit-btn" onclick="editDraftPO('${po.id}')">EDIT</button>
          <button type="button" class="po-cart-approve-btn" onclick="approveFinalizedDraft('${po.id}')">APPROVE</button>
          <button type="button" class="po-cart-reject-btn" onclick="rejectFinalizedDraft('${po.id}')">REJECT</button>
        `;
      } else if (isRejected) {
        // Rejected - show VIEW and EDIT (allow editing after rejection)
        buttonsHTML = `
          <button type="button" class="po-cart-view-btn" onclick="showPODetails('${po.id}')">VIEW</button>
          <button type="button" class="po-cart-edit-btn" onclick="editDraftPO('${po.id}')">EDIT</button>
        `;
      } else {
        // Normal draft - show VIEW, EDIT, ADD, FINALIZE
        buttonsHTML = `
          <button type="button" class="po-cart-view-btn" onclick="showPODetails('${po.id}')">VIEW</button>
          <button type="button" class="po-cart-edit-btn" onclick="editDraftPO('${po.id}')">EDIT</button>
          ${hasCurrentItem ? `<button type="button" class="po-cart-add-btn" onclick="addItemToDraft('${po.id}')">ADD</button>` : ''}
          <button type="button" class="po-cart-finalize-btn" onclick="finalizeDraft('${po.id}')">FINALIZE</button>
        `;
      }
      
      const rejectedClass = isRejected ? 'po-draft-rejected' : '';
      
      html += `
        <div class="po-cart-item ${rejectedClass}" data-po-id="${po.id}" data-finalized="${isFinalized}" data-rejected="${isRejected}">
          <div class="po-cart-item-header">
            <div class="po-cart-item-info">
              <h3>${po.po_number || 'N/A'}</h3>
              <p>Supplier: ${supplierName}</p>
              <p>Items: ${itemsCount} | Total Qty: ${totalQuantity}</p>
              <p style="font-size: 0.85rem; color: #999;">Created: ${new Date(po.created_at).toLocaleDateString()}</p>
              ${isRejected ? `<p style="color: #FB5928; font-weight: 600; margin-top: 0.5rem;">REJECTED</p>` : ''}
              ${isFinalized && !isRejected ? `<p style="color: #4caf50; font-weight: 600; margin-top: 0.5rem;">FINALIZED - Awaiting Approval</p>` : ''}
            </div>
            <div class="po-cart-item-amount">
              <strong>RM ${(po.total_amount || 0).toFixed(2)}</strong>
            </div>
          </div>
          <div class="po-cart-item-actions">
            ${buttonsHTML}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading draft POs:', error);
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Error loading draft purchase orders</p>';
    }
  }
}

// Add Item to Existing Draft (helper function)
async function addItemToExistingDraft(poId, itemData) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get current draft
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', poId)
      .eq('status', 'draft')
      .single();

    if (poError || !po) {
      throw new Error('Draft not found or cannot be modified.');
    }

    // Check if draft is finalized
    if (po.finalized_at) {
      throw new Error('Cannot add items to a finalized draft.');
    }

    // Calculate new items
    let additionalSubtotal = 0;
    const newItems = itemData.variants.map(variant => {
      const lineTotal = variant.quantity * variant.unitCost;
      additionalSubtotal += lineTotal;
      return {
        purchase_order_id: poId,
        product_variant_id: variant.variantId,
        quantity_ordered: variant.quantity,
        unit_cost: variant.unitCost,
        line_total: lineTotal,
        notes: variant.notes || null,
        discount_percentage: 0
      };
    });

    // Insert new items
    const { error: itemError } = await window.supabase
      .from('purchase_order_items')
      .insert(newItems);

    if (itemError) {
      throw new Error('Error adding items: ' + itemError.message);
    }

    // Update PO totals
    const newSubtotal = (parseFloat(po.subtotal) || 0) + additionalSubtotal;
    const { data: updatedPO, error: updateError } = await window.supabase
      .from('purchase_orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newSubtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Error updating draft: ' + updateError.message);
    }

    return updatedPO;
  } catch (error) {
    console.error('Error adding item to existing draft:', error);
    throw error;
  }
}

// Create Draft with Item (auto-create when no drafts exist)
async function createDraftWithItem(itemData) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userId = userSession.id || userSession.userData?.id;

    // Calculate totals
    let subtotal = 0;
    const poItems = itemData.variants.map(variant => {
      const lineTotal = variant.quantity * variant.unitCost;
      subtotal += lineTotal;
      return {
        product_variant_id: variant.variantId,
        quantity_ordered: variant.quantity,
        unit_cost: variant.unitCost,
        line_total: lineTotal,
        notes: variant.notes || null,
        discount_percentage: 0
      };
    });

    // Calculate expected delivery date
    const orderDate = new Date();
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + itemData.leadTimeDays);

    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    // Create Purchase Order as Draft
    const { data: newPO, error: poError } = await window.supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: itemData.supplierId,
        order_date: orderDate.toISOString().split('T')[0],
        expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
        status: 'draft',
        subtotal: subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: subtotal,
        currency: 'MYR',
        notes: itemData.remarks || null,
        created_by: userId || null
      })
      .select()
      .single();

    if (poError) {
      throw new Error('Error creating draft: ' + poError.message);
    }

    // Create Purchase Order Items
    const poItemsWithPOId = poItems.map(item => ({
      ...item,
      purchase_order_id: newPO.id
    }));

    const { error: itemError } = await window.supabase
      .from('purchase_order_items')
      .insert(poItemsWithPOId);

    if (itemError) {
      throw new Error('Error creating draft items: ' + itemError.message);
    }

    return newPO;
  } catch (error) {
    console.error('Error creating draft with item:', error);
    throw error;
  }
}

// Add Item to Existing Draft
window.addItemToDraft = async function(poId) {
  if (!window.currentDraftItem) {
    alert('No item to add. Please select a product first.');
    return;
  }

  if (!confirm('Add this item to the selected draft?')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get current draft
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', poId)
      .eq('status', 'draft')
      .single();

    if (poError || !po) {
      throw new Error('Draft not found or cannot be modified.');
    }

    // Check if draft is finalized
    if (po.finalized_at) {
      alert('Cannot add items to a finalized draft.');
      return;
    }

    // Calculate new items
    let additionalSubtotal = 0;
    const newItems = window.currentDraftItem.variants.map(variant => {
      const lineTotal = variant.quantity * variant.unitCost;
      additionalSubtotal += lineTotal;
      return {
        purchase_order_id: poId,
        product_variant_id: variant.variantId,
        quantity_ordered: variant.quantity,
        unit_cost: variant.unitCost,
        line_total: lineTotal,
        notes: variant.notes || null,
        discount_percentage: 0
      };
    });

    // Insert new items
    const { error: itemError } = await window.supabase
      .from('purchase_order_items')
      .insert(newItems);

    if (itemError) {
      throw new Error('Error adding items: ' + itemError.message);
    }

    // Update PO totals
    const newSubtotal = (parseFloat(po.subtotal) || 0) + additionalSubtotal;
    const { error: updateError } = await window.supabase
      .from('purchase_orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newSubtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId);

    if (updateError) {
      throw new Error('Error updating draft: ' + updateError.message);
    }

    // Clear current item
    window.currentDraftItem = null;

    // Reload drafts
    await loadDraftPOs();
    alert('Item added to draft successfully!');
  } catch (error) {
    console.error('Error adding item to draft:', error);
    alert('Error: ' + error.message);
  }
};

// Finalize Draft
window.finalizeDraft = async function(poId) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Prompt for expected delivery date
    const expectedDeliveryDateStr = await window.customPrompt(
      'Please enter the expected delivery date (DD/MM/YYYY):',
      '',
      'ENTER EXPECTED DELIVERY DATE'
    );

    if (expectedDeliveryDateStr === null || expectedDeliveryDateStr.trim() === '') {
      // User cancelled or didn't enter date
      return;
    }

    // Parse the date (DD/MM/YYYY format)
    const dateParts = expectedDeliveryDateStr.trim().split('/');
    if (dateParts.length !== 3) {
      alert('Invalid date format. Please use DD/MM/YYYY format.');
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      alert('Invalid date. Please enter a valid date in DD/MM/YYYY format.');
      return;
    }

    const expectedDeliveryDate = new Date(year, month, day);
    if (expectedDeliveryDate.getDate() !== day || expectedDeliveryDate.getMonth() !== month || expectedDeliveryDate.getFullYear() !== year) {
      alert('Invalid date. Please enter a valid date.');
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectedDeliveryDate < today) {
      if (!await window.customConfirm('The expected delivery date is in the past. Do you want to continue?')) {
        return;
      }
    }

    // Only set finalized_at, keep status as 'draft' (database constraint doesn't allow 'finalized' status)
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        finalized_at: new Date().toISOString(),
        expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0], // Store as date only
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'draft');

    if (error) {
      throw new Error('Error finalizing draft: ' + error.message);
    }

    // Get current tab filter
    const activeTab = document.querySelector('#manage-po-tabs .edit-product-tab.active');
    const currentTab = activeTab ? activeTab.getAttribute('data-tab') : 'draft';
    
    await loadDraftPOs(currentTab);
    await updatePOTabBadges();
    alert('Draft finalized successfully! Awaiting manager approval.');
  } catch (error) {
    console.error('Error finalizing draft:', error);
    alert('Error: ' + error.message);
  }
};

// Approve Finalized Draft
window.approveFinalizedDraft = async function(poId) {
  if (!confirm('Approve and send this finalized draft to the supplier?')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Change status to 'pending' and clear finalized_at (since it's now approved)
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'pending',
        finalized_at: null, // Clear finalized_at since it's now approved
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'draft'); // Only approve drafts (with or without finalized_at)

    if (error) {
      throw new Error('Error approving draft: ' + error.message);
    }

    // Get current tab filter
    const activeTab = document.querySelector('#manage-po-tabs .edit-product-tab.active');
    const currentTab = activeTab ? activeTab.getAttribute('data-tab') : 'draft';
    
    await loadDraftPOs(currentTab);
    await updatePOTabBadges();
    await loadPurchaseOrders();
    updatePOBadge();
    alert('Draft approved and sent to supplier successfully!');
  } catch (error) {
    console.error('Error approving draft:', error);
    alert('Error: ' + error.message);
  }
};

// Reject Finalized Draft
window.rejectFinalizedDraft = async function(poId) {
  const rejectionReason = prompt('Please provide a reason for rejecting this draft:');
  if (!rejectionReason || rejectionReason.trim() === '') {
    alert('Rejection reason is required.');
    return;
  }

  if (!confirm('Reject this finalized draft? The draft will be marked as rejected.')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Keep status as 'draft', but set rejection_reason to mark it as rejected
    // Status remains 'draft' because database constraint doesn't allow 'rejected'
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        rejection_reason: rejectionReason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'draft'); // Only reject drafts

    if (error) {
      throw new Error('Error rejecting draft: ' + error.message);
    }

    // Get current tab filter
    const activeTab = document.querySelector('#manage-po-tabs .edit-product-tab.active');
    const currentTab = activeTab ? activeTab.getAttribute('data-tab') : 'draft';
    
    await loadDraftPOs(currentTab);
    await updatePOTabBadges();
    alert('Draft rejected successfully.');
  } catch (error) {
    console.error('Error rejecting draft:', error);
    alert('Error: ' + error.message);
  }
};

// Handle Create New Draft
async function handleCreateNewDraft() {
  if (!window.currentDraftItem) {
    alert('No item to add. Please select a product first.');
    return;
  }

  try {
    await createDraftWithItem(window.currentDraftItem);
    window.currentDraftItem = null;
    await loadDraftPOs();
    alert('New draft created successfully!');
  } catch (error) {
    console.error('Error creating new draft:', error);
    alert('Error creating draft: ' + error.message);
  }
}

// Handle Save Draft Changes
async function handleSaveDraftChanges() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await handleSaveDraftChangesInternal(authenticatedUser);
      },
      'Saved draft purchase order changes',
      'purchase_order',
      { action: 'save_draft_changes' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to handle save draft changes (after authentication)
async function handleSaveDraftChangesInternal(authenticatedUser) {
  // For now, just reload to ensure all changes are saved
  await loadDraftPOs();
  alert('All changes saved successfully!');
}

// Update PO Badge (count of draft POs)
async function updatePOBadge() {
  const badge = document.getElementById('po-pending-badge');
  if (!badge) return;

  try {
    if (!window.supabase) return;

    const { count, error } = await window.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    if (error) {
      console.error('Error counting draft POs:', error);
      return;
    }

    if (count && count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating PO badge:', error);
  }
}

// Update Bulk Approve Button
function updateBulkApproveButton() {
  const checkboxes = document.querySelectorAll('.po-cart-item-checkbox:checked');
  const bulkApproveBtn = document.getElementById('po-bulk-approve-btn');
  
  if (bulkApproveBtn) {
    const count = checkboxes.length;
    if (count > 0) {
      bulkApproveBtn.style.display = 'block';
      bulkApproveBtn.textContent = `APPROVE SELECTED (${count})`;
      bulkApproveBtn.disabled = false;
    } else {
      bulkApproveBtn.style.display = 'none';
    }
  }
}

// Setup Select All Checkbox
function setupSelectAllCheckbox() {
  // Add select all functionality to header if needed
  const cartHeader = document.querySelector('.po-cart-header');
  if (cartHeader && !document.getElementById('po-select-all-checkbox')) {
    const selectAllHtml = `
      <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
        <input type="checkbox" id="po-select-all-checkbox" onchange="toggleSelectAll(this.checked)">
        <span>Select All</span>
      </label>
    `;
    const actionsDiv = cartHeader.querySelector('.po-cart-actions');
    if (actionsDiv) {
      actionsDiv.insertAdjacentHTML('afterbegin', selectAllHtml);
    }
  }
}

// Toggle Select All
window.toggleSelectAll = function(checked) {
  const checkboxes = document.querySelectorAll('.po-cart-item-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
  updateBulkApproveButton();
};

// Handle Bulk Approve
async function handleBulkApprove() {
  const checkboxes = document.querySelectorAll('.po-cart-item-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-po-id'));
  
  if (selectedIds.length === 0) {
    alert('Please select at least one purchase order to approve.');
    return;
  }
  
  // Require staff authentication before approving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await handleBulkApproveInternal(authenticatedUser, selectedIds);
      },
      'Bulk approved purchase orders',
      'purchase_order',
      { action: 'bulk_approve', po_count: selectedIds.length, po_ids: selectedIds }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to handle bulk approve (after authentication)
async function handleBulkApproveInternal(authenticatedUser, selectedIds) {
  if (selectedIds.length === 0) {
    alert('Please select at least one purchase order to approve.');
    return;
  }
  
  if (!confirm(`Are you sure you want to approve and send ${selectedIds.length} purchase order(s)? This action cannot be undone.`)) {
    return;
  }
  
  const bulkApproveBtn = document.getElementById('po-bulk-approve-btn');
  if (bulkApproveBtn) {
    bulkApproveBtn.disabled = true;
    bulkApproveBtn.textContent = 'APPROVING...';
  }
  
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }
    
    // Update all selected POs to pending
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .in('id', selectedIds)
      .eq('status', 'draft'); // Only approve draft POs
    
    if (error) {
      throw new Error('Error approving POs: ' + error.message);
    }
    
    alert(`Successfully approved and sent ${selectedIds.length} purchase order(s)!`);
    
    // Refresh data
    loadPurchaseOrders();
    loadDraftPOs();
    updatePOBadge();
    hideManagePOPopup();
    
  } catch (error) {
    console.error('Error bulk approving POs:', error);
    alert('Error approving purchase orders: ' + error.message);
    if (bulkApproveBtn) {
      bulkApproveBtn.disabled = false;
      updateBulkApproveButton();
    }
  }
}

// Edit Draft PO
window.editDraftPO = async function(poId) {
  if (!poId) return;
  
  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }
    
    // Fetch PO with items
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier (
          id,
          company_name,
          user_code
        )
      `)
      .eq('id', poId)
      .eq('status', 'draft')
      .single();
    
    if (poError || !po) {
      throw new Error('Purchase order not found or cannot be edited.');
    }
    
    // Allow editing even if finalized (user can make changes before approval)
    
    // Fetch PO items with full variant and product info
    const { data: items, error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        *,
        product_variants (
          id,
          color,
          size,
          sku,
          cost_price,
          products (
            id,
            product_name,
            image_url
          )
        )
      `)
      .eq('purchase_order_id', poId);
    
    if (itemsError) {
      throw new Error('Error loading PO items: ' + itemsError.message);
    }
    
    if (!items || items.length === 0) {
      alert('No items found in this purchase order.');
      return;
    }
    
    // Show edit popup with all items
    showEditDraftPopup(po, items);
    
  } catch (error) {
    console.error('Error loading PO for editing:', error);
    alert('Error loading purchase order: ' + error.message);
  }
};

// Show Edit Draft Popup
function showEditDraftPopup(po, items) {
  const popup = document.getElementById('po-details-popup');
  const content = document.getElementById('po-details-content');
  const title = document.getElementById('po-details-title');
  
  if (!popup || !content) return;
  
  const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
  
    // Build editable items list
    let itemsHTML = '';
    items.forEach((item, index) => {
      const variant = item.product_variants;
      const product = variant?.products;
      const productName = product?.product_name || 'N/A';
      const variantInfo = variant ? 
        `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
        'N/A';
      const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
      const currentQtyInPieces = item.quantity_ordered || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      
      // Determine if quantity is divisible by 12 (could be bundles)
      // Default to pieces, but allow user to switch
      const isDivisibleBy12 = currentQtyInPieces % 12 === 0 && currentQtyInPieces > 0;
      const defaultUnit = isDivisibleBy12 ? 'bundle' : 'pieces';
      const displayQty = defaultUnit === 'bundle' ? currentQtyInPieces / 12 : currentQtyInPieces;
      
      const lineTotal = currentQtyInPieces * unitCost;
      
      itemsHTML += `
        <div class="po-edit-item" data-item-id="${item.id}" data-variant-id="${variant?.id}" data-original-qty-pieces="${currentQtyInPieces}">
          <div class="po-edit-item-header">
            <img src="${imageUrl}" alt="${productName}" class="po-edit-item-image" />
            <div class="po-edit-item-info">
              <h4>${productName}</h4>
              <p>${variantInfo}</p>
              <p style="font-size: 0.85rem; color: #666;">SKU: ${variant?.sku || 'N/A'} | Cost: RM ${unitCost.toFixed(2)} per piece</p>
            </div>
          </div>
          <div class="po-edit-item-controls">
            <label>Quantity:</label>
            <div class="po-edit-quantity-wrapper">
              <input type="number" 
                     class="po-edit-qty-input" 
                     data-item-id="${item.id}"
                     data-variant-id="${variant?.id}"
                     value="${displayQty}" 
                     min="1" 
                     step="1"
                     data-unit-cost="${unitCost}"
                     data-current-unit="${defaultUnit}"
                     style="width: 100px; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 6px; text-align: center;">
              <div class="po-edit-unit-toggle" style="display: flex; gap: 0.25rem; background: #f5f5f5; padding: 0.2rem; border-radius: 6px; margin-left: 0.5rem;">
                <button type="button" 
                        class="po-edit-unit-btn ${defaultUnit === 'pieces' ? 'active' : ''}" 
                        data-item-id="${item.id}"
                        data-unit="pieces"
                        data-variant-id="${variant?.id}"
                        style="padding: 0.4rem 0.75rem; border: none; border-radius: 4px; background: ${defaultUnit === 'pieces' ? '#9D5858' : 'transparent'}; color: ${defaultUnit === 'pieces' ? '#ffffff' : '#666'}; font-weight: 500; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
                  PIECES
                </button>
                <button type="button" 
                        class="po-edit-unit-btn ${defaultUnit === 'bundle' ? 'active' : ''}" 
                        data-item-id="${item.id}"
                        data-unit="bundle"
                        data-variant-id="${variant?.id}"
                        style="padding: 0.4rem 0.75rem; border: none; border-radius: 4px; background: ${defaultUnit === 'bundle' ? '#9D5858' : 'transparent'}; color: ${defaultUnit === 'bundle' ? '#ffffff' : '#666'}; font-weight: 500; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase;">
                  BUNDLE
                </button>
              </div>
              <span class="po-edit-unit-hint" style="font-size: 0.7rem; color: #999; font-style: italic; margin-left: 0.5rem;">1 bundle = 12 pieces</span>
            </div>
            <div class="po-edit-item-total">
              <strong>RM ${lineTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      `;
    });
  
  content.innerHTML = `
    <div class="po-details-info-section">
      <div class="po-details-row">
        <div class="po-details-field">
          <label>PO Number</label>
          <p>${po.po_number || 'N/A'}</p>
        </div>
        <div class="po-details-field">
          <label>Supplier</label>
          <p>${supplierName}</p>
        </div>
      </div>
      ${po.rejection_reason ? `
      <div class="po-details-rejection-section" style="background: #ffebee; border: 2px solid #FB5928; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
        <h3 class="po-section-title" style="color: #FB5928;">REJECTION REASON</h3>
        <p style="color: #c62828; font-weight: 500;">${po.rejection_reason}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="po-details-items-section">
      <h3 class="po-section-title">EDIT ITEMS & QUANTITIES</h3>
      <div class="po-edit-items-list">
        ${itemsHTML}
      </div>
    </div>
    
    <div class="po-details-notes-section">
      <label for="po-edit-remarks">Remarks:</label>
      <textarea id="po-edit-remarks" class="po-input po-textarea" rows="3" placeholder="Additional notes...">${po.notes || ''}</textarea>
    </div>
    
    <div class="po-details-actions">
      <button type="button" class="po-save-btn" onclick="saveDraftEdits('${po.id}')">SAVE CHANGES</button>
      <button type="button" class="po-delete-btn" onclick="deleteDraftPO('${po.id}')">DELETE DRAFT</button>
    </div>
  `;
  
  // Setup quantity change handlers to update totals
  const qtyInputs = content.querySelectorAll('.po-edit-qty-input');
  qtyInputs.forEach(input => {
    input.addEventListener('input', function() {
      updateItemTotal(this);
    });
  });
  
  // Setup unit toggle handlers
  const unitButtons = content.querySelectorAll('.po-edit-unit-btn');
  unitButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-item-id');
      const newUnit = this.getAttribute('data-unit');
      const itemDiv = this.closest('.po-edit-item');
      const qtyInput = itemDiv.querySelector('.po-edit-qty-input');
      const currentQty = parseFloat(qtyInput.value) || 0;
      const currentUnit = qtyInput.getAttribute('data-current-unit');
      
      // Convert quantity when switching units
      let newQty = currentQty;
      if (currentUnit === 'bundle' && newUnit === 'pieces') {
        // Convert bundle to pieces
        newQty = currentQty * 12;
      } else if (currentUnit === 'pieces' && newUnit === 'bundle') {
        // Convert pieces to bundle (round to nearest bundle)
        newQty = Math.round(currentQty / 12);
        if (newQty === 0 && currentQty > 0) newQty = 1; // At least 1 bundle
      }
      
      // Update input value
      qtyInput.value = newQty;
      qtyInput.setAttribute('data-current-unit', newUnit);
      
      // Update active button
      const itemButtons = itemDiv.querySelectorAll(`.po-edit-unit-btn[data-item-id="${itemId}"]`);
      itemButtons.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = '#666';
      });
      this.classList.add('active');
      this.style.background = '#9D5858';
      this.style.color = '#ffffff';
      
      // Update total
      updateItemTotal(qtyInput);
    });
  });
  
  if (title) {
    title.textContent = `EDIT DRAFT: ${po.po_number || 'N/A'}`;
  }
  
  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
}

// Update item total when quantity changes
function updateItemTotal(input) {
  const itemDiv = input.closest('.po-edit-item');
  const unitCost = parseFloat(input.getAttribute('data-unit-cost')) || 0;
  const quantity = parseFloat(input.value) || 0;
  const unit = input.getAttribute('data-current-unit') || 'pieces';
  
  // Convert to pieces for calculation
  const quantityInPieces = unit === 'bundle' ? quantity * 12 : quantity;
  const total = quantityInPieces * unitCost;
  
  const totalElement = itemDiv.querySelector('.po-edit-item-total strong');
  if (totalElement) {
    totalElement.textContent = `RM ${total.toFixed(2)}`;
  }
}

// Save Draft Edits
window.saveDraftEdits = async function(poId) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const content = document.getElementById('po-details-content');
    if (!content) return;
    
    // Collect all item edits
    const qtyInputs = content.querySelectorAll('.po-edit-qty-input');
    const itemUpdates = [];
    let newSubtotal = 0;
    
    for (const input of qtyInputs) {
      const itemId = input.getAttribute('data-item-id');
      const quantity = parseFloat(input.value) || 0;
      const unit = input.getAttribute('data-current-unit') || 'pieces';
      const unitCost = parseFloat(input.getAttribute('data-unit-cost')) || 0;
      
      if (quantity <= 0) {
        alert('All quantities must be greater than 0. Please remove items you don\'t want instead.');
        return;
      }
      
      // Convert to pieces for storage
      const quantityInPieces = unit === 'bundle' ? quantity * 12 : quantity;
      const lineTotal = quantityInPieces * unitCost;
      newSubtotal += lineTotal;
      
      itemUpdates.push({
        id: itemId,
        quantity: quantityInPieces, // Always store in pieces
        lineTotal: lineTotal
      });
    }
    
    if (itemUpdates.length === 0) {
      alert('At least one item must have a quantity greater than 0.');
      return;
    }
    
    // Get remarks
    const remarks = document.getElementById('po-edit-remarks')?.value || '';
    
    // Update all items
    for (const update of itemUpdates) {
      const { error } = await window.supabase
        .from('purchase_order_items')
        .update({
          quantity_ordered: update.quantity,
          line_total: update.lineTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);
      
      if (error) {
        throw new Error('Error updating item: ' + error.message);
      }
    }
    
    // Update PO totals and remarks
    const { error: poError } = await window.supabase
      .from('purchase_orders')
      .update({
        subtotal: newSubtotal,
        total_amount: newSubtotal,
        notes: remarks || null,
        updated_at: new Date().toISOString(),
        // Clear rejection reason if editing after rejection
        rejection_reason: null
      })
      .eq('id', poId);
    
    if (poError) {
      throw new Error('Error updating purchase order: ' + poError.message);
    }
    
    alert('Draft updated successfully!');
    
    // Refresh and close
    await loadDraftPOs();
    hidePODetailsPopup();
    
  } catch (error) {
    console.error('Error saving draft edits:', error);
    alert('Error saving changes: ' + error.message);
  }
};

// Handle Update Draft PO
async function handleUpdateDraftPO(poId) {
  // Similar to handleAddToCart but updates existing PO
  const addToCartBtn = document.getElementById('po-add-to-cart-btn');
  if (!addToCartBtn) return;
  
  // Validate inputs
  const supplierId = document.getElementById('po-supplier-select').value;
  const remarks = document.getElementById('po-remarks-textarea').value;
  
  if (!supplierId) {
    alert('Please select a supplier.');
    return;
  }
  
  // Collect selected variants with quantities
  const variantInputs = document.querySelectorAll('.po-variant-qty-input');
  const selectedVariants = [];
  
  variantInputs.forEach(input => {
    const quantity = parseInt(input.value) || 0;
    if (quantity > 0) {
      const variantId = input.getAttribute('data-variant-id');
      const unitBtn = document.querySelector(`.po-variant-unit-btn.active[data-variant-id="${variantId}"]`);
      const unit = unitBtn ? unitBtn.getAttribute('data-unit') : 'pieces';
      const quantityInPieces = unit === 'bundle' ? quantity * 12 : quantity;
      
      selectedVariants.push({
        variantId: variantId,
        quantity: quantityInPieces,
        color: input.getAttribute('data-variant-color'),
        size: input.getAttribute('data-variant-size')
      });
    }
  });
  
  if (selectedVariants.length === 0) {
    alert('Please select at least one variant and enter quantity.');
    return;
  }
  
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = 'UPDATING...';
  
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Get supplier info
    const { data: supplier } = await window.supabase
      .from('supplier')
      .select('lead_time_days')
      .eq('id', supplierId)
      .single();
    
    const orderDate = new Date();
    const leadTimeDays = supplier?.lead_time_days || 7;
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + leadTimeDays);
    
    // Fetch variant cost prices
    const variantIds = selectedVariants.map(v => v.variantId);
    const { data: variants } = await window.supabase
      .from('product_variants')
      .select('id, cost_price')
      .in('id', variantIds);
    
    // Calculate totals
    let subtotal = 0;
    const poItems = selectedVariants.map(selected => {
      const variant = variants.find(v => v.id === selected.variantId);
      const unitCost = parseFloat(variant?.cost_price) || 0;
      const lineTotal = selected.quantity * unitCost;
      subtotal += lineTotal;
      
      return {
        product_variant_id: selected.variantId,
        quantity_ordered: selected.quantity,
        unit_cost: unitCost,
        line_total: lineTotal,
        notes: `${selected.color} - ${selected.size}`,
        discount_percentage: 0
      };
    });
    
    // Delete old items
    await window.supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', poId);
    
    // Update PO
    const { error: poError } = await window.supabase
      .from('purchase_orders')
      .update({
        supplier_id: supplierId,
        expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
        subtotal: subtotal,
        total_amount: subtotal,
        notes: remarks || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'draft');
    
    if (poError) {
      throw new Error('Error updating purchase order: ' + poError.message);
    }
    
    // Insert new items
    const poItemsWithPOId = poItems.map(item => ({
      ...item,
      purchase_order_id: poId
    }));
    
    const { error: itemError } = await window.supabase
      .from('purchase_order_items')
      .insert(poItemsWithPOId);
    
    if (itemError) {
      throw new Error('Error updating purchase order items: ' + itemError.message);
    }
    
    // Success
    addToCartBtn.textContent = 'UPDATED!';
    addToCartBtn.style.background = '#4caf50';
    
    setTimeout(() => {
      hideAddPOPopup();
      loadPurchaseOrders();
      loadDraftPOs();
      updatePOBadge();
      
      // Reset button
      addToCartBtn.textContent = 'ADD TO CART';
      addToCartBtn.style.background = '#9D5858';
      addToCartBtn.disabled = false;
      addToCartBtn.onclick = handleAddToCart;
      window.editingPOId = null;
      window.editingPOItems = null;
      
      alert('Draft purchase order updated successfully!');
    }, 1500);
    
  } catch (error) {
    console.error('Error updating draft PO:', error);
    alert('Error updating purchase order: ' + error.message);
    addToCartBtn.disabled = false;
    addToCartBtn.textContent = 'UPDATE DRAFT';
    addToCartBtn.style.background = '#9D5858';
  }
}

// Approve and Send PO
window.approvePO = async function(poId) {
  if (!poId) return;
  
  if (!confirm('Are you sure you want to approve and send this purchase order? This action cannot be undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }

    // Update PO status to pending
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', poId);

    if (error) {
      throw new Error('Error approving PO: ' + error.message);
    }

    alert('Purchase order approved and sent successfully!');
    
    // Refresh data
    loadPurchaseOrders();
    loadDraftPOs();
    updatePOBadge();
    hidePODetailsPopup();
    hideManagePOPopup();
  } catch (error) {
    console.error('Error approving PO:', error);
    alert('Error approving purchase order: ' + error.message);
  }
};

// Delete Draft PO
window.deleteDraftPO = async function(poId) {
  if (!poId) return;
  
  if (!confirm('Are you sure you want to delete this draft purchase order? This action cannot be undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }

    // Delete PO items first (cascade should handle this, but being explicit)
    const { error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .delete()
      .eq('purchase_order_id', poId);

    if (itemsError) {
      console.error('Error deleting PO items:', itemsError);
    }

    // Delete PO
    const { error } = await window.supabase
      .from('purchase_orders')
      .delete()
      .eq('id', poId)
      .eq('status', 'draft'); // Only allow deletion of draft POs

    if (error) {
      throw new Error('Error deleting PO: ' + error.message);
    }

    alert('Draft purchase order deleted successfully!');
    
    // Refresh data
    loadPurchaseOrders();
    loadDraftPOs();
    updatePOBadge();
    hidePODetailsPopup();
  } catch (error) {
    console.error('Error deleting PO:', error);
    alert('Error deleting purchase order: ' + error.message);
  }
};

// Clear All Draft POs
async function clearAllDraftPOs() {
  if (!confirm('Are you sure you want to delete ALL draft purchase orders? This action cannot be undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }

    // Get all draft PO IDs
    const { data: draftPOs, error: fetchError } = await window.supabase
      .from('purchase_orders')
      .select('id')
      .eq('status', 'draft');

    if (fetchError) {
      throw new Error('Error fetching draft POs: ' + fetchError.message);
    }

    if (!draftPOs || draftPOs.length === 0) {
      alert('No draft purchase orders to delete.');
      return;
    }

    const poIds = draftPOs.map(po => po.id);

    // Delete all PO items
    const { error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .delete()
      .in('purchase_order_id', poIds);

    if (itemsError) {
      console.error('Error deleting PO items:', itemsError);
    }

    // Delete all draft POs
    const { error } = await window.supabase
      .from('purchase_orders')
      .delete()
      .eq('status', 'draft');

    if (error) {
      throw new Error('Error deleting draft POs: ' + error.message);
    }

    alert(`Successfully deleted ${draftPOs.length} draft purchase order(s).`);
    
    // Refresh data
    loadPurchaseOrders();
    loadDraftPOs();
    updatePOBadge();
  } catch (error) {
    console.error('Error clearing draft POs:', error);
    alert('Error clearing draft purchase orders: ' + error.message);
  }
}

// Edit PO - Redirects to view details (editing can be added later)
window.editPO = async function(poId) {
  // For now, just show details. Can be enhanced later for editing
  showPODetails(poId);
};

// Auto-initialize if on PO page
if (window.location.pathname.includes('new-po-page.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    initializePurchaseOrderPage();
  });
}

/* ============================================
   SUPPLIER PO MANAGEMENT PAGE FUNCTIONALITY
   ============================================ */

// Initialize Supplier PO Management Page
function initializeSupplierPOManagementPage() {
  setupSupplierNavigation();
  loadIncomingOrders();
  setupSupplierFilters();
  setupUploadDO();
  setupPriceManagement();
  // Run auto-cancel check on page load
  autoCancelUnpaidPOs();
  // Set up periodic auto-cancel check (every hour)
  setInterval(autoCancelUnpaidPOs, 60 * 60 * 1000);
}

// Setup Supplier Navigation
function setupSupplierNavigation() {
  const incomingBtn = document.getElementById('incoming-order-btn');
  const historyBtn = document.getElementById('history-btn');
  const paymentHistoryBtn = document.getElementById('payment-history-btn');

  if (incomingBtn) {
    incomingBtn.addEventListener('click', function(e) {
      e.preventDefault();
      switchSupplierView('incoming');
    });
  }

  if (historyBtn) {
    historyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      switchSupplierView('history');
    });
  }

  if (paymentHistoryBtn) {
    paymentHistoryBtn.addEventListener('click', function(e) {
      e.preventDefault();
      switchSupplierView('payments');
    });
  }
}

// Switch Supplier View
function switchSupplierView(view) {
  const incomingView = document.getElementById('incoming-order-view');
  const historyView = document.getElementById('history-view');
  const paymentHistoryView = document.getElementById('payment-history-view');
  const incomingBtn = document.getElementById('incoming-order-btn');
  const historyBtn = document.getElementById('history-btn');
  const paymentHistoryBtn = document.getElementById('payment-history-btn');

  // Hide all views
  if (incomingView) incomingView.style.display = 'none';
  if (historyView) historyView.style.display = 'none';
  if (paymentHistoryView) paymentHistoryView.style.display = 'none';

  // Remove active class from all buttons
  if (incomingBtn) incomingBtn.classList.remove('active');
  if (historyBtn) historyBtn.classList.remove('active');
  if (priceManagementBtn) priceManagementBtn.classList.remove('active');
  if (paymentHistoryBtn) paymentHistoryBtn.classList.remove('active');

  if (view === 'incoming') {
    if (incomingView) incomingView.style.display = 'block';
    if (incomingBtn) incomingBtn.classList.add('active');
    loadIncomingOrders();
  } else if (view === 'payments') {
    if (paymentHistoryView) paymentHistoryView.style.display = 'block';
    if (paymentHistoryBtn) paymentHistoryBtn.classList.add('active');
    loadPaymentHistory();
  } else {
    if (historyView) historyView.style.display = 'block';
    if (historyBtn) historyBtn.classList.add('active');
    loadPOHistory();
  }
}

// Load Incoming Orders
async function loadIncomingOrders() {
  const tbody = document.getElementById('incoming-orders-body');
  if (!tbody) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Supplier not found. Please log in again.</td></tr>';
      return;
    }

    // Get purchase orders for this supplier (exclude completed - those go to history only)
    // Priority order: processing/days (highest), pending (middle), partially_received (lowest)
    // Note: Days format statuses (e.g., "5 days") need to be fetched separately or included in filter
    const { data: purchaseOrders, error } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          product_variants (
            id,
            products (
              product_name
            )
          )
        )
      `)
      .eq('supplier_id', supplierId)
      .in('status', ['pending', 'payment_pending', 'price_proposed', 'processing', 'partially_received', 'arrived', 'out_for_delivery', 'delayed'])
      .order('created_at', { ascending: false });
    
    // Also fetch POs with days format status (e.g., "5 days", "10 days")
    // We'll need to fetch these separately since they don't match the IN clause
    let daysStatusPOs = [];
    if (!error) {
      const { data: daysPOs, error: daysError } = await window.supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            quantity_ordered,
            quantity_received,
            product_variants (
              id,
              products (
                product_name
              )
            )
          )
        `)
        .eq('supplier_id', supplierId)
        .like('status', '% days')
        .order('created_at', { ascending: false });
      
      if (!daysError && daysPOs) {
        daysStatusPOs = daysPOs;
      }
    }
    
    // Combine both results
    const allPOs = [...(purchaseOrders || []), ...daysStatusPOs];
    
    // Remove duplicates based on ID
    const uniquePOs = Array.from(new Map(allPOs.map(po => [po.id, po])).values());
    
    // Sort by priority: processing/days (highest), pending (middle), partially_received (lowest)
    if (uniquePOs && uniquePOs.length > 0) {
      const statusPriority = {
        'processing': 1,      // Highest priority
        'out_for_delivery': 1, // Same as processing (active delivery)
        'delayed': 1,        // High priority (needs attention)
        'payment_pending': 1.5, // High priority (needs payment)
        'pending': 2,          // Middle priority
        'price_proposed': 2,  // Same as pending
        'arrived': 2,         // Same as pending
        'partially_received': 3  // Lowest priority
      };
      
      uniquePOs.sort((a, b) => {
        // Check if status is days format
        const aIsDays = /^\d+\s+days$/i.test(a.status);
        const bIsDays = /^\d+\s+days$/i.test(b.status);
        
        const priorityA = aIsDays ? 1 : (statusPriority[a.status] || 999);
        const priorityB = bIsDays ? 1 : (statusPriority[b.status] || 999);
        
        // First sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority and both are days, sort by number of days (more days = lower priority)
        if (aIsDays && bIsDays) {
          const aDays = parseInt(a.status.match(/^\d+/)?.[0] || '0', 10);
          const bDays = parseInt(b.status.match(/^\d+/)?.[0] || '0', 10);
          return aDays - bDays; // Lower days first
        }
        
        // If same priority, sort by created_at (newest first)
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    }

    if (!uniquePOs || uniquePOs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">No incoming orders</td></tr>';
      return;
    }

    tbody.innerHTML = uniquePOs.map(po => {
      const items = po.purchase_order_items || [];
      const itemsCount = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
      const status = po.status || 'pending';
      // Determine status badge class
      let statusClass = 'active';
      if (status === 'delayed') {
        statusClass = 'inactive'; // Red background
      } else if (status === 'payment_pending') {
        statusClass = 'warning'; // Orange/Yellow for payment pending
      } else if (status === 'pending' || status === 'processing' || status === 'out_for_delivery') {
        statusClass = 'active';
      }
      // Handle days format status (e.g., "5 days") and delayed status
      let statusText = status.toUpperCase().replace(/_/g, ' ');
      if (/^\d+\s+days$/.test(status)) {
        statusText = status.toUpperCase();
      } else if (status === 'delayed') {
        statusText = 'DELAYED';
      }

      return `
        <tr class="supplier-po-table-row" 
            data-po-id="${po.id}" 
            data-status="${status}"
            style="cursor: pointer;">
          <td>${po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</td>
          <td>${po.po_number || 'N/A'}</td>
          <td>${itemsCount} item${itemsCount !== 1 ? 's' : ''}</td>
          <td>${totalQuantity}</td>
          <td>RM ${(po.total_amount || 0).toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `;
    }).join('');

    // Add click handlers to table rows
    const poRows = tbody.querySelectorAll('.supplier-po-table-row');
    poRows.forEach(row => {
      row.addEventListener('click', function(e) {
        // Don't trigger if clicking on status badge
        if (e.target.closest('.status-badge')) return;
        const poId = this.getAttribute('data-po-id');
        if (poId) {
          showSupplierPODetails(poId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading incoming orders:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading orders. Please refresh the page.</td></tr>';
    }
  }
}

// Store current PO data for PDF export
let currentPOData = null;

// Load PO History
async function loadPOHistory() {
  const tbody = document.getElementById('po-history-body');
  if (!tbody) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Supplier not found. Please log in again.</td></tr>';
      return;
    }

    // Get purchase orders for this supplier with status 'completed' or 'cancelled'
    const { data: purchaseOrders, error } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          product_variants (
            id,
            products (
              product_name
            )
          )
        )
      `)
      .eq('supplier_id', supplierId)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading PO history:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading history. Please try again.</td></tr>';
      return;
    }

    if (!purchaseOrders || purchaseOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No purchase order history</td></tr>';
      return;
    }

    tbody.innerHTML = purchaseOrders.map(po => {
      const items = po.purchase_order_items || [];
      const firstItem = items[0];
      const productName = firstItem?.product_variants?.products?.product_name || 'N/A';
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
      const status = po.status || 'pending';
      // Handle days format status (e.g., "5 days")
      let statusText = status.toUpperCase().replace(/_/g, ' ');
      if (/^\d+\s+days$/i.test(status)) {
        statusText = status.toUpperCase();
      }
      
      // Determine status badge class and color
      let statusClass = 'active';
      if (status === 'completed') {
        statusClass = 'active'; // Green
      } else if (status === 'cancelled') {
        statusClass = 'inactive'; // Red/Gray
      } else if (status === 'partially_received') {
        statusClass = 'warning'; // Orange/Yellow
      } else if (status === 'processing' || status === 'arrived' || /^\d+\s+days$/i.test(status)) {
        statusClass = 'processing'; // Blue
      } else if (status === 'pending' || status === 'price_proposed') {
        statusClass = 'pending'; // Yellow/Orange
      }
      
      // Get creator info from created_by UUID (first 8 chars) or show N/A
      const creatorId = po.created_by || '';
      const creatorName = creatorId ? creatorId.substring(0, 8).toUpperCase() : 'N/A';
      
      // Format order item: show first product name and total quantity if multiple items, or just product name
      const orderItemText = items.length > 1 
        ? `${productName} + ${items.length - 1} more`
        : productName;

      return `
        <tr class="supplier-po-history-row" 
            data-po-id="${po.id}" 
            data-status="${status}"
            style="cursor: pointer;">
          <td>${po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</td>
          <td>${creatorName}</td>
          <td>${orderItemText}</td>
          <td>RM ${(po.total_amount || 0).toFixed(2)}</td>
          <td>${po.po_number || 'N/A'}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
    
    // Add click handlers to history table rows
    const historyRows = tbody.querySelectorAll('.supplier-po-history-row');
    historyRows.forEach(row => {
      row.addEventListener('click', function(e) {
        // Don't trigger if clicking on status badge
        if (e.target.closest('.status-badge')) return;
        const poId = this.getAttribute('data-po-id');
        if (poId) {
          showSupplierPODetails(poId);
        }
      });
    });
  } catch (error) {
    console.error('Error loading PO history:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading history. Please refresh the page.</td></tr>';
    }
  }
}

// Load Payment History
async function loadPaymentHistory() {
  const tbody = document.getElementById('payment-history-body');
  if (!tbody) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Supplier not found. Please log in again.</td></tr>';
      return;
    }

    // Get purchase orders that have been paid (status changed from payment_pending to processing or later)
    // We'll check for POs that have payment information in notes
    // Query all POs for this supplier (excluding payment_pending since those haven't been paid yet)
    const { data: purchaseOrders, error } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .neq('status', 'payment_pending') // Exclude unpaid POs
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading payment history:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading payment history. Please try again.</td></tr>';
      return;
    }

    console.log('Payment History Debug:', {
      totalPOs: purchaseOrders?.length || 0,
      supplierId: supplierId
    });

    // Filter POs that have payment information (check notes for "PAYMENT COMPLETED")
    const paidPOs = (purchaseOrders || []).filter(po => {
      const notes = po.notes || '';
      const hasPayment = notes.includes('PAYMENT COMPLETED');
      if (hasPayment) {
        console.log('Found paid PO:', {
          po_number: po.po_number,
          status: po.status,
          hasPayment: true
        });
      }
      return hasPayment;
    });

    if (!paidPOs || paidPOs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No payment history</td></tr>';
      return;
    }

    tbody.innerHTML = paidPOs.map(po => {
      // Extract payment information from notes
      // Format 1: PAYMENT COMPLETED: [date]. Transaction ID: [id]. Payment Method: [method]. Amount: RM [amount].
      // Format 2: PAYMENT COMPLETED: [date]. Payment ID: [id]. Payment Method: [method].
      const notes = po.notes || '';
      let paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Transaction ID: ([^\.]+)\. Payment Method: ([^\.]+)\.(?: Amount: RM ([^\.]+)\.)?/);
      if (!paymentMatch) {
        // Try alternative format (from dashboard.js handlePaymentSuccess)
        paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Payment ID: ([^\.]+)\. Payment Method: ([^\.]+)/);
      }
      const paymentDate = paymentMatch ? paymentMatch[1] : new Date(po.updated_at).toLocaleString();
      const paymentId = paymentMatch ? paymentMatch[2] : 'N/A';
      const paymentMethod = paymentMatch ? paymentMatch[3] : 'Online Banking';
      
      const status = po.status || 'pending';
      let statusClass = 'active';
      if (status === 'completed') {
        statusClass = 'active';
      } else if (status === 'cancelled') {
        statusClass = 'inactive';
      } else {
        statusClass = 'pending';
      }

      return `
        <tr class="payment-history-row" onclick="showPaymentInvoice('${po.id}')" style="cursor: pointer;" title="Click to view invoice">
          <td>${new Date(po.order_date || po.created_at).toLocaleDateString()}</td>
          <td>${po.po_number || 'N/A'}</td>
          <td style="text-align: right;">RM ${(po.total_amount || 0).toFixed(2)}</td>
          <td>${paymentMethod}</td>
          <td><span class="status-badge ${statusClass}">PAID</span></td>
          <td>${paymentDate}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading payment history:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading payment history. Please refresh the page.</td></tr>';
    }
  }
}

// Show Payment Invoice (Receipt-style for paid POs)
window.showPaymentInvoice = async function(poId) {
  const popup = document.getElementById('payment-invoice-popup');
  const content = document.getElementById('payment-invoice-content');
  const title = document.getElementById('payment-invoice-title');
  
  if (!popup || !content) {
    console.error('Payment invoice popup elements not found');
    return;
  }

  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    // Fetch purchase order with related data
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier (
          id,
          company_name,
          user_code,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      alert('Error loading purchase order: ' + (poError?.message || 'Purchase order not found'));
      return;
    }

    // Fetch purchase order items
    const { data: items, error: itemsError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        *,
        product_variants (
          id,
          sku,
          size,
          color,
          variant_name,
          products (
            product_name
          )
        )
      `)
      .eq('purchase_order_id', poId);

    if (itemsError) {
      console.error('Error fetching PO items:', itemsError);
    }

    const supplierName = po.supplier?.company_name || po.supplier?.user_code || 'N/A';
    const supplierAddress = [
      po.supplier?.address_line1,
      po.supplier?.address_line2,
      po.supplier?.city,
      po.supplier?.state,
      po.supplier?.postal_code,
      po.supplier?.country
    ].filter(Boolean).join(', ') || 'N/A';

    const totalAmount = parseFloat(po.total_amount) || 0;
    const subtotal = parseFloat(po.subtotal) || 0;
    const taxAmount = parseFloat(po.tax_amount) || 0;
    const discountAmount = parseFloat(po.discount_amount) || 0;

    // Extract payment information from notes
    const notes = po.notes || '';
    let paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Transaction ID: ([^\.]+)\. Payment Method: ([^\.]+)\.(?: Amount: RM ([^\.]+)\.)?/);
    if (!paymentMatch) {
      paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Payment ID: ([^\.]+)\. Payment Method: ([^\.]+)/);
    }
    const paymentDate = paymentMatch ? paymentMatch[1] : new Date(po.updated_at).toLocaleString();
    const transactionId = paymentMatch ? paymentMatch[2] : 'N/A';
    const paymentMethod = paymentMatch ? paymentMatch[3] : 'Online Banking';

    // Build invoice items HTML
    let itemsHTML = '';
    if (items && items.length > 0) {
      itemsHTML = items.map((item, index) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const quantity = item.quantity_ordered || 0;
        const unitCost = parseFloat(item.unit_cost) || 0;
        const lineTotal = parseFloat(item.line_total) || (quantity * unitCost);

        return `
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">
              ${productName}<br>
              <small style="color: #666;">${variantInfo}</small>
            </td>
            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e0e0e0;">${quantity}</td>
            <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e0e0e0;">RM ${unitCost.toFixed(2)}</td>
            <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e0e0e0;">RM ${lineTotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    // Build receipt-style invoice HTML
    content.innerHTML = `
      <div style="background: #fff; padding: 2rem; border-radius: 8px; max-width: 700px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #9D5858; padding-bottom: 1rem;">
          <h2 style="color: #9D5858; margin: 0; font-size: 1.8rem;">SPORT NEXUS</h2>
          <p style="color: #666; margin: 0.5rem 0 0 0;">Payment Invoice / Receipt</p>
        </div>

        <!-- Invoice Details -->
        <div style="margin-bottom: 2rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Invoice Number</h3>
              <p style="margin: 0; color: #666;">INV-${po.po_number || 'N/A'}</p>
            </div>
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">PO Number</h3>
              <p style="margin: 0; color: #666;">${po.po_number || 'N/A'}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Invoice Date</h3>
              <p style="margin: 0; color: #666;">${new Date(po.order_date || po.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Payment Date</h3>
              <p style="margin: 0; color: #666;">${paymentDate}</p>
            </div>
          </div>
          <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Supplier</h3>
            <p style="margin: 0; color: #666;">${supplierName}</p>
            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">${supplierAddress}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #1d1f2c; margin: 0 0 1rem 0; font-size: 1rem;">Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #1d1f2c;">#</th>
                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #1d1f2c;">Product</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #1d1f2c;">Qty</th>
                <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #1d1f2c;">Unit Price</th>
                <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #1d1f2c;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: flex-end;">
            <div style="min-width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                <span style="color: #666;">Subtotal:</span>
                <strong style="color: #1d1f2c;">RM ${subtotal.toFixed(2)}</strong>
              </div>
              ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0; color: #4caf50;">
                  <span>Discount:</span>
                  <strong>-RM ${discountAmount.toFixed(2)}</strong>
                </div>
              ` : ''}
              ${taxAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                  <span style="color: #666;">Tax:</span>
                  <strong style="color: #1d1f2c;">RM ${taxAmount.toFixed(2)}</strong>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-top: 2px solid #9D5858; margin-top: 0.5rem;">
                <span style="font-size: 1.2rem; font-weight: 600; color: #1d1f2c;">Total Amount:</span>
                <strong style="font-size: 1.2rem; color: #9D5858;">RM ${totalAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h3 style="color: #1d1f2c; margin: 0 0 1rem 0; font-size: 1rem;">Payment Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <p style="margin: 0.25rem 0; color: #666;"><strong>Payment Method:</strong> ${paymentMethod}</p>
            </div>
            <div>
              <p style="margin: 0.25rem 0; color: #666;"><strong>Transaction ID:</strong> ${transactionId}</p>
            </div>
          </div>
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #4caf50; font-weight: 600; font-size: 1.1rem;">
              ✓ Payment Status: PAID
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 1.5rem; border-top: 1px solid #e0e0e0; color: #666; font-size: 0.85rem;">
          <p style="margin: 0;">Thank you for your business!</p>
          <p style="margin: 0.5rem 0 0 0;">This is an official payment receipt.</p>
        </div>
      </div>
    `;

    if (title) {
      title.textContent = `PAYMENT INVOICE - ${po.po_number || 'N/A'}`;
    }

    // Setup close button
    const closeBtn = document.getElementById('close-payment-invoice-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        popup.style.display = 'none';
        document.body.classList.remove('popup-open');
        document.body.style.overflow = '';
      };
    }

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error showing payment invoice:', error);
    alert('Error: ' + error.message);
  }
};

// Auto-cancel unpaid POs after 30 days
async function autoCancelUnpaidPOs() {
  try {
    if (!window.supabase) {
      return;
    }

    // Get all payment_pending POs
    const { data: unpaidPOs, error } = await window.supabase
      .from('purchase_orders')
      .select('id, updated_at, notes, po_number')
      .eq('status', 'payment_pending');

    if (error) {
      console.error('Error fetching unpaid POs:', error);
      return;
    }

    if (!unpaidPOs || unpaidPOs.length === 0) {
      return;
    }

    const now = new Date();
    const cancelledPOs = [];

    for (const po of unpaidPOs) {
      const updatedDate = new Date(po.updated_at || po.created_at);
      const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));

      if (daysSinceUpdate >= 30) {
        // Auto-cancel this PO
        const { error: cancelError } = await window.supabase
          .from('purchase_orders')
          .update({
            status: 'cancelled',
            updated_at: now.toISOString(),
            notes: `${po.notes || ''}\n\nAUTO-CANCELLED: Payment not received within 30 days. Cancelled on ${now.toLocaleString()}.`
          })
          .eq('id', po.id)
          .eq('status', 'payment_pending');

        if (!cancelError) {
          cancelledPOs.push(po.po_number || po.id);
        }
      }
    }

    if (cancelledPOs.length > 0) {
      console.log(`Auto-cancelled ${cancelledPOs.length} unpaid purchase orders:`, cancelledPOs);
    }
  } catch (error) {
    console.error('Error in auto-cancel unpaid POs:', error);
  }
}

// Setup Supplier Filters
function setupSupplierFilters() {
  // Status filter
  const statusBtn = document.getElementById('supplier-status-filter-btn');
  if (statusBtn) {
    statusBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isActive = this.classList.contains('active');
      if (isActive) {
        this.classList.remove('active');
        document.getElementById('supplier-status-submenu').classList.remove('show');
      } else {
        this.classList.add('active');
        document.getElementById('supplier-status-submenu').classList.add('show');
      }
    });

    const statusOptions = document.querySelectorAll('#supplier-status-submenu .status-option-btn');
    statusOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const status = this.dataset.status;
        filterIncomingOrdersByStatus(status === 'all' ? null : status);
        statusOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        statusBtn.classList.remove('active');
        document.getElementById('supplier-status-submenu').classList.remove('show');
      });
    });
  }
}

// Filter Incoming Orders by Status
function filterIncomingOrdersByStatus(status) {
  const rows = document.querySelectorAll('#incoming-orders-body tr');
  rows.forEach(row => {
    if (row.classList.contains('no-data-message')) return;

    if (!status) {
      row.style.display = '';
      return;
    }

    // Get status from data attribute (more reliable)
    const rowStatus = row.getAttribute('data-status') || '';
    const statusCell = row.cells[5]; // Status is in column 5 (0-indexed)
    
    if (statusCell || rowStatus) {
      const cellStatus = statusCell?.textContent.trim().toLowerCase().replace(' ', '_') || '';
      const matchStatus = status.toLowerCase();
      
      // Handle status mapping
      let shouldShow = false;
      if (matchStatus === 'shipped') {
        shouldShow = rowStatus === 'partially_received' || cellStatus === 'shipped';
      } else if (matchStatus === 'all') {
        shouldShow = true;
      } else {
        shouldShow = rowStatus === matchStatus || cellStatus === matchStatus;
      }
      
      row.style.display = shouldShow ? '' : 'none';
    }
  });
}

// Setup Upload DO
function setupUploadDO() {
  const closeBtn = document.getElementById('close-generate-do-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('generate-do-popup').style.display = 'none';
      document.body.classList.remove('popup-open');
      document.body.style.overflow = '';
      resetGenerateDOForm();
    });
  }

  // Close Propose Prices Popup
  const closeProposePricesBtn = document.getElementById('close-propose-prices-btn');
  if (closeProposePricesBtn) {
    closeProposePricesBtn.addEventListener('click', () => {
      document.getElementById('propose-prices-popup').style.display = 'none';
      document.body.classList.remove('popup-open');
      document.body.style.overflow = '';
    });
  }

  // Close View Invoice Popup (Retailer) - Use event delegation to ensure it works
  // This will be set up when the popup is shown, but we also set it up here as a fallback
  document.addEventListener('click', function(e) {
    if (e.target.closest('#close-view-invoice-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const invoicePopup = document.getElementById('view-invoice-popup');
      if (invoicePopup) {
        invoicePopup.style.display = 'none';
      }
      document.body.classList.remove('popup-open');
      document.body.style.overflow = '';
      
      // Reopen PO details popup if we have a stored PO ID
      if (window.currentInvoicePOId) {
        const poId = window.currentInvoicePOId;
        window.currentInvoicePOId = null; // Clear it
        showPODetails(poId);
      }
    }
  });

  const submitBtn = document.getElementById('submit-generate-do-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleGenerateDO);
  }

  // Close Supplier PO Details Popup
  const closeSupplierPODetailsBtn = document.getElementById('close-supplier-po-details-btn');
  if (closeSupplierPODetailsBtn) {
    closeSupplierPODetailsBtn.addEventListener('click', hideSupplierPODetails);
  }
  
  // Setup export PDF button
  const exportPdfBtn = document.getElementById('export-po-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportPOToPDF);
  }
}

// Show Supplier PO Details
async function showSupplierPODetails(poId) {
  const popup = document.getElementById('supplier-po-details-popup');
  const content = document.getElementById('supplier-po-details-content');
  const title = document.getElementById('supplier-po-details-title');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }

    // Fetch PO with full details
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          line_total,
          product_variants (
            id,
            color,
            size,
            sku,
            products (
              id,
              product_name,
              image_url
            )
          )
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found.');
    }

    // Store PO data for PDF export
    currentPOData = po;

    const status = po.status || 'pending';
    const statusClass = status === 'pending' ? 'active' : status === 'processing' ? 'active' : 'active';
    const statusText = status.toUpperCase().replace(/_/g, ' ');

    // Build items HTML
    let itemsHTML = '';
    if (po.purchase_order_items && po.purchase_order_items.length > 0) {
      itemsHTML = po.purchase_order_items.map(item => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
        
        return `
          <div class="po-detail-item">
            <div class="po-detail-item-image">
              <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
            </div>
            <div class="po-detail-item-info">
              <h4>${productName}</h4>
              <p class="po-detail-variant">${variantInfo}</p>
              <p class="po-detail-sku">SKU: ${variant?.sku || 'N/A'}</p>
            </div>
            <div class="po-detail-item-quantity">
              <p>Ordered: <strong>${item.quantity_ordered || 0}</strong></p>
              ${item.quantity_received > 0 ? `<p>Received: <strong>${item.quantity_received}</strong></p>` : ''}
            </div>
            <div class="po-detail-item-price">
              <p>Unit Cost: <strong>RM ${(item.unit_cost || 0).toFixed(2)}</strong></p>
              <p>Line Total: <strong>RM ${(item.line_total || 0).toFixed(2)}</strong></p>
            </div>
          </div>
        `;
      }).join('');
    } else {
      itemsHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No items in this purchase order</p>';
    }

    // Determine action buttons based on status
    let actionsHTML = '';
    if (status === 'pending') {
      // Stage 1: Pending - Show Propose Prices or Accept/Reject
      actionsHTML = `
        <div class="supplier-po-actions">
          <button type="button" class="supplier-action-btn" onclick="proposePrices('${po.id}')">PROPOSE PRICES</button>
          <button type="button" class="supplier-accept-btn" onclick="acceptSupplierPO('${po.id}')">ACCEPT ORDER</button>
          <button type="button" class="supplier-reject-btn" onclick="rejectSupplierPO('${po.id}')">REJECT ORDER</button>
        </div>
      `;
    } else if (status === 'price_proposed') {
      // Price proposal sent, waiting for retailer response - Show view/edit proposal
      actionsHTML = `
        <div class="supplier-po-actions">
          <button type="button" class="supplier-action-btn" onclick="viewPriceProposal('${po.id}')">VIEW PROPOSAL</button>
          <button type="button" class="supplier-action-btn" onclick="proposePrices('${po.id}', true)">REVISE PROPOSAL</button>
        </div>
      `;
    } else if (status === 'processing' || status === 'partially_received' || status === 'out_for_delivery' || status === 'delayed' || /^\d+\s+days$/.test(status)) {
      // Check if DO was already generated
      const doGenerated = po.notes && po.notes.includes('Delivery Order Generated:');
      const buttonText = doGenerated ? 'MANAGE DELIVERY STATUS' : 'GENERATE DELIVERY ORDER';
      
      // Stage 3: Processing - Show actions for picking, packing, shipping
      actionsHTML = `
        <div class="supplier-po-actions">
          <button type="button" class="supplier-action-btn" onclick="generatePickingList('${po.id}')">GENERATE PICKING LIST</button>
          <button type="button" class="supplier-action-btn" onclick="openGenerateDO('${po.id}', '${po.po_number}')">${buttonText}</button>
          ${status === 'processing' ? `<button type="button" class="supplier-reject-btn" onclick="cancelProcessingOrder('${po.id}')">CANCEL ORDER</button>` : ''}
        </div>
      `;
    }

    // Format dates with time
    const orderDate = po.order_date ? new Date(po.order_date).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';
    
    const expectedDeliveryDate = po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';
    
    const createdAt = po.created_at ? new Date(po.created_at).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) : 'N/A';
    
    const updatedAt = po.updated_at ? new Date(po.updated_at).toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) : 'N/A';

    content.innerHTML = `
      <div class="po-details-info-section">
        <div class="po-details-row">
          <div class="po-details-field">
            <label>PO Number</label>
            <p>${po.po_number || 'N/A'}</p>
          </div>
          <div class="po-details-field">
            <label>Status</label>
            <p><span class="status-badge ${statusClass}">${statusText}</span></p>
          </div>
        </div>
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Order Date & Time</label>
            <p>${orderDate}</p>
          </div>
          <div class="po-details-field">
            <label>Expected Delivery Date & Time</label>
            <p>${expectedDeliveryDate}</p>
          </div>
        </div>
        <div class="po-details-row">
          <div class="po-details-field">
            <label>Created At</label>
            <p>${createdAt}</p>
          </div>
          <div class="po-details-field">
            <label>Last Updated</label>
            <p>${updatedAt}</p>
          </div>
        </div>
      </div>
      
      <div class="po-details-items-section">
        <h3 class="po-section-title">ORDER ITEMS</h3>
        <div class="po-details-items-list">
          ${itemsHTML}
        </div>
      </div>
      
      <div class="po-details-summary-section">
        <div class="po-details-summary-row">
          <span>Subtotal:</span>
          <strong>RM ${(po.subtotal || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row">
          <span>Tax:</span>
          <strong>RM ${(po.tax_amount || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row">
          <span>Discount:</span>
          <strong>RM ${(po.discount_amount || 0).toFixed(2)}</strong>
        </div>
        <div class="po-details-summary-row po-details-total">
          <span>Total Amount:</span>
          <strong>RM ${(po.total_amount || 0).toFixed(2)}</strong>
        </div>
      </div>
      
      ${formatSupplierPONotes(po.notes)}
      
      ${po.status === 'partially_received' ? formatMissingStockSection(po.purchase_order_items) : ''}
      
      ${actionsHTML}
    `;

    if (title) {
      title.textContent = `PURCHASE ORDER: ${po.po_number || 'N/A'}`;
    }

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error loading supplier PO details:', error);
    alert('Error loading purchase order: ' + error.message);
  }
}

// Format Supplier PO Notes (parse and display in organized sections)
function formatSupplierPONotes(notes) {
  if (!notes || !notes.trim()) return '';
  
  // Parse notes into structured sections
  const sections = {
    deliveryOrder: [],
    statusUpdates: [],
    itemVerification: [],
    missingStock: [],
    cancellations: [],
    other: []
  };
  
  // Split by double newlines to get major sections, then process each
  const majorSections = notes.split(/\n\s*\n/).filter(s => s.trim());
  
  majorSections.forEach(section => {
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    const firstLine = lines[0] || '';
    
    if (firstLine.includes('Delivery Order Generated:')) {
      const match = firstLine.match(/Delivery Order Generated: (DO-[^\s]+) on ([^\n]+)/);
      if (match) {
        const fullText = section;
        sections.deliveryOrder.push({
          doNumber: match[1],
          date: match[2],
          tracking: fullText.match(/Tracking: ([^\s.]+)/)?.[1] || null,
          carrier: fullText.match(/Carrier: ([^\n.]+)/)?.[1] || null
        });
      }
    } else if (firstLine.includes('Delivery Status Update:')) {
      const match = firstLine.match(/Delivery Status Update: ([^on]+) on ([^\n]+)/);
      if (match) {
        const fullText = section;
        const statusText = match[1].trim();
        // Check if it's a cancellation
        if (statusText.includes('Cancelled')) {
          const cancelReason = fullText.match(/Cancellation Reason: ([^\n]+)/)?.[1]?.trim() || null;
          sections.cancellations.push({
            status: statusText,
            date: match[2].trim(),
            reason: cancelReason
          });
        } else {
          // Regular status update
          sections.statusUpdates.push({
            status: statusText,
            date: match[2].trim(),
            delayReason: fullText.match(/Delay Reason: ([^\n]+)/)?.[1]?.trim() || null
          });
        }
      }
    } else if (firstLine.includes('ITEM VERIFICATION:')) {
      const match = firstLine.match(/ITEM VERIFICATION: ([^by]+) by ([^\n]+)/);
      if (match) {
        const items = lines.slice(1).filter(l => l.trim() && (l.includes(':') || l.includes('×') || l.includes('Missing')));
        sections.itemVerification.push({
          date: match[1].trim(),
          by: match[2].trim(),
          items: items
        });
      }
    } else if (firstLine.includes('MISSING STOCK REPORTED:')) {
      const match = firstLine.match(/MISSING STOCK REPORTED: ([^by]+) by ([^\n]+)/);
      if (match) {
        const reason = lines.slice(1).join(' ').trim();
        sections.missingStock.push({
          date: match[1].trim(),
          by: match[2].trim(),
          reason: reason
        });
      }
    } else if (firstLine.includes('Delivery Status Update:') && firstLine.includes('Cancelled')) {
      // Parse cancellation from delivery status update
      const match = firstLine.match(/Delivery Status Update: ([^on]+) on ([^\n]+)/);
      if (match) {
        const fullText = section;
        const cancelReason = fullText.match(/Cancellation Reason: ([^\n]+)/)?.[1]?.trim() || null;
        sections.cancellations.push({
          status: match[1].trim(),
          date: match[2].trim(),
          reason: cancelReason
        });
      }
    } else if (firstLine.includes('CANCELLED BY SUPPLIER') || firstLine.includes('REJECTED:')) {
      // Parse cancellation or rejection notes
      const reason = lines.slice(1).join(' ').trim() || lines[0].replace(/CANCELLED BY SUPPLIER|REJECTED:/g, '').trim();
      sections.cancellations.push({
        date: new Date().toLocaleString(),
        reason: reason,
        type: firstLine.includes('CANCELLED') ? 'cancelled' : 'rejected'
      });
    } else if (firstLine.trim()) {
      // Other notes - combine all lines
      sections.other.push(lines.join(' '));
    }
  });
  
  // Collect all events with timestamps for chronological sorting
  const allEvents = [];
  
  // Add delivery orders
  sections.deliveryOrder.forEach(doInfo => {
    allEvents.push({
      type: 'deliveryOrder',
      timestamp: parseDate(doInfo.date),
      data: doInfo,
      displayDate: formatDisplayDate(doInfo.date)
    });
  });
  
  // Add status updates
  sections.statusUpdates.forEach(update => {
    allEvents.push({
      type: 'statusUpdate',
      timestamp: parseDate(update.date),
      data: update,
      displayDate: formatDisplayDate(update.date)
    });
  });
  
  // Add item verifications
  sections.itemVerification.forEach(verification => {
    allEvents.push({
      type: 'itemVerification',
      timestamp: parseDate(verification.date),
      data: verification,
      displayDate: formatDisplayDate(verification.date)
    });
  });
  
  // Add missing stock reports
  sections.missingStock.forEach(report => {
    allEvents.push({
      type: 'missingStock',
      timestamp: parseDate(report.date),
      data: report,
      displayDate: formatDisplayDate(report.date)
    });
  });
  
  // Add cancellations
  sections.cancellations.forEach(cancellation => {
    allEvents.push({
      type: 'cancellation',
      timestamp: cancellation.date ? parseDate(cancellation.date) : new Date(0),
      data: cancellation,
      displayDate: cancellation.date ? formatDisplayDate(cancellation.date) : 'N/A'
    });
  });
  
  // Sort all events chronologically (newest first)
  allEvents.sort((a, b) => b.timestamp - a.timestamp);
  
  // Build formatted HTML with chronological timeline
  let notesHTML = '<div class="po-details-notes-section">';
  notesHTML += '<h3 class="po-section-title">NOTES & HISTORY</h3>';
  notesHTML += '<div class="po-notes-timeline">';
  
  if (allEvents.length === 0 && sections.other.length === 0) {
    notesHTML += '<div class="po-note-empty">No notes available</div>';
  } else {
    // Display events in chronological order
    allEvents.forEach((event, index) => {
      const isLast = index === allEvents.length - 1;
      
      if (event.type === 'deliveryOrder') {
        const doInfo = event.data;
        notesHTML += `
          <div class="po-note-card po-note-delivery-order">
            <div class="po-note-timeline-connector ${isLast ? 'po-timeline-last' : ''}"></div>
            <div class="po-note-card-header">
              <div class="po-note-card-icon-wrapper po-note-icon-delivery">
                <span class="po-note-icon">📦</span>
              </div>
              <div class="po-note-card-title-group">
                <h4 class="po-note-card-title">Delivery Order Generated</h4>
                <span class="po-note-card-date">${event.displayDate}</span>
              </div>
            </div>
            <div class="po-note-card-body">
              <div class="po-note-info-grid">
                <div class="po-note-info-item">
                  <span class="po-note-label">DO Number</span>
                  <span class="po-note-value">${doInfo.doNumber}</span>
                </div>
                ${doInfo.tracking ? `
                <div class="po-note-info-item">
                  <span class="po-note-label">Tracking</span>
                  <span class="po-note-value">${doInfo.tracking}</span>
                </div>
                ` : ''}
                ${doInfo.carrier ? `
                <div class="po-note-info-item">
                  <span class="po-note-label">Carrier</span>
                  <span class="po-note-value">${doInfo.carrier}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      } else if (event.type === 'statusUpdate') {
        const update = event.data;
        const isDelayed = update.status.includes('DELAYED') || update.delayReason;
        const statusIcon = update.status.includes('Arrived') ? '✅' : 
                          update.status.includes('DELAYED') ? '⚠️' : 
                          update.status.includes('Out for delivery') ? '🚚' : '📋';
        notesHTML += `
          <div class="po-note-card po-note-status-update ${isDelayed ? 'po-note-delayed' : ''}">
            <div class="po-note-timeline-connector ${isLast ? 'po-timeline-last' : ''}"></div>
            <div class="po-note-card-header">
              <div class="po-note-card-icon-wrapper po-note-icon-status">
                <span class="po-note-icon">${statusIcon}</span>
              </div>
              <div class="po-note-card-title-group">
                <h4 class="po-note-card-title">${update.status}</h4>
                <span class="po-note-card-date">${event.displayDate}</span>
              </div>
            </div>
            ${update.delayReason ? `
            <div class="po-note-card-body">
              <div class="po-note-alert po-note-alert-delay">
                <span class="po-note-alert-icon">⚠️</span>
                <div class="po-note-alert-content">
                  <strong>Delay Reason</strong>
                  <p>${update.delayReason}</p>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        `;
      } else if (event.type === 'itemVerification') {
        const verification = event.data;
        // Parse items more clearly
        const parsedItems = verification.items.map(item => {
          // Parse format like "shoe 1: 10/12 × Missing 2"
          const itemMatch = item.match(/^(.+?):\s*(\d+)\/(\d+)\s*×\s*Missing\s*(\d+)$/);
          if (itemMatch) {
            return {
              product: itemMatch[1].trim(),
              received: itemMatch[2],
              ordered: itemMatch[3],
              missing: itemMatch[4]
            };
          }
          return { raw: item };
        });
        
        notesHTML += `
          <div class="po-note-card po-note-verification">
            <div class="po-note-timeline-connector ${isLast ? 'po-timeline-last' : ''}"></div>
            <div class="po-note-card-header">
              <div class="po-note-card-icon-wrapper po-note-icon-verification">
                <span class="po-note-icon">✓</span>
              </div>
              <div class="po-note-card-title-group">
                <h4 class="po-note-card-title">Item Verification</h4>
                <span class="po-note-card-date">${event.displayDate}</span>
              </div>
            </div>
            <div class="po-note-card-body">
              <div class="po-note-info-row">
                <span class="po-note-label">Verified by</span>
                <span class="po-note-value">${verification.by}</span>
              </div>
              <div class="po-note-items-container">
                <span class="po-note-label">Verification Details</span>
                <div class="po-note-items-grid">
                  ${parsedItems.map(item => {
                    if (item.raw) {
                      return `<div class="po-note-item-entry">${item.raw}</div>`;
                    }
                    return `
                      <div class="po-note-item-entry">
                        <div class="po-note-item-name">${item.product}</div>
                        <div class="po-note-item-stats">
                          <span class="po-note-item-stat received">Received: ${item.received}</span>
                          <span class="po-note-item-stat ordered">Ordered: ${item.ordered}</span>
                          <span class="po-note-item-stat missing">Missing: ${item.missing}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (event.type === 'missingStock') {
        const report = event.data;
        notesHTML += `
          <div class="po-note-card po-note-missing-stock">
            <div class="po-note-timeline-connector ${isLast ? 'po-timeline-last' : ''}"></div>
            <div class="po-note-card-header">
              <div class="po-note-card-icon-wrapper po-note-icon-warning">
                <span class="po-note-icon">⚠️</span>
              </div>
              <div class="po-note-card-title-group">
                <h4 class="po-note-card-title">Missing Stock Reported</h4>
                <span class="po-note-card-date">${event.displayDate}</span>
              </div>
            </div>
            <div class="po-note-card-body">
              <div class="po-note-info-row">
                <span class="po-note-label">Reported by</span>
                <span class="po-note-value">${report.by}</span>
              </div>
              ${report.reason ? `
              <div class="po-note-alert po-note-alert-warning">
                <span class="po-note-alert-icon">⚠️</span>
                <div class="po-note-alert-content">
                  <p>${report.reason}</p>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        `;
      } else if (event.type === 'cancellation') {
        const cancellation = event.data;
        notesHTML += `
          <div class="po-note-card po-note-cancellation">
            <div class="po-note-timeline-connector ${isLast ? 'po-timeline-last' : ''}"></div>
            <div class="po-note-card-header">
              <div class="po-note-card-icon-wrapper po-note-icon-cancellation">
                <span class="po-note-icon">❌</span>
              </div>
              <div class="po-note-card-title-group">
                <h4 class="po-note-card-title">${cancellation.type === 'rejected' ? 'Order Rejected' : 'Order Cancelled'}</h4>
                <span class="po-note-card-date">${event.displayDate}</span>
              </div>
            </div>
            <div class="po-note-card-body">
              ${cancellation.reason ? `
              <div class="po-note-alert po-note-alert-cancellation">
                <span class="po-note-alert-icon">❌</span>
                <div class="po-note-alert-content">
                  <strong>Reason</strong>
                  <p>${cancellation.reason}</p>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    });
    
    // Other Notes (if any)
    if (sections.other.length > 0) {
      notesHTML += `
        <div class="po-note-card po-note-other">
          <div class="po-note-timeline-connector po-timeline-last"></div>
          <div class="po-note-card-header">
            <div class="po-note-card-icon-wrapper po-note-icon-other">
              <span class="po-note-icon">📝</span>
            </div>
            <div class="po-note-card-title-group">
              <h4 class="po-note-card-title">Additional Notes</h4>
            </div>
          </div>
          <div class="po-note-card-body">
            ${sections.other.map(note => `<div class="po-note-text-content">${note}</div>`).join('')}
          </div>
        </div>
      `;
    }
  }
  
  notesHTML += '</div></div>';
  return notesHTML;
}

// Helper function to parse date from various formats
function parseDate(dateString) {
  if (!dateString) return new Date(0);
  // Try to parse common date formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  // Try DD/MM/YYYY, HH:MM:SS format
  const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:${match[6]}`);
  }
  return new Date(0);
}

// Helper function to format date for display
function formatDisplayDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

// Format Missing Stock Section (for partially_received POs)
function formatMissingStockSection(items) {
  if (!items || items.length === 0) return '';
  
  const missingItems = items.filter(item => {
    const ordered = item.quantity_ordered || 0;
    const received = item.quantity_received || 0;
    return received < ordered;
  });
  
  if (missingItems.length === 0) return '';
  
  let missingHTML = '<div class="po-missing-stock-section">';
  missingHTML += '<h3 class="po-section-title" style="color: #ff9800;">MISSING STOCK TO COMPLETE</h3>';
  missingHTML += '<div class="po-missing-stock-list">';
  
  missingItems.forEach(item => {
    const variant = item.product_variants;
    const product = variant?.products;
    const productName = product?.product_name || 'N/A';
    const variantInfo = variant ? 
      `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
      'N/A';
    const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
    const ordered = item.quantity_ordered || 0;
    const received = item.quantity_received || 0;
    const missing = ordered - received;
    
    missingHTML += `
      <div class="po-missing-stock-item">
        <div class="po-missing-stock-item-image">
          <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
        </div>
        <div class="po-missing-stock-item-info">
          <h4>${productName}</h4>
          <p class="po-detail-variant">${variantInfo}</p>
          <p class="po-detail-sku">SKU: ${variant?.sku || 'N/A'}</p>
        </div>
        <div class="po-missing-stock-item-quantity">
          <p>Ordered: <strong>${ordered}</strong></p>
          <p>Received: <strong>${received}</strong></p>
          <p class="po-missing-amount">Missing: <strong style="color: #ff9800;">${missing}</strong></p>
        </div>
      </div>
    `;
  });
  
  missingHTML += '</div></div>';
  return missingHTML;
}

// Hide Supplier PO Details
function hideSupplierPODetails() {
  const popup = document.getElementById('supplier-po-details-popup');
  if (!popup) return;
  
  popup.style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  currentPOData = null; // Clear stored PO data
}

// Export PO to PDF
window.exportPOToPDF = async function() {
  if (!currentPOData) {
    alert('No purchase order data available to export.');
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page and try again.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Add Logo at top center
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 2000);
        
        logoImg.onload = () => {
          clearTimeout(timeout);
          try {
            const logoWidth = 40;
            const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
            const logoX = (pageWidth - logoWidth) / 2;
            doc.addImage(logoImg, 'PNG', logoX, yPos, logoWidth, logoHeight);
            yPos += logoHeight + 5;
          } catch (err) {
            console.log('Error adding logo to PDF:', err);
          }
          resolve();
        };
        
        logoImg.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        logoImg.src = 'image/sportNexusLatestLogo.png';
      });
    } catch (error) {
      console.log('Logo not loaded, continuing without it:', error);
    }

    // Company Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sport Nexus', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Purchase Order Document', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // PO Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // PO Information Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INFORMATION', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const poInfo = [
      ['PO Number:', currentPOData.po_number || 'N/A'],
      ['Status:', (currentPOData.status || 'pending').toUpperCase().replace(/_/g, ' ')],
      ['Order Date:', currentPOData.order_date ? new Date(currentPOData.order_date).toLocaleDateString() : 'N/A'],
      ['Expected Delivery:', currentPOData.expected_delivery_date ? new Date(currentPOData.expected_delivery_date).toLocaleDateString() : 'N/A'],
      ['Created At:', currentPOData.created_at ? new Date(currentPOData.created_at).toLocaleString() : 'N/A'],
      ['Last Updated:', currentPOData.updated_at ? new Date(currentPOData.updated_at).toLocaleString() : 'N/A']
    ];

    poInfo.forEach(([label, value]) => {
      checkPageBreak(6);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 50, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Order Items Section
    checkPageBreak(15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER ITEMS', margin, yPos);
    yPos += 7;

    if (currentPOData.purchase_order_items && currentPOData.purchase_order_items.length > 0) {
      // Table header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const tableHeaders = ['Product', 'Variant/SKU', 'Qty Ordered', 'Qty Received', 'Unit Cost', 'Line Total'];
      const colWidths = [50, 35, 25, 25, 25, 30];
      let xPos = margin;
      
      tableHeaders.forEach((header, idx) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[idx];
      });
      yPos += 5;

      // Draw line under header
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      currentPOData.purchase_order_items.forEach((item) => {
        checkPageBreak(8);
        
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const sku = variant?.sku || 'N/A';
        const variantText = variantInfo !== 'N/A' ? `${variantInfo} (${sku})` : sku;
        
        xPos = margin;
        const rowData = [
          productName.length > 30 ? productName.substring(0, 27) + '...' : productName,
          variantText.length > 20 ? variantText.substring(0, 17) + '...' : variantText,
          (item.quantity_ordered || 0).toString(),
          (item.quantity_received || 0).toString(),
          `RM ${(item.unit_cost || 0).toFixed(2)}`,
          `RM ${(item.line_total || 0).toFixed(2)}`
        ];
        
        rowData.forEach((data, idx) => {
          doc.text(data, xPos, yPos);
          xPos += colWidths[idx];
        });
        
        yPos += 6;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text('No items in this purchase order', margin, yPos);
      yPos += 6;
    }

    yPos += 5;

    // Summary Section
    checkPageBreak(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryItems = [
      ['Subtotal:', `RM ${(currentPOData.subtotal || 0).toFixed(2)}`],
      ['Tax:', `RM ${(currentPOData.tax_amount || 0).toFixed(2)}`],
      ['Discount:', `RM ${(currentPOData.discount_amount || 0).toFixed(2)}`]
    ];

    summaryItems.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(value, pageWidth - margin - 40, yPos, { align: 'right' });
      yPos += 6;
    });

    // Total
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', margin, yPos);
    doc.text(`RM ${(currentPOData.total_amount || 0).toFixed(2)}`, pageWidth - margin - 40, yPos, { align: 'right' });

    // Notes section if available
    if (currentPOData.notes && currentPOData.notes.trim()) {
      yPos += 10;
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(currentPOData.notes, pageWidth - 2 * margin);
      notesLines.forEach((line) => {
        checkPageBreak(5);
        doc.text(line, margin, yPos);
        yPos += 5;
      });
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${totalPages} | Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `PO_${currentPOData.po_number || currentPOData.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF: ' + error.message);
  }
};

// Accept Supplier PO (Stage 2: Status -> processing)
window.acceptSupplierPO = async function(poId) {
  if (!confirm('Accept this purchase order? Once accepted, the order will require payment before processing.')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Update to 'payment_pending' status - requires payment before processing
    let { error } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'payment_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'pending');

    if (error) {
      throw new Error('Error accepting order: ' + error.message);
    } else {
      // Record payment due date (30 days from now)
      const paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + 30);
      
      // Update notes with payment information
      const { data: currentPO } = await window.supabase
        .from('purchase_orders')
        .select('notes')
        .eq('id', poId)
        .single();
      
      const acceptanceNote = `ACCEPTED BY SUPPLIER: ${new Date().toLocaleString()}. Payment required within 30 days (Due: ${paymentDueDate.toLocaleDateString()}). ${currentPO?.notes || ''}`;
      
      await window.supabase
        .from('purchase_orders')
        .update({
          notes: acceptanceNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', poId);
      
      alert('Order accepted successfully! Payment is now required before processing can begin.');
    }
    
    // Refresh and close
    await loadIncomingOrders();
    hideSupplierPODetails();
  } catch (error) {
    console.error('Error accepting order:', error);
    alert('Error accepting order: ' + error.message);
  }
};

// Propose Prices (Supplier)
window.proposePrices = async function(poId, isRevision = false) {
  const popup = document.getElementById('propose-prices-popup');
  const content = document.getElementById('propose-prices-content');
  const title = document.getElementById('propose-prices-title');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Fetch PO with items
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          unit_cost,
          line_total,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              id,
              product_name,
              image_url
            )
          )
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found.');
    }

    // Get current proposal number
    let proposalNumber = (po.price_proposal_count || 0);
    if (isRevision || po.status === 'pending') {
      // If revising or status is back to pending (after rejection), increment proposal number
      proposalNumber = proposalNumber + 1;
    } else {
      proposalNumber = proposalNumber || 1;
    }
    
    if (title) {
      title.textContent = isRevision ? `REVISE PRICE PROPOSAL (Round ${proposalNumber})` : `PROPOSE PRICES (Round ${proposalNumber})`;
    }

    // Fetch existing proposals for this round (if revising)
    let existingProposals = {};
    if (isRevision || po.status === 'pending') {
      const { data: prevProposals } = await window.supabase
        .from('po_price_proposals')
        .select('*')
        .eq('purchase_order_id', poId)
        .eq('proposal_number', proposalNumber - 1)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (prevProposals && prevProposals.length > 0) {
        prevProposals.forEach(p => {
          existingProposals[p.purchase_order_item_id] = p.proposed_unit_cost;
        });
      }
    }

    // Build price proposal form
    let itemsHTML = '';
    if (po.purchase_order_items && po.purchase_order_items.length > 0) {
      itemsHTML = po.purchase_order_items.map((item, index) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
        const originalPrice = parseFloat(item.unit_cost) || 0;
        const originalTotal = parseFloat(item.line_total) || 0;
        
        // Use existing proposal price if available (for revisions), otherwise use original
        const defaultProposedPrice = existingProposals[item.id] || originalPrice;
        const defaultProposedTotal = defaultProposedPrice * (item.quantity_ordered || 0);

        return `
          <div class="propose-price-item" data-item-id="${item.id}">
            <div class="propose-price-item-header">
              <div class="propose-price-item-image">
                <img src="${imageUrl}" alt="${productName}" onerror="this.src='image/sportNexusLatestLogo.png'" />
              </div>
              <div class="propose-price-item-info">
                <h4>${productName}</h4>
                <p>${variantInfo}</p>
                <p>SKU: ${variant?.sku || 'N/A'}</p>
                <p>Quantity: ${item.quantity_ordered}</p>
              </div>
            </div>
            <div class="propose-price-comparison">
              <div class="propose-price-original">
                <label>Original Price</label>
                <p>RM ${originalPrice.toFixed(2)}</p>
                <p class="propose-price-total">Total: RM ${originalTotal.toFixed(2)}</p>
              </div>
              <div class="propose-price-arrow">→</div>
              <div class="propose-price-proposed">
                <label>Proposed Price</label>
                <input type="number" step="0.01" min="0" class="propose-price-input" 
                       data-item-id="${item.id}" 
                       value="${defaultProposedPrice.toFixed(2)}" 
                       onchange="updateProposedLineTotal('${item.id}', ${item.quantity_ordered})" />
                <p class="propose-price-total" id="proposed-total-${item.id}">Total: RM ${defaultProposedTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    content.innerHTML = `
      <div class="propose-prices-form">
        <div class="po-form-group">
          <label>PO Number: <strong>${po.po_number || 'N/A'}</strong></label>
        </div>
        <div class="propose-prices-items-list">
          ${itemsHTML}
        </div>
        <div class="propose-prices-summary">
          <div class="propose-prices-summary-row">
            <span>Original Total:</span>
            <strong id="original-total">RM ${(po.total_amount || 0).toFixed(2)}</strong>
          </div>
          <div class="propose-prices-summary-row">
            <span>Proposed Total:</span>
            <strong id="proposed-total">RM ${(po.total_amount || 0).toFixed(2)}</strong>
          </div>
          <div class="propose-prices-summary-row propose-prices-difference" id="price-difference-row">
            <span>Difference:</span>
            <strong id="price-difference">RM 0.00</strong>
          </div>
        </div>
        <div class="po-form-group">
          <label for="propose-prices-notes">Notes (Optional)</label>
          <textarea id="propose-prices-notes" class="po-input" rows="3" placeholder="Add any notes about this price proposal..."></textarea>
        </div>
        <div class="propose-prices-actions">
          <button type="button" class="po-send-btn" onclick="submitPriceProposal('${poId}', ${proposalNumber})">SUBMIT PROPOSAL</button>
        </div>
      </div>
    `;

    // Calculate initial totals
    updateProposedTotal();

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error loading price proposal form:', error);
    alert('Error loading price proposal: ' + error.message);
  }
};

// Update Proposed Line Total
window.updateProposedLineTotal = function(itemId, quantity) {
  const input = document.querySelector(`.propose-price-input[data-item-id="${itemId}"]`);
  if (!input) return;

  const proposedPrice = parseFloat(input.value) || 0;
  const lineTotal = proposedPrice * quantity;
  
  const totalElement = document.getElementById(`proposed-total-${itemId}`);
  if (totalElement) {
    totalElement.textContent = `Total: RM ${lineTotal.toFixed(2)}`;
  }

  updateProposedTotal();
};

// Update Proposed Total
function updateProposedTotal() {
  const inputs = document.querySelectorAll('.propose-price-input');
  let proposedTotal = 0;
  let originalTotal = 0;

  inputs.forEach(input => {
    const itemId = input.getAttribute('data-item-id');
    const item = document.querySelector(`.propose-price-item[data-item-id="${itemId}"]`);
    if (!item) return;

    const quantityText = item.querySelector('.propose-price-item-info p:last-child')?.textContent || '0';
    const quantity = parseInt(quantityText.replace('Quantity: ', '')) || 0;
    
    const originalPriceText = item.querySelector('.propose-price-original p')?.textContent || 'RM 0.00';
    const originalPrice = parseFloat(originalPriceText.replace('RM ', '')) || 0;
    
    const proposedPrice = parseFloat(input.value) || 0;
    
    originalTotal += originalPrice * quantity;
    proposedTotal += proposedPrice * quantity;
  });

  const originalTotalEl = document.getElementById('original-total');
  const proposedTotalEl = document.getElementById('proposed-total');
  const differenceEl = document.getElementById('price-difference');
  const differenceRow = document.getElementById('price-difference-row');

  if (originalTotalEl) originalTotalEl.textContent = `RM ${originalTotal.toFixed(2)}`;
  if (proposedTotalEl) proposedTotalEl.textContent = `RM ${proposedTotal.toFixed(2)}`;
  
  const difference = proposedTotal - originalTotal;
  if (differenceEl) {
    differenceEl.textContent = `RM ${Math.abs(difference).toFixed(2)}`;
    differenceEl.style.color = difference >= 0 ? '#d32f2f' : '#2e7d32';
  }
  if (differenceRow) {
    differenceRow.style.display = 'flex';
  }
}

// Submit Price Proposal
window.submitPriceProposal = async function(poId, proposalNumber) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      throw new Error('Supplier not found. Please log in again.');
    }

    // Get PO items
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          unit_cost,
          line_total
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found.');
    }

    // Collect proposed prices
    const proposals = [];
    const inputs = document.querySelectorAll('.propose-price-input');
    
    for (const input of inputs) {
      const itemId = input.getAttribute('data-item-id');
      const proposedPrice = parseFloat(input.value) || 0;
      
      const item = po.purchase_order_items.find(i => i.id === itemId);
      if (!item) continue;

      const originalPrice = parseFloat(item.unit_cost) || 0;
      const originalTotal = parseFloat(item.line_total) || 0;
      
      // Get quantity from item
      const { data: itemData } = await window.supabase
        .from('purchase_order_items')
        .select('quantity_ordered')
        .eq('id', itemId)
        .single();
      
      const quantity = itemData?.quantity_ordered || 0;
      const proposedTotal = proposedPrice * quantity;

      proposals.push({
        purchase_order_item_id: itemId,
        original_unit_cost: originalPrice,
        proposed_unit_cost: proposedPrice,
        original_line_total: originalTotal,
        proposed_line_total: proposedTotal,
        proposal_number: proposalNumber
      });
    }

    if (proposals.length === 0) {
      throw new Error('No items found to propose prices for.');
    }

    // Get notes
    const notes = document.getElementById('propose-prices-notes')?.value || '';

    // Insert proposals
    const proposalsToInsert = proposals.map(p => ({
      ...p,
      purchase_order_id: poId,
      created_by: supplierId,
      notes: notes,
      status: 'pending'
    }));

    const { error: insertError } = await window.supabase
      .from('po_price_proposals')
      .insert(proposalsToInsert);

    if (insertError) {
      throw new Error('Error saving price proposal: ' + insertError.message);
    }

    // Update PO status and proposal count
    // Allow update from both 'pending' and 'price_proposed' (for revisions)
    const { error: updateError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'price_proposed',
        price_proposal_count: proposalNumber,
        last_price_proposal_at: new Date().toISOString(),
        price_proposal_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .in('status', ['pending', 'price_proposed']);

    if (updateError) {
      throw new Error('Error updating purchase order: ' + updateError.message);
    }

    alert(`Price proposal submitted successfully! Round ${proposalNumber}. Waiting for retailer review.`);
    
    // Close popup and refresh
    document.getElementById('propose-prices-popup').style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
    await loadIncomingOrders();
    hideSupplierPODetails();
  } catch (error) {
    console.error('Error submitting price proposal:', error);
    alert('Error submitting price proposal: ' + error.message);
  }
};

// View Price Proposal (Supplier)
window.viewPriceProposal = async function(poId) {
  // Similar to proposePrices but read-only view
  await proposePrices(poId, true);
  // Make all inputs read-only
  document.querySelectorAll('.propose-price-input').forEach(input => {
    input.disabled = true;
  });
  document.querySelector('.propose-prices-actions').style.display = 'none';
};

// Cancel Processing Order (Edge Case: Supplier needs to cancel after accepting)
window.cancelProcessingOrder = async function(poId) {
  const cancellationReason = prompt('Please provide a reason for cancelling this order after acceptance:');
  if (!cancellationReason || cancellationReason.trim() === '') {
    alert('Cancellation reason is required.');
    return;
  }

  if (!confirm('Cancel this order? This action will notify the retailer and cannot be easily undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Get current PO to preserve existing notes
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    // Update status to cancelled and add cancellation reason in notes
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        notes: `CANCELLED BY SUPPLIER (after acceptance): ${cancellationReason.trim()}. ${currentPO?.notes || ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'processing'); // Only allow cancellation from processing status

    if (error) {
      throw new Error('Error cancelling order: ' + error.message);
    }

    alert('Order cancelled successfully. The retailer has been notified.');
    
    // Refresh and close
    await loadIncomingOrders();
    hideSupplierPODetails();
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert('Error cancelling order: ' + error.message);
  }
};

// Reject Supplier PO
window.rejectSupplierPO = async function(poId) {
  const rejectionReason = prompt('Please provide a reason for rejecting this order:');
  if (!rejectionReason || rejectionReason.trim() === '') {
    alert('Rejection reason is required.');
    return;
  }

  if (!confirm('Reject this purchase order? This action cannot be undone.')) {
    return;
  }

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Get current PO to preserve existing notes
    const { data: currentPO } = await window.supabase
      .from('purchase_orders')
      .select('notes')
      .eq('id', poId)
      .single();

    // Update status to cancelled and add rejection reason in notes
    const { error } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        notes: `REJECTED: ${rejectionReason.trim()}. ${currentPO?.notes || ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .eq('status', 'pending');

    if (error) {
      throw new Error('Error rejecting order: ' + error.message);
    }

    alert('Order rejected successfully.');
    
    // Refresh and close
    await loadIncomingOrders();
    hideSupplierPODetails();
  } catch (error) {
    console.error('Error rejecting order:', error);
    alert('Error rejecting order: ' + error.message);
  }
};

// Generate Picking List (Stage 3)
window.generatePickingList = async function(poId) {
  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Fetch PO with items
    const { data: po, error } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              product_name
            )
          )
        )
      `)
      .eq('id', poId)
      .single();

    if (error || !po) {
      throw new Error('Purchase order not found.');
    }

    // Filter items based on PO status
    let itemsToPick = [];
    if (po.status === 'partially_received') {
      // Only show missing items for partially_received POs
      itemsToPick = po.purchase_order_items.filter(item => {
        const ordered = item.quantity_ordered || 0;
        const received = item.quantity_received || 0;
        return received < ordered;
      });
    } else {
      // Show all items for other statuses
      itemsToPick = po.purchase_order_items;
    }

    if (itemsToPick.length === 0) {
      alert('No items to pick. All items have been received.');
      return;
    }

    // Generate picking list text
    let pickingList = `PICKING LIST\n`;
    pickingList += `PO Number: ${po.po_number}\n`;
    pickingList += `Date: ${new Date().toLocaleDateString()}\n`;
    pickingList += `Status: ${po.status === 'partially_received' ? 'MISSING STOCK ONLY' : 'FULL ORDER'}\n`;
    pickingList += `\nITEMS TO PICK:\n\n`;

    itemsToPick.forEach((item, index) => {
      const variant = item.product_variants;
      const product = variant?.products;
      const ordered = item.quantity_ordered || 0;
      const received = item.quantity_received || 0;
      const quantityToPick = po.status === 'partially_received' ? (ordered - received) : ordered;
      
      pickingList += `${index + 1}. ${product?.product_name || 'N/A'}\n`;
      pickingList += `   SKU: ${variant?.sku || 'N/A'}\n`;
      pickingList += `   Variant: ${variant?.color || ''} ${variant?.size || ''}\n`;
      pickingList += `   Quantity: ${quantityToPick}`;
      if (po.status === 'partially_received') {
        pickingList += ` (Ordered: ${ordered}, Received: ${received}, Missing: ${ordered - received})`;
      }
      pickingList += `\n\n`;
    });

    // Create a blob and download
    const blob = new Blob([pickingList], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PickingList-${po.po_number}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Picking list generated and downloaded successfully!');
  } catch (error) {
    console.error('Error generating picking list:', error);
    alert('Error generating picking list: ' + error.message);
  }
};

// Open Generate DO Popup
window.openGenerateDO = async function(poId, poNumber) {
  const popup = document.getElementById('generate-do-popup');
  if (!popup) return;

  window.currentGenerateDOId = poId;
  
  // Check if DO already exists
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', poId)
      .single();
    
    if (poError || !po) {
      throw new Error('Purchase order not found.');
    }
    
    // Check if DO was already generated (check notes for DO number)
    const doGenerated = po.notes && po.notes.includes('Delivery Order Generated:');
    
    if (doGenerated) {
      // Show generated DO view
      await showGeneratedDOView(poId, po);
    } else {
      // Show form to generate DO
      document.getElementById('generate-do-po-id').textContent = poNumber || po.po_number || poId;
      
      // Auto-generate tracking number
      const trackingInput = document.getElementById('generate-do-tracking-number');
      if (trackingInput && !trackingInput.value.trim()) {
        // Generate tracking number: TRK-YYYYMMDD-XXXXXX (6 random alphanumeric)
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const generatedTracking = `TRK-${year}${month}${day}-${randomSuffix}`;
        trackingInput.value = generatedTracking;
      }
      
      document.getElementById('generate-do-form').style.display = 'block';
      document.getElementById('generated-do-view').style.display = 'none';
    }
  } catch (error) {
    console.error('Error opening generate DO:', error);
    alert('Error: ' + error.message);
    return;
  }

  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
};

// Handle Upload DO
// Handle Generate DO (replaces old handleUploadDO)
async function handleGenerateDO() {
  const submitBtn = document.getElementById('submit-generate-do-btn');
  if (!submitBtn) return;

  const trackingNumber = document.getElementById('generate-do-tracking-number').value.trim();
  const carrier = document.getElementById('generate-do-carrier').value.trim();
  const notes = document.getElementById('generate-do-notes').value.trim();
  const poId = window.currentGenerateDOId;

  if (!poId) {
    alert('Purchase order not found.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'GENERATING...';

  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      throw new Error('Supplier not found. Please log in again.');
    }

    // Fetch PO with items for delivery order generation
    const { data: po, error: poError } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          line_total,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              id,
              product_name,
              image_url
            )
          )
        ),
        supplier:supplier_id (
          id,
          company_name,
          address,
          city,
          state,
          postal_code,
          country,
          phone,
          email
        )
      `)
      .eq('id', poId)
      .single();

    if (poError || !po) {
      throw new Error('Purchase order not found.');
    }

    // Generate delivery order number
    const deliveryNumber = `DO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Generate delivery order document
    let deliveryOrderContent = `DELIVERY ORDER\n`;
    deliveryOrderContent += `========================================\n\n`;
    deliveryOrderContent += `Delivery Order Number: ${deliveryNumber}\n`;
    deliveryOrderContent += `PO Number: ${po.po_number}\n`;
    deliveryOrderContent += `Date: ${new Date().toLocaleDateString()}\n`;
    deliveryOrderContent += `\nSUPPLIER INFORMATION:\n`;
    deliveryOrderContent += `Company: ${po.supplier?.company_name || 'N/A'}\n`;
    deliveryOrderContent += `Address: ${po.supplier?.address || ''}\n`;
    if (po.supplier?.city) deliveryOrderContent += `${po.supplier.city}, `;
    if (po.supplier?.state) deliveryOrderContent += `${po.supplier.state} `;
    if (po.supplier?.postal_code) deliveryOrderContent += `${po.supplier.postal_code}\n`;
    if (po.supplier?.country) deliveryOrderContent += `${po.supplier.country}\n`;
    if (po.supplier?.phone) deliveryOrderContent += `Phone: ${po.supplier.phone}\n`;
    if (po.supplier?.email) deliveryOrderContent += `Email: ${po.supplier.email}\n`;
    
    deliveryOrderContent += `\nDELIVERY INFORMATION:\n`;
    if (trackingNumber) deliveryOrderContent += `Tracking Number: ${trackingNumber}\n`;
    if (carrier) deliveryOrderContent += `Carrier: ${carrier}\n`;
    deliveryOrderContent += `Delivery Date: ${new Date().toLocaleDateString()}\n`;
    
    deliveryOrderContent += `\n========================================\n`;
    deliveryOrderContent += `ITEMS:\n`;
    deliveryOrderContent += `========================================\n\n`;

    po.purchase_order_items.forEach((item, index) => {
      const variant = item.product_variants;
      const product = variant?.products;
      deliveryOrderContent += `${index + 1}. ${product?.product_name || 'N/A'}\n`;
      deliveryOrderContent += `   SKU: ${variant?.sku || 'N/A'}\n`;
      deliveryOrderContent += `   Variant: ${(variant?.color || '')} ${(variant?.size || '')}\n`.trim() + '\n';
      deliveryOrderContent += `   Quantity: ${item.quantity_ordered}\n`;
      deliveryOrderContent += `   Unit Cost: RM ${(item.unit_cost || 0).toFixed(2)}\n`;
      deliveryOrderContent += `   Line Total: RM ${(item.line_total || 0).toFixed(2)}\n\n`;
    });

    // Add Missing Stock Section for partially_received POs
    if (po.status === 'partially_received') {
      const missingItems = po.purchase_order_items.filter(item => {
        const ordered = item.quantity_ordered || 0;
        const received = item.quantity_received || 0;
        return received < ordered;
      });
      
      if (missingItems.length > 0) {
        deliveryOrderContent += `\n========================================\n`;
        deliveryOrderContent += `MISSING STOCK TO COMPLETE:\n`;
        deliveryOrderContent += `========================================\n\n`;
        
        missingItems.forEach((item, index) => {
          const variant = item.product_variants;
          const product = variant?.products;
          const ordered = item.quantity_ordered || 0;
          const received = item.quantity_received || 0;
          const missing = ordered - received;
          
          deliveryOrderContent += `${index + 1}. ${product?.product_name || 'N/A'}\n`;
          deliveryOrderContent += `   SKU: ${variant?.sku || 'N/A'}\n`;
          deliveryOrderContent += `   Variant: ${(variant?.color || '')} ${(variant?.size || '')}\n`.trim() + '\n';
          deliveryOrderContent += `   Ordered: ${ordered}\n`;
          deliveryOrderContent += `   Received: ${received}\n`;
          deliveryOrderContent += `   Missing: ${missing}\n`;
          deliveryOrderContent += `   Unit Cost: RM ${(item.unit_cost || 0).toFixed(2)}\n\n`;
        });
      }
    }

    deliveryOrderContent += `========================================\n`;
    deliveryOrderContent += `SUMMARY:\n`;
    deliveryOrderContent += `Subtotal: RM ${(po.subtotal || 0).toFixed(2)}\n`;
    deliveryOrderContent += `Tax: RM ${(po.tax_amount || 0).toFixed(2)}\n`;
    deliveryOrderContent += `Discount: RM ${(po.discount_amount || 0).toFixed(2)}\n`;
    deliveryOrderContent += `Total: RM ${(po.total_amount || 0).toFixed(2)}\n`;
    deliveryOrderContent += `========================================\n`;

    if (notes) {
      deliveryOrderContent += `\nNOTES:\n${notes}\n`;
    }

    // Create and download delivery order file
    const blob = new Blob([deliveryOrderContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeliveryOrder-${deliveryNumber}-${po.po_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Store DO information in notes (don't change status yet)
    const deliveryNotes = `Delivery Order Generated: ${deliveryNumber} on ${new Date().toLocaleString()}. ${trackingNumber ? `Tracking: ${trackingNumber}.` : ''} ${carrier ? `Carrier: ${carrier}.` : ''} ${notes ? `Notes: ${notes}` : ''}`;
    
    const { error: updateError } = await window.supabase
      .from('purchase_orders')
      .update({
        notes: `${po.notes ? po.notes + '\n\n' : ''}${deliveryNotes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId);

    if (updateError) {
      throw new Error('Error updating purchase order: ' + updateError.message);
    }

    // Store DO data for display
    window.currentDOData = {
      deliveryNumber,
      trackingNumber,
      carrier,
      notes,
      poNumber: po.po_number,
      expectedDeliveryDate: po.expected_delivery_date
    };

    // Show generated DO view instead of closing
    await showGeneratedDOView(poId, { ...po, notes: `${po.notes ? po.notes + '\n\n' : ''}${deliveryNotes}` });
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'GENERATE DELIVERY ORDER';

  } catch (error) {
    console.error('Error generating delivery order:', error);
    alert('Error generating delivery order: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'GENERATE DELIVERY ORDER';
  }
}

// Show Generated DO View
async function showGeneratedDOView(poId, po) {
  const form = document.getElementById('generate-do-form');
  const view = document.getElementById('generated-do-view');
  const doContent = document.getElementById('do-document-content');
  const doTitle = document.getElementById('generate-do-title');
  
  if (!form || !view || !doContent) return;
  
  // Hide form, show view
  form.style.display = 'none';
  view.style.display = 'block';
  doTitle.textContent = 'DELIVERY ORDER & STATUS';
  
  // Fetch full PO data if not provided
  if (!po || !po.purchase_order_items) {
    const { data: fullPO, error } = await window.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          line_total,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              id,
              product_name,
              image_url
            )
          )
        ),
        supplier:supplier_id (
          id,
          company_name,
          address,
          city,
          state,
          postal_code,
          country,
          phone,
          email
        )
      `)
      .eq('id', poId)
      .single();
    
    if (error || !fullPO) {
      throw new Error('Error loading purchase order details.');
    }
    po = fullPO;
  }
  
  // Extract DO number from notes or use stored data
  let deliveryNumber = window.currentDOData?.deliveryNumber;
  let trackingNumber = window.currentDOData?.trackingNumber || '';
  let carrier = window.currentDOData?.carrier || '';
  let notes = window.currentDOData?.notes || '';
  
  if (!deliveryNumber && po.notes) {
    const doMatch = po.notes.match(/Delivery Order Generated: (DO-\d+-\d+)/);
    if (doMatch) {
      deliveryNumber = doMatch[1];
      // Try to extract tracking and carrier from notes
      const trackingMatch = po.notes.match(/Tracking: ([^.]+)/);
      if (trackingMatch) trackingNumber = trackingMatch[1].trim();
      const carrierMatch = po.notes.match(/Carrier: ([^.]+)/);
      if (carrierMatch) carrier = carrierMatch[1].trim();
    }
  }
  
  if (!deliveryNumber) {
    deliveryNumber = `DO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }
  
  // Generate DO document HTML
  const supplier = po.supplier || {};
  let doHTML = `
    <div class="do-document-preview">
      <div class="do-header">
        <h2>DELIVERY ORDER</h2>
        <div class="do-info-row">
          <span><strong>DO Number:</strong> ${deliveryNumber}</span>
          <span><strong>PO Number:</strong> ${po.po_number || 'N/A'}</span>
          <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div class="do-supplier-info">
        <h3>SUPPLIER INFORMATION</h3>
        <p><strong>Company:</strong> ${supplier.company_name || 'N/A'}</p>
        <p><strong>Address:</strong> ${supplier.address || ''} ${supplier.city || ''}, ${supplier.state || ''} ${supplier.postal_code || ''}</p>
        ${supplier.phone ? `<p><strong>Phone:</strong> ${supplier.phone}</p>` : ''}
        ${supplier.email ? `<p><strong>Email:</strong> ${supplier.email}</p>` : ''}
      </div>
      <div class="do-delivery-info">
        <h3>DELIVERY INFORMATION</h3>
        ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
        ${carrier ? `<p><strong>Carrier:</strong> ${carrier}</p>` : ''}
        <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="do-items">
        <h3>ITEMS</h3>
        <table class="do-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Variant</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  // Display all items (current items)
  po.purchase_order_items.forEach((item, index) => {
    const variant = item.product_variants;
    const product = variant?.products;
    const variantInfo = variant ? `${variant.color || ''} ${variant.size || ''}`.trim() || 'N/A' : 'N/A';
    doHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${product?.product_name || 'N/A'}</td>
        <td>${variant?.sku || 'N/A'}</td>
        <td>${variantInfo}</td>
        <td>${item.quantity_ordered}</td>
        <td>RM ${(item.unit_cost || 0).toFixed(2)}</td>
        <td>RM ${(item.line_total || 0).toFixed(2)}</td>
      </tr>
    `;
  });
  
  doHTML += `
          </tbody>
        </table>
      </div>
  `;
  
  // Add Missing Stock Section for partially_received POs
  if (po.status === 'partially_received') {
    const missingItems = po.purchase_order_items.filter(item => {
      const ordered = item.quantity_ordered || 0;
      const received = item.quantity_received || 0;
      return received < ordered;
    });
    
    if (missingItems.length > 0) {
      doHTML += `
      <div class="do-missing-stock-section" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #ff9800;">
        <h3 style="color: #ff9800; margin-bottom: 1rem;">MISSING STOCK TO COMPLETE</h3>
        <table class="do-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Variant</th>
              <th>Ordered</th>
              <th>Received</th>
              <th>Missing</th>
              <th>Unit Cost</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      missingItems.forEach((item, index) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const variantInfo = variant ? `${variant.color || ''} ${variant.size || ''}`.trim() || 'N/A' : 'N/A';
        const ordered = item.quantity_ordered || 0;
        const received = item.quantity_received || 0;
        const missing = ordered - received;
        
        doHTML += `
          <tr>
            <td>${index + 1}</td>
            <td>${product?.product_name || 'N/A'}</td>
            <td>${variant?.sku || 'N/A'}</td>
            <td>${variantInfo}</td>
            <td>${ordered}</td>
            <td>${received}</td>
            <td style="color: #ff9800; font-weight: bold;">${missing}</td>
            <td>RM ${(item.unit_cost || 0).toFixed(2)}</td>
          </tr>
        `;
      });
      
      doHTML += `
          </tbody>
        </table>
      </div>
      `;
    }
  }
  
  doHTML += `
      <div class="do-summary">
        <h3>SUMMARY</h3>
        <p><strong>Subtotal:</strong> RM ${(po.subtotal || 0).toFixed(2)}</p>
        <p><strong>Tax:</strong> RM ${(po.tax_amount || 0).toFixed(2)}</p>
        <p><strong>Discount:</strong> RM ${(po.discount_amount || 0).toFixed(2)}</p>
        <p><strong>Total:</strong> RM ${(po.total_amount || 0).toFixed(2)}</p>
      </div>
      ${notes ? `<div class="do-notes"><h3>NOTES</h3><p>${notes}</p></div>` : ''}
    </div>
  `;
  
  doContent.innerHTML = doHTML;
  
  // Set expected delivery date
  const expectedDateEl = document.getElementById('do-expected-date');
  if (expectedDateEl && po.expected_delivery_date) {
    const expectedDate = new Date(po.expected_delivery_date);
    expectedDateEl.textContent = expectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Setup status update dropdown
  const statusSelect = document.getElementById('do-status-update');
  const daysInputGroup = document.getElementById('do-days-input-group');
  const delayRemarksGroup = document.getElementById('do-delay-remarks-group');
  const cancelReasonGroup = document.getElementById('do-cancel-reason-group');
  const daysInput = document.getElementById('do-days-input');
  
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      if (this.value === 'days') {
        daysInputGroup.style.display = 'block';
        delayRemarksGroup.style.display = 'none';
        cancelReasonGroup.style.display = 'none';
        // Check if entered days exceed expected delivery date
        if (daysInput && po.expected_delivery_date) {
          checkDaysDelayAndShowRemarks(parseInt(daysInput.value || '0', 10), po.expected_delivery_date);
        }
      } else if (this.value === 'cancel') {
        daysInputGroup.style.display = 'none';
        delayRemarksGroup.style.display = 'none';
        cancelReasonGroup.style.display = 'block';
        const cancelReason = document.getElementById('do-cancel-reason');
        if (cancelReason) {
          cancelReason.required = true;
        }
      } else {
        daysInputGroup.style.display = 'none';
        cancelReasonGroup.style.display = 'none';
        // Check if delay remarks needed
        if (this.value === 'out_for_delivery') {
          checkDelayAndShowRemarks(po.expected_delivery_date);
        } else {
          delayRemarksGroup.style.display = 'none';
        }
      }
    });
  }
  
  // Setup days input listener to check for delay when days are entered
  if (daysInput && po.expected_delivery_date) {
    daysInput.addEventListener('input', function() {
      const days = parseInt(this.value || '0', 10);
      if (!isNaN(days) && days > 0) {
        checkDaysDelayAndShowRemarks(days, po.expected_delivery_date);
      } else {
        // Hide delay remarks if days is invalid or 0
        if (delayRemarksGroup) {
          delayRemarksGroup.style.display = 'none';
          const delayRemarks = document.getElementById('do-delay-remarks');
          if (delayRemarks) {
            delayRemarks.required = false;
          }
        }
      }
    });
  }
  
  // Setup download button
  const downloadBtn = document.getElementById('download-do-btn');
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadDOAsFile(po, deliveryNumber, trackingNumber, carrier, notes);
  }
  
  // Setup update status button
  const updateStatusBtn = document.getElementById('update-do-status-btn');
  if (updateStatusBtn) {
    updateStatusBtn.onclick = () => updateDOStatus(poId, po);
  }
}

// Check if delivery is delayed and show remarks field
function checkDelayAndShowRemarks(expectedDeliveryDate) {
  if (!expectedDeliveryDate) return;
  
  const expectedDate = new Date(expectedDeliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expectedDate.setHours(0, 0, 0, 0);
  
  const delayRemarksGroup = document.getElementById('do-delay-remarks-group');
  if (today > expectedDate && delayRemarksGroup) {
    delayRemarksGroup.style.display = 'block';
    document.getElementById('do-delay-remarks').required = true;
  } else if (delayRemarksGroup) {
    delayRemarksGroup.style.display = 'none';
    document.getElementById('do-delay-remarks').required = false;
  }
}

// Check if days in transit exceed expected delivery date and show remarks field
function checkDaysDelayAndShowRemarks(days, expectedDeliveryDate) {
  if (!expectedDeliveryDate || !days || days <= 0) {
    const delayRemarksGroup = document.getElementById('do-delay-remarks-group');
    if (delayRemarksGroup) {
      delayRemarksGroup.style.display = 'none';
      const delayRemarks = document.getElementById('do-delay-remarks');
      if (delayRemarks) {
        delayRemarks.required = false;
      }
    }
    return;
  }
  
  const expectedDate = new Date(expectedDeliveryDate);
  const today = new Date();
  const daysUntilExpected = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
  
  const delayRemarksGroup = document.getElementById('do-delay-remarks-group');
  const delayRemarks = document.getElementById('do-delay-remarks');
  
  if (days > daysUntilExpected) {
    // Days exceed expected delivery date - show delay remarks field
    if (delayRemarksGroup) {
      delayRemarksGroup.style.display = 'block';
    }
    if (delayRemarks) {
      delayRemarks.required = true;
    }
  } else {
    // Days don't exceed expected date - hide delay remarks field
    if (delayRemarksGroup) {
      delayRemarksGroup.style.display = 'none';
    }
    if (delayRemarks) {
      delayRemarks.required = false;
    }
  }
}

// Download DO as file
function downloadDOAsFile(po, deliveryNumber, trackingNumber, carrier, notes) {
  const supplier = po.supplier || {};
  
  let deliveryOrderContent = `DELIVERY ORDER\n`;
  deliveryOrderContent += `========================================\n\n`;
  deliveryOrderContent += `Delivery Order Number: ${deliveryNumber}\n`;
  deliveryOrderContent += `PO Number: ${po.po_number}\n`;
  deliveryOrderContent += `Date: ${new Date().toLocaleDateString()}\n`;
  deliveryOrderContent += `\nSUPPLIER INFORMATION:\n`;
  deliveryOrderContent += `Company: ${supplier.company_name || 'N/A'}\n`;
  deliveryOrderContent += `Address: ${supplier.address || ''}\n`;
  if (supplier.city) deliveryOrderContent += `${supplier.city}, `;
  if (supplier.state) deliveryOrderContent += `${supplier.state} `;
  if (supplier.postal_code) deliveryOrderContent += `${supplier.postal_code}\n`;
  if (supplier.country) deliveryOrderContent += `${supplier.country}\n`;
  if (supplier.phone) deliveryOrderContent += `Phone: ${supplier.phone}\n`;
  if (supplier.email) deliveryOrderContent += `Email: ${supplier.email}\n`;
  
  deliveryOrderContent += `\nDELIVERY INFORMATION:\n`;
  if (trackingNumber) deliveryOrderContent += `Tracking Number: ${trackingNumber}\n`;
  if (carrier) deliveryOrderContent += `Carrier: ${carrier}\n`;
  deliveryOrderContent += `Delivery Date: ${new Date().toLocaleDateString()}\n`;
  
  deliveryOrderContent += `\n========================================\n`;
  deliveryOrderContent += `ITEMS:\n`;
  deliveryOrderContent += `========================================\n\n`;

  po.purchase_order_items.forEach((item, index) => {
    const variant = item.product_variants;
    const product = variant?.products;
    deliveryOrderContent += `${index + 1}. ${product?.product_name || 'N/A'}\n`;
    deliveryOrderContent += `   SKU: ${variant?.sku || 'N/A'}\n`;
    deliveryOrderContent += `   Variant: ${(variant?.color || '')} ${(variant?.size || '')}\n`.trim() + '\n';
    deliveryOrderContent += `   Quantity: ${item.quantity_ordered}\n`;
    deliveryOrderContent += `   Unit Cost: RM ${(item.unit_cost || 0).toFixed(2)}\n`;
    deliveryOrderContent += `   Line Total: RM ${(item.line_total || 0).toFixed(2)}\n\n`;
  });

  deliveryOrderContent += `========================================\n`;
  deliveryOrderContent += `SUMMARY:\n`;
  deliveryOrderContent += `Subtotal: RM ${(po.subtotal || 0).toFixed(2)}\n`;
  deliveryOrderContent += `Tax: RM ${(po.tax_amount || 0).toFixed(2)}\n`;
  deliveryOrderContent += `Discount: RM ${(po.discount_amount || 0).toFixed(2)}\n`;
  deliveryOrderContent += `Total: RM ${(po.total_amount || 0).toFixed(2)}\n`;
  deliveryOrderContent += `========================================\n`;

  if (notes) {
    deliveryOrderContent += `\nNOTES:\n${notes}\n`;
  }

  const blob = new Blob([deliveryOrderContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DeliveryOrder-${deliveryNumber}-${po.po_number}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Update DO Status
async function updateDOStatus(poId, po) {
  const statusSelect = document.getElementById('do-status-update');
  const daysInput = document.getElementById('do-days-input');
  const delayRemarks = document.getElementById('do-delay-remarks');
  
  if (!statusSelect || !statusSelect.value) {
    alert('Please select a status.');
    return;
  }
  
  let statusUpdate = '';
  let remarks = '';
  
  if (statusSelect.value === 'days') {
    const days = parseInt(daysInput?.value || '0', 10);
    if (isNaN(days) || days < 0) {
      alert('Please enter a valid number of days.');
      return;
    }
    
    // Check if delayed BEFORE updating status
    let isDelayed = false;
    if (po.expected_delivery_date) {
      const expectedDate = new Date(po.expected_delivery_date);
      const today = new Date();
      const daysUntilExpected = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
      
      if (days > daysUntilExpected) {
        if (!delayRemarks?.value.trim()) {
          alert('Delay remarks are required when delivery exceeds expected date.');
          return;
        }
        remarks = delayRemarks.value.trim();
        isDelayed = true;
      }
    }
    
    // Set status based on whether it's delayed
    const statusValue = isDelayed ? 'delayed' : `${days} days`;
    statusUpdate = isDelayed ? `DELAYED - ${days} days in transit` : `${days} days in transit`;
    
    // Update PO status
    const { error: statusUpdateError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: statusValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId);
    
    if (statusUpdateError) {
      // If status update fails (due to constraint), alert user to run SQL migration
      console.error('Error updating status:', statusUpdateError);
      alert('Could not update status. Please run the SQL migration to add "delayed" status. Status update saved in notes.');
    }
  } else if (statusSelect.value === 'out_for_delivery') {
    statusUpdate = 'Out for delivery';
    
    // Check if delayed FIRST (before status update)
    if (po.expected_delivery_date) {
      const expectedDate = new Date(po.expected_delivery_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (today > expectedDate) {
        if (!delayRemarks?.value.trim()) {
          alert('Delay remarks are required when delivery exceeds expected date.');
          return;
        }
        remarks = delayRemarks.value.trim();
      }
    }
    
    // Update PO status to out_for_delivery (after delay check passes)
    // Allow update from processing, partially_received, or delayed status
    const { error: statusUpdateError } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'out_for_delivery',
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .in('status', ['processing', 'partially_received', 'delayed', 'out_for_delivery']);
    
    if (statusUpdateError) {
      // If status update fails (due to constraint), alert user
      console.error('Error updating status to out_for_delivery:', statusUpdateError);
      alert('Could not update status to "Out for Delivery". Status update saved in notes. Please check database constraints.');
    }
  } else if (statusSelect.value === 'cancel') {
    const cancelReason = document.getElementById('do-cancel-reason');
    
    if (!cancelReason?.value.trim()) {
      alert('Cancellation reason is required.');
      return;
    }
    
    statusUpdate = 'Cancelled';
    remarks = cancelReason.value.trim();
    
    // Update PO status to cancelled
    // Since we're in delivery management context, the PO must be in a valid status for delivery management
    // We'll update without status restriction since we know it's a valid state
    const { error: cancelError, data: cancelData } = await window.supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select();
    
    if (cancelError) {
      console.error('Error cancelling PO:', cancelError);
      alert('Error cancelling order: ' + cancelError.message);
      return;
    }
    
    // Verify the update worked
    if (!cancelData || cancelData.length === 0) {
      console.error('No rows updated - PO may not exist');
      alert('Error: Could not cancel order. The order may not exist.');
      return;
    }
    
    // Double-check that the status was actually updated
    if (cancelData[0].status !== 'cancelled') {
      console.error('Status update failed - status is:', cancelData[0].status);
      alert('Error: Order status was not updated to cancelled. Current status: ' + cancelData[0].status);
      return;
    }
  }
  
  // Update notes with status update
  const reasonLabel = statusSelect.value === 'cancel' ? 'Cancellation Reason' : 'Delay Reason';
  const statusNote = `Delivery Status Update: ${statusUpdate} on ${new Date().toLocaleString()}.${remarks ? ` ${reasonLabel}: ${remarks}` : ''}`;
  
  const { error: updateError } = await window.supabase
    .from('purchase_orders')
    .update({
      notes: `${po.notes || ''}\n\n${statusNote}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', poId);
  
  if (updateError) {
    throw new Error('Error updating delivery status: ' + updateError.message);
  }
  
  const alertMessage = statusSelect.value === 'cancel' 
    ? `Order cancelled successfully. Cancellation reason recorded.`
    : `Delivery status updated: ${statusUpdate}${remarks ? '. Delay reason recorded.' : ''}`;
  alert(alertMessage);
  
  // Close the DO status popup
  document.getElementById('generate-do-popup').style.display = 'none';
  document.body.classList.remove('popup-open');
  document.body.style.overflow = '';
  resetGenerateDOForm();
  
  // Refresh incoming orders list to show updated status
  await loadIncomingOrders();
  
  // Refresh the PO details popup to show updated status (keep it open)
  await showSupplierPODetails(poId);
}

// Reset Generate DO Form
function resetGenerateDOForm() {
  const trackingInput = document.getElementById('generate-do-tracking-number');
  const carrierInput = document.getElementById('generate-do-carrier');
  const notesInput = document.getElementById('generate-do-notes');
  const statusSelect = document.getElementById('do-status-update');
  const daysInput = document.getElementById('do-days-input');
  const delayRemarks = document.getElementById('do-delay-remarks');
  const cancelReason = document.getElementById('do-cancel-reason');
  const daysInputGroup = document.getElementById('do-days-input-group');
  const delayRemarksGroup = document.getElementById('do-delay-remarks-group');
  const cancelReasonGroup = document.getElementById('do-cancel-reason-group');
  const form = document.getElementById('generate-do-form');
  const view = document.getElementById('generated-do-view');
  
  if (trackingInput) trackingInput.value = '';
  if (carrierInput) carrierInput.value = '';
  if (notesInput) notesInput.value = '';
  if (statusSelect) statusSelect.value = '';
  if (daysInput) daysInput.value = '';
  if (delayRemarks) delayRemarks.value = '';
  if (cancelReason) cancelReason.value = '';
  if (daysInputGroup) daysInputGroup.style.display = 'none';
  if (delayRemarksGroup) delayRemarksGroup.style.display = 'none';
  if (cancelReasonGroup) cancelReasonGroup.style.display = 'none';
  if (form) form.style.display = 'block';
  if (view) view.style.display = 'none';
  window.currentGenerateDOId = null;
  window.currentDOData = null;
}

// ==================== CUSTOM DIALOG SYSTEM ====================
// Replaces native alert(), confirm(), and prompt() with custom dialogs

// Custom Alert (replaces alert())
window.customAlert = function(message, title = '') {
  return new Promise((resolve) => {
    // Remove existing dialog if any
    const existing = document.getElementById('custom-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.id = 'custom-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';

    const messageEl = document.createElement('div');
    messageEl.className = 'custom-dialog-message';
    messageEl.textContent = title ? title.toUpperCase() : message.toUpperCase();

    if (title) {
      const subtitle = document.createElement('div');
      subtitle.style.cssText = 'color: #666; font-size: 0.95rem; font-weight: 400; text-transform: none; margin-top: 0.5rem;';
      subtitle.textContent = message;
      messageEl.appendChild(subtitle);
    }

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'custom-dialog-buttons';

    const okButton = document.createElement('button');
    okButton.className = 'custom-dialog-btn primary';
    okButton.textContent = 'OK';
    okButton.onclick = () => {
      overlay.remove();
      const dashboardContainer = document.querySelector('.dashboard-container');
      const mainContent = document.querySelector('.main-content');
      if (dashboardContainer) dashboardContainer.classList.remove('blurred');
      if (mainContent) mainContent.classList.remove('blurred');
      document.body.classList.remove('blurred');
      resolve(true);
    };

    buttonsContainer.appendChild(okButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonsContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Apply blur to dashboard elements
    const dashboardContainer = document.querySelector('.dashboard-container');
    const mainContent = document.querySelector('.main-content');
    if (dashboardContainer) dashboardContainer.classList.add('blurred');
    if (mainContent) mainContent.classList.add('blurred');
    document.body.classList.add('blurred');
  });
};

// Custom Confirm (replaces confirm())
window.customConfirm = function(message, title = '') {
  return new Promise((resolve) => {
    // Remove existing dialog if any
    const existing = document.getElementById('custom-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.id = 'custom-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';

    const messageEl = document.createElement('div');
    messageEl.className = 'custom-dialog-message';
    messageEl.textContent = title ? title.toUpperCase() : message.toUpperCase();

    if (title) {
      const subtitle = document.createElement('div');
      subtitle.style.cssText = 'color: #666; font-size: 0.95rem; font-weight: 400; text-transform: none; margin-top: 0.5rem;';
      subtitle.textContent = message;
      messageEl.appendChild(subtitle);
    }

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'custom-dialog-buttons';

    const yesButton = document.createElement('button');
    yesButton.className = 'custom-dialog-btn primary';
    yesButton.textContent = 'YES';
    yesButton.onclick = () => {
      overlay.remove();
      const dashboardContainer = document.querySelector('.dashboard-container');
      const mainContent = document.querySelector('.main-content');
      if (dashboardContainer) dashboardContainer.classList.remove('blurred');
      if (mainContent) mainContent.classList.remove('blurred');
      document.body.classList.remove('blurred');
      resolve(true);
    };

    const noButton = document.createElement('button');
    noButton.className = 'custom-dialog-btn secondary';
    noButton.textContent = 'NO';
    noButton.onclick = () => {
      overlay.remove();
      const dashboardContainer = document.querySelector('.dashboard-container');
      const mainContent = document.querySelector('.main-content');
      if (dashboardContainer) dashboardContainer.classList.remove('blurred');
      if (mainContent) mainContent.classList.remove('blurred');
      document.body.classList.remove('blurred');
      resolve(false);
    };

    buttonsContainer.appendChild(yesButton);
    buttonsContainer.appendChild(noButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonsContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Apply blur to dashboard elements
    const dashboardContainer = document.querySelector('.dashboard-container');
    const mainContent = document.querySelector('.main-content');
    if (dashboardContainer) dashboardContainer.classList.add('blurred');
    if (mainContent) mainContent.classList.add('blurred');
    document.body.classList.add('blurred');
  });
};

// Custom Prompt (replaces prompt())
window.customPrompt = function(message, defaultValue = '', title = '') {
  return new Promise((resolve) => {
    // Remove existing dialog if any
    const existing = document.getElementById('custom-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.id = 'custom-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';

    const messageEl = document.createElement('div');
    messageEl.className = 'custom-dialog-message';
    messageEl.textContent = title ? title.toUpperCase() : message.toUpperCase();

    if (title) {
      const subtitle = document.createElement('div');
      subtitle.style.cssText = 'color: #666; font-size: 0.95rem; font-weight: 400; text-transform: none; margin-top: 0.5rem; margin-bottom: 1rem;';
      subtitle.textContent = message;
      messageEl.appendChild(subtitle);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'custom-dialog-input';
    input.value = defaultValue;
    input.placeholder = 'Enter your response...';
    
    // Auto-focus and select text
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);

    // Handle Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        okButton.click();
      }
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'custom-dialog-buttons';

    const okButton = document.createElement('button');
    okButton.className = 'custom-dialog-btn primary';
    okButton.textContent = 'OK';
    okButton.onclick = () => {
      const value = input.value;
      overlay.remove();
      const dashboardContainer = document.querySelector('.dashboard-container');
      const mainContent = document.querySelector('.main-content');
      if (dashboardContainer) dashboardContainer.classList.remove('blurred');
      if (mainContent) mainContent.classList.remove('blurred');
      document.body.classList.remove('blurred');
      resolve(value);
    };

    const cancelButton = document.createElement('button');
    cancelButton.className = 'custom-dialog-btn secondary';
    cancelButton.textContent = 'CANCEL';
    cancelButton.onclick = () => {
      overlay.remove();
      const dashboardContainer = document.querySelector('.dashboard-container');
      const mainContent = document.querySelector('.main-content');
      if (dashboardContainer) dashboardContainer.classList.remove('blurred');
      if (mainContent) mainContent.classList.remove('blurred');
      document.body.classList.remove('blurred');
      resolve(null);
    };

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(okButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(input);
    dialog.appendChild(buttonsContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Apply blur to dashboard elements
    const dashboardContainer = document.querySelector('.dashboard-container');
    const mainContent = document.querySelector('.main-content');
    if (dashboardContainer) dashboardContainer.classList.add('blurred');
    if (mainContent) mainContent.classList.add('blurred');
    document.body.classList.add('blurred');
  });
};

// Override native alert, confirm, prompt
window.alert = window.customAlert;
window.confirm = window.customConfirm;
window.prompt = window.customPrompt;

// Auto-initialize if on supplier PO management page
if (window.location.pathname.includes('supplier-po-management.html')) {
  document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated and is a supplier
    const user = await checkUserSession();
    
    if (!user) {
      // No user session, redirect to login
      window.location.href = 'index.html';
      return;
    }
    
    if (user.role !== 'supplier') {
      // User is not a supplier, redirect to appropriate page
      console.warn('User is not a supplier, redirecting...');
      if (user.role === 'staff') {
        window.location.href = 'statistic-page.html';
      } else {
        window.location.href = 'index.html';
      }
      return;
    }
    
    // User is a supplier, initialize the page
    initializeSupplierPOManagementPage();
  });
}

// ==================== SUPPLIER PRICE MANAGEMENT ====================

// Setup Price Management
function setupPriceManagement() {
  const closeEditPriceBtn = document.getElementById('close-edit-price-btn');
  const savePriceBtn = document.getElementById('save-price-btn');
  const searchInput = document.getElementById('supplier-price-search-input');
  const categoryBtn = document.getElementById('supplier-price-category-btn');

  if (closeEditPriceBtn) {
    closeEditPriceBtn.addEventListener('click', hideEditPricePopup);
  }

  if (savePriceBtn) {
    savePriceBtn.addEventListener('click', saveSupplierPrice);
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterSupplierPrices);
  }

  if (categoryBtn) {
    categoryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const submenu = document.getElementById('supplier-price-category-submenu');
      if (submenu) {
        submenu.classList.toggle('show');
        const isOpen = submenu.classList.contains('show');
        updateFilterIcon(categoryBtn, isOpen);
      }
    });
  }

  // Load categories for filter
  loadSupplierPriceCategories();
}

// Load Supplier Price Management
async function loadSupplierPriceManagement() {
  const tbody = document.getElementById('supplier-price-management-body');
  if (!tbody) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Supplier not found. Please log in again.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Loading products...</td></tr>';

    // Get unique product variants from purchase orders for this supplier
    const { data: poItems, error: poError } = await window.supabase
      .from('purchase_order_items')
      .select(`
        product_variant_id,
        purchase_orders!inner(supplier_id)
      `)
      .eq('purchase_orders.supplier_id', supplierId);

    if (poError) throw poError;

    if (!poItems || poItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">No products found. Products will appear here after purchase orders are created.</td></tr>';
      return;
    }

    // Get unique variant IDs
    const variantIds = [...new Set(poItems.map(item => item.product_variant_id))];

    // Fetch product variants with product details
    const { data: variants, error: variantError } = await window.supabase
      .from('product_variants')
      .select(`
        id,
        sku,
        color,
        size,
        cost_price,
        products (
          id,
          product_name,
          image_url,
          category_id,
          categories (
            id,
            category_name
          )
        )
      `)
      .in('id', variantIds)
      .eq('status', 'active')
      .order('products(product_name)', { ascending: true });

    if (variantError) throw variantError;

    if (!variants || variants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">No active product variants found.</td></tr>';
      return;
    }

    // Build table rows
    let rowsHTML = '';
    variants.forEach(variant => {
      const product = variant.products;
      const category = product?.categories;
      const variantInfo = `${variant.color || ''} ${variant.size || ''}`.trim() || 'N/A';
      const imageUrl = product?.image_url || 'image/sportNexusLatestLogo.png';
      const currentPrice = parseFloat(variant.cost_price) || 0;

      rowsHTML += `
        <tr class="supplier-price-row" data-variant-id="${variant.id}" data-category-id="${category?.id || ''}" data-product-name="${(product?.product_name || '').toLowerCase()}" data-variant-info="${variantInfo.toLowerCase()}">
          <td>
            <div class="supplier-price-image">
              <img src="${imageUrl}" alt="${product?.product_name || 'Product'}" onerror="this.src='image/sportNexusLatestLogo.png'" />
            </div>
          </td>
          <td>${product?.product_name || 'N/A'}</td>
          <td>${variantInfo}</td>
          <td>${variant.sku || 'N/A'}</td>
          <td><strong>RM ${currentPrice.toFixed(2)}</strong></td>
          <td>
            <input type="number" step="0.01" min="0" class="supplier-price-input" value="${currentPrice.toFixed(2)}" data-variant-id="${variant.id}" />
          </td>
          <td>
            <button type="button" class="supplier-edit-price-btn" onclick="editSupplierPrice('${variant.id}', '${product?.product_name || ''}', '${variantInfo}', '${variant.sku || ''}', ${currentPrice})">
              EDIT
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHTML;
  } catch (error) {
    console.error('Error loading supplier price management:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Error loading products. Please refresh the page.</td></tr>';
    }
  }
}

// Load Supplier Price Categories
async function loadSupplierPriceCategories() {
  const submenu = document.getElementById('supplier-price-category-submenu');
  if (!submenu) return;

  try {
    if (!window.supabase) return;

    const { data: categories, error } = await window.supabase
      .from('categories')
      .select('id, category_name')
      .eq('is_active', true)
      .order('category_name', { ascending: true });

    if (error) throw error;

    let categoriesHTML = '<button class="category-option-btn" data-category="all">ALL CATEGORIES</button>';
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        categoriesHTML += `<button class="category-option-btn" data-category="${cat.id}">${cat.category_name}</button>`;
      });
    }

    submenu.innerHTML = categoriesHTML;

    // Add event listeners
    submenu.querySelectorAll('.category-option-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const categoryId = this.getAttribute('data-category');
        filterSupplierPricesByCategory(categoryId);
        submenu.classList.remove('show');
        updateFilterIcon(document.getElementById('supplier-price-category-btn'), false);
      });
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Filter Supplier Prices
function filterSupplierPrices() {
  const searchInput = document.getElementById('supplier-price-search-input');
  const searchTerm = (searchInput?.value || '').toLowerCase();
  const rows = document.querySelectorAll('.supplier-price-row');

  rows.forEach(row => {
    const productName = row.getAttribute('data-product-name') || '';
    const variantInfo = row.getAttribute('data-variant-info') || '';
    const sku = row.querySelector('td:nth-child(4)')?.textContent?.toLowerCase() || '';

    if (productName.includes(searchTerm) || variantInfo.includes(searchTerm) || sku.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Filter Supplier Prices by Category
function filterSupplierPricesByCategory(categoryId) {
  const rows = document.querySelectorAll('.supplier-price-row');
  const categoryBtn = document.getElementById('supplier-price-category-btn');
  const categoryText = categoryBtn?.querySelector('span');

  rows.forEach(row => {
    const rowCategoryId = row.getAttribute('data-category-id') || '';
    if (categoryId === 'all' || rowCategoryId === categoryId) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  // Update button text
  if (categoryId === 'all') {
    if (categoryText) categoryText.textContent = 'CATEGORY';
  } else {
    const selectedCategory = document.querySelector(`.category-option-btn[data-category="${categoryId}"]`);
    if (categoryText && selectedCategory) {
      categoryText.textContent = selectedCategory.textContent.toUpperCase();
    }
  }
}

// Edit Supplier Price
window.editSupplierPrice = function(variantId, productName, variantInfo, sku, currentPrice) {
  const popup = document.getElementById('edit-price-popup');
  const title = document.getElementById('edit-price-title');
  const productNameEl = document.getElementById('edit-price-product-name');
  const variantEl = document.getElementById('edit-price-variant');
  const skuEl = document.getElementById('edit-price-sku');
  const priceInput = document.getElementById('edit-price-input');

  if (!popup) return;

  if (title) title.textContent = 'EDIT PRICE';
  if (productNameEl) productNameEl.textContent = productName || 'N/A';
  if (variantEl) variantEl.textContent = variantInfo || 'N/A';
  if (skuEl) skuEl.textContent = sku || 'N/A';
  if (priceInput) {
    priceInput.value = parseFloat(currentPrice).toFixed(2);
    priceInput.setAttribute('data-variant-id', variantId);
  }

  popup.style.display = 'flex';
  document.body.classList.add('popup-open');
  document.body.style.overflow = 'hidden';
};

// Hide Edit Price Popup
function hideEditPricePopup() {
  const popup = document.getElementById('edit-price-popup');
  if (popup) {
    popup.style.display = 'none';
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
  }
}

// Save Supplier Price
async function saveSupplierPrice() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveSupplierPriceInternal(authenticatedUser);
      },
      'Updated supplier price',
      'product_variant',
      { action: 'save_supplier_price' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save supplier price (after authentication)
async function saveSupplierPriceInternal(authenticatedUser) {
  const priceInput = document.getElementById('edit-price-input');
  const notesInput = document.getElementById('edit-price-notes');
  const saveBtn = document.getElementById('save-price-btn');

  if (!priceInput) return;

  const variantId = priceInput.getAttribute('data-variant-id');
  const newPrice = parseFloat(priceInput.value);

  if (!variantId) {
    alert('Product variant not found.');
    return;
  }

  if (isNaN(newPrice) || newPrice < 0) {
    alert('Please enter a valid price (0 or greater).');
    return;
  }

  if (!confirm(`Update price to RM ${newPrice.toFixed(2)}?`)) {
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'SAVING...';

  try {
    if (!window.supabase) {
      throw new Error('Database connection not available.');
    }

    // Update product variant cost_price
    const { error } = await window.supabase
      .from('product_variants')
      .update({
        cost_price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId);

    if (error) {
      throw new Error('Error updating price: ' + error.message);
    }

    alert('Price updated successfully!');
    
    // Refresh price management table
    await loadSupplierPriceManagement();
    hideEditPricePopup();
  } catch (error) {
    console.error('Error saving supplier price:', error);
    alert('Error updating price: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'SAVE PRICE';
  }
}
