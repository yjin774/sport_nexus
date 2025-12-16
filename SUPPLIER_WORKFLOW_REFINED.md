# Supplier Purchase Order Workflow - Refined

> **Last Updated:** 2024-12-20
> 
> This document describes the refined supplier workflow that matches the current system implementation.

---

## Overview

The supplier workflow has been refined to match your current system capabilities while maintaining the ideal workflow structure. The workflow progresses through 5 main stages from order reception to invoicing.

---

## Workflow Stages

### Stage 1: Order Reception & Notification ✅

**Trigger:** Retailer sends Purchase Order (status: `pending`)

**Supplier Dashboard:**
- Incoming orders appear in the "INCOMING ORDER" view
- Table shows: Date, PO Number, Items Count, Total Quantity, Amount, Status, Expected Delivery
- **All table rows are clickable** to view order details

**Supplier Action:**
- Click on any order row to view full details
- Review all items, quantities, prices, and delivery deadline

**System Status:** `pending`

---

### Stage 2: Validation & Decision ✅

**Supplier Decision:** Accept or Reject the order

#### Option A: Accept Order
**Action:** Click "ACCEPT ORDER" button in PO details popup

**System Actions:**
- Status changes from `pending` → `processing`
- Order moves to processing stage
- Supplier can now proceed with fulfillment

**Status Update:** `processing`

#### Option B: Reject Order
**Action:** Click "REJECT ORDER" button in PO details popup

**System Actions:**
- Prompts for rejection reason (required)
- Status changes from `pending` → `cancelled`
- Rejection reason is stored in PO notes
- Order is removed from incoming orders list

**Status Update:** `cancelled`

---

### Stage 3: Warehouse Processing ✅

**Trigger:** Order status is `processing`

**Available Actions:**

1. **Generate Picking List**
   - Click "GENERATE PICKING LIST" button
   - System generates a downloadable text file
   - Contains: PO Number, Date, and all items with SKU, variant, and quantity
   - Format: Simple text file for warehouse staff

2. **Upload Delivery Order**
   - Click "UPLOAD DELIVERY ORDER" button
   - Upload DO file (PDF, JPG, PNG)
   - Enter tracking number (optional)
   - Enter delivery note number (optional)
   - Click "UPLOAD & MARK AS SHIPPED"

**Note:** In a full implementation, this stage would also include:
- Packing details input (number of boxes, weight)
- Bin location optimization for picking
- Quality control checks

**Current Implementation:** Basic picking list generation and DO upload

---

### Stage 4: Shipping & Documentation ✅

**Trigger:** Order status is `processing` or `partially_received`

**Actions:**

1. **Upload Delivery Order**
   - Upload DO file (required)
   - Add tracking number (optional)
   - Add delivery note number (optional)
   - Click "UPLOAD & MARK AS SHIPPED"

**System Actions:**
- DO file is uploaded to Supabase Storage
- Status changes from `processing` → `partially_received`
- Tracking and delivery note info stored in PO notes
- Order appears as "SHIPPED" in supplier view

**Status Update:** `partially_received` (displays as "SHIPPED" in UI)

**Note:** In a full implementation, this would also include:
- Automatic ASN (Advance Shipping Notice) to retailer
- Hard deduction of inventory
- Integration with courier APIs

**Current Implementation:** 
- File upload to storage
- Status update to `partially_received`
- Manual tracking number entry

---

### Stage 5: Invoicing (Future Enhancement)

**Status:** Not yet implemented

**Planned Features:**
- Auto-generate invoice when order is shipped
- Link invoice to specific delivery order
- Calculate: (Confirmed Quantity × Unit Cost) + Tax + Shipping
- Display in retailer's finance section

**Current Status:** Can be added as a future feature

---

## Status Flow

```
pending → processing → partially_received → completed
   ↓
cancelled (if rejected)
```

**Status Meanings:**
- `pending`: Order received, awaiting supplier decision
- `processing`: Order accepted, being fulfilled
- `partially_received`: DO uploaded, order shipped
- `completed`: All items received by retailer (updated by retailer)
- `cancelled`: Order rejected by supplier

---

## UI Features

### Incoming Orders Table
- **Clickable rows:** Click any row to view full PO details
- **Columns:** Date, PO Number, Items, Total Qty, Amount, Status, Expected Delivery
- **Filtering:** Filter by status (PENDING, PROCESSING, SHIPPED, COMPLETED)
- **Search:** Search by PO number or item name

