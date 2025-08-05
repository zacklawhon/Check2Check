import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DateConfirmationStep from './DateConfirmationStep';
import IncomeStep from './IncomeStep';
import ExpenseStep from './ExpenseStep';
import SpendingStep from './SpendingStep';

function GuidedWizard({ user }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        confirmedDates: { startDate: '', endDate: '' },
        confirmedIncome: [],
        confirmedExpenses: [],
        suggestions: null, // Start as null until loaded
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // FIX: A user is "returning" if they have completed at least one budget.
    // We check for > 0 because the user object might not have the count for a brand new user.
    const isReturningUser = (user.completed_budget_count || 0) > 0;

    useEffect(() => {
        const fetchSuggestions = async () => {
            const endpoint = isReturningUser ? '/api/budget/wizard-suggestions' : '/api/onboarding/data';
            try {
                const response = await fetch(endpoint, { credentials: 'include' });
                if (!response.ok) throw new Error('Could not load setup data.');
                const data = await response.json();

                const suggestions = {
                    proposedStartDate: data.proposedStartDate,
                    proposedEndDate: data.proposedEndDate,
                    suggestedIncome: data.suggestedIncome || data.income_sources || [],
                    suggestedExpenses: data.suggestedExpenses || data.recurring_expenses || [],
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
    }, [isReturningUser]);
    
    // Set the initial step correctly for new vs returning users
    useEffect(() => {
        if (!loading) {
            setStep(isReturningUser ? 1 : 2);
        }
    }, [loading, isReturningUser]);


    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleDatesConfirmed = (dates) => {
        setWizardData(prev => ({ ...prev, confirmedDates: dates }));
        // Re-filter expenses based on user-confirmed dates
        const start = new Date(`${dates.startDate}T00:00:00`);
        const end = new Date(`${dates.endDate}T00:00:00`);

        const filteredExpenses = (wizardData.suggestions.suggestedExpenses || []).filter(exp => {
            if (!exp.due_date) return false;
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
            suggestions: {
                ...prev.suggestions,
                learned_spending_categories: [...prev.suggestions.learned_spending_categories, newCategory]
            }
        }));
    };

    const handleFinishSetup = async (finalSpendingCategories) => {
        setLoading(true);
        setError('');
        
        // For a new user, dates are suggested, not confirmed. Use them here.
        const finalStartDate = wizardData.confirmedDates.startDate || wizardData.suggestions.proposedStartDate;
        const finalEndDate = wizardData.confirmedDates.endDate || wizardData.suggestions.proposedEndDate;

        try {
            const response = await fetch('/api/budget/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    start_date: finalStartDate,
                    end_date: finalEndDate,
                    income_sources: JSON.stringify(wizardData.confirmedIncome),
                    recurring_expenses: JSON.stringify(wizardData.confirmedExpenses),
                    spending_categories: JSON.stringify(finalSpendingCategories)
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create budget cycle.');
            navigate(`/budget/${data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div className="text-center p-8 text-white">Loading your setup...</div>
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    // Do not render any steps until the suggestions have loaded
    if (!wizardData.suggestions) {
        return <div className="text-center p-8 text-white">Preparing suggestions...</div>;
    }

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
                        onBack={isReturningUser ? prevStep : null}
                        onComplete={handleIncomeConfirmed}
                        suggestions={wizardData.suggestions.suggestedIncome}
                        existingIncome={wizardData.confirmedIncome}
                    />
                )}
                 {step === 3 && (
                    <ExpenseStep
                        onBack={prevStep}
                        onComplete={handleExpensesConfirmed}
                        suggestions={wizardData.suggestions.suggestedExpenses}
                        existingExpenses={wizardData.confirmedExpenses}
                        confirmedDates={wizardData.confirmedDates}
                    />
                )}
                {step === 4 && (
                    <SpendingStep
                        onBack={prevStep}
                        onComplete={handleFinishSetup}
                        updateSpending={updateSpending}
                        existingCategories={wizardData.suggestions.learned_spending_categories}
                    />
                )}
            </div>
        </div>
    );
}
export default GuidedWizard;