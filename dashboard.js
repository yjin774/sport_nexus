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
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading products data. Please try again.</td></tr>';
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
      tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">There are no available products in the system yet.</td></tr>';
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
    
    // Update product cards if container exists
    if (productCardsContainer && data.length > 0) {
      productCardsContainer.innerHTML = data.slice(0, 10).map((product, index) => {
        const totalStock = stockMap[product.id] || 0;
        const imageUrl = product.image_url || (product.image_urls && product.image_urls[0]) || 'image/sportNexusLatestLogo.png';
        return `
          <div class="product-card" data-product-id="${product.id}" data-category-id="${product.category_id || ''}">
            <div class="product-image-wrapper">
              <img src="${imageUrl}" alt="${product.product_name}" class="product-image" onerror="this.src='image/sportNexusLatestLogo.png'" />
            </div>
            <div class="product-info">
              <p class="product-name">NAME : ${product.product_name || 'N/A'}</p>
              <p class="product-quantity">QUANTITY : ${totalStock}</p>
            </div>
          </div>
        `;
      }).join('');
      
      // Re-setup product card selection after loading
      setupProductCardSelection();
    } else if (productCardsContainer) {
      productCardsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No products available</p>';
    }
    
    // Sort products: active first, then inactive, then by created_at descending
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
          <td><span class="user-icon">📦</span></td>
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
    tbody.innerHTML = '<tr><td colspan="9" class="no-data-message">Error loading products data. Please refresh the page.</td></tr>';
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
    if (categoryId && categoryId !== 'all') {
      if (cardCategoryId === categoryId) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    } else {
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
  const table = document.querySelector('.member-table');
  if (!table) return;
  
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  
  const existingNoResults = tbody.querySelector('.no-results-message');
  if (existingNoResults) {
    existingNoResults.remove();
  }
  
  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;
  
  rows.forEach(row => {
    if (row.classList.contains('no-data-message')) {
      return;
    }
    
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    
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
    
    // Status filter
    if (statusFilter && shouldShow) {
      const statusCell = cells[6];
      const statusText = statusCell.textContent.trim().toLowerCase();
      const statusMatch = statusFilter === 'active' ? statusText === 'active' : statusText === 'inactive';
      if (!statusMatch) {
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
    
    if (shouldShow) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });
  
    if (visibleCount === 0 && rows.length > 0 && !tbody.querySelector('.no-data-message')) {
      const noResultsRow = document.createElement('tr');
      noResultsRow.className = 'no-results-message';
      noResultsRow.innerHTML = '<td colspan="9" class="no-data-message">No products match the selected filters.</td>';
      tbody.appendChild(noResultsRow);
    }
}

// Filter products by status
function filterProductsByStatus(status) {
  const searchInput = document.getElementById('product-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const activeCategoryOption = document.querySelector('.category-option-btn.active');
  const categoryFilter = activeCategoryOption ? activeCategoryOption.getAttribute('data-category') : null;
  
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
        product_name: cells[2] ? cells[2].textContent.trim() : '',
        brand: cells[3] ? cells[3].textContent.trim() : '',
        category: cells[4] ? cells[4].textContent.trim() : '',
        status: cells[6] ? cells[6].querySelector('.status-badge')?.textContent.trim() : '',
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
  message.textContent = `ARE YOU SURE YOU WANT TO DELETE ${productName.toUpperCase()} ?`;
  
  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'logout-dialog-buttons';
  
  // Create YES button
  const yesButton = document.createElement('button');
  yesButton.className = 'logout-dialog-btn';
  yesButton.textContent = 'YES';
  yesButton.onclick = () => confirmDeleteProduct(productId);
  
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

// Confirm delete product
async function confirmDeleteProduct(productId) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      dismissDeleteProductDialog();
      return;
    }
    
    if (!productId) {
      alert('Product ID is missing. Cannot delete product.');
      dismissDeleteProductDialog();
      return;
    }
    
    console.log('Deleting product:', productId);
    
    // Delete product from database
    // Note: This will cascade delete product_variants due to ON DELETE CASCADE
    const { data, error } = await window.supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .select();
    
    if (error) {
      console.error('Error deleting product:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Error deleting product. ';
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
    
    console.log('Product deleted successfully:', data);
    
    // Exit remove mode
    exitProductRemoveMode();
    
    // Reload products data
    await loadProductsData();
    
    // Dismiss dialog
    dismissDeleteProductDialog();
    
  } catch (error) {
    console.error('Error deleting product:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    alert('Error deleting product. Please try again.');
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
      const activeCategoryOption = document.querySelector('.category-option-btn.active');
      const categoryFilter = activeCategoryOption ? activeCategoryOption.getAttribute('data-category') : null;
      const dateRange = window.dateFilterRange || null;
      applyProductFilters(searchTerm, statusFilter, categoryFilter, dateRange);
    });
  }
  
  // Handle status filter
  const statusSubmenu = document.getElementById('status-submenu');
  if (statusSubmenu) {
    const statusOptions = statusSubmenu.querySelectorAll('.status-option-btn');
    statusOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const selectedStatus = this.getAttribute('data-status');
        const isActive = this.classList.contains('active');
        
        if (isActive) {
          this.classList.remove('active');
          window.currentStatusFilter = null;
          filterProductsByStatus(null);
        } else {
          statusOptions.forEach(opt => opt.classList.remove('active'));
          this.classList.add('active');
          window.currentStatusFilter = selectedStatus;
          filterProductsByStatus(selectedStatus);
        }
      });
    });
  }
  
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
  const statusSelect = document.getElementById('add-product-status');
  
  if (codeDisplay) codeDisplay.textContent = '-';
  if (nameInput) nameInput.value = '';
  if (brandInput) brandInput.value = '';
  if (categorySelect) categorySelect.value = '';
  if (descriptionTextarea) descriptionTextarea.value = '';
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
  const saveBtn = document.getElementById('save-add-product-btn');
  if (!saveBtn) return;
  
  // Get form values
  const codeDisplay = document.getElementById('add-product-code');
  const nameInput = document.getElementById('add-product-name');
  const brandInput = document.getElementById('add-product-brand');
  const categorySelect = document.getElementById('add-product-category');
  const descriptionTextarea = document.getElementById('add-product-description');
  const statusSelect = document.getElementById('add-product-status');
  const imageInput = document.getElementById('product-image-input');
  
  const productCode = codeDisplay ? codeDisplay.textContent.trim() : '';
  const productName = nameInput ? nameInput.value.trim() : '';
  const brand = brandInput ? brandInput.value.trim() : '';
  const categoryId = categorySelect ? categorySelect.value : '';
  const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
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
      current_stock: 0,
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
    const imageUrl = product.image_url || (product.image_urls && product.image_urls[0]) || 'image/sportNexusLatestLogo.png';
    preview.innerHTML = `<img src="${imageUrl}" alt="${product.product_name}" style="width: 100%; height: 100%; object-fit: contain;" />`;
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
  return `
    <div class="variant-item" data-variant-id="${variant.id || ''}" data-variant-index="${index}">
      <div class="variant-item-header">
        <span class="variant-item-title">Variant ${index + 1}</span>
        <button type="button" class="variant-remove-btn" data-variant-id="${variant.id || ''}">Remove</button>
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
  });
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
    
    // Get existing variants
    const { data: existingVariants, error: fetchError } = await window.supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);
    
    if (fetchError) {
      console.error('Error fetching existing variants:', fetchError);
      return;
    }
    
    const existingVariantIds = new Set((existingVariants || []).map(v => v.id));
    const currentVariantIds = new Set();
    
    // Process each variant item
    const variantsToInsert = [];
    const variantsToUpdate = [];
    
    variantItems.forEach(item => {
      const variantId = item.getAttribute('data-variant-id');
      let sku = item.querySelector('.variant-sku')?.value.trim() || '';
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
        return;
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
      
      if (variantId && existingVariantIds.has(variantId)) {
        // Update existing variant
        variantsToUpdate.push({ id: variantId, data: variantData });
        currentVariantIds.add(variantId);
      } else {
        // Insert new variant
        variantsToInsert.push(variantData);
      }
    });
    
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
      const { error: updateError } = await window.supabase
        .from('product_variants')
        .update(variant.data)
        .eq('id', variant.id);
      
      if (updateError) {
        console.error('Error updating variant:', updateError);
      }
    }
    
    // Insert new variants
    if (variantsToInsert.length > 0) {
      const { error: insertError } = await window.supabase
        .from('product_variants')
        .insert(variantsToInsert);
      
      if (insertError) {
        console.error('Error inserting variants:', insertError);
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
      await saveCategoryChangesInternal();
    });
  }
}

// Internal function to save category changes
async function saveCategoryChangesInternal() {
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
