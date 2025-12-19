# Permission Analysis: Staff vs Manager Actions

Based on the current system implementation, here's a comprehensive breakdown of what actions can be performed by different staff positions.

## Position Hierarchy
- **MANAGER**: Can perform ALL actions (staff actions + manager-only actions)
- **STAFF** (non-manager): Can perform staff-level actions only

---

## 🔒 MANAGER-ONLY ACTIONS
These actions require `requireManagerAuthentication()` and check that the user's position is exactly "MANAGER".

### 1. **Approve Finalized Purchase Order**
- **Function**: `approveFinalizedDraft()`
- **Action**: Approve a finalized draft PO and send it to the supplier
- **Changes Status**: `draft` → `pending`
- **Authentication**: Manager authentication required
- **Logged As**: `po_approved`

### 2. **Reject Finalized Purchase Order**
- **Function**: `rejectFinalizedDraft()`
- **Action**: Reject a finalized draft PO with a rejection reason
- **Changes**: Sets `rejection_reason` field on the PO
- **Authentication**: Manager authentication required
- **Logged As**: `po_rejected`

### 3. **Add New User** (Manager Check with Verification)
- **Function**: Add user popup trigger
- **Action**: Add new member/staff/supplier to the system
- **Authentication**: If current user is NOT a manager, shows manager verification dialog
- **Note**: Uses `isCurrentUserManager()` check + `showManagerVerificationDialog()`

### 4. **Edit Existing User** (Manager Check with Verification)
- **Function**: `showEditUserPopup()`
- **Action**: Edit existing member/staff/supplier details
- **Authentication**: If current user is NOT a manager, shows manager verification dialog
- **Note**: Uses `isCurrentUserManager()` check + `showManagerVerificationDialog()`

---

## 👤 STAFF-ONLY ACTIONS
These actions require `requireStaffAuthentication()` - any staff member (including managers) can perform these, but they require authentication.

### 1. **Save Position Changes** (General Settings)
- **Function**: `savePositionChangesInternal()`
- **Action**: Save changes to position settings in general settings
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 2. **Save User Changes** (Edit User)
- **Function**: `saveUserChangesInternal()`
- **Action**: Save changes when editing a user (member/staff/supplier)
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 3. **Save New User** (Add User)
- **Function**: `saveNewUserInternal()`
- **Action**: Create a new user (member/staff/supplier) after adding
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 4. **Delete Product**
- **Function**: `confirmDeleteProductInternal()`
- **Action**: Delete a product from the system
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 5. **Save New Product**
- **Function**: `saveNewProductInternal()`
- **Action**: Create a new product in the system
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 6. **Save Edited Product**
- **Function**: `saveEditedProductInternal()`
- **Action**: Save changes to an existing product
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 7. **Save Category Changes** (General Settings)
- **Function**: `saveCategoryChangesInternal()`
- **Action**: Save changes to product category settings
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 8. **Finalize Purchase Order Cart**
- **Function**: `handleFinalizeCartInternal()`
- **Action**: Finalize items in the PO cart to create a draft PO
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 9. **Save Item Verification** (PO Receiving)
- **Function**: `saveItemVerificationInternal()`
- **Action**: Verify received items in a purchase order
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 10. **Accept Price Proposal** (PO Price Negotiation)
- **Function**: `acceptPriceProposalInternal()`
- **Action**: Accept a supplier's price proposal for a PO
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 11. **Reject Price Proposal** (PO Price Negotiation)
- **Function**: `rejectPriceProposalInternal()`
- **Action**: Reject a supplier's price proposal for a PO
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 12. **Finalize Draft Purchase Order**
- **Function**: `finalizeDraftInternal()`
- **Action**: Finalize a draft PO (marks it as ready for manager approval)
- **Sets**: `finalized_at` timestamp
- **Authentication**: Staff authentication required
- **Logged As**: `po_finalized`
- **Note**: After finalizing, the PO needs manager approval/rejection

### 13. **Save Draft Changes** (Edit Draft PO)
- **Function**: `handleSaveDraftChangesInternal()`
- **Action**: Save changes to an existing draft PO
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

### 14. **Bulk Approve Purchase Orders**
- **Function**: `handleBulkApproveInternal()`
- **Action**: Approve multiple draft POs at once (changes status directly from `draft` to `pending`)
- **Authentication**: Staff authentication required
- **Note**: This is different from individual approve which requires finalization first. Bulk approve bypasses the finalization step.
- **Recommendation**: This should probably be manager-only since it bypasses the finalization/approval workflow
- **Logged As**: `authenticated_action`

