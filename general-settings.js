// General Settings JavaScript

// Helper function to close stock count history popup
function closeStockCountHistoryPopup() {
  const popup = document.getElementById('stock-count-history-popup');
  if (popup) {
    popup.style.display = 'none';
    // Remove blur effect
    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
  }
}

// Setup Log Book Date Picker
function setupLogBookDatePicker() {
  const dateBtn = document.getElementById('log-date-filter-btn');
  if (!dateBtn) {
    console.warn('Log book date filter button not found');
    return;
  }
  
  const datePicker = document.getElementById('log-date-picker');
  if (!datePicker) {
    console.warn('Log book date picker not found');
    return;
  }
  
  console.log('Setting up log book date picker');
  
  const monthSelect = document.getElementById('log-month-select');
  const yearSelect = document.getElementById('log-year-select');
  const daysContainer = document.getElementById('log-date-picker-days');
  const startDateInput = document.getElementById('log-start-date-input');
  const endDateInput = document.getElementById('log-end-date-input');
  const backBtn = datePicker.querySelector('.date-picker-back-btn');
  const applyBtn = datePicker.querySelector('.date-picker-apply-btn');
  
  if (!monthSelect || !yearSelect || !daysContainer || !startDateInput || !endDateInput || !backBtn || !applyBtn) return;
  
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
    const remainingCells = 35 - totalCells;
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
    if (isOtherMonth) dayElement.classList.add('other-month');
    dayElement.textContent = day;
    
    // Check if this date is selected
    if (startDate && date.getTime() === startDate.getTime()) {
      dayElement.classList.add('selected', 'start-date');
    }
    if (endDate && date.getTime() === endDate.getTime()) {
      dayElement.classList.add('selected', 'end-date');
    }
    if (startDate && endDate && date > startDate && date < endDate) {
      dayElement.classList.add('in-range');
    }
    
    dayElement.addEventListener('click', function() {
      if (isSelectingStart || !startDate) {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = null;
        isSelectingStart = false;
        updateInputFields();
        updateDateFilterText();
      } else {
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < startDate) {
          const temp = startDate;
          startDate = endDate;
          endDate = temp;
        }
        isSelectingStart = true;
        updateInputFields();
        updateDateFilterText();
      }
      renderCalendar();
    });
    
    return dayElement;
  }
  
  // Update date filter button text
  function updateDateFilterText() {
    const filterText = document.getElementById('log-date-filter-text');
    if (!filterText) return;
    
    if (startDate && endDate) {
      filterText.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      filterText.textContent = formatDate(startDate);
    } else {
      filterText.textContent = 'DATE RANGE';
    }
  }
  
  // Handle start date input
  if (startDateInput) {
    startDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        startDate = null;
        updateDateFilterText();
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newStartDate = parsedDate;
        newStartDate.setHours(0, 0, 0, 0);
        
        if (endDate && newStartDate > endDate) {
          showDateValidationError('Start date must be before or equal to end date');
          this.value = formatDate(startDate);
          return;
        }
        
        startDate = newStartDate;
        this.value = formatDate(startDate);
        updateDateFilterText();
        navigateToDate(startDate);
        renderCalendar();
      } else {
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(startDate);
      }
    });
  }
  
  // Handle end date input
  if (endDateInput) {
    endDateInput.addEventListener('blur', function() {
      const inputValue = this.value.trim();
      if (inputValue === '') {
        endDate = null;
        updateDateFilterText();
        return;
      }
      
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        const newEndDate = parsedDate;
        newEndDate.setHours(23, 59, 59, 999);
        
        if (startDate && newEndDate < startDate) {
          showDateValidationError('End date must be after or equal to start date');
          this.value = formatDate(endDate);
          return;
        }
        
        endDate = newEndDate;
        this.value = formatDate(endDate);
        updateDateFilterText();
        navigateToDate(endDate);
        renderCalendar();
      } else {
        showDateValidationError('Invalid date format. Please use DD/MM/YYYY');
        this.value = formatDate(endDate);
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
  
  // Back button
  backBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
  });
  
  // Apply button
  applyBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    const existingError = datePicker.querySelector('.date-validation-error');
    if (existingError) existingError.remove();
    
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
    
    if (startDate && endDate) {
      if (!validateDateRange(startDate, endDate)) {
        showDateValidationError('Start date must be before or equal to end date');
        return;
      }
    }
    
    updateDateFilterText();
    dateBtn.classList.remove('active');
    datePicker.classList.remove('show');
    loadLogBook();
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

// Expose setupLogBookDatePicker to window for debugging (optional)
window.setupLogBookDatePicker = setupLogBookDatePicker;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadGeneralSettings();
  loadMemberPolicySettings();
  setupLogBookDatePicker();
  loadLogBook();
  checkStockCountStatus();
  setupLogBookUserFilter();
  
  // Setup close button for stock history popup
  const closeBtn = document.getElementById('close-stock-history-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeStockCountHistoryPopup);
  }
  
  // Close popup on ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const popup = document.getElementById('stock-count-history-popup');
      if (popup && popup.style.display !== 'none') {
        closeStockCountHistoryPopup();
      }
    }
  });
  
  // Close popup when clicking outside (on the backdrop)
  const popup = document.getElementById('stock-count-history-popup');
  if (popup) {
    popup.addEventListener('click', function(event) {
      // If clicking directly on the popup backdrop (not the dialog)
      if (event.target === popup) {
        closeStockCountHistoryPopup();
      }
    });
  }
});

