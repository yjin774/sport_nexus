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
    
    dayElement.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent event from bubbling to document click handler
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
      // Don't dismiss date picker - let user continue selecting or click back/outside to close
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
    if (typeof updateLogBookActiveFiltersDisplay === 'function') {
      updateLogBookActiveFiltersDisplay();
    }
  });
  
  // Stop propagation on date picker container to prevent outside click handler from closing it
  datePicker.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    // Check if click is inside date picker or date button using closest for better detection
    const isClickInsidePicker = e.target.closest('.date-picker') === datePicker;
    const isClickOnButton = dateBtn.contains(e.target);
    
    if (!isClickOnButton && !isClickInsidePicker) {
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
  // Require manager authentication before saving
  try {
    await requireManagerAuthentication(
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
    
    // Log activity (already logged in requireManagerAuthentication, but log additional details)
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
// Setup duration unit toggle
function setupDurationUnitToggle() {
  const daysBtn = document.getElementById('duration-unit-days');
  const monthsBtn = document.getElementById('duration-unit-months');
  const durationInput = document.getElementById('points-duration');
  const hintText = document.getElementById('points-duration-hint');
  
  if (!daysBtn || !monthsBtn || !durationInput) return;
  
  // Store current unit (default to days)
  let currentUnit = 'days';
  
  // Get current value from input (always in days in database)
  const currentDaysValue = parseInt(durationInput.value) || 365;
  
  // Update hint text based on current unit
  function updateHintText() {
    if (hintText) {
      hintText.textContent = currentUnit === 'days' 
        ? 'How long member points remain valid (in days)'
        : 'How long member points remain valid (in months)';
    }
  }
  
  // Convert days to months (assuming 30 days per month)
  function daysToMonths(days) {
    return Math.round((days / 30) * 100) / 100; // Round to 2 decimal places
  }
  
  // Convert months to days (assuming 30 days per month)
  function monthsToDays(months) {
    return Math.round(months * 30);
  }
  
  // Switch to days
  daysBtn.addEventListener('click', function() {
    if (currentUnit === 'months') {
      // Convert current value from months back to days
      const monthsValue = parseFloat(durationInput.value) || 12;
      durationInput.value = monthsToDays(monthsValue);
      currentUnit = 'days';
      
      daysBtn.classList.add('active');
      monthsBtn.classList.remove('active');
      updateHintText();
    }
  });
  
  // Switch to months
  monthsBtn.addEventListener('click', function() {
    if (currentUnit === 'days') {
      // Convert current value from days to months
      const daysValue = parseInt(durationInput.value) || 365;
      durationInput.value = daysToMonths(daysValue);
      currentUnit = 'months';
      
      monthsBtn.classList.add('active');
      daysBtn.classList.remove('active');
      updateHintText();
    }
  });
  
  // Initialize hint text
  updateHintText();
}

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
      // Initialize toggle switch (default to days)
      const daysBtn = document.getElementById('duration-unit-days');
      const monthsBtn = document.getElementById('duration-unit-months');
      if (daysBtn && monthsBtn) {
        daysBtn.classList.add('active');
        monthsBtn.classList.remove('active');
      }
      setupDurationUnitToggle();
      return;
    }

    if (data) {
      document.getElementById('points-to-rm').value = data.points_to_rm_ratio || '1.00';
      // Always display in days (database stores in days)
      document.getElementById('points-duration').value = data.points_duration_days || '365';
      document.getElementById('bill-ratio').value = data.bill_ratio_percentage || '20';
      document.getElementById('min-purchase-amount').value = data.min_purchase_amount_for_points || '0.00';
      document.getElementById('max-redemption-ratio').value = data.max_redemption_ratio_percentage || '20';
      
      // Initialize toggle switch (default to days)
      const daysBtn = document.getElementById('duration-unit-days');
      const monthsBtn = document.getElementById('duration-unit-months');
      if (daysBtn && monthsBtn) {
        daysBtn.classList.add('active');
        monthsBtn.classList.remove('active');
      }
    }
    
    // Setup duration unit toggle after loading settings
    setupDurationUnitToggle();
  } catch (error) {
    console.error('Error loading member policy settings:', error);
  }
}

