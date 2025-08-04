# **AI App Generation Blueprint**

## **1\. High-Level Summary**

**Instructions:** Start with a brief, high-level overview. Think of this as your elevator pitch.

* **App Name:** Check2Check.org  
* **One-Sentence Description:** A simple and fun budgeting tool made just for people that live paycheck to paycheck  
* **Target Audience:** Citizens living paycheck to paycheck with little to no financial literacy  
* **Problem It Solves:** Most citizens that live paycheck to paycheck will do so their entire lives because they find financial literacy overwhelming or out of reach  
* **Unique Selling Proposition (USP):** The app's feature set and UI evolve with the user. It starts as a simple calculator and gradually introduces more powerful budgeting tools, gamification, and a choice of a guided experience as the user becomes more engaged and financially confident.

## **2\. Privacy & Monetization Philosophy**

**Instructions:** A statement on the ethical handling of user data and the approach to monetization.

* **User Trust is Paramount:** All user-provided data is considered sensitive and will be protected with industry-standard encryption.  
* **Anonymity by Default:** Any data used for comparative insights will be fully aggregated and anonymized. No personally identifiable information will ever be shared or sold.  
* **Opt-In for All Comparisons & Offers:** Users must explicitly opt-in to see peer comparison data and to receive any product suggestions. The app will be fully functional without opting into these features.  
* **Value-Driven Monetization:** Monetization through affiliate programs will only be implemented when it provides genuine, timely value to the user (e.g., suggesting a credit-builder card only after the user has achieved their savings goal). The focus is on helping the user, not just selling products.

## **3\. Core Features & Functionality**

**Instructions:** List every feature you want in the app. Be specific. Use the format "A user can..." to describe each action. Prioritize them if possible (e.g., Must-Have, Nice-to-Have).

### **Phase 1: Unregistered User Experience (Local Storage Only)**

* **Feature 1:** A new user, on the landing page, can input their total available cash for their current pay period.  
* **Feature 2:** A user can add, name, and set an amount for each expected expense.  
* **Feature 3:** The app automatically calculates the remaining money.  
* **Feature 4:** All data is stored locally in the user's browser.  
* **Feature 5:** The user is prompted to create an account to save their progress.

### **Phase 2: Registered User Features (MVP)**

* **User Authentication:** Passwordless login via a "magic link" sent to the user's email.  
* **Persistent Sessions:** A user remains logged in unless they access from a new device/browser/IP.  
* **Feature 1:** A user can create and save multiple "Budget Cycles".  
* **Feature 2:** A user can mark fixed bills as "Paid".  
* **Transaction Logging:** For variable spending categories (e.g., Groceries), a user can log individual transactions to track spending against their budgeted amount.  
* **Dynamic Budget Adjustments:** A user can adjust their total income or add a completely unplanned expense category mid-cycle. The app records this as a new, timestamped "adjustment" transaction, preserving the original budget figures for an accurate historical record.

### **Phase 3: Onboarding & Learning (Post-Registration)**

* **Demographic Collection:** A one-time, skippable prompt for optional demographic info.  
* **Experience Choice:** The user chooses between "Simple Mode" or "Guided Mode".  
* **Budget Adherence Nudging:** The app can leverage the history of a user's budget adjustments to provide helpful insights.  
* **Pattern Recognition:** The app learns from user entries to identify recurring bills and variable spending categories.  
* **Smart Suggestions:** The app suggests learned recurring bills and common variable spending categories when creating new budgets.  
* **Savings Balance Tracking:** When creating a new budget, users with a savings account are prompted to update their current balance.  
* **Gamification & Achievements:**  
  * **Financial Literacy Quizzes:** Optional financial questions are triggered by positive actions.  
  * **Progress Badges:** Users earn badges for key milestones.  
  * **Financial Tool Badges:** Users earn badges for indicating they have tools like a checking or savings account.  
  * **Final Badge:** A capstone achievement awarded for reaching a high level of financial proficiency.  
* **Prioritized Financial Education Path:** A subtle, trigger-based system to educate users based on their current financial standing, progressing through tiers from savings to credit building to advanced credit.

### **Phase 4: Guided Mode Onboarding Wizard**