// Load General Settings
async function loadGeneralSettings() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Load settings from Supabase settings table
    const { data: settingsData, error } = await window.supabase
      .from('settings')
      .select('*')
      .eq('singleton', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading settings:', error);
      // Fallback to localStorage
      const settings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
      document.getElementById('business-name').value = settings.businessName || 'SPORT NEXUS';
      document.getElementById('company-address').value = settings.companyAddress || '';
      document.getElementById('working-hours-start').value = settings.workingHoursStart || '09:00';
      document.getElementById('working-hours-end').value = settings.workingHoursEnd || '18:00';
      document.getElementById('currency').value = settings.currency || 'MYR';
      document.getElementById('language').value = settings.language || 'en';
      if (settings.subscribeDate) {
        document.getElementById('subscribe-date').value = settings.subscribeDate;
      } else {
        document.getElementById('subscribe-date').value = '2025-11-01';
      }
      return;
    }

    if (settingsData) {
      // Extract time from time strings (format: HH:MM:SS)
      const extractTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5); // Get HH:MM from HH:MM:SS
      };

      document.getElementById('business-name').value = settingsData.business_name || 'SPORT NEXUS';
      document.getElementById('company-address').value = settingsData.company_address || '';
      document.getElementById('working-hours-start').value = extractTime(settingsData.working_hours_start) || '09:00';
      document.getElementById('working-hours-end').value = extractTime(settingsData.working_hours_end) || '18:00';
      document.getElementById('currency').value = settingsData.currency || 'MYR';
      document.getElementById('language').value = settingsData.language || 'en';
      
      if (settingsData.business_subscribed_date) {
        const date = new Date(settingsData.business_subscribed_date);
        document.getElementById('subscribe-date').value = date.toISOString().split('T')[0];
      } else {
        document.getElementById('subscribe-date').value = '2025-11-01';
      }
    } else {
      // No settings found, use defaults
      document.getElementById('business-name').value = 'SPORT NEXUS';
      document.getElementById('company-address').value = '';
      document.getElementById('working-hours-start').value = '09:00';
      document.getElementById('working-hours-end').value = '18:00';
      document.getElementById('currency').value = 'MYR';
      document.getElementById('language').value = 'en';
      document.getElementById('subscribe-date').value = '2025-11-01';
    }
  } catch (error) {
    console.error('Error loading general settings:', error);
  }
}

