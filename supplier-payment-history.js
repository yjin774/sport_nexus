/* ============================================
   SUPPLIER PAYMENT HISTORY PAGE - Minimalist Design
   ============================================ */

// Store original payment data for filtering
let originalPaymentData = [];

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
  loadPaymentHistory();
  setupSupplierPaymentFilters();
  // Setup date picker override (the actual setup is done by dashboard.js)
  setupSupplierPaymentDatePickerOverride();
  updateSupplierUserDisplay();
});

// Load payment history
async function loadPaymentHistory() {
  const container = document.getElementById('payment-history-container');
  if (!container) return;

  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get current supplier from session
    const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
    const supplierId = userSession.userData?.id;

    if (!supplierId) {
      container.innerHTML = '<div class="payment-empty-state">Supplier not found. Please log in again.</div>';
      return;
    }

    // Get purchase orders that have been paid
    const { data: purchaseOrders, error } = await window.supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .neq('status', 'payment_pending')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading payment history:', error);
      container.innerHTML = '<div class="payment-empty-state">Error loading payment history. Please try again.</div>';
      return;
    }

    // Filter POs that have payment information
    const paidPOs = (purchaseOrders || []).filter(po => {
      const notes = po.notes || '';
      return notes.includes('PAYMENT COMPLETED');
    });

    if (!paidPOs || paidPOs.length === 0) {
      container.innerHTML = '<div class="payment-empty-state">No payment history available</div>';
      originalPaymentData = [];
      applySupplierPaymentFilters();
      return;
    }

    // Store original data for filtering
    originalPaymentData = paidPOs;

    // Remove any existing filtered "no data" message before rendering
    const container = document.getElementById('payment-history-container');
    if (container) {
      const filteredMessage = container.querySelector('.no-data-filtered-message');
      if (filteredMessage) {
        filteredMessage.remove();
      }
    }

    // Render payment cards
    renderPaymentCards(paidPOs);
    
    // Apply any existing filters
    applySupplierPaymentFilters();
  } catch (error) {
    console.error('Error loading payment history:', error);
    if (container) {
      container.innerHTML = '<div class="payment-empty-state">Error loading payment history. Please refresh the page.</div>';
    }
  }
}