// Save Member Policy Settings
async function saveMemberPolicySettings() {
  // Require manager authentication before saving
  try {
    await requireManagerAuthentication(
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

    // Get points duration value and convert to days if in months
    const durationInput = document.getElementById('points-duration');
    const durationValue = parseFloat(durationInput.value) || 365;
    const daysBtn = document.getElementById('duration-unit-days');
    const isDays = daysBtn && daysBtn.classList.contains('active');
    
    // Convert to days if currently in months
    const pointsDurationDays = isDays 
      ? Math.round(durationValue)
      : Math.round(durationValue * 30); // Convert months to days (30 days per month)
    
    const settings = {
      pointsToRM: parseFloat(document.getElementById('points-to-rm').value) || 1.00,
      pointsDuration: pointsDurationDays,
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
    
    // Log activity (already logged in requireManagerAuthentication, but log additional details)
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

    alert('Stock count request sent successfully to mobile POS system!');
    
    // Log activity
    logActivity('stock_count_request', 'stock_count', insertedData.id, 'Sent stock count request to mobile POS', null, requestData);
    
    // Refresh status display to show the new request
    await checkStockCountStatus();
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
      <!-- Filter Bar -->
      <div class="filter-bar" style="margin-bottom: 1rem;">
        <div class="date-btn-wrapper">
          <button class="filter-btn date-btn stock-history-date-btn" id="stock-history-date-filter-btn">
            <span id="stock-history-date-filter-text">DATE RANGE</span>
            <div style="position: relative; width: 16px; height: 16px;">
              <img src="image/sn_icon_arrow_up.png" alt="Arrow" class="filter-icon filter-icon-up" />
              <img src="image/sn_icon_hover_arrow_up.png" alt="Arrow" class="filter-icon-hover filter-icon-hover-up" />
              <img src="image/sn_icon_arrow_down.png" alt="Arrow" class="filter-icon filter-icon-down" />
              <img src="image/sn_icon_hover_arrow_down.png" alt="Arrow" class="filter-icon-hover filter-icon-hover-down" />
            </div>
          </button>
          <div class="date-picker" id="stock-history-date-picker">
            <div class="date-picker-inputs">
              <div class="date-input-group">
                <label>Start Date</label>
                <input type="text" class="date-input" id="stock-history-start-date-input" placeholder="DD/MM/YYYY" />
              </div>
              <div class="date-input-group">
                <label>End Date</label>
                <input type="text" class="date-input" id="stock-history-end-date-input" placeholder="DD/MM/YYYY" />
              </div>
            </div>
            <div class="date-picker-header">
              <select class="month-select" id="stock-history-month-select">
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
              <select class="year-select" id="stock-history-year-select"></select>
            </div>
            <div class="date-picker-weekdays">
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
              <div>S</div>
            </div>
            <div class="date-picker-days" id="stock-history-date-picker-days"></div>
            <div class="date-picker-actions">
              <button class="date-picker-back-btn">Back</button>
              <button class="date-picker-apply-btn">Apply</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Active Filters Display -->
      <div class="active-filters-container" id="stock-history-active-filters-container" style="display: none;">
        <div class="active-filters-label">Active Filters:</div>
        <div class="active-filters-chips" id="stock-history-active-filters-chips">
          <!-- Active filter chips will be added here dynamically -->
        </div>
        <button class="clear-filters-btn" onclick="clearStockCountHistoryFilter()">Clear All</button>
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
  
  // Setup date picker after rendering
  setupStockHistoryDatePicker();
  updateStockHistoryActiveFiltersDisplay();
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
    // Make row inactive if status is pending
    const isInactive = req.status === 'pending';
    const clickHandler = isInactive ? '' : `onclick="viewStockCount('${req.id}')"`;
    const cursorStyle = isInactive ? 'cursor: not-allowed;' : 'cursor: pointer;';
    const opacityStyle = isInactive ? 'opacity: 0.6;' : '';
    
    return `
      <tr class="stock-history-row ${isInactive ? 'inactive-row' : ''}" ${clickHandler} style="${cursorStyle} ${opacityStyle} background-color: #ffffff;">
        <td>${formattedDateTime}</td>
        <td>${req.requested_by_name || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${req.status.toUpperCase().replace('_', ' ')}</span></td>
        <td>${formattedCompletedDateTime}</td>
      </tr>
    `;
  }).join('');
}

// Setup Stock History Date Picker (matching setupLogBookDatePicker logic)
function setupStockHistoryDatePicker() {
  const dateBtn = document.getElementById('stock-history-date-filter-btn');
  if (!dateBtn) {
    console.warn('Stock history date filter button not found');
    return;
  }
  
  const datePicker = document.getElementById('stock-history-date-picker');
  if (!datePicker) {
    console.warn('Stock history date picker not found');
    return;
  }
  
  console.log('Setting up stock history date picker');
  
  const monthSelect = document.getElementById('stock-history-month-select');
  const yearSelect = document.getElementById('stock-history-year-select');
  const daysContainer = document.getElementById('stock-history-date-picker-days');
  const startDateInput = document.getElementById('stock-history-start-date-input');
  const endDateInput = document.getElementById('stock-history-end-date-input');
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
    
    dayElement.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent event from bubbling to document click handler
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
      // Don't dismiss date picker - let user continue selecting or click back/outside to close
    });
    
    return dayElement;
  }
  
  // Update date filter button text
  function updateDateFilterText() {
    const dateText = document.getElementById('stock-history-date-filter-text');
    if (!dateText) return;
    
    if (startDate && endDate) {
      dateText.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      dateText.textContent = formatDate(startDate);
    } else {
      dateText.textContent = 'DATE RANGE';
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
    filterStockCountHistory();
    updateStockHistoryActiveFiltersDisplay();
  });
  
  // Stop propagation on date picker container to prevent outside click handler from closing it
  datePicker.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    // Check if click is inside date picker or date button using closest for better detection
    const isClickInsidePicker = e.target.closest('.date-picker') === datePicker;
    const isClickOnButton = dateBtn.contains(e.target);
    
    if (!isClickOnButton && !isClickInsidePicker) {
      if (dateBtn.classList.contains('active')) {
        dateBtn.classList.remove('active');
        datePicker.classList.remove('show');
      }
    }
  });
  
  // Initialize
  initYearSelect();
}