// Save General Settings
async function saveGeneralSettings() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveGeneralSettingsInternal(authenticatedUser);
      },
      'Updated general settings',
      'general_settings',
      { action: 'save_general_settings' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save general settings (after authentication)
async function saveGeneralSettingsInternal(authenticatedUser) {
  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    // Use authenticated user for updated_by
    const authUserId = authenticatedUser?.id;

    // Prepare data for Supabase (using snake_case column names)
    const settingsData = {
      singleton: true,
      business_name: document.getElementById('business-name').value,
      company_address: document.getElementById('company-address').value,
      working_hours_start: document.getElementById('working-hours-start').value + ':00', // Add seconds
      working_hours_end: document.getElementById('working-hours-end').value + ':00', // Add seconds
      currency: document.getElementById('currency').value,
      language: document.getElementById('language').value,
      business_subscribed_date: document.getElementById('subscribe-date').value
    };

    // Add updated_by if authenticated user is available
    if (authUserId) {
      settingsData.updated_by = authUserId;
    }

    // Save to Supabase settings table (upsert since singleton = true)
    const { data, error } = await window.supabase
      .from('settings')
      .upsert(settingsData, { onConflict: 'singleton' });

    if (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
      return;
    }

    // Also save to localStorage as backup
    const settings = {
      businessName: settingsData.business_name,
      companyAddress: settingsData.company_address,
      workingHoursStart: document.getElementById('working-hours-start').value,
      workingHoursEnd: document.getElementById('working-hours-end').value,
      currency: settingsData.currency,
      language: settingsData.language,
      subscribeDate: settingsData.business_subscribed_date
    };
    localStorage.setItem('generalSettings', JSON.stringify(settings));

    alert('General settings saved successfully!');
    
    // Log activity (already logged in requireStaffAuthentication, but log additional details)
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    logActivity('settings_updated', 'general_settings', null, 'Updated general settings', authenticatedUser?.id || userSession.userData?.id, {
      ...settings,
      authenticated_by: authenticatedUser?.email
    });
  } catch (error) {
    console.error('Error saving general settings:', error);
    alert('Error saving settings: ' + error.message);
  }
}

// Load Member Policy Settings
async function loadMemberPolicySettings() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      // Fallback to localStorage
      const settings = JSON.parse(localStorage.getItem('memberPolicySettings') || '{}');
      document.getElementById('points-to-rm').value = settings.pointsToRM || '1.00';
      document.getElementById('points-duration').value = settings.pointsDuration || '365';
      document.getElementById('bill-ratio').value = settings.billRatio || '20';
      document.getElementById('min-purchase-amount').value = settings.minPurchaseAmount || '0.00';
      const maxRedemptionInput = document.getElementById('max-redemption-ratio');
      if (maxRedemptionInput) {
        maxRedemptionInput.value = settings.maxRedemptionRatio || '20';
      }
      return;
    }

    // Load from Supabase member_policy table
    const { data, error } = await window.supabase
      .from('member_policy')
      .select('*')
      .eq('singleton', true)
      .single();

    if (error) {
      console.error('Error loading member policy settings:', error);
      // Fallback to localStorage
      const settings = JSON.parse(localStorage.getItem('memberPolicySettings') || '{}');
      document.getElementById('points-to-rm').value = settings.pointsToRM || '1.00';
      document.getElementById('points-duration').value = settings.pointsDuration || '365';
      document.getElementById('bill-ratio').value = settings.billRatio || '20';
      document.getElementById('min-purchase-amount').value = settings.minPurchaseAmount || '0.00';
      const maxRedemptionInput = document.getElementById('max-redemption-ratio');
      if (maxRedemptionInput) {
        maxRedemptionInput.value = settings.maxRedemptionRatio || '20';
      }
      return;
    }

    if (data) {
      document.getElementById('points-to-rm').value = data.points_to_rm_ratio || '1.00';
      document.getElementById('points-duration').value = data.points_duration_days || '365';
      document.getElementById('bill-ratio').value = data.bill_ratio_percentage || '20';
      document.getElementById('min-purchase-amount').value = data.min_purchase_amount_for_points || '0.00';
      document.getElementById('max-redemption-ratio').value = data.max_redemption_ratio_percentage || '20';
    }
  } catch (error) {
    console.error('Error loading member policy settings:', error);
  }
}

// Save Member Policy Settings
async function saveMemberPolicySettings() {
  // Require staff authentication before saving
  try {
    await requireStaffAuthentication(
      async (authenticatedUser) => {
        await saveMemberPolicySettingsInternal(authenticatedUser);
      },
      'Updated member policy settings',
      'member_policy',
      { action: 'save_member_policy_settings' }
    );
  } catch (error) {
    if (error.message !== 'Authentication cancelled') {
      console.error('Authentication error:', error);
    }
  }
}

