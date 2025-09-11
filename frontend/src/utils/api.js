import toast from 'react-hot-toast';

/**
 * A centralized function for making API requests.
 * @param {string} endpoint - The API endpoint.
 * @param {string} [method='GET'] - The HTTP method.
 * @param {object} [body=null] - The request body.
 * @param {boolean} [showToast=true] - Whether to show a toast on error.
 * @returns {Promise<any>} - The JSON response from the server.
 */


const apiRequest = async (endpoint, method = 'GET', body = null, showToast = true) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include',
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, options);
        
        if (response.status === 204) {
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ messages: { error: 'An unexpected error occurred.' } }));
            // Add a status code to the error object for more specific handling
            const error = new Error(errorData.messages?.error || 'API request failed.');
            error.status = response.status;
            throw error;
        }

        return await response.json();

    } catch (err) {
        // --- THIS IS THE FIX ---
        // Only show the toast if the showToast flag is true
        if (showToast) {
            toast.error(err.message);
        }
        // --- END OF FIX ---
        throw err;
    }
};
// --- Export a specific, named function for each API call ---

//Auth
export const requestLoginLink = (email, inviteToken = null) => {
    const payload = { email };
    if (inviteToken) {
        payload.invite_token = inviteToken;
    }
    return apiRequest('/api/auth/request-link', 'POST', payload);
};
export const verifyLoginLink = (token) => apiRequest('/api/auth/verify-link', 'POST', { token });
export const logout = () => apiRequest('/api/auth/logout', 'POST');

// User & Account Data
export const getProfile = (showToast = true) => apiRequest('/api/user/profile', 'GET', null, showToast);
export const getCycles = () => apiRequest('/api/budget/cycles');
export const getUserAccounts = () => apiRequest('/api/user-accounts');
export const getActiveBudget = () => apiRequest('/api/user/active-budget');
export const updateAccountBalance = (accountId, newBalance) => apiRequest(`/api/user-accounts/update-balance/${accountId}`, 'POST', { current_balance: newBalance });
export const deleteUserAccount = (accountId) => apiRequest(`/api/user-accounts/${accountId}`, 'DELETE');
export const dismissAccountsPrompt = () => apiRequest('/api/user/dismiss-accounts-prompt', 'POST');
export const updateProfile = (profileData) => apiRequest('/api/settings/profile', 'POST', profileData);
export const createAccount = (accountData) => apiRequest('/api/user-accounts', 'POST', accountData);
export const updateAccount = (accountId, accountData) => apiRequest(`/api/user-accounts/${accountId}`, 'PUT', accountData);


// Content
export const getAllContent = () => apiRequest('/api/content/all');
export const getLatestAnnouncement = () => apiRequest('/api/content/latest-announcement');
export const markAnnouncementSeen = (contentId) => apiRequest('/api/content/mark-as-seen', 'POST', { content_id: contentId });

// Account Page
export const getRecurringItems = () => apiRequest('/api/settings/recurring-items');
export const deleteGoal = (goalId) => apiRequest(`/api/goals/${goalId}`, 'DELETE');
export const deleteRecurringItem = (type, itemId) => {
    const endpoint = type === 'income' 
        ? `/api/settings/income-sources/${itemId}` 
        : `/api/settings/recurring-expenses/${itemId}`;
    return apiRequest(endpoint, 'DELETE');
};
export const verifyEmailChange = (token) => apiRequest(`/api/settings/verify-email-change/${token}`);
export const updateIncomeSource = (sourceId, sourceData) => apiRequest(`/api/settings/income-sources/${sourceId}`, 'PUT', sourceData);
export const updateRecurringExpense = (expenseId, expenseData) => apiRequest(`/api/settings/recurring-expenses/${expenseId}`, 'POST', expenseData);

// Budget Page
export const getBudgetDetails = (budgetId) => apiRequest(`/api/budget/${budgetId}`);
export const getTransactionsForCycle = (budgetId) => apiRequest(`/api/budget-items/transactions/${budgetId}`);
export const getActionRequests = (budgetId) => apiRequest(`/api/sharing/requests/${budgetId}`);
export const removeIncomeItem = (budgetId, label, date, id) => {
    return apiRequest(`/api/budget-items/remove-income/${budgetId}`, 'POST', { label, date, id });
};
export const closeBudget = (budgetId) => apiRequest(`/api/budget/close/${budgetId}`, 'POST');
export const updateBudgetDates = (budgetId, dates) => apiRequest(`/api/budget/update-dates/${budgetId}`, 'POST', dates);

// Sharing
export const acceptShareInvite = (token) => apiRequest('/api/sharing/accept', 'POST', { token });
export const transformAccount = (token) => apiRequest('/api/sharing/transform-account', 'POST', { token });
export const sendShareInvite = (email, permissionLevel) => apiRequest('/api/sharing/invite', 'POST', { email, permission_level: permissionLevel });
export const revokeAccess = (inviteId) => apiRequest(`/api/sharing/invites/${inviteId}`, 'DELETE');
export const updatePartnerPermission = (partnerId, newPermission) => apiRequest(`/api/sharing/update-permission/${partnerId}`, 'PUT', { permission_level: newPermission });
export const approveRequest = (requestId) => apiRequest(`/api/sharing/approve/${requestId}`, 'POST');
export const denyRequest = (requestId) => apiRequest(`/api/sharing/deny/${requestId}`, 'POST');
export const getSharingInvites = () => apiRequest('/api/sharing/invites');
export const cancelRequest = (requestId) => apiRequest(`/api/sharing/request/${requestId}`, 'DELETE');
export const getPartnersAndInvites = () => apiRequest('/api/sharing/partners-and-invites');


