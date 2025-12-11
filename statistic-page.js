/* ============================================
   STATISTIC PAGE FUNCTIONALITY
   ============================================ */

// Chart instance
let salesChart = null;
let currentChartType = 'histogram'; // 'histogram', 'bar', 'pie'

// Store all transactions data
let allTransactions = [];
let dateRangeFilter = null; // { startDate: Date, endDate: Date }

// Sales data for charts (loaded from Supabase)
const salesData = {
  labels: [],
  thisMonth: [],
  lastMonth: [],
  categories: ['Growth', 'Degrowth', 'Product'],
  categoryValues: [28, 32, 40],
  financial: [],
  product: []
};

// Initialize statistic page
document.addEventListener('DOMContentLoaded', function() {
  initializeStatisticPage();
});

async function initializeStatisticPage() {
  // Set up date range display (default to first day of current year until today)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of day
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year
  firstDayOfYear.setHours(0, 0, 0, 0); // Set to start of day
  dateRangeFilter = { startDate: firstDayOfYear, endDate: today };
  
  // Set up date picker first
  setupStatisticDatePicker();
  
  // Load sales data from Supabase
  await loadSalesData();
  
  // Initialize chart with default type (histogram/line)
  renderChart('histogram');
  
  // Set up chart type switching
  setupChartTypeSwitching();
  
  // Set up report buttons
  setupReportButtons();
}

// Set up chart type switching
function setupChartTypeSwitching() {
  const histogramOptions = document.querySelectorAll('.histogram-option-btn');
  
  histogramOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const chartType = this.getAttribute('data-chart-type');
      
      // Remove active class from all options
      histogramOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      this.classList.add('active');
      
      // Render the selected chart type
      renderChart(chartType);
    });
  });
}

// Render chart based on type
function renderChart(type) {
  currentChartType = type;
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (salesChart) {
    salesChart.destroy();
  }
  
  // Get the number of labels to determine x-axis configuration
  const labelCount = salesData.labels ? salesData.labels.length : 0;
  
  // Update chart title and legend based on type
  const chartTitle = document.getElementById('chart-title');
  const chartLegend = document.getElementById('chart-legend');
  
  if (type === 'histogram') {
    // Line chart (histogram)
    chartTitle.textContent = 'Sale';
    chartLegend.innerHTML = `
      <span class="legend-item">
        <span class="legend-dot this-month"></span> This Month
      </span>
      <span class="legend-item">
        <span class="legend-dot last-month"></span> Last Month
      </span>
    `;
    
    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: salesData.labels,
        datasets: [
          {
            label: 'This Month',
            data: salesData.thisMonth,
            borderColor: '#9D5858',
            backgroundColor: 'rgba(157, 88, 88, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#9D5858',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Last Month',
            data: salesData.lastMonth,
            borderColor: '#C8CCE9',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#C8CCE9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#9D5858',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                return 'RM' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000) {
                  return (value / 1000) + 'k';
                }
                return value;
              },
              color: '#666',
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#666',
              font: {
                size: labelCount > 30 ? 9 : 11 // Smaller font if many dates
              },
              maxRotation: labelCount > 15 ? 45 : 0, // Rotate if many dates
              minRotation: labelCount > 15 ? 45 : 0,
              autoSkip: labelCount > 50, // Auto-skip only if more than 50 dates
              maxTicksLimit: labelCount > 50 ? 50 : undefined // Limit to 50 if too many
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
    
  } else if (type === 'pie') {
    // Pie/Donut chart
    chartTitle.textContent = 'Sales Distribution';
    chartLegend.innerHTML = `
      <span class="legend-item">
        <span class="legend-dot" style="background: #f0a5a5;"></span> Growth ${salesData.categoryValues[0]}%
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background: #9D5858;"></span> Degrowth ${salesData.categoryValues[1]}%
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background: #7C79BE;"></span> Product ${salesData.categoryValues[2]}%
      </span>
    `;
    
    salesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: salesData.categories,
        datasets: [{
          data: salesData.categoryValues,
          backgroundColor: [
            '#f0a5a5',
            '#9D5858',
            '#7C79BE'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#9D5858',
            padding: 12,
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          },
        },
        cutout: '60%'
      }
    });
    
  } else if (type === 'bar') {
    // Bar chart
    chartTitle.textContent = 'Sales Comparison';
    chartLegend.innerHTML = `
      <span class="legend-item">
        <span class="legend-dot" style="background: #f0a5a5;"></span> FINANCIAL
      </span>
      <span class="legend-item">
        <span class="legend-dot" style="background: #9D5858;"></span> PRODUCT
      </span>
    `;
    
    salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: salesData.labels,
        datasets: [
          {
            label: 'FINANCIAL',
            data: salesData.financial,
            backgroundColor: '#f0a5a5',
            borderColor: '#f0a5a5',
            borderWidth: 0,
            borderRadius: 4
          },
          {
            label: 'PRODUCT',
            data: salesData.product,
            backgroundColor: '#9D5858',
            borderColor: '#9D5858',
            borderWidth: 0,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#9D5858',
            padding: 12,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': RM' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000) {
                  return (value / 1000) + 'k';
                }
                return value;
              },
              color: '#666',
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#666',
              font: {
                size: labelCount > 30 ? 9 : 11 // Smaller font if many dates
              },
              maxRotation: labelCount > 15 ? 45 : 0, // Rotate if many dates
              minRotation: labelCount > 15 ? 45 : 0,
              autoSkip: labelCount > 50, // Auto-skip only if more than 50 dates
              maxTicksLimit: labelCount > 50 ? 50 : undefined // Limit to 50 if too many
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}