* **Trigger:** This wizard starts immediately after a user chooses "Guided Mode" for the first time.  
* **Step 1: Income Setup:** The user adds all recurring income sources.  
* **Step 2: Budget Cycle Confirmation:** The app suggests a budget duration based on income frequency.  
* **Step 3: Recurring Expense Setup:** The wizard guides the user to add their common recurring bills.  
* **Step 4: Variable Spending Setup:** The wizard prompts the user to create budgets for variable spending categories.  
* **Step 5: Financial Tools Setup:** The wizard asks the user about their financial accounts and records their initial savings balance.

### **Phase 5: End-of-Cycle Review**

* **Trigger:** When a budget cycle's endDate is reached, the user is prompted to review the cycle.  
* **Budget Summary:** The review displays a clear summary showing initial budgeted amounts vs. final amounts.  
* **Surplus/Deficit Analysis:** The app calculates the final remaining cash (surplus) or shortfall (deficit).  
* **Smart Suggestions for Surplus:** If there is a surplus, the app provides a prioritized list of encouraging suggestions.  
* **Budget Comparison:** The review compares key stats to the user's previous budget cycles to highlight progress.  
* **Deficit Warning System & Humane Advice:** When a deficit occurs, the app provides strong, empathetic advice against predatory options and offers practical, safe suggestions.  
* **Deficit Pattern Recognition:** By analyzing past budget performance, the app can recognize if a user frequently runs a deficit and provide a gentle warning before the next budget cycle.

### **Phase 6: Community & Monetization (Optional, Opt-In)**

* **Anonymous Peer Comparison:** An opt-in feature where users can see how their financial habits compare to the anonymized average of other users in their same demographic group.  
* **Targeted Affiliate Suggestions:** After a user reaches a specific milestone on their Financial Education Path, the app may suggest relevant, vetted financial products via an affiliate link.

### **Phase 7: User Account Management**

* **Change Email Address:** A logged-in user can change their email address. This will trigger a verification link to be sent to the *original* email address to confirm the change.  
* **Preference Management:** A user can change their opt-in preferences for peer comparisons and affiliate offers at any time from a dedicated Settings page.  
* **Account Deletion (Data Anonymization):** A user can choose to delete their account. This action is irreversible and will:  
  * Permanently delete their personal information (email, demographic data) from the User record.  
  * Re-assign all their associated financial records (budgets, transactions, etc.) to a generic, anonymous user ID to preserve the integrity of the platform's aggregate data.

### **Phase 8: Admin Panel & Platform Management**

* **Secure Admin Access:** A separate, secure login for admin users.  
* **Role-Based Permissions:** Different admin roles (e.g., Super Admin, Content Manager, Support Agent) with varying levels of access.  
* **Content Management System (CMS):** Admins can create, update, and delete content for Financial Literacy Quizzes and the prioritized educational tips.  
* **Reporting Dashboard:** Admins can view high-level, anonymized reports on user engagement, demographic trends, and common spending patterns to improve the app.  
* **User Support System:** A built-in messaging/ticketing system for users to report bugs or ask questions. Admins can view, manage, and respond to these tickets.  
* **User Management:** Super Admins have the ability to manage user accounts, such as updating a user's email if they lose access to their original one, or manually anonymizing an account if required.

### **Nice-to-Have Features (Future Versions):**

* **Feature 1:** Savings goal tracking with visualizations based on SavingsHistory.  
* **Feature 2:** Prediction of user paydays.  
* **Feature 3:** Advanced "Guided Mode" features like debt-payoff strategies.  
* **Feature 4:** 2FA/SMS verification as an additional security option for changing an email address.

## **4\. User Flow & Stories**

**Instructions:** Describe the user's journey through the app for key tasks. This helps define the sequence of screens and actions.