// Goals
export const getGoals = () => apiRequest('/api/goals');
export const createGoal = (goalData) => apiRequest('/api/goals', 'POST', goalData);
export const updateGoal = (goalId, goalData) => apiRequest(`/api/goals/${goalId}`, 'PUT', goalData);
export const logGoalPayment = (goalId, data) => apiRequest(`/api/goals/${goalId}/log-payment`, 'POST', data);

//Account Actions
export const requestEmailChange = (newEmail) => apiRequest('/api/settings/request-email-change', 'POST', { new_email: newEmail });
export const deleteAccount = () => apiRequest('/api/settings/delete', 'DELETE');
export const freshStart = () => apiRequest('/api/user/fresh-start', 'DELETE');

// Budget Item Creation
export const addIncomeToCycle = (budgetId, data) => apiRequest(`/api/budget-items/add-income/${budgetId}`, 'POST', data);
export const addVariableExpense = (budgetId, data) => apiRequest(`/api/budget-items/add-variable-expense/${budgetId}`, 'POST', data);
export const addRecurringExpense = (budgetId, data) => apiRequest(`/api/budget-items/add-expense/${budgetId}`, 'POST', data);

// Budget Item Actions
export const updateRecurringExpenseInCycle = (budgetId, data) => apiRequest(`/api/budget-items/recurring-expense/${budgetId}`, 'PUT', data);
export const updateIncomeInCycle = (budgetId, data) => apiRequest(`/api/budget-items/${budgetId}/update-income`, 'POST', data);
export const getExpenseHistory = (label) => apiRequest(`/api/budget-items/expense-history?label=${encodeURIComponent(label)}`);
export const updateExpenseDetails = (expenseId, data) => apiRequest(`/api/settings/expenses/update-details/${expenseId}`, 'PUT', data);
export const markBillPaid = (budgetId, data) => apiRequest(`/api/budget-items/mark-bill-paid/${budgetId}`, 'POST', data);
export const markIncomeReceived = (budgetId, data) => apiRequest(`/api/budget-items/${budgetId}/receive-income`, 'POST', data);
export const markBillUnpaid = (budgetId, data) => apiRequest(`/api/budget-items/mark-bill-unpaid/${budgetId}`, 'POST', data);
export const removeExpenseItem = (budgetId, label) => apiRequest(`/api/budget-items/remove-expense/${budgetId}`, 'POST', { label });
export const updateVariableExpenseAmount = (budgetId, data) => apiRequest(`/api/budget-items/update-variable-amount/${budgetId}`, 'POST', data);

// Log Variable Expense Transaction
export const logVariableExpense = (budgetId, data) => apiRequest(`/api/budget-items/log-variable-expense/${budgetId}`, 'POST', data);

// Transactions
export const logTransaction = (transactionData) => apiRequest('/api/transaction/add', 'POST', transactionData);

// Account Transfers
export const transferToAccount = (budgetId, data) => apiRequest(`/api/transfers/${budgetId}/to-account`, 'POST', data);
export const transferFromAccount = (budgetId, data) => apiRequest(`/api/transfers/${budgetId}/from-account`, 'POST', data);

// Feedback
export const submitFeedback = (feedbackData) => apiRequest('/api/feedback/submit', 'POST', feedbackData);

// "Join the App" Invitations
export const getUserInvitations = () => apiRequest('/api/invitations');
export const sendJoinInvite = (email) => apiRequest('/api/invitations/send', 'POST', { recipient_email: email });

// Account Item Creation
export const createRecurringExpense = (expenseData) => apiRequest('/api/settings/recurring-expenses', 'POST', expenseData);
export const createIncomeSource = (incomeData) => apiRequest('/api/settings/income-sources', 'POST', incomeData);

// Wizard
export const getWizardSuggestions = () => apiRequest('/api/budget/wizard-suggestions');
export const createBudgetCycle = (budgetData) => apiRequest('/api/budget/create', 'POST', budgetData);

// Projections
export const projectIncome = (dates, incomeRules) => apiRequest('/api/budget/project-income', 'POST', {
    start_date: dates.startDate,
    end_date: dates.endDate,
    income_rules: incomeRules,
});

// Categories
export const createSpendingCategory = (name) => apiRequest('/api/budget-items/spending-categories', 'POST', { name });

// Savings Actions
export const addSavings = (budgetId, data) => apiRequest(`/api/budget/savings/add/${budgetId}`, 'POST', data);
export const withdrawSavings = (budgetId, data) => apiRequest(`/api/budget/savings/withdraw/${budgetId}`, 'POST', data);

// Cancel Invite
export async function cancelInvite(inviteId) {
    // Adjust the endpoint as needed to match your backend route
    const res = await fetch(`/api/sharing/cancel-invite/${inviteId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to cancel invite');
    }
    return await res.json();
}