// Set up report buttons
function setupReportButtons() {
  const csvBtn = document.getElementById('csv-report-btn');
  const pdfBtn = document.getElementById('pdf-report-btn');
  
  if (csvBtn) {
    csvBtn.addEventListener('click', function() {
      generateReport('csv');
    });
  }
  
  if (pdfBtn) {
    pdfBtn.addEventListener('click', function() {
      generateReport('pdf');
    });
  }
}

// Set up date picker for statistic page
function setupStatisticDatePicker() {
  const dateBtn = document.getElementById('statistic-date-filter-btn');
  if (!dateBtn) return;
  
  const datePicker = document.getElementById('statistic-date-picker');
  if (!datePicker) return;
  
  const monthSelect = document.getElementById('statistic-month-select');
  const yearSelect = document.getElementById('statistic-year-select');
  const daysContainer = document.getElementById('statistic-date-picker-days');
  const startDateInput = document.getElementById('statistic-start-date-input');
  const endDateInput = document.getElementById('statistic-end-date-input');
  const backBtn = datePicker.querySelector('.date-picker-back-btn');
  const applyBtn = datePicker.querySelector('.date-picker-apply-btn');
  
  let currentDate = new Date();
  let startDate = dateRangeFilter ? dateRangeFilter.startDate : null;
  let endDate = dateRangeFilter ? dateRangeFilter.endDate : null;
  let isSelectingStart = true;
  
  // Format date to DD/MM/YYYY
  function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Format date for display (26 OCT 2025)
  function formatDisplayDate(date) {
    if (!date) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  
  // Parse date from DD/MM/YYYY or DD-MM-YYYY format
  function parseDate(dateString) {
    if (!dateString || dateString.trim() === '') return null;
    
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
    const existingError = datePicker.querySelector('.date-validation-error');
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
    if (startDateInput) startDateInput.value = formatDate(startDate);
    if (endDateInput) endDateInput.value = formatDate(endDate);
  }
  
  // Update date range display
  function updateDateRangeDisplay() {
    const dateRangeDisplay = document.getElementById('date-range-display');
    if (!dateRangeDisplay) return;
    
    if (startDate && endDate) {
      dateRangeDisplay.textContent = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    } else {
      // Default: first day of current year until today
      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      dateRangeDisplay.textContent = `${formatDisplayDate(firstDayOfYear)} - ${formatDisplayDate(today)}`;
    }
  }
  
  // Navigate to date
  function navigateToDate(date) {
    if (!date) return;
    monthSelect.value = date.getMonth();
    yearSelect.value = date.getFullYear();
    renderCalendar();
  }
  
  // Initialize year dropdown
  function initYearSelect() {
    const currentYear = currentDate.getFullYear();
    yearSelect.innerHTML = '';
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      if (i === currentYear) option.selected = true;
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
    const adjustedStart = (startingDayOfWeek + 6) % 7;
    
    daysContainer.innerHTML = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      daysContainer.appendChild(createDayElement(day, date, true));
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      daysContainer.appendChild(createDayElement(day, date, false));
    }
    
    // Next month days
    const totalCells = daysContainer.children.length;
    const remainingCells = 35 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      daysContainer.appendChild(createDayElement(day, date, true));
    }
  }
  
  // Create day element
  function createDayElement(day, date, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'date-day';
    dayElement.textContent = day;
    dayElement.dataset.date = date.toISOString().split('T')[0];
    
    if (isOtherMonth) dayElement.classList.add('other-month');
    
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
      if (dateStr === startStr) dayElement.classList.add('selected');
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
  
  // Initialize with default dates (first day of year to today) if not set
  if (!startDate || !endDate) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    firstDayOfYear.setHours(0, 0, 0, 0);
    startDate = firstDayOfYear;
    endDate = today;
    // Update dateRangeFilter with default dates
    if (!dateRangeFilter) {
      dateRangeFilter = { startDate, endDate };
    }
    updateInputFields();
  }
  
  // Initialize
  initYearSelect();
  if (startDate && endDate) {
    updateInputFields();
    navigateToDate(startDate);
  } else {
    renderCalendar();
  }
  
  // Update date range display on initialization
  updateDateRangeDisplay();
  
  // Toggle date picker
  dateBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isActive = dateBtn.classList.contains('active');
    
    if (isActive) {
      dateBtn.classList.remove('active');
      datePicker.classList.remove('show');
    } else {
      dateBtn.classList.add('active');
      datePicker.classList.add('show');
      if (startDate) navigateToDate(startDate);
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!dateBtn.contains(e.target) && !datePicker.contains(e.target)) {
      dateBtn.classList.remove('active');
      datePicker.classList.remove('show');
    }
  });
  
  // Handle input fields
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
  }
  
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
  }
  
  // Month/Year change
  monthSelect.addEventListener('change', renderCalendar);
  yearSelect.addEventListener('change', renderCalendar);
  
  // Back button - only dismiss the date picker, don't reset dates
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dateBtn.classList.remove('active');
      datePicker.classList.remove('show');
      // Don't reset startDate and endDate - keep the current selection
    });
  }
  
  // Apply button
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
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
        
        dateRangeFilter = { startDate, endDate };
        updateDateRangeDisplay();
        loadSalesData(); // Reload data with new date range
      } else {
        // If dates are not set, use default (first day of year to today)
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        firstDayOfYear.setHours(0, 0, 0, 0);
        startDate = firstDayOfYear;
        endDate = today;
        dateRangeFilter = { startDate, endDate };
        updateDateRangeDisplay();
        loadSalesData();
      }
      
      dateBtn.classList.remove('active');
      datePicker.classList.remove('show');
    });
  }
}