// Filter stock count history by date range (updated to use new date inputs)
window.filterStockCountHistory = function() {
  const startDateInput = document.getElementById('stock-history-start-date-input');
  const endDateInput = document.getElementById('stock-history-end-date-input');
  
  if (!window.stockCountHistoryRequests) {
    return;
  }

  let filtered = [...window.stockCountHistoryRequests];

  // Parse dates from DD/MM/YYYY format
  let startDate = null;
  let endDate = null;
  
  if (startDateInput && startDateInput.value) {
    const parts = startDateInput.value.split('/');
    if (parts.length === 3) {
      startDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      startDate.setHours(0, 0, 0, 0);
    }
  }

  if (endDateInput && endDateInput.value) {
    const parts = endDateInput.value.split('/');
    if (parts.length === 3) {
      endDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      endDate.setHours(23, 59, 59, 999);
    }
  }

  if (startDate) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.request_date);
      reqDate.setHours(0, 0, 0, 0);
      return reqDate >= startDate;
    });
  }

  if (endDate) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.request_date);
      reqDate.setHours(0, 0, 0, 0);
      return reqDate <= endDate;
    });
  }

  const tbody = document.getElementById('stock-history-tbody');
  if (tbody) {
    tbody.innerHTML = renderStockCountHistoryRows(filtered);
  }
  
  updateStockHistoryActiveFiltersDisplay();
}

// Clear stock count history filter
window.clearStockCountHistoryFilter = function() {
  const startDateInput = document.getElementById('stock-history-start-date-input');
  const endDateInput = document.getElementById('stock-history-end-date-input');
  const dateBtn = document.getElementById('stock-history-date-filter-btn');
  const datePicker = document.getElementById('stock-history-date-picker');
  const dateText = document.getElementById('stock-history-date-filter-text');
  
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  if (dateBtn) dateBtn.classList.remove('active');
  if (datePicker) datePicker.classList.remove('show');
  if (dateText) dateText.textContent = 'DATE RANGE';

  // Show all records
  const tbody = document.getElementById('stock-history-tbody');
  if (tbody && window.stockCountHistoryRequests) {
    tbody.innerHTML = renderStockCountHistoryRows(window.stockCountHistoryRequests);
  }
  
  updateStockHistoryActiveFiltersDisplay();
}