* **User Story 1 (First Visit):** "As a **first-time visitor**, I want to **use a simple calculator on the homepage**."  
* **User Story 2 (Sign Up):** "As a **first-time user**, I want to **get a magic link via email** to save my budget."  
* **User Story 3 (Onboarding Profile):** "As a **newly registered user**, I want to be **prompted once to optionally provide demographic info**."  
* **User Story 4 (Choosing an Experience):** "As a **newly registered user**, I want to **choose between a simple and a guided experience**."  
* **User Story 5 (Guided Setup):** "As a **new user in Guided Mode**, I want to **use a step-by-step wizard to enter my income, confirm the budget duration, add my bills, set my spending budgets, and log my financial accounts**."  
* **User Story 6 (Tracking Spending):** "As a **user with a budget**, I want to **log my $45 grocery purchase against my grocery budget** so I can see how much I have left to spend."  
* **User Story 7 (Live Adjustment):** "As a **current user**, I want to **add an unplanned 'Car Repair' expense of $150 to my live budget** so it stays accurate."  
* **User Story 8 (Reviewing a Budget):** "As a **user whose budget just ended**, I want to **see a summary of my performance, compare it to last time, and get suggestions** on what to do with my leftover money."  
* **User Story 9 (Earning a Badge):** "As a **user**, I want to **indicate that I have a checking account** to earn a badge."  
* **User Story 10 (Tracking Savings):** "As a **returning user**, I want to be **prompted to update my savings balance** when I create a new budget."  
* **User Story 11 (Educational Path):** "As a **user who has successfully built a savings buffer**, I want the app to **start showing me small, actionable tips about building credit** so I know what to focus on next."  
* **User Story 12 (Peer Comparison):** "As a **user who has opted-in**, I want to **see how my grocery spending compares to the average for my household size** so I can know if I'm on the right track."  
* **User Story 13 (Product Suggestion):** "As a **user who has unlocked the 'Credit Building' tier**, I want the app to **suggest a few vetted, beginner-friendly secured credit cards** so I can easily research and apply for one."  
* **User Story 14 (Nudge Response):** "As a **returning user**, I want to **see a gentle reminder** so I can add more details when I'm ready."  
* **User Story 15 (Deficit Advice):** "As a **user who ended my budget with a deficit**, I want the app to **give me realistic, safe options to manage the shortfall** instead of just showing me a negative number."  
* **User Story 16 (Account Deletion):** "As a **user who wants to leave the service**, I want to **delete my account from a settings page**, which will remove my personal information but keep my past financial data for anonymous statistics."  
* **User Story 17 (Admin Content Management):** "As a **Content Manager**, I want to **log into the admin panel and add a new quiz question** so that I can keep the educational content fresh."  
* **User Story 18 (User Needing Support):** "As a **user who found a bug**, I want to **submit a support message through the app** so that I can get help from an admin."

## **5\. Data Model**

**Instructions:** Describe the data your app needs to store. This is like a blueprint for your database.

{  
  "LocalBudget": { "..." },  
  "User": {  
    "userId": "Unique ID",  
    "email": "String",  
    "status": "String ('active', 'anonymized')",  
    "experienceMode": "String ('simple' or 'guided')",  
    "financialTier": "Number (1=Pre-Savings, 2=Building Savings, 3=Credit Building, 4=Advanced)",  
    "achievements": \["String"\],  
    "hasOptedInToComparisons": "Boolean",  
    "hasOptedInToOffers": "Boolean",  
    "financialTools": {  
        "hasChecking": "Boolean",  
        "hasSavings": "Boolean",  
        "hasCreditCard": "Boolean",  
        "hasLineOfCredit": "Boolean",  
        "savingsBalance": "Number"  
    },  
    "..."  
  },  
  "AdminUser": {  
    "adminId": "Unique ID",  
    "username": "String",  
    "passwordHash": "String",  
    "role": "String ('super\_admin', 'content\_manager', 'support\_agent')"  
  },  
  "SupportTicket": {  
    "ticketId": "Unique ID",  
    "ownerId": "ID of the User who submitted it",  
    "subject": "String",  
    "message": "Text",  
    "status": "String ('open', 'in\_progress', 'resolved')",  
    "createdAt": "Timestamp",  
    "resolvedAt": "Timestamp"  
  },  
  "IncomeSource": { "..." },  
  "RecurringExpense": { "..." },  
  "BudgetCycle": {  
    "cycleId": "Unique ID",  
    "ownerId": "ID of the User",  
    "cycleName": "String",  
    "startDate": "Date",  
    "endDate": "Date",  
    "status": "String ('active', 'completed')",  
    "initialIncome": \[ { "sourceName": "String", "amount": "Number" } \],  
    "initialExpenses": \[ {   
        "expenseName": "String",   
        "amount": "Number",   
        "isPaid": "Boolean",  
        "type": "String ('bill' or 'spending')"   
    } \],  
    "finalSummary": {  
        "totalIncome": "Number",  
        "totalExpenses": "Number",  
        "surplusOrDeficit": "Number"  
    },  
    "createdAt": "Timestamp"  
  },  
  "Transaction": {  
    "transactionId": "Unique ID",  
    "cycleId": "ID of the BudgetCycle",  
    "categoryName": "String (e.g., 'Groceries')",  
    "amount": "Number",  
    "description": "String (e.g., 'Walmart run')",  
    "transactionDate": "Timestamp"  
  },  
  "IncomeAdjustment": { "..." },  
  "ExpenseAdjustment": { "..." },  
  "LearnedSpendingCategory": { "..." },  
  "SavingsHistory": { "..." },  
  "QuizQuestion": { "..." },  
  "Suggestion": {  
    "suggestionId": "Unique ID",  
    "type": "String ('surplus', 'deficit', 'education')",  
    "tier": "Number (Matches user's financialTier)",  
    "text": "String (The suggestion text, e.g., 'Consider putting this towards your savings goal\!')"  
  }  
}