// Update date range display
function updateDateRangeDisplay() {
  const dateRangeDisplay = document.getElementById('date-range-display');
  if (!dateRangeDisplay) return;
  
  if (dateRangeFilter && dateRangeFilter.startDate && dateRangeFilter.endDate) {
    const formatDisplayDate = (date) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    dateRangeDisplay.textContent = `${formatDisplayDate(dateRangeFilter.startDate)} - ${formatDisplayDate(dateRangeFilter.endDate)}`;
  } else {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const formatDisplayDate = (date) => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    dateRangeDisplay.textContent = `${formatDisplayDate(lastMonth)} - ${formatDisplayDate(today)}`;
  }
}

// Load sales data from Supabase
async function loadSalesData() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      updateSalesTable([]);
      updateKPICards({ grossSale: 0, refunds: 0, discounts: 0, netSales: 0, grossProfit: 0, cost: 0 });
      return;
    }
    
    // Build query with date range filter
    let query = window.supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    
    // Apply date range filter if set
    if (dateRangeFilter && dateRangeFilter.startDate && dateRangeFilter.endDate) {
      const startDateStr = dateRangeFilter.startDate.toISOString().split('T')[0];
      const endDateStr = dateRangeFilter.endDate.toISOString().split('T')[0] + 'T23:59:59.999Z';
      query = query.gte('transaction_date', startDateStr).lte('transaction_date', endDateStr);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.log('Error loading transactions:', error);
      updateSalesTable([]);
      updateKPICards({ grossSale: 0, refunds: 0, discounts: 0, netSales: 0, grossProfit: 0, cost: 0 });
      return;
    }
    
    allTransactions = data || [];
    
    // Always process data (even if empty) to ensure chart updates correctly
    processSalesData(allTransactions);
    
  } catch (error) {
    console.error('Error loading sales data:', error);
    updateSalesTable([]);
    updateKPICards({ grossSale: 0, refunds: 0, discounts: 0, netSales: 0, grossProfit: 0 });
  }
}