### 15. **Save Supplier Price** (General Settings)
- **Function**: `saveSupplierPriceInternal()`
- **Action**: Save supplier pricing settings
- **Authentication**: Staff authentication required
- **Logged As**: `authenticated_action`

---

## 📋 UNAUTHENTICATED ACTIONS (View/Read Operations)
These actions don't require authentication and can be performed by any logged-in staff member:

- **View Products**: Browse product catalog
- **View Purchase Orders**: View PO list and details
- **View Users**: View member/staff/supplier lists
- **View Statistics**: View sales and business statistics
- **View General Settings**: View (but not modify) general settings
- **View Stock Count History**: View stock count requests and history
- **View Log Book**: View activity logs
- **View Member Points**: View member points and transaction history

---

## 🔍 KEY DIFFERENCES

### Manager vs Staff Position Check Methods:

1. **`isCurrentUserManager()`**: 
   - Checks session storage for current user's position
   - Returns `true` if position contains "manager" (case-insensitive)
   - Used for UI-level checks (show/hide buttons, conditional flows)
   - Used for: Add User, Edit User popups

2. **`requireManagerAuthentication()`**:
   - Requires username/password authentication
   - Verifies user exists in staff table
   - **Strictly checks**: `position.toUpperCase() === 'MANAGER'`
   - Used for: Approve/Reject finalized POs

3. **`requireStaffAuthentication()`**:
   - Requires username/password authentication
   - Verifies user exists in staff table
   - Checks if user is active
   - **No position check** - any staff member can authenticate
   - Used for: Most database write operations

---

## ⚠️ POTENTIAL ISSUES & RECOMMENDATIONS

### 1. **Bulk Approve Should Be Manager-Only**
Currently `handleBulkApproveInternal()` uses `requireStaffAuthentication()`, but approving multiple POs should probably require manager authentication.

### 2. **Inconsistent Manager Checks**
- Add/Edit User: Uses `isCurrentUserManager()` + `showManagerVerificationDialog()` (which internally uses `requireStaffAuthentication` with a flag, but doesn't actually enforce manager position)
- Approve/Reject PO: Uses `requireManagerAuthentication()` (strictly enforces MANAGER position)

**Recommendation**: Consider making Add/Edit User use `requireManagerAuthentication()` for consistency and proper enforcement.

### 3. **Delete User Missing**
There's no delete user function found - if this feature exists, it should be manager-only.

### 4. **Product Operations**
All product operations (create, edit, delete) require staff authentication. Consider if delete should be manager-only.

---

## 📊 SUMMARY TABLE

| Action | Staff (any) | Manager | Authentication Type |
|--------|-------------|---------|---------------------|
| View data (read operations) | ✅ | ✅ | None |
| Finalize PO draft | ✅ | ✅ | Staff Auth |
| Approve finalized PO | ❌ | ✅ | Manager Auth |
| Reject finalized PO | ❌ | ✅ | Manager Auth |
| Add new user | ❌* | ✅ | Manager Verification* |
| Edit existing user | ❌* | ✅ | Manager Verification* |
| Create/Edit/Delete Product | ✅ | ✅ | Staff Auth |
| Accept/Reject price proposal | ✅ | ✅ | Staff Auth |
| Verify received items | ✅ | ✅ | Staff Auth |
| Bulk approve POs (draft→pending) | ✅ | ✅ | Staff Auth ⚠️ |
| Save settings changes | ✅ | ✅ | Staff Auth |

*Note: Add/Edit User uses a softer check (`isCurrentUserManager()`), which may not be as secure as the strict `requireManagerAuthentication()`.

---

## 🎯 RECOMMENDED PERMISSION MODEL

### Manager Should Have:
- ✅ All staff permissions
- ✅ Approve/Reject finalized POs
- ✅ Add/Edit/Delete users
- ✅ Bulk approve operations
- ✅ Critical settings changes

### Staff Should Have:
- ✅ View all data
- ✅ Create/Edit products
- ✅ Finalize PO drafts (marks as ready for manager approval)
- ✅ Accept/Reject price proposals
- ✅ Verify received items
- ✅ Regular settings changes
- ❌ Approve/Reject finalized POs (requires manager approval)
- ❌ Add/Edit/Delete users
- ❌ Bulk approve operations (should be manager-only)

**Note**: The current system allows staff to bulk approve draft POs directly (bypassing finalization). This creates an inconsistency with the individual PO approval workflow which requires finalization → manager approval.
