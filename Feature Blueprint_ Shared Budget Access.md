## **Feature Blueprint: Shared Budget Access**

### **1\. Core Concept**

A primary user ("Owner") can invite a secondary user ("Partner") to access their financial data. The Partner has their own account and login (via magic link) but is permanently linked to the Owner. The Owner controls the Partner's access level through a permissions system.

### **2\. Database Schema**

#### **A. `users` Table (Modifications)**

Two new nullable columns will be added:

* **`owner_user_id` (INT, NULLABLE)**: Foreign key referencing `users(id)`. `NULL` for Owners, contains the Owner's `id` for Partners.  
* **`permission_level` (VARCHAR, NULLABLE)**: `NULL` for Owners. For Partners, stores the access level (`'read_only'`, `'update_by_request'`, `'full_access'`).

#### **B. `invitations` Table (Modifications)**

The existing table will be modified to handle both new user invites and sharing invites:

* **`invite_type` (ENUM('join', 'share'))**: A new column to differentiate the invitation's purpose.  
* **`permission_level` (VARCHAR, NULLABLE)**: A new column to store the intended permission level for `'share'` type invites.

#### **C. `action_requests` Table (New)**

A new table to manage the "Update by Request" workflow:

* **`id`**: Primary Key  
* **`requester_user_id`**: The Partner's user `id`.  
* **`owner_user_id`**: The Owner's user `id`.  
* **`budget_cycle_id`**: The budget the action applies to.  
* **`action_type`**: A string identifying the action (e.g., `'mark_paid'`, `'edit_expense'`).  
* **`payload` (JSON)**: Stores the data needed to perform the action (e.g., `{"label": "Netflix", "new_amount": 15.99}`).  
* **`description` (VARCHAR)**: A human-readable summary of the action (e.g., "Pay 'Netflix' for $15.99.").  
* **`status`**: (e.g., `'pending'`).  
* **`created_at`**.

### **3\. Backend API & Logic**

#### **A. Core Logic Modifications**

* **Session Management**: When any user logs in, the system checks if their `user` record has an `owner_user_id`. If so, the session will store **both** `userId` (for the partner) and `owner_user_id`.  
* **Data Access**: All data-fetching methods in existing controllers (`BudgetController`, `AccountController`, etc.) will be updated to use the `owner_user_id` from the session if it exists; otherwise, they will default to using the `userId`.  
* **Permissions Enforcement**: All data-modification methods (`markBillPaid`, `addIncome`, etc.) will first check the `permission_level` from the session to determine whether to execute the action, log it as an `action_request`, or deny it.

#### **B. New/Updated API Endpoints (`SharingController` and others)**

* **`POST /api/sharing/invite`**: An Owner sends an invite.  
  * Creates an `invitations` record with `invite_type = 'share'`.  
  * Sends an email to the recipient with a unique acceptance link.  
* **`GET /api/sharing/invites`**: An Owner fetches a list of their pending and accepted invites.  
* **`PUT /api/sharing/update-permission/{partnerId}`**: An Owner changes an existing partner's permissions.  
* **`DELETE /api/sharing/invites/{partnerId}` (Revoke Access)**:  
  * Finds the partner's user record.  
  * Sets `owner_user_id` and `permission_level` to `NULL`.  
  * Triggers an email informing the user their account is now a standard, independent account.  
* **`POST /api/sharing/accept` (Invite Acceptance)**:  
  * Validates the invite `token`.  
  * **If recipient email is new**: Creates a new user, links them to the owner, creates a session, and redirects them to the `/dashboard`.  
  * **If recipient email exists**: Returns a "pending transformation" status, prompting the user on the frontend.  
* **`POST /api/sharing/transform-account`**: An existing user agrees to become a partner.  
  * Deletes all of their personal financial data (budgets, goals, etc.).  
  * Updates their `users` record to set the `owner_user_id` and `permission_level`.  
  * Logs them in and redirects to the owner's dashboard.  
* **`POST /api/sharing/approve/{requestId}`**: An Owner approves a pending action.  
  * Reads the `action_requests` record.  
  * Executes the action described in the `payload`.  
  * Deletes the record from `action_requests`.

### **4\. Frontend UI/UX**

#### **A. Invite Acceptance Flow**

* A new page at `/accept-invite?token=...`.  
* If the user is new, they are seamlessly logged in and redirected.  
* If the user exists, they are presented with the "Transform Account" or "Use a Different Email" options.

#### **B. Owner's Management UI (on `AccountPage.jsx`)**

* A new "Shared Access" card.  
* A form to send new sharing invitations, including a dropdown for setting the initial permission level.  
* A list of current partners and pending invites. Each partner listed will have a dropdown to change their permission level and a button to revoke access (with a confirmation modal).

#### **C. Partner's Experience**

* **Page Access**: A route guard in `App.jsx` will check if the user is a partner (`owner_user_id` exists in their user context). If so, it will restrict their access to an allowlist of pages (e.g., `/dashboard`, `/budget/`, `/review/`) and redirect them from forbidden pages like `/account`.  
* **Budget Page**: The UI will appear differently based on permission level:  
  * **`read_only`**: "Pay," "Edit," "Add" buttons will be disabled or hidden.  
  * **`update_by_request`**: All buttons appear enabled. Clicking an action button makes an API call that logs an `action_request` and shows a confirmation toast like "Request sent for approval."  
  * **`full_access`**: The UI is fully functional.

#### **D. Owner's Budget Page Experience**

* The page will fetch both budget data and any pending `action_requests`.  
* It will compute a "preview state" of the budget, applying the pending changes virtually.  
* The UI will render based on this preview state.  
* Items with a pending request will have a distinct visual style (e.g., a colored border) and will display the `description` text from the `action_requests` table, along with an "Approve" button.