// Process sales data for charts
function processSalesData(transactions) {
  // Calculate KPI totals
  let grossSale = 0;
  let refunds = 0;
  let discounts = 0;
  let netSales = 0;
  let grossProfit = 0;
  let totalCost = 0;
  
  // Group by date and calculate totals
  const dailySales = {};
  const salesTransactions = [];
  const refundTransactions = [];
  
  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.total_amount || 0);
    const discount = parseFloat(transaction.discount_amount || 0);
    const subtotal = parseFloat(transaction.subtotal || 0);
    
    // Gross Profit Calculation:
    // Gross Profit = Net Sales - Cost of Goods Sold (COGS)
    // Net Sales = total_amount - discount_amount
    // COGS = subtotal (subtotal represents the cost before discounts and taxes)
    // 
    // NOTE: Negative gross profit is NORMAL if:
    // 1. Costs exceed revenue (e.g., selling items at a loss)
    // 2. High discounts are applied
    // 3. The subtotal field contains the actual cost basis
    // 
    // For more accurate profit calculation, we should ideally sum cost_price from transaction_items table,
    // but since we're working with transactions table only, we use subtotal as cost basis.
    // If your data shows consistently negative profits, verify that:
    // - transaction_items.cost_price is being populated correctly
    // - The relationship between subtotal and actual COGS is correct
    const netSalesAmount = amount - discount;
    const costOfGoods = subtotal; // Subtotal represents the base cost
    const profit = netSalesAmount - costOfGoods;
    
    if (transaction.transaction_type === 'sale' && transaction.status === 'completed') {
      grossSale += amount;
      discounts += discount;
      netSales += netSalesAmount;
      grossProfit += profit;
      totalCost += costOfGoods;
      salesTransactions.push(transaction);
    } else if (transaction.transaction_type === 'return' || transaction.transaction_type === 'refund') {
      refunds += amount;
      refundTransactions.push(transaction);
    }
    
    const date = new Date(transaction.transaction_date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = {
        grossSale: 0,
        refunds: 0,
        discounts: 0,
        netSales: 0,
        cost: 0
      };
    }
    
    if (transaction.transaction_type === 'sale' && transaction.status === 'completed') {
      dailySales[dateKey].grossSale += amount;
      dailySales[dateKey].discounts += discount;
      dailySales[dateKey].netSales += amount - discount;
      dailySales[dateKey].cost += costOfGoods;
    }
    
    if (transaction.transaction_type === 'return' || transaction.transaction_type === 'refund') {
      dailySales[dateKey].refunds += amount;
    }
  });
  
  // Update KPI cards
  updateKPICards({ grossSale, refunds, discounts, netSales, grossProfit, cost: totalCost });
  
  // Prepare chart data based on date range filter
  let chartDates = [];
  
  if (dateRangeFilter && dateRangeFilter.startDate && dateRangeFilter.endDate) {
    // Generate dates for the selected date range
    const startDate = new Date(dateRangeFilter.startDate);
    const endDate = new Date(dateRangeFilter.endDate);
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      chartDates.push(dateKey);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    // Use all available dates
    chartDates = Object.keys(dailySales).sort();
    // Limit to last 30 days if no filter
    if (chartDates.length > 30) {
      chartDates = chartDates.slice(-30);
    }
  }
  
  // Check if we have any data in the selected date range
  // First check if we have any transactions at all
  if (transactions.length === 0) {
    // No transactions at all - clear all chart data
    salesData.labels = chartDates.map(date => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    });
    
    // Fill with zeros for all dates in range
    salesData.thisMonth = new Array(chartDates.length).fill(0);
    salesData.lastMonth = new Array(chartDates.length).fill(0);
    salesData.financial = new Array(chartDates.length).fill(0);
    salesData.product = new Array(chartDates.length).fill(0);
    salesData.categoryValues = [0, 0, 0];
    
    // Destroy and re-render chart with empty data
    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }
    renderChart(currentChartType);
    
    // Update sales table
    updateSalesTable(transactions);
    return;
  }
  
  // Check if we have any data in the selected date range
  const hasDataInRange = chartDates.some(date => dailySales[date] && (dailySales[date].grossSale > 0 || dailySales[date].netSales > 0));
  
  if (!hasDataInRange) {
    // No data in the selected date range - clear all chart data
    // But still show the date range labels
    salesData.labels = chartDates.map(date => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    });
    
    // Fill with zeros for all dates in range
    salesData.thisMonth = new Array(chartDates.length).fill(0);
    salesData.lastMonth = new Array(chartDates.length).fill(0);
    salesData.financial = new Array(chartDates.length).fill(0);
    salesData.product = new Array(chartDates.length).fill(0);
    salesData.categoryValues = [0, 0, 0];
    
    // Destroy and re-render chart with empty data
    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }
    renderChart(currentChartType);
    
    // Update sales table
    updateSalesTable(transactions);
    return;
  }
  
  // Prepare labels and data for charts
  salesData.labels = chartDates.map(date => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  
  // Filter dailySales to only include dates in the selected range
  const filteredDailySales = {};
  chartDates.forEach(date => {
    if (dailySales[date]) {
      filteredDailySales[date] = dailySales[date];
    }
  });
  
  // For line chart - calculate this month and last month data based on actual sales
  // Only use data from the filtered date range
  salesData.thisMonth = chartDates.map(date => {
    return filteredDailySales[date] ? filteredDailySales[date].netSales : 0;
  });
  
  // For last month, we need to compare with previous period
  // If date range is selected, calculate the previous period of the same length
  if (dateRangeFilter && dateRangeFilter.startDate && dateRangeFilter.endDate) {
    const rangeStart = new Date(dateRangeFilter.startDate);
    const rangeEnd = new Date(dateRangeFilter.endDate);
    const rangeLength = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)); // Days in range
    
    // Calculate previous period (same length, ending the day before the start date)
    const prevPeriodEnd = new Date(rangeStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - rangeLength);
    
    // Create a map of previous period dates
    const prevPeriodDates = {};
    const currentDate = new Date(prevPeriodStart);
    while (currentDate <= prevPeriodEnd) {
      const dateKey = currentDate.toISOString().split('T')[0];
      prevPeriodDates[dateKey] = true;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Map current period dates to previous period data
    salesData.lastMonth = chartDates.map((date, index) => {
      // Find corresponding date in previous period
      const currentDate = new Date(date);
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - rangeLength - 1);
      const prevDateKey = prevDate.toISOString().split('T')[0];
      
      return dailySales[prevDateKey] ? dailySales[prevDateKey].netSales : 0;
    });
  } else {
    // Default: compare with previous month
    const today = new Date();
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    salesData.lastMonth = chartDates.map(date => {
      const d = new Date(date);
      if (d >= lastMonthStart && d <= lastMonthEnd) {
        return filteredDailySales[date] ? filteredDailySales[date].netSales : 0;
      }
      return 0;
    });
  }
  
  // For bar chart - calculate financial vs product (using payment method as proxy)
  // Only use transactions within the filtered date range
  salesData.financial = chartDates.map(date => {
    // Only include transactions that are in the filtered date range
    const dayTransactions = salesTransactions.filter(t => {
      const tDate = new Date(t.transaction_date).toISOString().split('T')[0];
      return tDate === date && (t.payment_method === 'card' || t.payment_method === 'mobile_payment');
    });
    return dayTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount || 0) - parseFloat(t.discount_amount || 0), 0);
  });
  
  salesData.product = chartDates.map(date => {
    // Only include transactions that are in the filtered date range
    const dayTransactions = salesTransactions.filter(t => {
      const tDate = new Date(t.transaction_date).toISOString().split('T')[0];
      return tDate === date && t.payment_method === 'cash';
    });
    return dayTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount || 0) - parseFloat(t.discount_amount || 0), 0);
  });
  
  // For pie chart - calculate growth/degrowth/product percentages
  const totalSales = netSales;
  const totalRefunds = refunds;
  const growth = totalSales > 0 ? Math.max(0, ((totalSales - totalRefunds) / totalSales) * 100) : 0;
  const degrowth = totalRefunds > 0 && totalSales > 0 ? (totalRefunds / totalSales) * 100 : 0;
  const product = Math.max(0, 100 - growth - degrowth);
  
  salesData.categoryValues = [
    Math.round(growth),
    Math.round(degrowth),
    Math.round(product)
  ];
  
  // Re-render chart with updated data
  if (salesChart) {
    renderChart(currentChartType);
  }
  
  // Update sales table
  updateSalesTable(transactions);
}