// Internal function to save member policy settings (after authentication)
async function saveMemberPolicySettingsInternal(authenticatedUser) {
  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    const settings = {
      pointsToRM: parseFloat(document.getElementById('points-to-rm').value) || 1.00,
      pointsDuration: parseInt(document.getElementById('points-duration').value) || 365,
      billRatio: parseFloat(document.getElementById('bill-ratio').value) || 20,
      minPurchaseAmount: parseFloat(document.getElementById('min-purchase-amount').value) || 0.00,
      maxRedemptionRatio: parseFloat(document.getElementById('max-redemption-ratio').value) || 20,
      updatedAt: new Date().toISOString()
    };

    // Validate settings
    if (settings.billRatio < 0 || settings.billRatio > 100) {
      alert('Bill ratio must be between 0 and 100');
      return;
    }

    if (settings.maxRedemptionRatio < 0 || settings.maxRedemptionRatio > 100) {
      alert('Maximum redemption ratio must be between 0 and 100');
      return;
    }

    // Use authenticated user for updated_by
    const userId = authenticatedUser?.id;

    // Prepare data for Supabase (using snake_case column names)
    const updateData = {
      points_to_rm_ratio: settings.pointsToRM,
      points_duration_days: settings.pointsDuration,
      bill_ratio_percentage: settings.billRatio,
      min_purchase_amount_for_points: settings.minPurchaseAmount,
      max_redemption_ratio_percentage: settings.maxRedemptionRatio
    };

    // Add updated_by if authenticated user is available
    if (userId) {
      updateData.updated_by = userId;
    }

    // Update member_policy table (singleton = true ensures only one row)
    const { data, error } = await window.supabase
      .from('member_policy')
      .update(updateData)
      .eq('singleton', true);

    if (error) {
      console.error('Error saving member policy settings:', error);
      alert('Error saving settings: ' + error.message);
      return;
    }

    // Also save to localStorage as backup
    localStorage.setItem('memberPolicySettings', JSON.stringify(settings));

    alert('Member policy settings saved successfully!');
    
    // Log activity (already logged in requireStaffAuthentication, but log additional details)
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    logActivity('settings_updated', 'member_policy', null, 'Updated member policy settings', authenticatedUser?.id || userSession.userData?.id, {
      ...settings,
      authenticated_by: authenticatedUser?.email
    });
  } catch (error) {
    console.error('Error saving member policy settings:', error);
    alert('Error saving settings: ' + error.message);
  }
}

// Send Stock Count Request
async function sendStockCountRequest() {
  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const authUserId = userSession.userData?.id;
    const userEmail = userSession.userData?.email;
    const userName = userSession.userData?.username || userSession.userData?.email || 'Manager';

    if (!authUserId) {
      alert('User not found. Please log in again.');
      return;
    }

    // Try multiple methods to find staff record
    let staffData = null;
    let staffError = null;

    // Method 1: Try finding by user_id (auth.users.id)
    if (authUserId) {
      const result1 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (result1.data && !result1.error) {
        staffData = result1.data;
      } else {
        staffError = result1.error;
      }
    }

    // Method 2: If Method 1 failed, try finding by email
    if (!staffData && userEmail) {
      const result2 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (result2.data && !result2.error) {
        staffData = result2.data;
      }
    }

    // Method 3: If still not found, check if auth user ID itself is a staff ID
    if (!staffData && authUserId) {
      const result3 = await window.supabase
        .from('staff')
        .select('id, username, email, first_name, last_name')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (result3.data && !result3.error) {
        staffData = result3.data;
      }
    }

    if (!staffData) {
      console.error('Error finding staff record. Tried user_id, email, and id lookup.');
      console.error('Auth User ID:', authUserId);
      console.error('User Email:', userEmail);
      alert('Staff record not found. Please ensure your account is linked to a staff record in the database. Contact administrator if this issue persists.');
      return;
    }

    const staffId = staffData.id;
    const staffName = staffData.username || 
                     (staffData.first_name && staffData.last_name ? `${staffData.first_name} ${staffData.last_name}` : null) ||
                     staffData.email || 
                     userName;

    // Create stock count request data
    // Note: request_number is auto-generated by database trigger
    const requestData = {
      requested_by: staffId,
      requested_by_name: staffName,
      request_date: new Date().toISOString(),
      status: 'pending'
      // created_at and updated_at are auto-set by database
    };

    // Save to Supabase stock_count_requests table
    const { data: insertedData, error: insertError } = await window.supabase
      .from('stock_count_requests')
      .insert(requestData)
      .select()
      .single();

    if (insertError) {
      console.error('Error saving stock count request:', insertError);
      alert('Error sending request: ' + insertError.message);
      return;
    }

    // Also save to localStorage as backup
    const requests = JSON.parse(localStorage.getItem('stockCountRequests') || '[]');
    requests.push({
      id: insertedData.id,
      request_number: insertedData.request_number,
      ...requestData
    });
    localStorage.setItem('stockCountRequests', JSON.stringify(requests));

    // Update UI
    document.getElementById('stock-count-status').innerHTML = `
      <p style="color: #4caf50; font-weight: bold; margin: 0;">
        ✓ Stock count request sent on ${new Date().toLocaleString()}
      </p>
    `;

    alert('Stock count request sent successfully to mobile POS system!');
    
    // Log activity
    logActivity('stock_count_request', 'stock_count', insertedData.id, 'Sent stock count request to mobile POS', null, requestData);
  } catch (error) {
    console.error('Error sending stock count request:', error);
    alert('Error sending request: ' + error.message);
  }
}