// Update stock history active filters display
function updateStockHistoryActiveFiltersDisplay() {
  const container = document.getElementById('stock-history-active-filters-container');
  const chipsContainer = document.getElementById('stock-history-active-filters-chips');
  if (!container || !chipsContainer) return;
  
  const activeFilters = [];
  
  // Check date filter
  const startDate = document.getElementById('stock-history-start-date-input')?.value;
  const endDate = document.getElementById('stock-history-end-date-input')?.value;
  if (startDate || endDate) {
    const dateRange = [startDate, endDate].filter(Boolean).join(' - ');
    activeFilters.push({
      type: 'date',
      label: 'Date',
      value: dateRange,
      id: 'date'
    });
  }
  
  // Update display
  if (activeFilters.length > 0) {
    container.style.display = 'flex';
    chipsContainer.innerHTML = activeFilters.map(filter => `
      <div class="filter-chip" data-filter-type="${filter.type}" data-filter-id="${filter.id}">
        <span>${filter.label}: ${filter.value}</span>
        <span class="chip-remove" onclick="removeStockHistoryFilter('${filter.type}', '${filter.id}')">×</span>
      </div>
    `).join('');
  } else {
    container.style.display = 'none';
    chipsContainer.innerHTML = '';
  }
}

// Remove stock history filter
window.removeStockHistoryFilter = function(type, id) {
  if (type === 'date') {
    const startInput = document.getElementById('stock-history-start-date-input');
    const endInput = document.getElementById('stock-history-end-date-input');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    const dateBtn = document.getElementById('stock-history-date-filter-btn');
    if (dateBtn) {
      dateBtn.classList.remove('active');
      const dateText = document.getElementById('stock-history-date-filter-text');
      if (dateText) dateText.textContent = 'DATE RANGE';
      const datePicker = document.getElementById('stock-history-date-picker');
      if (datePicker) datePicker.classList.remove('show');
    }
    filterStockCountHistory();
  }
  updateStockHistoryActiveFiltersDisplay();
};

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
    const { data: requests, error } = await window.supabase
      .from('stock_count_requests')
      .select('*')
      .order('request_date', { ascending: false })
      .limit(1);
    
    const latestRequest = requests && requests.length > 0 ? requests[0] : null;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking stock count status:', error);
      return;
    }
    
    if (latestRequest) {
      updateStockCountStatusDisplay(latestRequest);
      updateSendRequestButtonState(latestRequest);
    } else {
      // No request found - show default message
      updateStockCountStatusDisplay(null);
      updateSendRequestButtonState(null);
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
        if (typeof updateLogBookActiveFiltersDisplay === 'function') {
          updateLogBookActiveFiltersDisplay();
        }
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
    let parsedEndDateObj = null;
    let parsedStartDateObj = null;
    
    console.log('=== LOG BOOK DATE FILTERING DEBUG ===');
    console.log('Start Date Input:', startDateInput ? startDateInput.value : 'null');
    console.log('End Date Input:', endDateInput ? endDateInput.value : 'null');
    
    if (startDateInput && startDateInput.value) {
      const parsedDate = parseLogDate(startDateInput.value);
      console.log('Parsed Start Date:', parsedDate);
      if (parsedDate) {
        parsedStartDateObj = parsedDate;
        startDate = formatDateForQuery(parsedDate);
        console.log('Formatted Start Date String:', startDate);
        console.log('Start Date Object:', {
          year: parsedDate.getFullYear(),
          month: parsedDate.getMonth(),
          date: parsedDate.getDate(),
          fullDate: parsedDate.toISOString()
        });
      }
    }
    
    if (endDateInput && endDateInput.value) {
      const parsedDate = parseLogDate(endDateInput.value);
      console.log('Parsed End Date:', parsedDate);
      if (parsedDate) {
        parsedEndDateObj = parsedDate;
        endDate = formatDateForQuery(parsedDate);
        console.log('Formatted End Date String:', endDate);
        console.log('End Date Object:', {
          year: parsedDate.getFullYear(),
          month: parsedDate.getMonth(),
          date: parsedDate.getDate(),
          fullDate: parsedDate.toISOString()
        });
      }
    }

    // Query activity logs
    let query = window.supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (startDate) {
      const startTimestamp = startDate + 'T00:00:00';
      console.log('Adding start date filter: gte("timestamp", "' + startTimestamp + '")');
      query = query.gte('timestamp', startTimestamp);
    }
    if (endDate && parsedEndDateObj) {
      // For end date, use less than the start of the next day to exclude the next day
      // This ensures that when start and end are the same date, only that date is included
      const nextDay = new Date(parsedEndDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      const nextDayStr = formatDateForQuery(nextDay);
      const endTimestamp = nextDayStr + 'T00:00:00';
      console.log('Calculated Next Day:', {
        originalEndDate: parsedEndDateObj.toISOString(),
        nextDay: nextDay.toISOString(),
        nextDayStr: nextDayStr,
        endTimestamp: endTimestamp
      });
      console.log('Adding end date filter: lt("timestamp", "' + endTimestamp + '")');
      console.log('This should exclude all timestamps >= ' + endTimestamp);
      query = query.lt('timestamp', endTimestamp);
    } else if (endDate) {
      // Fallback if parsing failed
      const endTimestamp = endDate + 'T23:59:59.999';
      console.log('Using fallback end date filter: lte("timestamp", "' + endTimestamp + '")');
      query = query.lte('timestamp', endTimestamp);
    }
    
    console.log('Final query filters applied');
    console.log('Expected date range: ' + (startDate || 'no start') + ' to ' + (endDate || 'no end'));
    
    // Apply user filter if selected
    if (selectedLogUser && selectedLogUser !== 'all') {
      query = query.eq('user_name', selectedLogUser);
    }

    const { data: logs, error } = await query;

    console.log('Query executed');
    console.log('Number of logs returned:', logs ? logs.length : 0);
    
    if (error) {
      console.error('Error loading log book:', error);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading logs. Please try again.</td></tr>';
      return;
    }

    if (!logs || logs.length === 0) {
      console.log('No logs found for the specified date range');
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No activity logs found.</td></tr>';
      return;
    }
    
    // Log all returned timestamps to check if filtering is working
    console.log('=== RETURNED LOGS TIMESTAMPS ===');
    
    // Filter logs client-side based on local date representation to match what user sees
    let filteredLogs = logs;
    if (startDate && endDate) {
      console.log('Filtering logs client-side based on local date representation...');
      console.log('Start date filter:', startDate);
      console.log('End date filter:', endDate);
      
      filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        // Get local date string (what user sees in the UI) - format as YYYY-MM-DD
        const logYear = logDate.getFullYear();
        const logMonth = String(logDate.getMonth() + 1).padStart(2, '0');
        const logDay = String(logDate.getDate()).padStart(2, '0');
        const logDateStr = `${logYear}-${logMonth}-${logDay}`;
        
        // Compare with start and end dates (also in YYYY-MM-DD format)
        const isInRange = logDateStr >= startDate && logDateStr <= endDate;
        
        console.log(`Log filter check: timestamp=${log.timestamp}, localDate=${logDateStr}, startDate=${startDate}, endDate=${endDate}, isInRange=${isInRange}`);
        
        if (!isInRange) {
          console.log(`  -> EXCLUDING this log (local date ${logDateStr} is outside range ${startDate} to ${endDate})`);
        } else {
          console.log(`  -> INCLUDING this log (local date ${logDateStr} is within range ${startDate} to ${endDate})`);
        }
        
        return isInRange;
      });
      console.log(`Filtered from ${logs.length} logs to ${filteredLogs.length} logs`);
    }
    
    logs.forEach((log, index) => {
      const logDate = new Date(log.timestamp);
      const logYear = logDate.getFullYear();
      const logMonth = String(logDate.getMonth() + 1).padStart(2, '0');
      const logDay = String(logDate.getDate()).padStart(2, '0');
      const logDateStr = `${logYear}-${logMonth}-${logDay}`;
      console.log(`Log ${index + 1}:`, {
        timestamp: log.timestamp,
        parsedDate: logDate.toISOString(),
        localDateString: logDateStr,
        shouldBeIncluded: startDate && endDate ? 
          (logDateStr >= startDate && logDateStr <= endDate) : 
          'N/A (no date filter)'
      });
    });
    console.log('=== END OF RETURNED LOGS ===');

    if (!filteredLogs || filteredLogs.length === 0) {
      console.log('No logs found after client-side filtering');
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No activity logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = filteredLogs.map(log => {
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
  if (typeof updateLogBookActiveFiltersDisplay === 'function') {
    updateLogBookActiveFiltersDisplay();
  }
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

// Update stock count status display
function updateStockCountStatusDisplay(latestRequest) {
  const statusElement = document.getElementById('stock-count-status');
  if (!statusElement) return;

  if (!latestRequest) {
    // No request - show friendly empty state
    statusElement.innerHTML = `
      <div style="text-align: center; padding: 1.5rem;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
        <p style="color: #666; font-size: 0.95rem; margin: 0 0 0.25rem 0; font-weight: 500;">No Stock Count Request</p>
        <p style="color: #999; font-size: 0.85rem; margin: 0;">Click "SEND REQUEST" to initiate a stock count</p>
      </div>
    `;
    return;
  }

  const requestDate = new Date(latestRequest.request_date);
  const formattedDate = requestDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let statusInfo = '';
  let statusColor = '#666';
  let statusBgColor = '#f5f5f5';
  let statusIcon = '📋';
  
  if (latestRequest.status === 'completed') {
    statusInfo = 'Completed';
    statusColor = '#4caf50';
    statusBgColor = '#e8f5e9';
    statusIcon = '✓';
  } else if (latestRequest.status === 'in_progress') {
    statusInfo = 'In Progress';
    statusColor = '#ff9800';
    statusBgColor = '#fff3e0';
    statusIcon = '⏳';
  } else if (latestRequest.status === 'pending') {
    statusInfo = 'Pending';
    statusColor = '#2196f3';
    statusBgColor = '#e3f2fd';
    statusIcon = '⏱️';
  }

  statusElement.innerHTML = `
    <div style="background: ${statusBgColor}; border-left: 4px solid ${statusColor}; border-radius: 6px; padding: 1rem 1.25rem;">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="font-size: 1.5rem; line-height: 1;">${statusIcon}</div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="color: ${statusColor}; font-weight: 600; font-size: 0.95rem; text-transform: uppercase;">${statusInfo}</span>
          </div>
          <p style="color: #666; font-size: 0.875rem; margin: 0 0 0.25rem 0;">Requested: ${formattedDate}</p>
          ${latestRequest.request_number ? `<p style="color: #999; font-size: 0.8rem; margin: 0;">Request #${latestRequest.request_number}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Update send request button state
function updateSendRequestButtonState(latestRequest) {
  const sendBtn = document.querySelector('.stock-count-btn[onclick="sendStockCountRequest()"]');
  if (!sendBtn) return;

  if (!latestRequest || latestRequest.status === 'completed') {
    // No request or completed - enable button
    sendBtn.disabled = false;
    sendBtn.style.opacity = '1';
    sendBtn.style.cursor = 'pointer';
    sendBtn.title = 'Send a new stock count request';
  } else {
    // Pending or in_progress - disable button
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.5';
    sendBtn.style.cursor = 'not-allowed';
    sendBtn.title = `Cannot send new request. Current request status: ${latestRequest.status === 'pending' ? 'Pending' : 'In Progress'}`;
  }
}

// Expose functions to global scope for onclick handlers in HTML
const originalLoadLogBook = loadLogBook;
window.loadLogBook = function() {
  originalLoadLogBook();
  if (typeof updateLogBookActiveFiltersDisplay === 'function') {
    updateLogBookActiveFiltersDisplay();
  }
};
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