// Update KPI cards with real data
function updateKPICards(kpis) {
  const formatCurrency = (amount) => {
    const value = parseFloat(amount);
    return 'RM' + Math.abs(value).toFixed(2);
  };
  
  const formatCurrencyWithColor = (amount, alwaysShowNegative = false) => {
    const value = parseFloat(amount);
    // If alwaysShowNegative is true, always show '-' prefix for red-colored values
    // Otherwise, only show '-' if value is actually negative
    const sign = (alwaysShowNegative || value < 0) ? '-' : '';
    const formatted = sign + 'RM' + Math.abs(value).toFixed(2);
    return {
      text: formatted,
      isPositive: value >= 0
    };
  };
  
  const grossSaleEl = document.getElementById('gross-sale');
  const refundsEl = document.getElementById('refunds');
  const discountsEl = document.getElementById('discounts');
  const netSalesEl = document.getElementById('net-sales');
  const grossProfitEl = document.getElementById('gross-profit');
  const costEl = document.getElementById('cost');
  
  // Gross Sale - green if positive, red if negative (with '-' prefix if negative)
  if (grossSaleEl) {
    const grossSaleValue = parseFloat(kpis.grossSale || 0);
    const formatted = formatCurrencyWithColor(grossSaleValue);
    grossSaleEl.textContent = formatted.text;
    grossSaleEl.style.color = grossSaleValue >= 0 ? '#28a745' : '#dc3545';
  }
  
  // Refunds - always red, always show '-' prefix to indicate it's a deduction
  if (refundsEl) {
    const formatted = formatCurrencyWithColor(kpis.refunds, true);
    refundsEl.textContent = formatted.text;
    refundsEl.style.color = '#dc3545'; // Red
  }
  
  // Discounts - always red, always show '-' prefix to indicate it's a deduction
  if (discountsEl) {
    const formatted = formatCurrencyWithColor(kpis.discounts, true);
    discountsEl.textContent = formatted.text;
    discountsEl.style.color = '#dc3545'; // Red
  }
  
  // Net Sales - can be positive or negative (with '-' prefix if negative/red)
  if (netSalesEl) {
    const netSalesValue = parseFloat(kpis.netSales || 0);
    const formatted = formatCurrencyWithColor(netSalesValue);
    netSalesEl.textContent = formatted.text;
    netSalesEl.style.color = netSalesValue >= 0 ? '#28a745' : '#dc3545';
  }
  
  // Gross Profit - can be positive or negative (with '-' prefix if negative/red)
  if (grossProfitEl) {
    const grossProfitValue = parseFloat(kpis.grossProfit || 0);
    const formatted = formatCurrencyWithColor(grossProfitValue);
    grossProfitEl.textContent = formatted.text;
    grossProfitEl.style.color = grossProfitValue >= 0 ? '#28a745' : '#dc3545';
  }
  
  // Cost - red if > 0.00 (with '-' prefix), green if = 0.00
  if (costEl) {
    const costValue = parseFloat(kpis.cost || 0);
    const formatted = formatCurrencyWithColor(costValue, costValue > 0);
    costEl.textContent = formatted.text;
    costEl.style.color = costValue > 0 ? '#dc3545' : '#28a745'; // Red if > 0, green if = 0
  }
}


