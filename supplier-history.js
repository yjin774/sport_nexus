/* ============================================
   SUPPLIER HISTORY PAGE - Completed Orders Only
   ============================================ */

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

// Store original orders data for filtering
let originalOrdersData = [];

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
  loadCompletedOrders();
  setupSupplierHistoryFilters();
  updateSupplierUserDisplay();
});

// Load completed purchase orders
async function loadCompletedOrders() {
  const tbody = document.getElementById('completed-orders-body');
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

    // Get completed and cancelled purchase orders for this supplier
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
      .limit(100);

    if (error) {
      console.error('Error loading completed orders:', error);
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Error loading history. Please try again.</td></tr>';
      return;
    }

    if (!purchaseOrders || purchaseOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">No order history</td></tr>';
      originalOrdersData = [];
      applySupplierHistoryFilters();
      return;
    }

    // Store original data for filtering
    originalOrdersData = purchaseOrders;

    // Remove any existing filtered "no data" message before rendering
    const tbody = document.getElementById('completed-orders-body');
    if (tbody) {
      const filteredMessage = tbody.querySelector('.no-data-filtered-message');
      if (filteredMessage) {
        filteredMessage.remove();
      }
    }
    
    // Render orders
    renderOrders(purchaseOrders);
    
    // Apply any existing filters
    applySupplierHistoryFilters();
  } catch (error) {
    console.error('Error loading completed orders:', error);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data-message">Error loading history. Please refresh the page.</td></tr>';
    }
  }
}

// Render orders to table
function renderOrders(orders) {
  const tbody = document.getElementById('completed-orders-body');
  if (!tbody) return;

  tbody.innerHTML = orders.map(po => {
    const items = po.purchase_order_items || [];
    const firstItem = items[0];
    const productName = firstItem?.product_variants?.products?.product_name || 'N/A';
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
    
    // Format order item: show first product name and total quantity if multiple items
    const orderItemText = items.length > 1 
      ? `${productName} + ${items.length - 1} more`
      : productName;

    const expectedDelivery = po.expected_delivery_date 
      ? formatDateDisplay(po.expected_delivery_date) 
      : 'N/A';

    const orderDate = po.order_date ? new Date(po.order_date) : new Date(po.created_at);
    const status = po.status || 'pending';
    
    // Determine status badge class and text
    let statusClass = 'active'; // Default for completed
    let statusText = 'COMPLETED';
    
    if (status === 'cancelled') {
      statusClass = 'cancelled';
      statusText = 'CANCELLED';
    } else if (status === 'completed') {
      statusClass = 'active';
      statusText = 'COMPLETED';
    } else {
      // Handle other statuses if needed
      statusClass = 'pending';
      statusText = status.toUpperCase().replace(/_/g, ' ');
    }

    return `
      <tr class="supplier-po-history-row" 
          data-po-id="${po.id}"
          data-status="${status}"
          data-order-date="${orderDate.toISOString()}"
          style="cursor: pointer;">
        <td>${formatDateDisplay(orderDate)}</td>
        <td>${po.po_number || 'N/A'}</td>
        <td>${orderItemText}</td>
        <td>${totalQuantity}</td>
        <td style="text-align: right;">RM ${(po.total_amount || 0).toFixed(2)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${expectedDelivery}</td>
      </tr>
    `;
  }).join('');
  
  // Add click handlers to table rows
  const historyRows = tbody.querySelectorAll('.supplier-po-history-row');
  historyRows.forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('.status-badge')) return;
      const poId = this.getAttribute('data-po-id');
      if (poId && typeof showSupplierPODetails === 'function') {
        showSupplierPODetails(poId);
      }
    });
  });
}

