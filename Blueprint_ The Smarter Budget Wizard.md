## **Blueprint: The Smarter Budget Wizard**

This document outlines the architecture and user flow for the upgraded Guided Budget Wizard. The primary goal is to transform the wizard from a manual data-entry tool into a smart, predictive engine that automates budget creation for the user.

### **1\. Overview & Goals**

* **Primary Goal:** To create a "one-click" budget creation experience for returning users by projecting their next budget cycle automatically.  
* **Core Feature:** Shift from users manually adding individual income items to defining reusable "Income Source Rules" (e.g., "I get paid $1500 every Friday").  
* **User Experience:**  
  * **First-Time User:** A guided, multi-step process to establish their initial financial rules.  
  * **Returning User:** A single "Express Review" screen that presents a fully projected, pre-built budget for their approval.  
* **Technical Goals:**  
  * Maximize reuse of existing frontend components.  
  * Minimize database schema changes to ensure stability.  
  * Ensure backward compatibility for existing beta testers.

### **2\. Core Concepts**

* **Budget Cycle:** The user explicitly defines a timeframe for their budget by providing a **Start Date** and a **Duration** (e.g., "One Month," "Two Weeks"). The system calculates the End Date.  
* **Projection Model:** The app uses a set of rules (Income Sources, Recurring Expenses) to project all financial events that will occur within the defined Budget Cycle. The complex date-based calculation logic will live exclusively on the backend.  
* **Learning System:** The more a user saves their financial rules, the more automated the process becomes. The system defaults to using all saved, active rules to pre-build the next budget.

### **3\. Database Changes**

To support the new frequency rules, the following **nullable integer columns** will be added to the existing income\_sources table. This is a non-breaking change.

* frequency\_day (INT, nullable): Stores the day of the week (e.g., 1 for Monday, 5 for Friday). Used for Weekly and Bi-Weekly frequencies.  
* frequency\_date\_1 (INT, nullable): Stores the day of the month (e.g., 15). Used for Monthly and the first date of Semi-Monthly frequencies.  
* frequency\_date\_2 (INT, nullable): Stores the second day of the month (e.g., 30). Used only for Semi-Monthly frequency.

The IncomeSourceModel.php will be updated to include these new fields in its $allowedFields array. No other database changes are required.

### **4\. Backend Architecture**

* **ProjectionService.php (New Service):**  
  * This new service will be the "brain" of the projection engine.  
  * **Input:** A startDate, endDate, and an array of income/expense rules.  
  * **Function:** It will calculate and generate a complete, dated list of all financial events occurring within the timeframe.  
* **/api/budget/wizard-suggestions (Enhanced Endpoint):**  
  * This endpoint will be upgraded to perform the projection automatically for returning users.  
  * It will fetch all of the user's saved rules and use the ProjectionService to generate a complete budget proposal.  
  * It will include a migrationRequired flag to handle backward compatibility.

### **5\. Frontend Wizard Flow (New User)**

A first-time user will be guided through a multi-step process to establish their initial rules.

* **Step 1: BudgetCycleStep.jsx (New Component)**  
  * Replaces DateConfirmationStep.  
  * User provides a **Start Date** and selects a **Duration**. The app calculates and displays the End Date.  
* **Step 2: IncomeStep.jsx (Enhanced Component)**  
  * The "Add New Income" form will be updated with conditional fields that appear based on the selected frequency (e.g., a "Day of Week" dropdown appears when "Weekly" is chosen).  
* **Step 3: ReviewStep.jsx (New Component)**  
  * The "magic" step. It displays the rules the user just configured.  
  * It makes an API call to the backend, which uses the ProjectionService to return a detailed breakdown of all projected income events and the total amount. The user confirms this projection.  
* **Step 4 & 5: ExpenseStep.jsx & SpendingStep.jsx (Existing Components)**  
  * These components are reused as-is and are simply moved to become the final steps in the new flow.

### **6\. Frontend Wizard Flow (Returning User)**

A returning user's experience is streamlined into a single confirmation screen.

* **The "Express Review" Screen:**  
  * The GuidedWizard.jsx will load directly into a single-page summary.  
  * The backend will have already performed the projection using the user's saved rules.  
  * The UI will display the proposed budget cycle, total projected income, total projected bills, and a detailed breakdown of each.  
  * **User Actions:**  
    1. **Primary Action:** A single "Looks Good, Create My Budget" button.  
    2. **Secondary Actions:** "Adjust Dates" or "Add/Edit Income Sources" buttons that open modals containing the relevant wizard step components (BudgetCycleStep, IncomeStep, etc.) for making quick changes. Any change triggers an immediate recalculation of the projection.

### **7\. Backward Compatibility Plan**

To ensure a smooth transition for the existing 7 beta testers.

* **Detection:** The /api/budget/wizard-suggestions endpoint will check if a user has "legacy" income rules (e.g., frequency is 'weekly' but the new frequency\_day column is null). If so, it will return migrationRequired: true.  
* **One-Time Upgrade Step:**  
  * If migrationRequired is true, the GuidedWizard.jsx will first render a new MigrationStep.jsx component.  
  * This component will display a friendly message explaining the one-time update.  
  * It will loop through only the legacy income sources and ask for the specific missing information (e.g., "On which day of the week do you get paid for 'My Paycheck'?").  
  * A single "Save & Continue" button will update the rules in the database.  
* **Seamless Handoff:** After the migration is complete, the wizard will proceed to the "Express Review" screen, and the user will never see the migration step again.