// Generate report
function generateReport(format) {
  console.log('Generating', format.toUpperCase(), 'report');
  
  if (!dateRangeFilter || !dateRangeFilter.startDate || !dateRangeFilter.endDate) {
    alert('Please select a date range before generating a report.');
    return;
  }
  
  // Get current KPI values
  const grossSaleEl = document.getElementById('gross-sale');
  const refundsEl = document.getElementById('refunds');
  const discountsEl = document.getElementById('discounts');
  const netSalesEl = document.getElementById('net-sales');
  const costEl = document.getElementById('cost');
  const grossProfitEl = document.getElementById('gross-profit');
  
  const kpis = {
    grossSale: grossSaleEl ? grossSaleEl.textContent : 'RM0.00',
    refunds: refundsEl ? refundsEl.textContent : 'RM0.00',
    discounts: discountsEl ? discountsEl.textContent : 'RM0.00',
    netSales: netSalesEl ? netSalesEl.textContent : 'RM0.00',
    cost: costEl ? costEl.textContent : 'RM0.00',
    grossProfit: grossProfitEl ? grossProfitEl.textContent : 'RM0.00'
  };
  
  // Get sales table data
  const tableRows = document.querySelectorAll('.sales-table tbody tr');
  const salesData = [];
  
  tableRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      salesData.push({
        date: cells[0].textContent.trim(),
        grossSale: cells[1].textContent.trim(),
        refunds: cells[2].textContent.trim(),
        discounts: cells[3].textContent.trim(),
        netSales: cells[4].textContent.trim(),
        cost: cells[5].textContent.trim()
      });
    }
  });
  
  // Format date range for display
  const formatDisplayDate = (date) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  const startDateStr = formatDisplayDate(dateRangeFilter.startDate);
  const endDateStr = formatDisplayDate(dateRangeFilter.endDate);
  const dateRange = `${startDateStr} - ${endDateStr}`;
  
  if (format === 'csv') {
    generateCSVReport(kpis, salesData, dateRange);
  } else if (format === 'pdf') {
    generatePDFReport(kpis, salesData, dateRange);
  }
}

