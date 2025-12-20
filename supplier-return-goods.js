/* ============================================
   SUPPLIER RETURN GOODS PAGE - Minimalist Design
   ============================================ */

// Store original return goods data for filtering
let originalReturnGoodsData = [];

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
  loadReturnGoods();
  setupSupplierReturnGoodsFilters();
  // Setup date picker override (the actual setup is done by dashboard.js)
  // Note: setupSupplierReturnGoodsDatePicker() is called from dashboard.js via setupSupplierFilters()
  setupSupplierReturnGoodsDatePickerOverride();
  updateSupplierUserDisplay();
});

// Load return goods
async function loadReturnGoods() {
  const container = document.getElementById('return-goods-container');
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

    // Get return goods records - first get PO IDs for this supplier, then get return goods
    const { data: pos, error: poError } = await window.supabase
      .from('purchase_orders')
      .select('id')
      .eq('supplier_id', supplierId);
    
    if (poError) {
      console.error('Error loading purchase orders:', poError);
      container.innerHTML = '<div class="payment-empty-state">Error loading return goods. Please try again.</div>';
      return;
    }
    
    if (!pos || pos.length === 0) {
      container.innerHTML = '<div class="payment-empty-state">No return goods records available</div>';
      originalReturnGoodsData = [];
      applySupplierReturnGoodsFilters();
      return;
    }
    
    const poIds = pos.map(p => p.id);
    const { data: returnGoodsRecords, error } = await window.supabase
      .from('return_goods')
      .select('*')
      .in('purchase_order_id', poIds)
      .order('reported_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading return goods:', error);
      // If join fails, try direct query with purchase_order_id filter
      const { data: pos } = await window.supabase
        .from('purchase_orders')
        .select('id')
        .eq('supplier_id', supplierId);
      
      if (pos && pos.length > 0) {
        const poIds = pos.map(p => p.id);
        const { data: records, error: error2 } = await window.supabase
          .from('return_goods')
          .select('*')
          .in('purchase_order_id', poIds)
          .order('reported_at', { ascending: false })
          .limit(100);
        
        if (error2) {
          container.innerHTML = '<div class="payment-empty-state">Error loading return goods. Please try again.</div>';
          return;
        }
        
        if (!records || records.length === 0) {
          container.innerHTML = '<div class="payment-empty-state">No return goods records available</div>';
          originalReturnGoodsData = [];
          applySupplierReturnGoodsFilters();
          return;
        }
        
        originalReturnGoodsData = records;
        renderReturnGoodsCards(records);
        applySupplierReturnGoodsFilters();
        return;
      }
      
      container.innerHTML = '<div class="payment-empty-state">Error loading return goods. Please try again.</div>';
      return;
    }

    if (!returnGoodsRecords || returnGoodsRecords.length === 0) {
      container.innerHTML = '<div class="payment-empty-state">No return goods records available</div>';
      originalReturnGoodsData = [];
      applySupplierReturnGoodsFilters();
      return;
    }

    // Store original data for filtering
    originalReturnGoodsData = returnGoodsRecords;

    // Remove any existing filtered "no data" message before rendering
    if (container) {
      const filteredMessage = container.querySelector('.no-data-filtered-message');
      if (filteredMessage) {
        filteredMessage.remove();
      }
    }

    // Render return goods cards
    renderReturnGoodsCards(returnGoodsRecords);
    
    // Apply any existing filters
    applySupplierReturnGoodsFilters();
  } catch (error) {
    console.error('Error loading return goods:', error);
    if (container) {
      container.innerHTML = '<div class="payment-empty-state">Error loading return goods. Please refresh the page.</div>';
    }
  }
}

