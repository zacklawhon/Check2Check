import toast from 'react-hot-toast';
import * as api from '../utils/api';

/**
 * A centralized function for making API requests.
 * @param {string} endpoint - The API endpoint (e.g., '/api/budget/1').
 * @param {string} [method='GET'] - The HTTP method.
 * @param {object} [body=null] - The request body for POST/PUT requests.
 * @returns {Promise<any>} - The JSON response from the server.
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
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
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ messages: { error: 'An unexpected error occurred.' } }));
            throw new Error(errorData.messages?.error || 'API request failed.');
        }

        // --- THIS IS THE FIX ---
        // Check if there's any content to parse. If not, return null.
        const contentLength = response.headers.get('content-length');
        if (response.status === 204 || contentLength === '0') {
            return null; // Return null for "No Content" responses
        }
        // --- END OF FIX ---

        // If there is content, parse it as JSON.
        return await response.json();

    } catch (err) {
        toast.error(err.message);
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

// User & Account Data
export const getProfile = () => apiRequest('/api/user/profile');
export const getCycles = () => apiRequest('/api/budget/cycles');
export const getUserAccounts = () => apiRequest('/api/user-accounts');
export const getActiveBudget = () => apiRequest('/api/user/active-budget');
export const updateAccountBalance = (accountId, newBalance) => apiRequest(`/api/user-accounts/update-balance/${accountId}`, 'POST', { current_balance: newBalance });
export const deleteUserAccount = (accountId) => apiRequest(`/api/user-accounts/${accountId}`, 'DELETE');

// Content
export const getAllContent = () => apiRequest('/api/content/all');
export const getLatestAnnouncement = () => apiRequest('/api/content/latest-announcement');
export const markAnnouncementSeen = (contentId) => apiRequest('/api/content/mark-as-seen', 'POST', { content_id: contentId });

// Account Page
export const getRecurringItems = () => apiRequest('/api/account/recurring-items');
export const deleteGoal = (goalId) => apiRequest(`/api/goals/${goalId}`, 'DELETE');
export const deleteRecurringItem = (type, itemId) => {
    const endpoint = type === 'income' 
        ? `/api/account/income-sources/${itemId}` 
        : `/api/account/recurring-expenses/${itemId}`;
    return apiRequest(endpoint, 'DELETE');
};
export const verifyEmailChange = (token) => apiRequest(`/api/account/verify-email-change/${token}`);
export const updateIncomeSource = (sourceId, sourceData) => apiRequest(`/api/account/income-sources/${sourceId}`, 'PUT', sourceData);
export const updateRecurringExpense = (expenseId, expenseData) => apiRequest(`/api/account/recurring-expenses/${expenseId}`, 'POST', expenseData);

// Budget Page
export const getBudgetDetails = (budgetId) => apiRequest(`/api/budget/${budgetId}`);
export const getTransactionsForCycle = (budgetId) => apiRequest(`/api/budget-items/transactions/${budgetId}`);
export const getActionRequests = (budgetId) => apiRequest(`/api/sharing/requests/${budgetId}`);
export const removeIncomeItem = (budgetId, label) => apiRequest(`/api/budget-items/remove-income/${budgetId}`, 'POST', { label });
export const closeBudget = (budgetId) => apiRequest(`/api/budget/close/${budgetId}`, 'POST');

// Sharing
export const acceptShareInvite = (token) => apiRequest('/api/sharing/accept', 'POST', { token });
export const transformAccount = (token) => apiRequest('/api/sharing/transform-account', 'POST', { token });
export const sendShareInvite = (email, permissionLevel) => apiRequest('/api/sharing/invite', 'POST', { email, permission_level: permissionLevel });
export const revokeAccess = (inviteId) => apiRequest(`/api/sharing/invites/${inviteId}`, 'DELETE');
export const updatePartnerPermission = (partnerId, newPermission) => apiRequest(`/api/sharing/update-permission/${partnerId}`, 'PUT', { permission_level: newPermission });

// Goals
export const getGoals = () => apiRequest('/api/goals');
export const createGoal = (goalData) => apiRequest('/api/goals', 'POST', goalData);
export const updateGoal = (goalId, goalData) => apiRequest(`/api/goals/${goalId}`, 'PUT', goalData);

//Account Actions
export const requestEmailChange = (newEmail) => apiRequest('/api/account/request-email-change', 'POST', { new_email: newEmail });
export const deleteAccount = () => apiRequest('/api/account/delete', 'DELETE');
export const freshStart = () => apiRequest('/api/user/fresh-start', 'DELETE');
export const updateFinancialTools = (toolsData) => apiRequest('/api/account/financial-tools', 'POST', toolsData);

// Budget Item Creation
export const addIncomeToCycle = (budgetId, data) => apiRequest(`/api/budget-items/add-income/${budgetId}`, 'POST', data);
export const addVariableExpense = (budgetId, data) => apiRequest(`/api/budget-items/add-variable-expense/${budgetId}`, 'POST', data);
export const addRecurringExpense = (budgetId, data) => apiRequest(`/api/budget-items/add-expense/${budgetId}`, 'POST', data);