// Generate CSV Report
function generateCSVReport(kpis, salesData, dateRange) {
  let csvContent = 'SALES REPORT\n';
  csvContent += `Date Range: ${dateRange}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  // KPI Summary
  csvContent += 'KPI SUMMARY\n';
  csvContent += 'Metric,Value\n';
  csvContent += `Gross Sale,${kpis.grossSale}\n`;
  csvContent += `Refunds,${kpis.refunds}\n`;
  csvContent += `Discounts,${kpis.discounts}\n`;
  csvContent += `Net Sales,${kpis.netSales}\n`;
  csvContent += `Cost,${kpis.cost}\n`;
  csvContent += `Gross Profit,${kpis.grossProfit}\n\n`;
  
  // Sales Data Table
  csvContent += 'DETAILED SALES DATA\n';
  csvContent += 'Date,Gross Sale,Refunds,Discounts,Net Sales,Cost\n';
  
  salesData.forEach(row => {
    // Remove color styling and clean the values
    const cleanValue = (val) => val.replace(/[^\d.\-RM,]/g, '').trim();
    csvContent += `${row.date},${cleanValue(row.grossSale)},${cleanValue(row.refunds)},${cleanValue(row.discounts)},${cleanValue(row.netSales)},${cleanValue(row.cost)}\n`;
  });
  
  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Sales_Report_${dateRange.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate PDF Report
function generatePDFReport(kpis, salesData, dateRange) {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page and try again.');
    return;
  }
  
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
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES REPORT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Date Range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Range: ${dateRange}`, margin, yPos);
  yPos += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 10;
  
  // KPI Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KPI SUMMARY', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const kpiLabels = [
    ['Gross Sale', kpis.grossSale],
    ['Refunds', kpis.refunds],
    ['Discounts', kpis.discounts],
    ['Net Sales', kpis.netSales],
    ['Cost', kpis.cost],
    ['Gross Profit', kpis.grossProfit]
  ];
  
  const kpiColWidth = (pageWidth - 2 * margin) / 2;
  let kpiX = margin;
  let kpiY = yPos;
  
  kpiLabels.forEach((label, index) => {
    if (index > 0 && index % 2 === 0) {
      kpiX = margin;
      kpiY += 7;
      checkPageBreak(7);
    } else if (index > 0) {
      kpiX = margin + kpiColWidth;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(label[0] + ':', kpiX, kpiY);
    doc.setFont('helvetica', 'normal');
    doc.text(label[1], kpiX + 50, kpiY);
  });
  
  yPos = kpiY + (Math.ceil(kpiLabels.length / 2) * 7) + 10;
  checkPageBreak(10);
  
  // Sales Data Table
  if (salesData.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED SALES DATA', margin, yPos);
    yPos += 8;
    
    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const tableHeaders = ['Date', 'Gross Sale', 'Refunds', 'Discounts', 'Net Sales', 'Cost'];
    const colWidths = [25, 30, 25, 25, 30, 25];
    let xPos = margin;
    
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    
    yPos += 6;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += 3;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    salesData.forEach((row, index) => {
      checkPageBreak(8);
      
      // Clean values (remove HTML color styling)
      const cleanValue = (val) => {
        return val.replace(/[^\d.\-RM,]/g, '').trim();
      };
      
      xPos = margin;
      const rowData = [
        row.date,
        cleanValue(row.grossSale),
        cleanValue(row.refunds),
        cleanValue(row.discounts),
        cleanValue(row.netSales),
        cleanValue(row.cost)
      ];
      
      rowData.forEach((data, i) => {
        // Truncate if too long
        const text = data.length > 15 ? data.substring(0, 12) + '...' : data;
        doc.text(text, xPos, yPos);
        xPos += colWidths[i];
      });
      
      yPos += 6;
      
      // Add separator line every 10 rows
      if ((index + 1) % 10 === 0 && index < salesData.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
        yPos += 2;
      }
    });
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('No sales data available for the selected date range.', margin, yPos);
  }
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Download PDF
  const fileName = `Sales_Report_${dateRange.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

// Update sales table with data
function updateSalesTable(transactions) {
  const tbody = document.querySelector('.sales-table tbody');
  if (!tbody) return;
  
  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No sales data available.</td></tr>';
    return;
  }
  
  // Group transactions by date
  const dailyData = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date);
    const dateKey = date.toISOString().split('T')[0];
    const subtotal = parseFloat(transaction.subtotal || 0);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        grossSale: 0,
        refunds: 0,
        discounts: 0,
        netSales: 0,
        cost: 0
      };
    }
    
    if (transaction.transaction_type === 'sale' && transaction.status === 'completed') {
      dailyData[dateKey].grossSale += parseFloat(transaction.total_amount || 0);
      dailyData[dateKey].discounts += parseFloat(transaction.discount_amount || 0);
      dailyData[dateKey].netSales += parseFloat(transaction.total_amount || 0) - parseFloat(transaction.discount_amount || 0);
      dailyData[dateKey].cost += subtotal;
    }
    
    if (transaction.transaction_type === 'return' || transaction.transaction_type === 'refund') {
      dailyData[dateKey].refunds += parseFloat(transaction.total_amount || 0);
    }
  });
  
  // Convert to array and sort by date (newest first)
  const sortedData = Object.values(dailyData).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return 'RM' + parseFloat(amount).toFixed(2);
  };
  
  // Format currency with color (for negative values)
  const formatCurrencyWithColor = (amount, alwaysShowNegative = false) => {
    const value = parseFloat(amount);
    // If alwaysShowNegative is true, always show '-' prefix (for red-colored values)
    // Otherwise, only show '-' if value is actually negative
    const sign = (alwaysShowNegative || value < 0) ? '-' : '';
    return sign + 'RM' + Math.abs(value).toFixed(2);
  };
  
  tbody.innerHTML = sortedData.map(item => {
    // Format values with '-' prefix for red-colored values
    const netSalesFormatted = formatCurrencyWithColor(item.netSales);
    const netSalesColor = item.netSales >= 0 ? '#28a745' : '#dc3545';
    
    // Gross Sale: green if positive, red if negative (with '-' prefix if negative/red)
    const grossSaleFormatted = formatCurrencyWithColor(item.grossSale);
    const grossSaleColor = item.grossSale >= 0 ? '#28a745' : '#dc3545';
    
    // Refunds and discounts are always displayed in red with '-' prefix
    const refundsFormatted = formatCurrencyWithColor(item.refunds, true);
    const discountsFormatted = formatCurrencyWithColor(item.discounts, true);
    
    // Cost: red if > 0.00 (with '-' prefix), green if = 0.00
    const costFormatted = formatCurrencyWithColor(item.cost, item.cost > 0);
    const costColor = item.cost > 0 ? '#dc3545' : '#28a745';
    
    return `
    <tr>
      <td data-label="DATE">${formatDate(item.date)}</td>
      <td data-label="GROSS SALE" style="color: ${grossSaleColor}">${grossSaleFormatted}</td>
      <td data-label="REFUNDS" style="color: #dc3545">${refundsFormatted}</td>
      <td data-label="DISCOUNTS" style="color: #dc3545">${discountsFormatted}</td>
      <td data-label="NET SALES" style="color: ${netSalesColor}">${netSalesFormatted}</td>
      <td data-label="COST" style="color: ${costColor}">${costFormatted}</td>
    </tr>
  `;
  }).join('');
}