// Setup all filters (status, search, date)
function setupSupplierHistoryFilters() {
  // Status filter
  const statusBtn = document.getElementById('supplier-status-filter-btn');
  if (statusBtn) {
    // Set "ALL STATUS" as default active option
    const allStatusOption = document.querySelector('#supplier-status-submenu .status-option-btn[data-status="all"]');
    if (allStatusOption) {
      allStatusOption.classList.add('active');
    }
    
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
        statusOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        statusBtn.classList.remove('active');
        document.getElementById('supplier-status-submenu').classList.remove('show');
        applySupplierHistoryFilters();
      });
    });
  }

  // Search filter
  const searchInput = document.getElementById('supplier-history-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      applySupplierHistoryFilters();
    });
  }

  // Date picker - use the setup from dashboard.js if available, otherwise use custom setup
  if (typeof setupSupplierHistoryDatePicker === 'function') {
    // The function exists in dashboard.js, but we need to ensure it works with our table
    // We'll override the filterPOHistoryByDateRange to use our applySupplierHistoryFilters
    const originalFilter = window.filterPOHistoryByDateRange;
    window.filterPOHistoryByDateRange = function(startDate, endDate) {
      window.supplierHistoryDateFilterRange = { start: startDate, end: endDate };
      applySupplierHistoryFilters();
    };
    setupSupplierHistoryDatePicker();
  } else {
    setupSupplierHistoryDatePickerCustom();
  }

  // Close status submenu when clicking outside
  document.addEventListener('click', function(e) {
    if (statusBtn && !statusBtn.contains(e.target) && !document.getElementById('supplier-status-submenu')?.contains(e.target)) {
      statusBtn.classList.remove('active');
      document.getElementById('supplier-status-submenu')?.classList.remove('show');
    }
  });
}

// Apply all filters (search, status, date) - similar to applySupplierIncomingFilters
function applySupplierHistoryFilters() {
  const searchInput = document.getElementById('supplier-history-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const activeStatusOption = document.querySelector('#supplier-status-submenu .status-option-btn.active');
  const status = activeStatusOption ? (activeStatusOption.dataset.status === 'all' ? null : activeStatusOption.dataset.status) : null;
  const dateRange = window.supplierHistoryDateFilterRange || null;
  
  const rows = document.querySelectorAll('#completed-orders-body tr');
  rows.forEach(row => {
    if (row.classList.contains('no-data-message')) return;
    
    let shouldShow = true;
    
    // Apply status filter
    if (status) {
      const rowStatus = row.getAttribute('data-status') || '';
      const statusCell = row.cells[5];
      // Normalize cell status: remove spaces, convert to lowercase
      const cellStatus = statusCell?.textContent.trim().toLowerCase().replace(/\s+/g, '') || '';
      const matchStatus = status.toLowerCase();
      
      let statusMatch = false;
      if (matchStatus === 'shipped') {
        statusMatch = rowStatus === 'partially_received' || cellStatus === 'shipped';
      } else {
        // Match by data-status attribute or by cell text content (normalized)
        // For 'cancelled', match both 'cancelled' and 'cancelled' (from "CANCELLED" text)
        statusMatch = rowStatus === matchStatus || cellStatus === matchStatus || cellStatus.includes(matchStatus);
      }
      if (!statusMatch) shouldShow = false;
    }
    
    // Apply date filter
    if (shouldShow && dateRange && dateRange.start && dateRange.end) {
      const dateCell = row.cells[0];
      if (dateCell) {
        const rowDateText = dateCell.textContent.trim();
        const rowDate = parseSupplierDate(rowDateText);
        if (!rowDate || rowDate < dateRange.start || rowDate > dateRange.end) {
          shouldShow = false;
        }
      } else {
        shouldShow = false;
      }
    }
    
    // Apply search filter
    if (shouldShow && searchTerm) {
      const rowText = row.textContent.toLowerCase();
      if (!rowText.includes(searchTerm)) {
        shouldShow = false;
      }
    }
    
    row.style.display = shouldShow ? '' : 'none';
  });
  
  // Check if any rows are visible after filtering
  const visibleRows = Array.from(document.querySelectorAll('#completed-orders-body tr')).filter(row => 
    !row.classList.contains('no-data-message') && row.style.display !== 'none'
  );
  
  // Show "no data" message if filters are active but no results
  const hasActiveFilters = status || dateRange || searchTerm;
  const tbody = document.getElementById('completed-orders-body');
  if (tbody && hasActiveFilters && visibleRows.length === 0) {
    // Check if no-data message already exists
    let noDataRow = tbody.querySelector('.no-data-filtered-message');
    if (!noDataRow) {
      noDataRow = document.createElement('tr');
      noDataRow.className = 'no-data-message no-data-filtered-message';
      noDataRow.innerHTML = `<td colspan="7" class="no-data-message">No orders match the selected filters. Please adjust your filters and try again.</td>`;
      tbody.appendChild(noDataRow);
    }
    noDataRow.style.display = '';
  } else if (tbody) {
    // Remove no-data message if there are results or no filters
    const noDataRow = tbody.querySelector('.no-data-filtered-message');
    if (noDataRow) {
      noDataRow.style.display = 'none';
    }
  }
  
  updateSupplierHistoryActiveFiltersDisplay();
}

// Setup Supplier History Date Picker (custom implementation - fallback only)
function setupSupplierHistoryDatePickerCustom() {
  const dateBtn = document.getElementById('supplier-history-date-btn');
  if (!dateBtn) return;
  
  const datePicker = document.getElementById('supplier-history-date-picker');
  if (!datePicker) return;
  
  // Use setupDatePicker from dashboard.js if available
  if (typeof setupDatePicker === 'function') {
    setupDatePicker(
      'supplier-history-date-btn',
      'supplier-history-date-picker',
      'supplier-history-start-date-input',
      'supplier-history-end-date-input',
      'supplier-history-month-select',
      'supplier-history-year-select',
      'supplier-history-date-picker-days',
      'supplier-history-date-text',
      function(startDate, endDate) {
        if (startDate && endDate) {
          window.supplierHistoryDateFilterRange = { start: startDate, end: endDate };
        } else if (startDate) {
          window.supplierHistoryDateFilterRange = { start: startDate, end: startDate };
        } else {
          window.supplierHistoryDateFilterRange = null;
        }
        applySupplierHistoryFilters();
      }
    );
  } else {
    // Fallback: basic date picker setup
    console.warn('Date picker setup functions not available');
    dateBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isActive = this.classList.contains('active');
      if (isActive) {
        this.classList.remove('active');
        datePicker.classList.remove('show');
      } else {
        this.classList.add('active');
        datePicker.classList.add('show');
      }
    });
  }
}