// Render payment cards
function renderPaymentCards(paymentData) {
  const container = document.getElementById('payment-history-container');
  if (!container) return;

  container.innerHTML = paymentData.map(po => {
    // Extract payment information from notes
    const notes = po.notes || '';
    let paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Transaction ID: ([^\.]+)\. Payment Method: ([^\.]+)\.(?: Amount: RM ([^\.]+)\.)?/);
    if (!paymentMatch) {
      paymentMatch = notes.match(/PAYMENT COMPLETED: ([^\.]+)\. Payment ID: ([^\.]+)\. Payment Method: ([^\.]+)/);
    }
    
    const paymentId = paymentMatch ? paymentMatch[2] : 'N/A';
    const paymentMethod = paymentMatch ? paymentMatch[3] : 'Online Banking';
    const orderDate = new Date(po.order_date || po.created_at);
    const orderDateFormatted = orderDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    // Parse payment date - use same logic as popup (showPaymentInvoice)
    // The popup uses: paymentMatch ? paymentMatch[1] : new Date(po.updated_at).toLocaleString()
    // We'll use the same approach but format it consistently for display
    let paymentDateString;
    if (paymentMatch && paymentMatch[1]) {
      // Use the date string directly from notes (same as popup)
      paymentDateString = paymentMatch[1].trim();
    } else {
      // No payment date in notes, use updated_at formatted as locale string (same as popup)
      paymentDateString = new Date(po.updated_at).toLocaleString();
    }
    
    // Format the date consistently - try to parse and format, but if it fails, use the string as-is
    // This matches the popup behavior but with consistent formatting
    let paymentDateFormatted;
    try {
      // Try parsing the date string - it might be in various formats from toLocaleString()
      const paymentDateObj = new Date(paymentDateString);
      
      // Check if parsing was successful
      if (!isNaN(paymentDateObj.getTime())) {
        // Successfully parsed, format it consistently in en-GB format
        paymentDateFormatted = paymentDateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        // Remove comma if present (some locales add commas)
        paymentDateFormatted = paymentDateFormatted.replace(',', '');
      } else {
        // Parsing failed - use the original string (same as popup does)
        paymentDateFormatted = paymentDateString;
      }
    } catch (e) {
      // Error parsing - use the original string (same as popup does)
      paymentDateFormatted = paymentDateString;
    }

    return `
      <div class="payment-card" 
           data-po-id="${po.id}"
           data-order-date="${orderDate.toISOString()}"
           onclick="viewPaymentInvoice('${po.id}')">
        <div class="payment-card-header">
          <div class="payment-card-main-info">
            <div class="payment-po-number">${po.po_number || 'N/A'}</div>
            <div class="payment-date">${orderDateFormatted}</div>
          </div>
          <div class="payment-amount">RM ${(po.total_amount || 0).toFixed(2)}</div>
        </div>
        <div class="payment-card-body">
          <div class="payment-info-row">
            <span class="payment-label">Payment Method:</span>
            <span class="payment-value">${paymentMethod}</span>
          </div>
          <div class="payment-info-row">
            <span class="payment-label">Payment Date:</span>
            <span class="payment-value">${paymentDateFormatted}</span>
          </div>
          <div class="payment-info-row">
            <span class="payment-label">Transaction ID:</span>
            <span class="payment-value payment-id">${paymentId}</span>
          </div>
        </div>
        <div class="payment-card-footer">
          <span class="payment-status-badge">PAID</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

// View payment invoice
window.viewPaymentInvoice = function(poId) {
  if (typeof showPaymentInvoice === 'function') {
    showPaymentInvoice(poId);
  }
};

// Setup all filters (search, date)
function setupSupplierPaymentFilters() {
  // Search filter
  const searchInput = document.getElementById('supplier-payment-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      applySupplierPaymentFilters();
    });
  }
}

// Apply all filters (search, date) - similar to applySupplierIncomingFilters
function applySupplierPaymentFilters() {
  const searchInput = document.getElementById('supplier-payment-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const dateRange = window.supplierPaymentDateFilterRange || null;
  
  const cards = document.querySelectorAll('.payment-card');
  cards.forEach(card => {
    let shouldShow = true;
    
    // Apply date filter
    if (shouldShow && dateRange && dateRange.start && dateRange.end) {
      const orderDateAttr = card.getAttribute('data-order-date');
      if (orderDateAttr) {
        const cardDate = new Date(orderDateAttr);
        if (cardDate < dateRange.start || cardDate > dateRange.end) {
          shouldShow = false;
        }
      } else {
        // Fallback: parse from displayed date
        const dateText = card.querySelector('.payment-date')?.textContent;
        if (dateText) {
          const cardDate = parsePaymentDate(dateText);
          if (!cardDate || cardDate < dateRange.start || cardDate > dateRange.end) {
            shouldShow = false;
          }
        }
      }
    }
    
    // Apply search filter
    if (shouldShow && searchTerm) {
      const cardText = card.textContent.toLowerCase();
      if (!cardText.includes(searchTerm)) {
        shouldShow = false;
      }
    }
    
    card.style.display = shouldShow ? '' : 'none';
  });
  
  // Check if any cards are visible after filtering
  const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
  
  // Show "no data" message if filters are active but no results
  const hasActiveFilters = dateRange || searchTerm;
  const container = document.getElementById('payment-history-container');
  if (container && hasActiveFilters && visibleCards.length === 0) {
    // Check if no-data message already exists
    let noDataMessage = container.querySelector('.no-data-filtered-message');
    if (!noDataMessage) {
      noDataMessage = document.createElement('div');
      noDataMessage.className = 'payment-empty-state no-data-filtered-message';
      noDataMessage.textContent = 'No payments match the selected filters. Please adjust your filters and try again.';
      container.appendChild(noDataMessage);
    }
    noDataMessage.style.display = 'block';
  } else if (container) {
    // Remove no-data message if there are results or no filters
    const noDataMessage = container.querySelector('.no-data-filtered-message');
    if (noDataMessage) {
      noDataMessage.style.display = 'none';
    }
  }
  
  updateSupplierPaymentActiveFiltersDisplay();
}

// Parse date from payment card date format (DD MMM YYYY)
function parsePaymentDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  dateString = dateString.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try DD MMM YYYY format (e.g., "20 Dec 2024")
  const months = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  
  const datePattern = /^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$/i;
  const match = dateString.match(datePattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase().substring(0, 3);
    const year = parseInt(match[3], 10);
    const month = months[monthName];
    
    if (month !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const date = new Date(year, month, day);
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY format
  const datePattern2 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  const match2 = dateString.match(datePattern2);
  if (match2) {
    const day = parseInt(match2[1], 10);
    const month = parseInt(match2[2], 10) - 1;
    const year = parseInt(match2[3], 10);
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

// Setup date picker override - ensure filter function uses our applySupplierPaymentFilters
// The actual date picker setup is done by dashboard.js's setupSupplierPaymentDatePicker function
function setupSupplierPaymentDatePickerOverride() {
  // Override filterPaymentHistoryByDateRange to use our applySupplierPaymentFilters
  const originalFilter = window.filterPaymentHistoryByDateRange;
  window.filterPaymentHistoryByDateRange = function(startDate, endDate) {
    if (startDate && endDate) {
      window.supplierPaymentDateFilterRange = { start: startDate, end: endDate };
    } else if (startDate) {
      window.supplierPaymentDateFilterRange = { start: startDate, end: startDate };
    } else {
      window.supplierPaymentDateFilterRange = null;
    }
    if (typeof applySupplierPaymentFilters === 'function') {
      applySupplierPaymentFilters();
    } else if (originalFilter) {
      originalFilter(startDate, endDate);
    }
  };
  
  // The setupSupplierPaymentDatePicker from dashboard.js is called from setupSupplierFilters
  // which is now called automatically on supplier-payment-history.html via auto-initialization
  // We just need to ensure our override is in place, which we've done above
}

// Clear filters
window.clearSupplierPaymentHistoryFilters = function() {
  const searchInput = document.getElementById('supplier-payment-search-input');
  if (searchInput) searchInput.value = '';
  
  // Reset date filter
  const dateBtn = document.getElementById('supplier-payment-date-btn');
  if (dateBtn) {
    dateBtn.classList.remove('active');
    const dateText = document.getElementById('supplier-payment-date-text');
    if (dateText) dateText.textContent = 'DATE';
    const datePicker = document.getElementById('supplier-payment-date-picker');
    if (datePicker) datePicker.classList.remove('show');
  }

  const startDateInput = document.getElementById('supplier-payment-start-date-input');
  const endDateInput = document.getElementById('supplier-payment-end-date-input');
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  
  window.supplierPaymentDateFilterRange = null;

  applySupplierPaymentFilters();
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
