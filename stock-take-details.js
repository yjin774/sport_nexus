// Stock Take Details JavaScript

// Store original stock items for filtering
let originalStockItems = [];
let currentDisplayedItems = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadStockTakeDetails();
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

    // Set default date range based on request date
    if (request.request_date) {
      const requestDate = new Date(request.request_date);
      const endDate = new Date(requestDate);
      endDate.setDate(endDate.getDate() + 30); // Assume 30 days range
      
      const startDateInput = document.getElementById('stock-take-start-date');
      const endDateInput = document.getElementById('stock-take-end-date');
      
      if (startDateInput) {
        startDateInput.value = requestDate.toISOString().split('T')[0];
      }
      if (endDateInput) {
        endDateInput.value = endDate.toISOString().split('T')[0];
      }
    }

    // Populate category dropdown
    populateCategoryDropdown(stockItems);

    // Display items
    displayStockItems(currentDisplayedItems);
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

// Populate Category Dropdown
function populateCategoryDropdown(items) {
  const categorySelect = document.getElementById('stock-take-category');
  if (!categorySelect) return;

  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
  
  // Clear existing options except "All Categories"
  categorySelect.innerHTML = '<option value="">All Categories</option>';
  
  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
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
  const startDate = document.getElementById('stock-take-start-date')?.value;
  const endDate = document.getElementById('stock-take-end-date')?.value;
  const category = document.getElementById('stock-take-category')?.value;

  let filtered = [...originalStockItems];

  // Filter by category
  if (category) {
    filtered = filtered.filter(item => item.category === category);
  }

  // Filter by date range (if items have date fields)
  // Note: This assumes items might have a date field. Adjust based on your data structure.
  if (startDate || endDate) {
    // If your items have a date field, uncomment and adjust:
    // filtered = filtered.filter(item => {
    //   if (!item.date) return true;
    //   const itemDate = new Date(item.date);
    //   if (startDate && itemDate < new Date(startDate)) return false;
    //   if (endDate && itemDate > new Date(endDate)) return false;
    //   return true;
    // });
  }

  currentDisplayedItems = filtered;
  displayStockItems(currentDisplayedItems);
}

// Clear Stock Take Filter
window.clearStockTakeFilter = function() {
  const startDateInput = document.getElementById('stock-take-start-date');
  const endDateInput = document.getElementById('stock-take-end-date');
  const categorySelect = document.getElementById('stock-take-category');

  // Reset date inputs to request date range
  if (originalStockItems.length > 0) {
    // Get request date from URL or use current date
    const requestId = getRequestIdFromURL();
    const stockCountRequests = JSON.parse(localStorage.getItem('stockCountRequests') || '[]');
    const request = stockCountRequests.find(r => r.id === requestId);
    
    if (request && request.request_date) {
      const requestDate = new Date(request.request_date);
      const endDate = new Date(requestDate);
      endDate.setDate(endDate.getDate() + 30);
      
      if (startDateInput) {
        startDateInput.value = requestDate.toISOString().split('T')[0];
      }
      if (endDateInput) {
        endDateInput.value = endDate.toISOString().split('T')[0];
      }
    }
  }

  // Reset category
  if (categorySelect) {
    categorySelect.value = '';
  }

  // Show all items
  currentDisplayedItems = [...originalStockItems];
  displayStockItems(currentDisplayedItems);
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

    // Report Information with left margin
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    doc.text(`Report Date: ${reportDate}`, margin, yPosition);
    
    if (requestInfo) {
      yPosition += 6; // Increased line spacing
      const requestDate = new Date(requestInfo.request_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Stock Count Date: ${requestDate}`, margin, yPosition);
      
      if (requestInfo.request_number) {
        yPosition += 6;
        doc.text(`Request Number: ${requestInfo.request_number}`, margin, yPosition);
      }
      
      if (requestInfo.requested_by_name) {
        yPosition += 6;
        doc.text(`Requested By: ${requestInfo.requested_by_name}`, margin, yPosition);
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

    // Generate table with proper margins
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
        left: margin, 
        right: margin
      },
      tableWidth: contentWidth, // Ensure table respects content width
      pageBreak: 'auto', // Auto page break if content exceeds page
      showHead: 'everyPage' // Show header on every page
    });

    // Get final Y position after table
    const finalY = doc.lastAutoTable.finalY;
    yPosition = finalY + 12; // Increased spacing before summary

    // Add summary section with proper margins
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', margin, yPosition);
    yPosition += 8; // Increased spacing

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${itemsToExport.length}`, margin, yPosition);
    yPosition += 6; // Increased line spacing
    doc.text(`Total Expected Quantity: ${totalExpected}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Total Counted Quantity: ${totalCounted}`, margin, yPosition);
    yPosition += 6;
    
    const diffColor = totalDifference < 0 ? [244, 67, 54] : totalDifference > 0 ? [76, 175, 80] : [0, 0, 0];
    doc.setTextColor(...diffColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Difference: ${totalDifference > 0 ? '+' : ''}${totalDifference}`, margin, yPosition);
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
        `Generated on ${new Date().toLocaleString('en-GB')}`,
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