// Render return goods cards
function renderReturnGoodsCards(returnGoodsData) {
  const container = document.getElementById('return-goods-container');
  if (!container) return;

  container.innerHTML = returnGoodsData.map(record => {
    const reportedDate = new Date(record.reported_at);
    const reportedDateFormatted = reportedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
    
    // Calculate total excess quantity
    const items = record.items || [];
    const totalExcess = items.reduce((sum, item) => sum + (item.excess_quantity || 0), 0);
    const totalItems = items.length;

    return `
      <div class="payment-card" 
           data-return-goods-id="${record.id}"
           data-reported-date="${reportedDate.toISOString()}"
           onclick="viewReturnGoodsDetails('${record.id}')">
        <div class="payment-card-header">
          <div class="payment-card-main-info">
            <div class="payment-po-number">${record.po_number || 'N/A'}</div>
            <div class="payment-date">${reportedDateFormatted}</div>
          </div>
          <div class="payment-amount">${totalExcess} Items</div>
        </div>
        <div class="payment-card-body">
          <div class="payment-info-row">
            <span class="payment-label">Total Items:</span>
            <span class="payment-value">${totalItems}</span>
          </div>
          <div class="payment-info-row">
            <span class="payment-label">Total Excess:</span>
            <span class="payment-value">${totalExcess} units</span>
          </div>
          <div class="payment-info-row">
            <span class="payment-label">Reported By:</span>
            <span class="payment-value">${record.reported_by || 'N/A'}</span>
          </div>
        </div>
        <div class="payment-card-footer">
          <span class="payment-status-badge">RETURN GOODS</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

// View return goods details
window.viewReturnGoodsDetails = async function(returnGoodsId) {
  const popup = document.getElementById('return-goods-details-popup');
  const content = document.getElementById('return-goods-details-content');
  const title = document.getElementById('return-goods-details-title');
  
  if (!popup || !content) return;

  try {
    if (!window.supabase) {
      alert('Database connection not available.');
      return;
    }

    // Fetch return goods record
    const { data: record, error } = await window.supabase
      .from('return_goods')
      .select(`
        *,
        purchase_orders (
          id,
          po_number,
          order_date,
          expected_delivery_date,
          total_amount,
          supplier:supplier_id (
            company_name,
            address,
            city,
            state,
            postal_code,
            country,
            phone,
            email
          )
        )
      `)
      .eq('id', returnGoodsId)
      .single();

    if (error || !record) {
      alert('Return goods record not found.');
      return;
    }

    const po = Array.isArray(record.purchase_orders) ? record.purchase_orders[0] : record.purchase_orders;
    const supplier = po?.supplier || {};
    const items = record.items || [];
    const reportedDate = new Date(record.reported_at);
    const reportedDateFormatted = reportedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');

    // Build items HTML
    let itemsHTML = '';
    let poItems = []; // Initialize poItems outside the if block to avoid reference errors
    
    if (items.length > 0) {
      // Fetch item details from purchase_order_items
      const itemIds = items.map(item => item.item_id);
      const { data: fetchedPoItems } = await window.supabase
        .from('purchase_order_items')
        .select(`
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          product_variants (
            id,
            sku,
            color,
            size,
            products (
              product_name
            )
          )
        `)
        .in('id', itemIds);
      
      // Assign to poItems variable
      poItems = fetchedPoItems || [];

      itemsHTML = items.map((item, index) => {
        const poItem = poItems?.find(pi => pi.id === item.item_id);
        const variant = poItem?.product_variants;
        const product = variant?.products;
        const productName = product?.product_name || 'N/A';
        const variantInfo = variant ? 
          `${variant.color || ''} ${variant.size || ''}`.trim() || variant.sku || 'N/A' : 
          'N/A';
        const sku = variant?.sku || 'N/A';
        const unitCost = poItem?.unit_cost || 0;
        const excessValue = (unitCost * item.excess_quantity).toFixed(2);

        return `
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">
              ${productName}<br>
              <small style="color: #666;">${variantInfo} (${sku})</small>
            </td>
            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e0e0e0;">${item.quantity_ordered}</td>
            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e0e0e0;">${item.quantity_received}</td>
            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #e0e0e0; color: var(--primary-color, #FB5928); font-weight: bold;">${item.excess_quantity}</td>
            <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e0e0e0;">RM ${unitCost.toFixed(2)}</td>
            <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e0e0e0; font-weight: 600;">RM ${excessValue}</td>
          </tr>
        `;
      }).join('');
    }

    const totalExcess = items.reduce((sum, item) => sum + (item.excess_quantity || 0), 0);
    const totalExcessValue = items.reduce((sum, item) => {
      const poItem = poItems?.find(pi => pi.id === item.item_id);
      const unitCost = poItem?.unit_cost || 0;
      return sum + (unitCost * item.excess_quantity);
    }, 0);

    // Build receipt-style return goods HTML (matching payment history style)
    content.innerHTML = `
      <div style="background: #fff; padding: 2rem; border-radius: 8px; max-width: 700px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid var(--primary-color, #FB5928); padding-bottom: 1rem;">
          <h2 style="color: var(--primary-color, #FB5928); margin: 0; font-size: 1.8rem;">SPORT NEXUS</h2>
          <p style="color: #666; margin: 0.5rem 0 0 0;">Return Goods Report</p>
        </div>

        <!-- Return Goods Details -->
        <div style="margin-bottom: 2rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Return Goods ID</h3>
              <p style="margin: 0; color: #666;">${record.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">PO Number</h3>
              <p style="margin: 0; color: #666;">${record.po_number || 'N/A'}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Reported Date</h3>
              <p style="margin: 0; color: #666;">${reportedDateFormatted}</p>
            </div>
            <div>
              <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Reported By</h3>
              <p style="margin: 0; color: #666;">${record.reported_by || 'N/A'}</p>
            </div>
          </div>
          <div style="margin-bottom: 1.5rem;">
            <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Supplier</h3>
            <p style="margin: 0; color: #666;">${supplier.company_name || 'N/A'}</p>
            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">${supplier.address || ''} ${supplier.city || ''}, ${supplier.state || ''} ${supplier.postal_code || ''}</p>
            ${supplier.phone ? `<p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">Phone: ${supplier.phone}</p>` : ''}
            ${supplier.email ? `<p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">Email: ${supplier.email}</p>` : ''}
          </div>
        </div>

        <!-- Returned Items Table -->
        <div style="margin-bottom: 2rem;">
          <h3 style="color: #1d1f2c; margin: 0 0 1rem 0; font-size: 1rem;">Returned Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #1d1f2c;">#</th>
                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #1d1f2c;">Product</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #1d1f2c;">Ordered</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #1d1f2c;">Received</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #1d1f2c;">Excess</th>
                <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #1d1f2c;">Unit Cost</th>
                <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #1d1f2c;">Excess Value</th>
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
              <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-top: 2px solid var(--primary-color, #FB5928); margin-top: 0.5rem;">
                <span style="font-size: 1.2rem; font-weight: 600; color: #1d1f2c;">Total Excess:</span>
                <strong style="font-size: 1.2rem; color: var(--primary-color, #FB5928);">${totalExcess} items / RM ${totalExcessValue.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
        
        ${record.notes ? `
        <!-- Notes -->
        <div style="margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
          <h3 style="color: #1d1f2c; margin: 0 0 0.5rem 0; font-size: 1rem;">Notes</h3>
          <p style="margin: 0; color: #666; white-space: pre-wrap; font-size: 0.9rem;">${record.notes}</p>
        </div>
        ` : ''}
      </div>
    `;

    if (title) {
      title.textContent = `RETURN GOODS: ${record.po_number || 'N/A'}`;
    }

    // Setup PDF export
    const exportBtn = document.getElementById('export-return-goods-pdf-btn');
    if (exportBtn) {
      exportBtn.onclick = () => exportReturnGoodsPDF(record, po, supplier, poItems);
    }

    // Setup close button
    const closeBtn = document.getElementById('close-return-goods-details-btn');
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
    console.error('Error loading return goods details:', error);
    alert('Error loading return goods details: ' + error.message);
  }
};

// Export return goods to PDF
window.exportReturnGoodsPDF = function(record, po, supplier, poItems) {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RETURN GOODS REPORT', margin, yPosition);
  yPosition += 10;

  // Return Goods Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const reportedDate = new Date(record.reported_at);
  const reportedDateFormatted = reportedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '');

  doc.text(`Return Goods ID: ${record.id.substring(0, 8).toUpperCase()}`, margin, yPosition);
  yPosition += 6;
  doc.text(`PO Number: ${record.po_number || 'N/A'}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Reported Date: ${reportedDateFormatted}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Reported By: ${record.reported_by || 'N/A'}`, margin, yPosition);
  yPosition += 10;

  // Supplier Info
  doc.setFont('helvetica', 'bold');
  doc.text('SUPPLIER INFORMATION', margin, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${supplier.company_name || 'N/A'}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Address: ${supplier.address || ''} ${supplier.city || ''}, ${supplier.state || ''}`, margin, yPosition);
  yPosition += 10;

  // Items Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RETURNED ITEMS', margin, yPosition);
  yPosition += 8;

  // Table headers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const headers = ['#', 'Product', 'SKU', 'Variant', 'Ordered', 'Received', 'Excess', 'Unit Cost', 'Excess Value'];
  const colWidths = [8, 40, 25, 25, 15, 15, 15, 18, 20];
  let xPos = margin;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition - 4, contentWidth, 6, 'F');
  
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, yPosition);
    xPos += colWidths[i];
  });
  yPosition += 8;

  // Items
  doc.setFont('helvetica', 'normal');
  const items = record.items || [];
  items.forEach((item, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    const poItem = poItems?.find(pi => pi.id === item.item_id);
    const variant = poItem?.product_variants;
    const product = variant?.products;
    const productName = product?.product_name || 'N/A';
    const sku = variant?.sku || 'N/A';
    const variantInfo = variant ? 
      `${variant.color || ''} ${variant.size || ''}`.trim() || 'N/A' : 
      'N/A';
    const unitCost = poItem?.unit_cost || 0;
    const excessValue = (unitCost * item.excess_quantity).toFixed(2);

    xPos = margin;
    doc.text((index + 1).toString(), xPos + 2, yPosition);
    xPos += colWidths[0];
    
    const productLines = doc.splitTextToSize(productName, colWidths[1] - 4);
    doc.text(productLines, xPos + 2, yPosition);
    xPos += colWidths[1];
    
    doc.text(sku, xPos + 2, yPosition);
    xPos += colWidths[2];
    
    doc.text(variantInfo, xPos + 2, yPosition);
    xPos += colWidths[3];
    
    doc.text(item.quantity_ordered.toString(), xPos + 2, yPosition);
    xPos += colWidths[4];
    
    doc.text(item.quantity_received.toString(), xPos + 2, yPosition);
    xPos += colWidths[5];
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 152, 0);
    doc.text(item.excess_quantity.toString(), xPos + 2, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    xPos += colWidths[6];
    
    doc.text(`RM ${unitCost.toFixed(2)}`, xPos + 2, yPosition);
    xPos += colWidths[7];
    
    doc.text(`RM ${excessValue}`, xPos + 2, yPosition);
    
    yPosition += 6;
  });

  // Total
  yPosition += 4;
  const totalExcess = items.reduce((sum, item) => sum + (item.excess_quantity || 0), 0);
  const totalExcessValue = items.reduce((sum, item) => {
    const poItem = poItems?.find(pi => pi.id === item.item_id);
    const unitCost = poItem?.unit_cost || 0;
    return sum + (unitCost * item.excess_quantity);
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Excess:', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], yPosition);
  doc.setTextColor(255, 152, 0);
  doc.text(totalExcess.toString(), margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6], yPosition);
  doc.setTextColor(0, 0, 0);
  doc.text(`RM ${totalExcessValue.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7], yPosition);

  // Save PDF
  doc.save(`ReturnGoods-${record.po_number || 'N/A'}-${Date.now()}.pdf`);
};

// Setup all filters (search, date)
function setupSupplierReturnGoodsFilters() {
  // Search filter
  const searchInput = document.getElementById('supplier-return-goods-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      applySupplierReturnGoodsFilters();
    });
  }
}

// Apply all filters (search, date)
function applySupplierReturnGoodsFilters() {
  const searchInput = document.getElementById('supplier-return-goods-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const dateRange = window.supplierReturnGoodsDateFilterRange || null;
  
  const cards = document.querySelectorAll('.payment-card');
  cards.forEach(card => {
    let shouldShow = true;
    
    // Apply date filter
    if (shouldShow && dateRange && dateRange.start && dateRange.end) {
      const reportedDateAttr = card.getAttribute('data-reported-date');
      if (reportedDateAttr) {
        const cardDate = new Date(reportedDateAttr);
        if (cardDate < dateRange.start || cardDate > dateRange.end) {
          shouldShow = false;
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
  const container = document.getElementById('return-goods-container');
  if (container && hasActiveFilters && visibleCards.length === 0) {
    let noDataMessage = container.querySelector('.no-data-filtered-message');
    if (!noDataMessage) {
      noDataMessage = document.createElement('div');
      noDataMessage.className = 'payment-empty-state no-data-filtered-message';
      noDataMessage.textContent = 'No return goods match the selected filters. Please adjust your filters and try again.';
      container.appendChild(noDataMessage);
    }
    noDataMessage.style.display = 'block';
  } else if (container) {
    const noDataMessage = container.querySelector('.no-data-filtered-message');
    if (noDataMessage) {
      noDataMessage.style.display = 'none';
    }
  }
  
  updateSupplierReturnGoodsActiveFiltersDisplay();
}

// Setup date picker override - ensure filter function uses our applySupplierReturnGoodsFilters
// The actual date picker setup is done by dashboard.js's setupSupplierReturnGoodsDatePicker function
function setupSupplierReturnGoodsDatePickerOverride() {
  // Override filterReturnGoodsByDateRange to use our applySupplierReturnGoodsFilters
  const originalFilter = window.filterReturnGoodsByDateRange;
  window.filterReturnGoodsByDateRange = function(startDate, endDate) {
    if (startDate && endDate) {
      window.supplierReturnGoodsDateFilterRange = { start: startDate, end: endDate };
    } else if (startDate) {
      window.supplierReturnGoodsDateFilterRange = { start: startDate, end: startDate };
    } else {
      window.supplierReturnGoodsDateFilterRange = null;
    }
    if (typeof applySupplierReturnGoodsFilters === 'function') {
      applySupplierReturnGoodsFilters();
    } else if (originalFilter) {
      originalFilter(startDate, endDate);
    }
  };
  
  // The setupSupplierReturnGoodsDatePicker from dashboard.js is called from setupSupplierFilters
  // which is now called automatically on supplier-return-goods.html via auto-initialization
  // We just need to ensure our override is in place, which we've done above
}

// Clear filters
window.clearSupplierReturnGoodsFilters = function() {
  const searchInput = document.getElementById('supplier-return-goods-search-input');
  if (searchInput) searchInput.value = '';
  
  // Reset date filter
  const dateBtn = document.getElementById('supplier-return-goods-date-btn');
  if (dateBtn) {
    dateBtn.classList.remove('active');
    const dateText = document.getElementById('supplier-return-goods-date-text');
    if (dateText) dateText.textContent = 'DATE';
    const datePicker = document.getElementById('supplier-return-goods-date-picker');
    if (datePicker) datePicker.classList.remove('show');
  }

  const startDateInput = document.getElementById('supplier-return-goods-start-date-input');
  const endDateInput = document.getElementById('supplier-return-goods-end-date-input');
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  
  window.supplierReturnGoodsDateFilterRange = null;

  applySupplierReturnGoodsFilters();
};

// Update active filters display
function updateSupplierReturnGoodsActiveFiltersDisplay() {
  const container = document.getElementById('supplier-return-goods-active-filters-container');
  const chipsContainer = document.getElementById('supplier-return-goods-active-filters-chips');
  if (!container || !chipsContainer) return;
  
  const activeFilters = [];
  
  // Check date filter
  const dateRange = window.supplierReturnGoodsDateFilterRange;
  if (dateRange && dateRange.start && dateRange.end) {
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dateRangeText = startStr === endStr ? startStr : `${startStr} - ${endStr}`;
    activeFilters.push({
      type: 'date',
      label: 'Date',
      value: dateRangeText,
      id: 'date'
    });
  } else {
    // Fallback to input values
    const startDate = document.getElementById('supplier-return-goods-start-date-input')?.value;
    const endDate = document.getElementById('supplier-return-goods-end-date-input')?.value;
    if (startDate || endDate) {
      const dateRangeText = [startDate, endDate].filter(Boolean).join(' - ');
      activeFilters.push({
        type: 'date',
        label: 'Date',
        value: dateRangeText,
        id: 'date'
      });
    }
  }
  
  // Check search filter
  const searchInput = document.getElementById('supplier-return-goods-search-input');
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
        <span class="chip-remove" onclick="removeSupplierReturnGoodsFilter('${filter.type}', '${filter.id}')">×</span>
      </div>
    `).join('');
  } else {
    container.style.display = 'none';
    chipsContainer.innerHTML = '';
  }
}

// Remove supplier return goods filter
window.removeSupplierReturnGoodsFilter = function(type, id) {
  if (type === 'date') {
    const startInput = document.getElementById('supplier-return-goods-start-date-input');
    const endInput = document.getElementById('supplier-return-goods-end-date-input');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    const dateBtn = document.getElementById('supplier-return-goods-date-btn');
    if (dateBtn) {
      dateBtn.classList.remove('active');
      const dateText = document.getElementById('supplier-return-goods-date-text');
      if (dateText) dateText.textContent = 'DATE';
      const datePicker = document.getElementById('supplier-return-goods-date-picker');
      if (datePicker) datePicker.classList.remove('show');
    }
    window.supplierReturnGoodsDateFilterRange = null;
    if (typeof applySupplierReturnGoodsFilters === 'function') {
      applySupplierReturnGoodsFilters();
    }
  } else if (type === 'search') {
    const searchInput = document.getElementById('supplier-return-goods-search-input');
    if (searchInput) searchInput.value = '';
    if (typeof applySupplierReturnGoodsFilters === 'function') {
      applySupplierReturnGoodsFilters();
    }
  }
  updateSupplierReturnGoodsActiveFiltersDisplay();
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