### PO Details Popup
- **Full order information:**
  - PO Number, Status, Order Date, Expected Delivery
  - Complete item list with images, variants, quantities, prices
  - Financial summary (subtotal, tax, discount, total)
  - Notes/remarks

- **Action buttons (context-aware):**
  - **Pending:** ACCEPT ORDER, REJECT ORDER
  - **Processing:** GENERATE PICKING LIST, UPLOAD DELIVERY ORDER
  - **Shipped:** UPLOAD DELIVERY ORDER (for additional shipments)

### Upload DO Popup
- **Fields:**
  - PO Number (display only)
  - Delivery Order File (required)
  - Tracking Number (optional)
  - Delivery Note Number (optional)
- **Action:** UPLOAD & MARK AS SHIPPED

---

## Database Schema Requirements

### Purchase Orders Table
- `status`: VARCHAR(50) - 'pending', 'processing', 'partially_received', 'completed', 'cancelled'
- `notes`: TEXT - Stores rejection reasons, tracking info, delivery notes
- `supplier_id`: UUID - Links to supplier
- `expected_delivery_date`: DATE - Delivery deadline

### Purchase Order Items Table
- `quantity_ordered`: INTEGER - Original order quantity
- `quantity_received`: INTEGER - Quantity actually received (updated by retailer)
- `unit_cost`: DECIMAL(10,2) - Cost per unit
- `line_total`: DECIMAL(10,2) - Total for line item

### Storage
- **Bucket:** `product-images` (or create `delivery-orders` bucket)
- **Path:** `delivery-orders/DO-{poId}-{timestamp}.{ext}`

---

## Implementation Notes

### Current Capabilities ✅
1. ✅ Clickable order rows
2. ✅ PO details popup with full information
3. ✅ Accept/Reject functionality
4. ✅ Status progression (pending → processing → partially_received)
5. ✅ Picking list generation (text file download)
6. ✅ Delivery order upload
7. ✅ Tracking number and delivery note storage
8. ✅ Status filtering

### Future Enhancements (Not Yet Implemented)
1. ⏳ Soft allocation of inventory on accept
2. ⏳ Hard deduction on shipping
3. ⏳ Automated ASN to retailer
4. ⏳ Packing details input
4. ⏳ Bin location optimization
5. ⏳ Invoice generation
6. ⏳ Courier API integration
7. ⏳ Quality control checks
8. ⏳ Partial item rejection/modification

---

## User Guide

### For Suppliers

1. **Viewing Orders:**
   - Go to "INCOMING ORDER" tab
   - All pending/processing orders are listed
   - Click any row to view details

2. **Accepting an Order:**
   - Click on order row
   - Review all details
   - Click "ACCEPT ORDER"
   - Order status changes to "PROCESSING"

3. **Rejecting an Order:**
   - Click on order row
   - Click "REJECT ORDER"
   - Enter rejection reason
   - Order is cancelled

4. **Processing an Order:**
   - After accepting, order shows "PROCESSING" status
   - Click "GENERATE PICKING LIST" to download picking list
   - Pick and pack items in warehouse

5. **Shipping an Order:**
   - Click "UPLOAD DELIVERY ORDER"
   - Upload DO file (PDF/image)
   - Enter tracking number (if available)
   - Enter delivery note number (if available)
   - Click "UPLOAD & MARK AS SHIPPED"
   - Order status changes to "SHIPPED"

---

## Technical Details

### Functions
- `loadIncomingOrders()`: Loads orders for current supplier
- `showSupplierPODetails(poId)`: Shows PO details popup
- `acceptSupplierPO(poId)`: Accepts order (pending → processing)
- `rejectSupplierPO(poId)`: Rejects order (pending → cancelled)
- `generatePickingList(poId)`: Generates and downloads picking list
- `openUploadDO(poId, poNumber)`: Opens DO upload popup
- `handleUploadDO()`: Handles DO file upload and marks as shipped

### Status Filtering
- Filters work with data attributes and cell content
- "SHIPPED" filter shows `partially_received` status orders
- Real-time filtering without page refresh

---

## Summary

The refined workflow maintains the ideal structure while adapting to current system capabilities:

✅ **Stage 1:** Order reception with clickable rows  
✅ **Stage 2:** Accept/Reject decision making  
✅ **Stage 3:** Processing with picking list generation  
✅ **Stage 4:** Shipping with DO upload and tracking  
⏳ **Stage 5:** Invoicing (future enhancement)

The workflow is functional and ready for use, with clear paths for future enhancements.