// Show Stock Count History
async function showStockCountHistory() {
  const popup = document.getElementById('stock-count-history-popup');
  const content = document.getElementById('stock-history-content');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      alert('Database connection not available. Please refresh the page.');
      return;
    }

    // Load stock count requests from Supabase
    const { data: requests, error } = await window.supabase
      .from('stock_count_requests')
      .select('*')
      .order('request_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading stock count history:', error);
      content.innerHTML = '<p style="text-align: center; color: #d32f2f; padding: 2rem;">Error loading history. Please try again.</p>';
      popup.style.display = 'flex';
      document.body.classList.add('popup-open');
      document.body.style.overflow = 'hidden';
      return;
    }
    
    // Store requests globally for filtering
    window.stockCountHistoryRequests = requests || [];
    
    // Render the content with date pickers
    renderStockCountHistory(requests || []);

    popup.style.display = 'flex';
    document.body.classList.add('popup-open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error loading stock count history:', error);
    alert('Error loading history: ' + error.message);
  }
}

// Render stock count history with filtering
function renderStockCountHistory(requests) {
  const content = document.getElementById('stock-history-content');
  
  if (!requests || requests.length === 0) {
    content.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No stock count requests found.</p>';
    return;
  }

  // Get date range for display
  const dates = requests.map(r => new Date(r.request_date));
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  const dateRangeStr = `${oldestDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()} - ${newestDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`;

  // Set default filter dates (today)
  const today = new Date().toISOString().split('T')[0];
  const defaultStartDate = oldestDate.toISOString().split('T')[0];
  const defaultEndDate = newestDate.toISOString().split('T')[0];

  content.innerHTML = `
    <div style="margin-bottom: 1rem; flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <label style="color: #666; font-weight: 500;">Filter by Date:</label>
          <input type="date" id="stock-history-start-date" class="settings-input" style="width: auto; padding: 0.5rem;" value="${defaultStartDate}" />
          <span style="color: #666;">to</span>
          <input type="date" id="stock-history-end-date" class="settings-input" style="width: auto; padding: 0.5rem;" value="${defaultEndDate}" />
          <button type="button" class="stock-count-btn" onclick="filterStockCountHistory()" style="padding: 0.5rem 1rem;">FILTER</button>
          <button type="button" class="stock-count-btn" onclick="clearStockCountHistoryFilter()" style="padding: 0.5rem 1rem;">CLEAR</button>
        </div>
      </div>
    </div>
    <div class="stock-history-table-container">
        <table class="member-table stock-history-table" style="width: 100%;">
          <thead>
            <tr>
              <th>REQUESTED DATE TIME</th>
              <th>PIC</th>
              <th>STATUS</th>
              <th>COMPLETED DATE TIME</th>
            </tr>
          </thead>
          <tbody id="stock-history-tbody">
            ${renderStockCountHistoryRows(requests)}
          </tbody>
        </table>
    </div>
  `;
}

