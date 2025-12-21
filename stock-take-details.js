// Stock Take Details JavaScript

// Global date formatting utility - formats dates as DD-MM-YYYY
function formatDateDisplay(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Global datetime formatting utility - formats dates as DD-MM-YYYY HH:MM
function formatDateTimeDisplay(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Store original stock items for filtering
let originalStockItems = [];
let currentDisplayedItems = [];
let selectedStockTakeCategory = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadStockTakeDetails();
  setupStockTakeDatePicker();
  setupStockTakeCategoryFilter();
});

// Get request ID from URL parameters
function getRequestIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('requestId');
}

// Load Stock Take Details
async function loadStockTakeDetails() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const requestId = getRequestIdFromURL();
    const tbody = document.getElementById('stock-take-body');
    
    if (!tbody) return;

    if (!requestId) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No stock take request ID provided.</td></tr>';
      return;
    }

    // Load stock count request from Supabase
    const { data: request, error: requestError } = await window.supabase
      .from('stock_count_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('Error loading stock count request:', requestError);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Stock take request not found.</td></tr>';
      return;
    }

    // Load stock count items from Supabase with product and category information
    // First, get the stock count items
    const { data: stockItemsData, error: itemsError } = await window.supabase
      .from('stock_count_items')
      .select('*')
      .eq('stock_count_request_id', requestId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error loading stock count items:', itemsError);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading stock items. Please try again.</td></tr>';
      return;
    }

    // Then, get product variant details for each item
    const stockItems = [];
    if (stockItemsData && stockItemsData.length > 0) {
      for (const item of stockItemsData) {
        if (!item.product_variant_id) {
          // Skip items without product variant
          continue;
        }

        // Get product variant with product and category info
        const { data: variantData, error: variantError } = await window.supabase
          .from('product_variants')
          .select(`
            id,
            variant_name,
            product_id,
            products (
              id,
              product_name,
              category_id,
              categories (
                id,
                category_name
              )
            )
          `)
          .eq('id', item.product_variant_id)
          .single();

        if (variantError) {
          console.error('Error loading product variant:', variantError);
          continue;
        }

        const product = variantData?.products;
        const category = product?.categories;

        stockItems.push({
          id: item.id,
          category: category?.category_name || 'N/A',
          itemName: variantData?.variant_name || product?.product_name || 'N/A',
          expected: item.expected_quantity || 0,
          counted: item.counted_quantity || 0,
          difference: item.difference_quantity || 0
        });
      }
    }

    if (itemsError) {
      console.error('Error loading stock count items:', itemsError);
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading stock items. Please try again.</td></tr>';
      return;
    }


    // If no items found, show message
    if (stockItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No stock items found for this request.</td></tr>';
      return;
    }

    // Store original items for filtering
    originalStockItems = stockItems;
    currentDisplayedItems = [...originalStockItems];

    // Populate category filter dropdown
    populateCategoryFilterDropdown(stockItems);

    // Display items
    displayStockItems(currentDisplayedItems);
    
    // Update active filters display
    updateStockTakeActiveFiltersDisplay();
  } catch (error) {
    console.error('Error loading stock take details:', error);
    const tbody = document.getElementById('stock-take-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">Error loading stock take details. Please try again.</td></tr>';
    }
  }
}

// Create Stock Row HTML
function createStockRow(item, index) {
  // Use difference from item if available, otherwise calculate
  const difference = item.difference !== undefined ? item.difference : (item.counted - item.expected);
  const hasDifference = difference !== 0;
  const differenceClass = hasDifference ? 'difference-error' : 'difference-ok';
  const icon = hasDifference 
    ? '<span style="color: #f44336; font-size: 1.2rem;">✗</span>' 
    : '<span style="color: #4caf50; font-size: 1.2rem;">✓</span>';
  
  const differenceText = difference > 0 ? `+${difference}` : difference.toString();

  return `
    <tr class="stock-take-row">
      <td>${index}</td>
      <td>${item.category || 'N/A'}</td>
      <td>${item.itemName || 'N/A'}</td>
      <td>${item.expected || 0}</td>
      <td>${item.counted || 0}</td>
      <td class="${differenceClass}">
        ${differenceText}
        ${icon}
      </td>
    </tr>
  `;
}