## **6\. UI/UX & Design Principles**

**Instructions:** Describe the look and feel of your app. While the AI will make design choices, your guidance is crucial. You can even link to inspiration or create simple wireframes.

* **Overall Vibe:** \[e.g., Minimalist and clean, Dark mode, Playful and colorful, Corporate and professional\]  
* **Color Palette:** \[e.g., Primary: \#4A90E2, Secondary: \#F5A623, Background: \#FFFFFF, Text: \#333333\]  
* **Typography:** \[e.g., Font: Inter, Headings: Bold, Body: Regular\]

### **UI States & Error Handling**

* **Loading States:** Use modern skeleton screens instead of spinners when fetching data to provide a smoother perceived performance.  
* **Error Handling:** Provide clear, human-readable error messages that guide the user to a solution without exposing technical details.  
  * **Example Login Errors:** "This email address is already registered.", "You might have misspelled your email address, it is failing validation.", "When we tried to send the login email, your email service rejected it. Can you check to make sure that address is still valid?"  
* **Data Validation:** The full stack must enforce data integrity. The frontend should only allow valid data types (e.g., number fields for amounts), the backend API must validate all incoming data before processing, and the database schema must enforce the correct data types at the final layer.

### **Key Screens**

* **Landing Page:** The initial page should be simple and inspiring. The messaging should stress that the app is free, built for people living paycheck to paycheck, and respects user privacy by not requiring bank connections, not collecting personal info to start, and having no ads. It should also clarify that any affiliate suggestions are optional and obligation-free. The primary call-to-action should be to use the simple, anonymous calculator.  
* **Login/Sign Up Screen:** A single email field for the magic link.  
* **Onboarding Profile Screen:** A friendly, skippable form for optional demographics.  
* **Experience Choice Screen:** Two large, clickable cards for "Simple Mode" and "Guided Mode".  
* **Guided Onboarding Wizard:** A multi-step modal for guided setup.  
* **Registered User Dashboard:** The main hub, showing budget cycles. Educational nudges appear as small, contextual cards on the dashboard.  
* **Budget Cycle Detail Screen:** A view of a single budget. The expense list will be visually grouped into "Bills" and "Spending Categories".  
* **Budget Review Screen:** A dedicated screen or modal that appears when a budget is completed. For a deficit, it will prominently display a 'Don't Panic, Let's Make a Plan' section with the humane suggestions listed in a clear, actionable format.  
* **Peer Comparison Screen:** An opt-in screen accessible from the dashboard that uses simple charts and graphs to show anonymous comparisons.  
* **Quiz Modal:** A pop-up for gamified learning.  
* **Achievements/Badges Screen:** A dedicated page to display all earned badges and visualize progress on the Financial Education Path.  
* **Settings Page:** A central page for managing the user profile. It will have distinct sections for: 1\. Changing email address. 2\. Managing opt-in preferences for comparisons and offers. 3\. A 'Delete Account' section with a clear warning about the irreversible nature of the action.  
* **Admin Panel:** A separate, secure web interface for platform management. It will feature a navigation menu for different sections: Dashboard (for reports), Content (for tips/quizzes), Support Tickets, and User Management. The interface will be functional and data-driven.

## **7\. Technology Stack**

**Instructions:** If you have a preference, specify the technologies you want the AI to use. If you don't know, you can leave this blank and let the AI choose.

* **Frontend (User Interface):** React  
* **Backend (Server & Database):** CodeIgniter 4x with MySQL  
* **Platform:** Web App (for browsers)