// Render stock count history table rows
function renderStockCountHistoryRows(requests) {
  if (!requests || requests.length === 0) {
    return '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No records found.</td></tr>';
  }

  return requests.map(req => {
    const requestDate = new Date(req.request_date);
    const formattedDateTime = requestDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
    
    // Format completed date/time if available
    let formattedCompletedDateTime = 'N/A';
    if (req.completed_at) {
      const completedDate = new Date(req.completed_at);
      formattedCompletedDateTime = completedDate.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    }
    
    const statusClass = req.status === 'completed' ? 'active' : req.status === 'in_progress' ? 'in-progress' : 'pending';
    return `
      <tr class="stock-history-row" onclick="viewStockCount('${req.id}')" style="cursor: pointer; background-color: #ffffff;">
        <td>${formattedDateTime}</td>
        <td>${req.requested_by_name || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${req.status.toUpperCase().replace('_', ' ')}</span></td>
        <td>${formattedCompletedDateTime}</td>
      </tr>
    `;
  }).join('');
}

// Filter stock count history by date range
window.filterStockCountHistory = function() {
  const startDate = document.getElementById('stock-history-start-date')?.value;
  const endDate = document.getElementById('stock-history-end-date')?.value;
  
  if (!window.stockCountHistoryRequests) {
    return;
  }

  let filtered = [...window.stockCountHistoryRequests];

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.request_date);
      reqDate.setHours(0, 0, 0, 0);
      return reqDate >= start;
    });
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.request_date);
      return reqDate <= end;
    });
  }

  // Update table body
  const tbody = document.getElementById('stock-history-tbody');
  if (tbody) {
    tbody.innerHTML = renderStockCountHistoryRows(filtered);
  }
}

// Clear stock count history filter
window.clearStockCountHistoryFilter = function() {
  const startDateInput = document.getElementById('stock-history-start-date');
  const endDateInput = document.getElementById('stock-history-end-date');
  
  if (!window.stockCountHistoryRequests || window.stockCountHistoryRequests.length === 0) {
    return;
  }

  // Reset to full date range
  const dates = window.stockCountHistoryRequests.map(r => new Date(r.request_date));
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  
  if (startDateInput) {
    startDateInput.value = oldestDate.toISOString().split('T')[0];
  }
  if (endDateInput) {
    endDateInput.value = newestDate.toISOString().split('T')[0];
  }

  // Show all records
  const tbody = document.getElementById('stock-history-tbody');
  if (tbody) {
    tbody.innerHTML = renderStockCountHistoryRows(window.stockCountHistoryRequests);
  }
}

// View Stock Count Details
window.viewStockCount = async function(requestId) {
  // Navigate to stock take details page
  window.location.href = `stock-take-details.html?requestId=${requestId}`;
};

// Check Stock Count Status
async function checkStockCountStatus() {
  try {
    if (!window.supabase) {
      return;
    }

    // Get the latest stock count request from Supabase
    const { data: latestRequest, error } = await window.supabase
      .from('stock_count_requests')
      .select('*')
      .order('request_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking stock count status:', error);
      return;
    }
    
    if (latestRequest) {
      const statusElement = document.getElementById('stock-count-status');
      if (statusElement) {
        const requestDate = new Date(latestRequest.request_date);
        const statusColor = latestRequest.status === 'completed' ? '#4caf50' : 
                           latestRequest.status === 'in_progress' ? '#ff9800' : '#2196f3';
        statusElement.innerHTML = `
          <p style="color: ${statusColor}; font-weight: bold; margin: 0;">
            ✓ Last request sent on ${requestDate.toLocaleString()} (${latestRequest.status.toUpperCase().replace('_', ' ')})
          </p>
        `;
      }
    }
  } catch (error) {
    console.error('Error checking stock count status:', error);
  }
}

// Load Log Book
// Store selected user filter
let selectedLogUser = null;

// Setup log book user filter button
function setupLogBookUserFilter() {
  const userFilterBtn = document.getElementById('log-user-filter-btn');
  const userSubmenu = document.getElementById('log-user-filter-submenu');
  
  if (!userFilterBtn || !userSubmenu) {
    console.warn('Log book user filter button or submenu not found');
    return;
  }
  
  console.log('Setting up log book user filter');

  // Load unique users from activity logs
  loadLogBookUsers();

  // Toggle submenu on button click
  userFilterBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('User filter button clicked');
    const isActive = userFilterBtn.classList.contains('active');
    
    // Close other submenus
    document.querySelectorAll('.status-submenu.show').forEach(menu => {
      if (menu !== userSubmenu) {
        menu.classList.remove('show');
      }
    });
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      if (btn !== userFilterBtn) {
        btn.classList.remove('active');
      }
    });
    
    if (isActive) {
      userFilterBtn.classList.remove('active');
      userSubmenu.classList.remove('show');
    } else {
      userFilterBtn.classList.add('active');
      userSubmenu.classList.add('show');
    }
  });

  // Close submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (!userFilterBtn.contains(e.target) && !userSubmenu.contains(e.target)) {
      userFilterBtn.classList.remove('active');
      userSubmenu.classList.remove('show');
    }
  });
}