// Generate Sample Stock Items (for demonstration)
function generateSampleStockItems() {
  return [
    { category: 'SHIRT', itemName: 'SHIRT 1', expected: 1, counted: 1 },
    { category: 'SHIRT', itemName: 'SHIRT 2', expected: 1, counted: 0 },
    { category: 'SHIRT', itemName: 'SHIRT 3', expected: 1, counted: 1 },
    { category: 'SHIRT', itemName: 'SHIRT 4', expected: 1, counted: 2 },
    { category: 'SHIRT', itemName: 'SHIRT 5', expected: 1, counted: 1 },
    { category: 'SHIRT', itemName: 'SHIRT 6', expected: 1, counted: 1 }
  ];
}

// Populate Category Filter Dropdown
async function populateCategoryFilterDropdown(items) {
  // Get unique categories from items
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
  
  // Load categories into filter dropdown
  await loadCategoriesIntoStockTakeDropdown(categories);
}

// Load categories into stock take category filter dropdown
async function loadCategoriesIntoStockTakeDropdown(categories = []) {
  const scrollableFrame = document.getElementById('stock-take-category-list-scrollable-frame');
  if (!scrollableFrame) return;

  try {
    // Clear existing options
    scrollableFrame.innerHTML = '';

    // Add "ALL CATEGORIES" button
    const allBtn = document.createElement('button');
    allBtn.className = 'category-option-btn';
    allBtn.setAttribute('data-category', 'all');
    allBtn.textContent = 'ALL CATEGORIES';
    if (!selectedStockTakeCategory) {
      allBtn.classList.add('active');
    }
    scrollableFrame.appendChild(allBtn);

    // Add category buttons from items
    categories.forEach(category => {
      const categoryBtn = document.createElement('button');
      categoryBtn.className = 'category-option-btn';
      categoryBtn.setAttribute('data-category', category);
      categoryBtn.textContent = category;
      if (selectedStockTakeCategory === category) {
        categoryBtn.classList.add('active');
      }
      scrollableFrame.appendChild(categoryBtn);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Display Stock Items
function displayStockItems(items) {
  const tbody = document.getElementById('stock-take-body');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data-message">No items found matching the filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map((item, index) => createStockRow(item, index + 1)).join('');
}

// Filter Stock Take Items
window.filterStockTakeItems = function() {
  const startDateInput = document.getElementById('stock-take-start-date-input');
  const endDateInput = document.getElementById('stock-take-end-date-input');
  
  let filtered = [...originalStockItems];

  // Filter by category
  if (selectedStockTakeCategory && selectedStockTakeCategory !== 'all') {
    filtered = filtered.filter(item => item.category === selectedStockTakeCategory);
  }

  // Filter by date range (if items have date fields)
  // Note: Date filtering would be based on item dates if available
  // For now, we'll skip date filtering as stock items don't have individual dates
  // They're associated with a stock count request which has a date

  currentDisplayedItems = filtered;
  displayStockItems(currentDisplayedItems);
  updateStockTakeActiveFiltersDisplay();
}

// Clear Stock Take Filters
window.clearStockTakeFilters = function() {
  const startDateInput = document.getElementById('stock-take-start-date-input');
  const endDateInput = document.getElementById('stock-take-end-date-input');
  const dateBtn = document.getElementById('stock-take-date-filter-btn');
  const datePicker = document.getElementById('stock-take-date-picker');
  const dateText = document.getElementById('stock-take-date-filter-text');
  const categoryBtn = document.getElementById('stock-take-category-btn');
  const categoryText = document.getElementById('stock-take-category-text');
  const categorySubmenu = document.getElementById('stock-take-category-submenu');

  // Clear date inputs
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  if (dateBtn) dateBtn.classList.remove('active');
  if (datePicker) datePicker.classList.remove('show');
  if (dateText) dateText.textContent = 'DATE RANGE';

  // Clear category filter
  selectedStockTakeCategory = null;
  if (categoryBtn) categoryBtn.classList.remove('active');
  if (categorySubmenu) categorySubmenu.classList.remove('show');
  if (categoryText) categoryText.textContent = 'ALL CATEGORIES';
  
  // Reset active category buttons
  const categoryOptions = document.querySelectorAll('#stock-take-category-list-scrollable-frame .category-option-btn');
  categoryOptions.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-category') === 'all') {
      btn.classList.add('active');
    }
  });

  // Show all items
  currentDisplayedItems = [...originalStockItems];
  displayStockItems(currentDisplayedItems);
  updateStockTakeActiveFiltersDisplay();
}

// Export Stock Count to PDF
window.exportStockCountPDF = async function() {
  try {
    if (typeof window.jspdf === 'undefined') {
      alert('PDF library not loaded. Please refresh the page and try again.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    // Get current displayed items (filtered)
    const itemsToExport = currentDisplayedItems.length > 0 ? currentDisplayedItems : originalStockItems;
    
    if (itemsToExport.length === 0) {
      alert('No stock items to export.');
      return;
    }

    // Get request information
    const requestId = getRequestIdFromURL();
    let requestInfo = null;
    if (requestId && window.supabase) {
      const { data: request } = await window.supabase
        .from('stock_count_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      requestInfo = request;
    }

    // Get company settings (if available)
    let companyName = 'Sport Nexus';
    let companyAddress = '';
    if (window.supabase) {
      const { data: settings } = await window.supabase
        .from('settings')
        .select('*')
        .eq('singleton', true)
        .single();
      if (settings) {
        companyName = settings.business_name || companyName;
        companyAddress = settings.company_address || '';
      }
    }

    // Page dimensions with increased margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // Increased from 15 to 20mm for better spacing
    const topMargin = 25; // Extra top margin for header
    const bottomMargin = 20; // Bottom margin for footer
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = topMargin;

    // Header Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCK COUNT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10; // Increased spacing

    // Company Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8; // Increased spacing

    if (companyAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addressLines = doc.splitTextToSize(companyAddress, contentWidth);
      doc.text(addressLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += addressLines.length * 5 + 3; // Added extra spacing
    }

    yPosition += 8; // Increased spacing before report info

    // Report Information - centered
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = formatDateDisplay(new Date());
    doc.text(`Report Date: ${reportDate}`, pageWidth / 2, yPosition, { align: 'center' });
    
    if (requestInfo) {
      yPosition += 6; // Increased line spacing
      const requestDate = formatDateDisplay(requestInfo.request_date);
      doc.text(`Stock Count Date: ${requestDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      if (requestInfo.request_number) {
        yPosition += 6;
        doc.text(`Request Number: ${requestInfo.request_number}`, pageWidth / 2, yPosition, { align: 'center' });
      }
      
      if (requestInfo.requested_by_name) {
        yPosition += 6;
        doc.text(`Requested By: ${requestInfo.requested_by_name}`, pageWidth / 2, yPosition, { align: 'center' });
      }
    }

    yPosition += 12; // Increased spacing before table

    // Prepare table data
    const tableData = itemsToExport.map((item, index) => [
      index + 1,
      item.category || 'N/A',
      item.itemName || 'N/A',
      item.expected || 0,
      item.counted || 0,
      item.difference !== undefined ? item.difference : (item.counted - item.expected)
    ]);

    // Calculate totals
    const totalExpected = itemsToExport.reduce((sum, item) => sum + (item.expected || 0), 0);
    const totalCounted = itemsToExport.reduce((sum, item) => sum + (item.counted || 0), 0);
    const totalDifference = itemsToExport.reduce((sum, item) => {
      const diff = item.difference !== undefined ? item.difference : (item.counted - item.expected);
      return sum + diff;
    }, 0);

    // Add summary row
    tableData.push([
      'TOTAL',
      '',
      '',
      totalExpected,
      totalCounted,
      totalDifference
    ]);

    // Calculate total table width from column widths
    const columnWidths = [15, 40, 60, 25, 25, 30];
    const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    
    // Calculate left margin to center the table horizontally
    const centeredLeftMargin = (pageWidth - totalTableWidth) / 2;
    
    // Generate table with centered alignment
    doc.autoTable({
      startY: yPosition,
      head: [['No', 'Category', 'Item Name', 'Expected', 'Counted', 'Difference']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [157, 88, 88], // #9D5858
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 } // Increased cell padding
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' }
      },
      styles: {
        cellPadding: 4, // Increased from 3 to 4
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      didParseCell: function(data) {
        // Style the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        }
        // Style difference column - red for negative, green for positive
        if (data.column.index === 5 && data.row.index < tableData.length - 1) {
          const value = data.cell.text[0];
          if (parseInt(value) < 0) {
            data.cell.styles.textColor = [244, 67, 54]; // Red
          } else if (parseInt(value) > 0) {
            data.cell.styles.textColor = [76, 175, 80]; // Green
          }
        }
      },
      margin: { 
        left: centeredLeftMargin, 
        right: centeredLeftMargin
      },
      tableWidth: totalTableWidth, // Use actual table width for proper centering
      pageBreak: 'auto', // Auto page break if content exceeds page
      showHead: 'everyPage' // Show header on every page
    });

    // Get final Y position after table
    const finalY = doc.lastAutoTable.finalY;
    yPosition = finalY + 12; // Increased spacing before summary

    // Add summary section - centered
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8; // Increased spacing

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${itemsToExport.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6; // Increased line spacing
    doc.text(`Total Expected Quantity: ${totalExpected}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Total Counted Quantity: ${totalCounted}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    const diffColor = totalDifference < 0 ? [244, 67, 54] : totalDifference > 0 ? [76, 175, 80] : [0, 0, 0];
    doc.setTextColor(...diffColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Difference: ${totalDifference > 0 ? '+' : ''}${totalDifference}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Footer with proper bottom margin
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const footerY = pageHeight - (bottomMargin / 2); // Position footer with bottom margin
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${formatDateTimeDisplay(new Date())}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }

    // Generate filename
    const filename = `Stock_Count_Report_${requestInfo?.request_number || requestId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF: ' + error.message);
  }
};

// Go Back
function goBack() {
  window.history.back();
  // Or navigate to general settings
  // window.location.href = 'general-settings.html';
}

// Setup Stock Take Date Picker (similar to log book date picker)
function setupStockTakeDatePicker() {
  const dateBtn = document.getElementById('stock-take-date-filter-btn');
  if (!dateBtn) {
    console.warn('Stock take date filter button not found');
    return;
  }

  const datePicker = document.getElementById('stock-take-date-picker');
  if (!datePicker) {
    console.warn('Stock take date picker not found');
    return;
  }

  const monthSelect = document.getElementById('stock-take-month-select');
  const yearSelect = document.getElementById('stock-take-year-select');
  const daysContainer = document.getElementById('stock-take-date-picker-days');
  const startDateInput = document.getElementById('stock-take-start-date-input');
  const endDateInput = document.getElementById('stock-take-end-date-input');
  const backBtn = datePicker.querySelector('.date-picker-back-btn');
  const applyBtn = datePicker.querySelector('.date-picker-apply-btn');

  if (!monthSelect || !yearSelect || !daysContainer || !startDateInput || !endDateInput || !backBtn || !applyBtn) return;

  let currentDate = new Date();
  let startDate = null;
  let endDate = null;
  let isSelectingStart = true;

  // Format date to DD-MM-YYYY
  function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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
      e.stopPropagation();
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
    const filterText = document.getElementById('stock-take-date-filter-text');
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
        updateStockTakeActiveFiltersDisplay();
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
        updateStockTakeActiveFiltersDisplay();
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
        updateStockTakeActiveFiltersDisplay();
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
        updateStockTakeActiveFiltersDisplay();
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
    window.filterStockTakeItems();
    updateStockTakeActiveFiltersDisplay();
  });

  // Stop propagation on date picker container
  datePicker.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
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

// Setup Stock Take Category Filter
function setupStockTakeCategoryFilter() {
  const categoryBtn = document.getElementById('stock-take-category-btn');
  if (!categoryBtn) return;

  const categorySubmenu = document.getElementById('stock-take-category-submenu');
  if (!categorySubmenu) return;

  categoryBtn.addEventListener('click', async function(e) {
    e.stopPropagation();
    const isActive = this.classList.contains('active');

    if (isActive) {
      this.classList.remove('active');
      categorySubmenu.classList.remove('show');
    } else {
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

  // Handle category option clicks
  document.addEventListener('click', function(e) {
    const categoryOption = e.target.closest('.category-option-btn');
    if (!categoryOption || !categorySubmenu.contains(categoryOption)) return;

    e.stopPropagation();
    const categoryId = categoryOption.getAttribute('data-category');

    // Update active state
    const categoryOptions = categorySubmenu.querySelectorAll('.category-option-btn');
    categoryOptions.forEach(btn => btn.classList.remove('active'));
    categoryOption.classList.add('active');

    // Update button text
    const categoryText = document.getElementById('stock-take-category-text');
    if (categoryText) {
      categoryText.textContent = categoryOption.textContent.toUpperCase();
    }

    // Close submenu
    categoryBtn.classList.remove('active');
    categorySubmenu.classList.remove('show');

    // Update selected category
    selectedStockTakeCategory = categoryId === 'all' ? null : categoryId;

    // Filter items
    window.filterStockTakeItems();
    updateStockTakeActiveFiltersDisplay();
  });
}

// Update Stock Take Active Filters Display
function updateStockTakeActiveFiltersDisplay() {
  const container = document.getElementById('stock-take-active-filters-container');
  const chipsContainer = document.getElementById('stock-take-active-filters-chips');
  if (!container || !chipsContainer) return;

  const activeFilters = [];

  // Check date filter
  const startDate = document.getElementById('stock-take-start-date-input')?.value;
  const endDate = document.getElementById('stock-take-end-date-input')?.value;
  if (startDate || endDate) {
    const dateRange = [startDate, endDate].filter(Boolean).join(' - ');
    activeFilters.push({
      type: 'date',
      label: 'Date',
      value: dateRange,
      id: 'date'
    });
  }

  // Check category filter
  if (selectedStockTakeCategory && selectedStockTakeCategory !== 'all') {
    const categoryText = document.getElementById('stock-take-category-text')?.textContent || selectedStockTakeCategory;
    activeFilters.push({
      type: 'category',
      label: 'Category',
      value: categoryText,
      id: 'category'
    });
  }

  // Update display
  if (activeFilters.length > 0) {
    container.style.display = 'flex';
    chipsContainer.innerHTML = activeFilters.map(filter => `
      <div class="filter-chip" data-filter-type="${filter.type}" data-filter-id="${filter.id}">
        <span>${filter.label}: ${filter.value}</span>
        <span class="chip-remove" onclick="removeStockTakeFilter('${filter.type}', '${filter.id}')">×</span>
      </div>
    `).join('');
  } else {
    container.style.display = 'none';
    chipsContainer.innerHTML = '';
  }
}

// Remove Stock Take Filter
window.removeStockTakeFilter = function(type, id) {
  if (type === 'date') {
    const startInput = document.getElementById('stock-take-start-date-input');
    const endInput = document.getElementById('stock-take-end-date-input');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    const dateBtn = document.getElementById('stock-take-date-filter-btn');
    if (dateBtn) {
      dateBtn.classList.remove('active');
      const dateText = document.getElementById('stock-take-date-filter-text');
      if (dateText) dateText.textContent = 'DATE RANGE';
      const datePicker = document.getElementById('stock-take-date-picker');
      if (datePicker) datePicker.classList.remove('show');
    }
    window.filterStockTakeItems();
  } else if (type === 'category') {
    selectedStockTakeCategory = null;
    const categoryBtn = document.getElementById('stock-take-category-btn');
    const categoryText = document.getElementById('stock-take-category-text');
    const categorySubmenu = document.getElementById('stock-take-category-submenu');
    if (categoryBtn) categoryBtn.classList.remove('active');
    if (categorySubmenu) categorySubmenu.classList.remove('show');
    if (categoryText) categoryText.textContent = 'ALL CATEGORIES';
    
    // Reset active category buttons
    const categoryOptions = document.querySelectorAll('#stock-take-category-list-scrollable-frame .category-option-btn');
    categoryOptions.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-category') === 'all') {
        btn.classList.add('active');
      }
    });
    
    window.filterStockTakeItems();
  }

  updateStockTakeActiveFiltersDisplay();
};

