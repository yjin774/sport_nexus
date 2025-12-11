/* ============================================
   DASHBOARD COMMON FUNCTIONS
   ============================================ */

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
  const userBtnWrapper = event.target.closest('.user-btn-wrapper');
  const submenu = document.getElementById('user-submenu');
  
  if (!userBtnWrapper && submenu) {
    submenu.classList.remove('show');
  }
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
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading staff data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">There are no staff members in the current system.</td></tr>';
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
          <td><span class="user-icon">👤</span></td>
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
    tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading staff data. Please refresh the page.</td></tr>';
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
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading supplier data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">There are no suppliers in the current system.</td></tr>';
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
          <td><span class="user-icon">👤</span></td>
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
    tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading supplier data. Please refresh the page.</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">There are no members in the current system.</td></tr>';
        return;
      }
      console.error('Error fetching member data:', error);
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading member data. Please try again.</td></tr>';
      return;
    }
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">There are no members in the current system.</td></tr>';
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
        <td><span class="user-icon">👤</span></td>
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
    tbody.innerHTML = '<tr><td colspan="10" class="no-data-message">Error loading member data. Please refresh the page.</td></tr>';
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
  if (!statusBtn) return;
  
  const statusSubmenu = document.getElementById('status-submenu');
  if (!statusSubmenu) return;
  
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
  statusOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const isCurrentlyActive = this.classList.contains('active');
      const selectedStatus = this.getAttribute('data-status');
      
      if (isCurrentlyActive) {
        // If already active, deselect and remove filter
        this.classList.remove('active');
        // Reset status filter
        const searchInput = document.querySelector('.search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const dateRange = window.dateFilterRange || null;
        const activePositionOption = document.querySelector('.position-option-btn.active:not([data-position="edit"])');
        const positionFilter = activePositionOption ? activePositionOption.getAttribute('data-position') : null;
        applyFilters(searchTerm, null, positionFilter, dateRange);
      } else {
        // Remove active class from all options
        statusOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        this.classList.add('active');
        // Get selected status and filter table
        filterTableByStatus(selectedStatus);
      }
    });
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
  // Get current search term
  const searchInput = document.querySelector('.search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // Apply filters with the selected status
  applyFilters(searchTerm, status, null, null);
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
        // Supplier table structure: icon, company_name, email, contact_person, phone, status, date, last_active, actions
        // Indices: 0=icon, 1=company_name, 2=email, 3=contact_person, 4=phone, 5=status
        userData.company_name = cells[1]?.textContent.trim() || '';
        userData.contact_person = cells[3]?.textContent.trim() || '';
        userData.phone = cells[4]?.textContent.trim() || '';
        userData.username = userData.company_name; // For display in dialog
        // Get status from status badge
        const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : 'active';
        userData.status = statusText === 'active' ? 'active' : 'inactive';
      } else if (tableType === 'member') {
        // Member table: username/first_name, email, phone
        userData.username = cells[1]?.textContent.trim() || '';
        userData.phone = cells[3]?.textContent.trim() || '';
      } else {
        // Staff table: username, email, phone, position, status
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
      
      // Check if user is manager, if not show verification dialog
      if (!isCurrentUserManager()) {
        showManagerVerificationDialog(async () => {
          // After verification, proceed with saving
          await savePositionChangesInternal();
        });
        return;
      }
      
      await savePositionChangesInternal();
    });
  }
}

// Internal function to save position changes (after verification)
async function savePositionChangesInternal() {
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
  // Check if user is manager, if not show verification dialog
  if (!isCurrentUserManager()) {
    showManagerVerificationDialog(async () => {
      // After verification, save the changes
      await saveUserChangesInternal();
    });
    return;
  }
  
  await saveUserChangesInternal();
}

// Internal function to save user changes (after verification)
async function saveUserChangesInternal() {
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
function showManagerVerificationDialog(callback) {
  const overlay = document.getElementById('manager-verification-overlay');
  if (!overlay) return;
  
  // Clear previous inputs
  const emailInput = document.getElementById('manager-verify-email');
  const passwordInput = document.getElementById('manager-verify-password');
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  
  overlay.style.display = 'flex';
  
  // Blur the main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('blurred');
  }
  
  // Set up verification button
  const verifyBtn = document.getElementById('manager-verify-yes');
  const cancelBtn = document.getElementById('manager-verify-no');
  
  const handleVerify = async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    
    try {
      // Verify manager credentials
      const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (authError) {
        alert('Invalid credentials. Please try again.');
        return;
      }
      
      // Check if user is a manager in staff table
      const { data: userData, error: userError } = await window.supabase
        .from('staff')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        alert('User not found or not a manager.');
        hideManagerVerificationDialog();
        return;
      }
      
      // Check if position is manager
      const position = userData.position || '';
      if (!position.toLowerCase().includes('manager')) {
        alert('Only managers can perform this action.');
        hideManagerVerificationDialog();
        return;
      }
      
      // Verification successful
      hideManagerVerificationDialog();
      if (callback) callback();
      
    } catch (error) {
      console.error('Verification error:', error);
      alert('Error verifying credentials. Please try again.');
    }
  };
  
  // Remove old listeners and add new ones
  const newVerifyBtn = verifyBtn.cloneNode(true);
  verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
  newVerifyBtn.addEventListener('click', handleVerify);
  
  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  newCancelBtn.addEventListener('click', () => {
    hideManagerVerificationDialog();
  });
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
  // Check if user is manager, if not show verification dialog
  if (!isCurrentUserManager()) {
    showManagerVerificationDialog(async () => {
      // After verification, proceed with saving
      await saveNewUserInternal();
    });
    return;
  }
  
  await saveNewUserInternal();
}

// Internal function to save new user (after verification)
async function saveNewUserInternal() {
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
          if (authError.message && authError.message.includes('already registered')) {
            alert('This email is already registered in Supabase Auth. Please use a different email.');
          } else {
            alert('Error creating authentication account: ' + authError.message);
          }
          return;
        }
        
        // Link auth user ID to user record if available
        if (authData && authData.user && authData.user.id) {
          userData.user_id = authData.user.id;
        }
        
        console.log('Auth user created successfully:', authData?.user?.id);
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
      userData.company_name = usernameInput?.value.trim() || null;
      userData.status = statusSelect?.value || 'active';
      userData.role = 'supplier';
    }
    
    // Insert user into database
    const { data, error } = await window.supabase
      .from(tableType)
      .insert(userData)
      .select();
    
    if (error) {
      console.error('Error adding user:', error);
      
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
      
      alert('Error adding user. Please try again.');
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