// Parse date from various formats (similar to parseSupplierDate in dashboard.js)
function parseSupplierDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  dateString = dateString.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY format
  const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  const match = dateString.match(datePattern);
  if (match) {
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
  }
  
  return null;
}

// Clear filters
window.clearSupplierHistoryFilters = function() {
  const searchInput = document.getElementById('supplier-history-search-input');
  if (searchInput) searchInput.value = '';
  
  // Reset status filter
  const allStatusOption = document.querySelector('#supplier-status-submenu .status-option-btn[data-status="all"]');
  if (allStatusOption) {
    document.querySelectorAll('#supplier-status-submenu .status-option-btn').forEach(opt => opt.classList.remove('active'));
    allStatusOption.classList.add('active');
  }
  
  // Reset date filter
  const dateBtn = document.getElementById('supplier-history-date-btn');
  if (dateBtn) {
    dateBtn.classList.remove('active');
    const dateText = document.getElementById('supplier-history-date-text');
    if (dateText) dateText.textContent = 'DATE';
    const datePicker = document.getElementById('supplier-history-date-picker');
    if (datePicker) datePicker.classList.remove('show');
  }

  const startDateInput = document.getElementById('supplier-history-start-date-input');
  const endDateInput = document.getElementById('supplier-history-end-date-input');
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  
  window.supplierHistoryDateFilterRange = null;

  applySupplierHistoryFilters();
};

// Update supplier user display
async function updateSupplierUserDisplay() {
  const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userData = userSession.userData;
  
  if (userData) {
    const displayName = userData.company_name || 
                       userData.contact_person ||
                       (userData.email ? userData.email.split('@')[0] : 'SUPPLIER001');
    
    const userIdElement = document.getElementById('supplier-current-user');
    if (userIdElement) {
      userIdElement.textContent = displayName.toUpperCase();
    }
  }
}