// Load unique users from activity logs
async function loadLogBookUsers() {
  try {
    if (!window.supabase) return;

    const userSubmenu = document.getElementById('log-user-filter-submenu');
    if (!userSubmenu) return;

    // Get all unique users from activity logs
    const { data: logs, error } = await window.supabase
      .from('activity_logs')
      .select('user_name, user_id')
      .order('user_name', { ascending: true });

    if (error) {
      console.error('Error loading users for filter:', error);
      return;
    }

    // Get unique users
    const uniqueUsers = [];
    const userSet = new Set();
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        const userName = log.user_name;
        if (userName && !userSet.has(userName)) {
          userSet.add(userName);
          uniqueUsers.push({
            name: userName,
            id: log.user_id
          });
        }
      });
    }

    // Sort users alphabetically
    uniqueUsers.sort((a, b) => a.name.localeCompare(b.name));

    // Build submenu HTML
    let submenuHTML = '<button class="status-option-btn" data-user="all">ALL USERS</button>';
    uniqueUsers.forEach(user => {
      submenuHTML += `<button class="status-option-btn" data-user="${user.name}">${user.name}</button>`;
    });

    userSubmenu.innerHTML = submenuHTML;

    // Add click handlers for user options
    userSubmenu.querySelectorAll('.status-option-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const userName = this.dataset.user;
        const filterText = document.getElementById('log-user-filter-text');
        
        if (userName === 'all') {
          selectedLogUser = null;
          if (filterText) filterText.textContent = 'ALL USERS';
        } else {
          selectedLogUser = userName;
          if (filterText) filterText.textContent = userName.toUpperCase();
        }
        
        // Close submenu
        const userFilterBtn = document.getElementById('log-user-filter-btn');
        if (userFilterBtn) userFilterBtn.classList.remove('active');
        userSubmenu.classList.remove('show');
        
        // Reload log book with filter
        loadLogBook();
      });
    });
  } catch (error) {
    console.error('Error loading log book users:', error);
  }
}

// Helper function to parse date from DD/MM/YYYY format
function parseLogDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  
  dateString = dateString.trim();
  const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  const match = dateString.match(datePattern);
  
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
  
  if (day < 1 || day > 31 || month < 0 || month > 11 || fullYear < 1900 || fullYear > 2100) {
    return null;
  }
  
  const date = new Date(fullYear, month, day);
  if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === fullYear) {
    return date;
  }
  
  return null;
}

