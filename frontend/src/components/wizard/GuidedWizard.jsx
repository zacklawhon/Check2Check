import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import DateConfirmationStep from './DateConfirmationStep';
import IncomeStep from './IncomeStep';
import ExpenseStep from './ExpenseStep';
import SpendingStep from './SpendingStep';

export function GuidedWizard() {
    const navigate = useNavigate();
    // 1. Get the user, accounts, AND the refreshData function from the context
    const { user, accounts, refreshData } = useOutletContext();

    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        confirmedDates: { startDate: '', endDate: '' },
        confirmedIncome: [],
        confirmedExpenses: [],
        suggestions: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch('/api/budget/wizard-suggestions', { credentials: 'include' });
                if (!response.ok) throw new Error('Could not load setup data.');
                const data = await response.json();
                const suggestions = {
                    proposedStartDate: data.proposedStartDate,
                    proposedEndDate: data.proposedEndDate,
                    suggestedIncome: data.suggestedIncome || [],
                    suggestedExpenses: data.suggestedExpenses || [],
                    learned_spending_categories: data.learned_spending_categories || [],
                };
                setWizardData(prev => ({
                    ...prev,
                    suggestions: suggestions,
                    confirmedIncome: suggestions.suggestedIncome,
                    confirmedExpenses: suggestions.suggestedExpenses,
                }));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, []);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const updateIncomeSuggestions = (newSource) => {
        setWizardData(prev => ({
            ...prev,
            suggestions: { ...prev.suggestions, suggestedIncome: [...prev.suggestions.suggestedIncome, newSource] }
        }));
    };

    const updateExpenseSuggestions = (newExpense) => {
        setWizardData(prev => ({
            ...prev,
            suggestions: { ...prev.suggestions, suggestedExpenses: [...prev.suggestions.suggestedExpenses, newExpense] }
        }));
    };

    const handleDatesConfirmed = (dates) => {
        setWizardData(prev => ({ ...prev, confirmedDates: dates }));
        const start = new Date(`${dates.startDate}T00:00:00`);
        const end = new Date(`${dates.endDate}T00:00:00`);
        const filteredExpenses = (wizardData.suggestions.suggestedExpenses || []).filter(exp => {
            if (!exp.due_date) return true;
            const dueDateDay = parseInt(exp.due_date, 10);
            let current = new Date(start);
            while (current <= end) {
                if (current.getDate() === dueDateDay) return true;
                current.setDate(current.getDate() + 1);
            }
            return false;
        });
        setWizardData(prev => ({ ...prev, confirmedExpenses: filteredExpenses }));
        nextStep();
    };

    const handleIncomeConfirmed = (incomeList) => {
        setWizardData(prev => ({ ...prev, confirmedIncome: incomeList }));
        nextStep();
    };

    const handleExpensesConfirmed = (expenseList) => {
        setWizardData(prev => ({ ...prev, confirmedExpenses: expenseList }));
        nextStep();
    };

    const updateSpending = (newCategory) => {
        setWizardData(prev => ({
            ...prev,
            suggestions: { ...prev.suggestions, learned_spending_categories: [...prev.suggestions.learned_spending_categories, newCategory] }
        }));
    };

    const handleFinishSetup = async (finalSpendingCategories) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/budget/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    start_date: wizardData.confirmedDates.startDate,
                    end_date: wizardData.confirmedDates.endDate,
                    income_sources: JSON.stringify(wizardData.confirmedIncome),
                    recurring_expenses: JSON.stringify(wizardData.confirmedExpenses),
                    spending_categories: JSON.stringify(finalSpendingCategories)
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create budget cycle.');

            // --- 2. THIS IS THE NEW LOGIC ---
            // Call refreshData and pass the new budget ID to it.
            // It will handle the state update and the navigation.
            await refreshData(data.id);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Loading your setup...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!wizardData.suggestions) return null;

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <h1 className="text-3xl font-bold mb-6 text-center">Guided Setup</h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
                {step === 1 && (
                    <DateConfirmationStep
                        proposedStartDate={wizardData.suggestions.proposedStartDate}
                        proposedEndDate={wizardData.suggestions.proposedEndDate}
                        onComplete={handleDatesConfirmed}
                    />
                )}
                {step === 2 && (
                    <IncomeStep
                        onBack={prevStep}
                        onComplete={handleIncomeConfirmed}
                        suggestions={wizardData.suggestions.suggestedIncome}
                        existingIncome={wizardData.confirmedIncome}
                        onNewSourceAdded={updateIncomeSuggestions}
                    />
                )}
                {step === 3 && (
                    <ExpenseStep
                        onBack={prevStep}
                        onComplete={handleExpensesConfirmed}
                        suggestions={wizardData.suggestions.suggestedExpenses}
                        existingExpenses={wizardData.confirmedExpenses}
                        confirmedDates={wizardData.confirmedDates}
                        accounts={accounts}
                        onNewExpenseAdded={updateExpenseSuggestions}
                    />
                )}
                {step === 4 && (
                    <SpendingStep
                        onBack={prevStep}
                        onComplete={handleFinishSetup}
                        updateSpending={updateSpending}
                        user={user} // Pass user prop to SpendingStep
                        existingCategories={wizardData.suggestions.learned_spending_categories}
                    />
                )}
            </div>
        </div>
    );
}