// Helper function to convert Date to YYYY-MM-DD format
function formatDateForQuery(date) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadLogBook() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const tbody = document.getElementById('log-book-body');
    if (!tbody) return;

    // Get dates from date picker inputs (DD/MM/YYYY format)
    const startDateInput = document.getElementById('log-start-date-input');
    const endDateInput = document.getElementById('log-end-date-input');
    
    let startDate = null;
    let endDate = null;
    
    if (startDateInput && startDateInput.value) {
      const parsedDate = parseLogDate(startDateInput.value);
      if (parsedDate) {
        startDate = formatDateForQuery(parsedDate);
      }
    }
    
    if (endDateInput && endDateInput.value) {
      const parsedDate = parseLogDate(endDateInput.value);
      if (parsedDate) {
        endDate = formatDateForQuery(parsedDate);
      }
    }

    // Query activity logs
    let query = window.supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (startDate) {
      query = query.gte('timestamp', startDate + 'T00:00:00');
    }
    if (endDate) {
      query = query.lte('timestamp', endDate + 'T23:59:59');
    }
    
    // Apply user filter if selected
    if (selectedLogUser && selectedLogUser !== 'all') {
      query = query.eq('user_name', selectedLogUser);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error loading log book:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading logs. Please try again.</td></tr>';
      return;
    }

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No activity logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const userName = log.user_name || 'Unknown';
      const timestamp = new Date(log.timestamp).toLocaleString();
      const hasReason = log.reason && log.reason.trim() !== '';
      const reasonButton = hasReason 
        ? `<button type="button" class="log-reason-view-btn" data-log-id="${log.id}" data-reason="${encodeURIComponent(log.reason)}">VIEW DETAILS</button>`
        : '<span style="color: #999;">-</span>';
      
      return `
        <tr>
          <td>${timestamp}</td>
          <td>${userName}</td>
          <td>${log.activity_type || 'N/A'}</td>
          <td>${log.entity_type || 'N/A'}</td>
          <td>${log.action_description || 'N/A'}</td>
          <td>${reasonButton}</td>
        </tr>
      `;
    }).join('');
    
    // Attach event listeners to reason view buttons
    setTimeout(() => {
      const reasonButtons = document.querySelectorAll('.log-reason-view-btn');
      reasonButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const logId = this.getAttribute('data-log-id');
          const reasonEncoded = this.getAttribute('data-reason');
          const reason = reasonEncoded ? decodeURIComponent(reasonEncoded) : null;
          showLogReason(logId, reason);
        });
      });
    }, 100);
  } catch (error) {
    console.error('Error loading log book:', error);
    const tbody = document.getElementById('log-book-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading logs. Please refresh the page.</td></tr>';
    }
  }
}

// Clear Log Filter
function clearLogFilter() {
  const startDateInput = document.getElementById('log-start-date-input');
  const endDateInput = document.getElementById('log-end-date-input');
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  
  selectedLogUser = null;
  const filterText = document.getElementById('log-user-filter-text');
  if (filterText) filterText.textContent = 'ALL USERS';
  const userFilterBtn = document.getElementById('log-user-filter-btn');
  if (userFilterBtn) userFilterBtn.classList.remove('active');
  const userSubmenu = document.getElementById('log-user-filter-submenu');
  if (userSubmenu) userSubmenu.classList.remove('show');
  
  // Clear date picker button active state
  const dateFilterBtn = document.getElementById('log-date-filter-btn');
  if (dateFilterBtn) dateFilterBtn.classList.remove('active');
  const datePicker = document.getElementById('log-date-picker');
  if (datePicker) datePicker.classList.remove('show');
  
  loadLogBook();
}

// Show log reason popup
window.showLogReason = function(logId, reasonText) {
  const popup = document.getElementById('log-reason-popup');
  const reasonContent = document.getElementById('log-reason-content');
  const closeBtn = document.getElementById('close-log-reason-btn');
  const okBtn = document.getElementById('close-log-reason-ok-btn');
  
  if (!popup || !reasonContent) return;
  
  const reason = reasonText || 'No reason provided.';
  reasonContent.textContent = reason;
  popup.style.display = 'flex';
  
  // Blur main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.add('blurred');
  }
  
  // Close handlers
  const closePopup = () => {
    popup.style.display = 'none';
    if (mainContent) {
      mainContent.classList.remove('blurred');
    }
  };
  
  if (closeBtn) {
    closeBtn.onclick = closePopup;
  }
  if (okBtn) {
    okBtn.onclick = closePopup;
  }
  
  // Close on overlay click
  popup.onclick = (e) => {
    if (e.target === popup) {
      closePopup();
    }
  };
};

// Expose functions to global scope for onclick handlers in HTML
window.loadLogBook = loadLogBook;
window.clearLogFilter = clearLogFilter;

// Log Activity (helper function)
async function logActivity(activityType, entityType, entityId, description, oldValue, newValue, reason = null) {
  try {
    if (!window.supabase) return;

    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const authUserId = userSession.userData?.id;
    const userEmail = userSession.userData?.email;
    const userName = userSession.userData?.username || userSession.userData?.email || 'Unknown';

    if (!authUserId) return;

    // Try to find staff record (multiple methods)
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

    const logEntry = {
      user_id: staffId,
      user_name: staffName,
      user_type: 'staff',
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      action_description: description,
      old_value: oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue) : null,
      new_value: newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : newValue) : null,
      timestamp: new Date().toISOString(),
      source: 'website',
      status: 'success',
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
      logs.push(logEntry);
      localStorage.setItem('activityLogs', JSON.stringify(logs));
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

