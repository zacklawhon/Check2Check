// frontend/src/components/wizard/GuidedWizard.jsx

import React, { useState, useEffect } from 'react';
// FIX: Import the useNavigate hook
import { useNavigate } from 'react-router-dom';
import DateConfirmationStep from './DateConfirmationStep';
import IncomeStep from './IncomeStep';
import SpendingStep from './SpendingStep';

// FIX: `navigate` prop is removed
function GuidedWizard({ user }) {
    // FIX: Initialize the navigate function from the hook
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        confirmedDates: { startDate: '', endDate: '' },
        confirmedIncome: [],
        confirmedExpenses: [],
        learned_spending_categories: [],
        suggestions: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isReturningUser = user.experience_mode !== null;

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!isReturningUser) {
                const response = await fetch('/api/onboarding/data', { credentials: 'include' });
                const data = await response.json();
                setWizardData(prev => ({
                    ...prev,
                    suggestions: {
                        suggestedIncome: data.income_sources || [],
                        suggestedExpenses: data.recurring_expenses || [],
                        learned_spending_categories: data.learned_spending_categories || [],
                    },
                    confirmedIncome: data.income_sources || [],
                    confirmedExpenses: data.recurring_expenses || [],
                    learned_spending_categories: data.learned_spending_categories || []
                }));
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/budget/wizard-suggestions', { credentials: 'include' });
                if (!response.ok) throw new Error('Could not fetch budget suggestions.');
                const data = await response.json();

                const start = new Date(`${data.proposedStartDate}T00:00:00`);
                const end = new Date(`${data.proposedEndDate}T00:00:00`);

                const filteredExpenses = (data.suggestedExpenses || []).filter(exp => {
                    if (!exp.due_date) return false;
                    const dueDateDay = parseInt(exp.due_date, 10);
                    let current = new Date(start);
                    while (current <= end) {
                        if (current.getDate() === dueDateDay) {
                            return true;
                        }
                        current.setDate(current.getDate() + 1);
                    }
                    return false;
                });

                setWizardData(prev => ({
                    ...prev,
                    suggestions: data,
                    confirmedIncome: data.suggestedIncome || [],
                    confirmedExpenses: filteredExpenses,
                    learned_spending_categories: data.learned_spending_categories || []
                }));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [isReturningUser]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleDatesConfirmed = (dates) => {
        setWizardData(prev => ({ ...prev, confirmedDates: dates }));
        const start = new Date(`${dates.startDate}T00:00:00`);
        const end = new Date(`${dates.endDate}T00:00:00`);

        const filteredExpenses = (wizardData.suggestions.suggestedExpenses || []).filter(exp => {
            if (!exp.due_date) return false;
            const dueDateDay = parseInt(exp.due_date, 10);
            let current = new Date(start);
            while (current <= end) {
                if (current.getDate() === dueDateDay) {
                    return true;
                }
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
        setWizardData(prev => ({...prev, learned_spending_categories: [...prev.learned_spending_categories, newCategory]}));
    }

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
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create budget cycle.');
            }
            // This now uses the navigate function from the hook
            navigate(`/budget/${data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div className="text-center p-8 text-white">Loading your setup...</div>
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    const firstStep = isReturningUser && wizardData.suggestions ? 1 : 2; 
    if (step < firstStep) setStep(firstStep);

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <h1 className="text-3xl font-bold mb-6 text-center">Guided Setup</h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
                {step === 1 && isReturningUser && wizardData.suggestions && (
                    <DateConfirmationStep
                        proposedStartDate={wizardData.suggestions.proposedStartDate}
                        proposedEndDate={wizardData.suggestions.proposedEndDate}
                        onComplete={handleDatesConfirmed}
                    />
                )}
                {step === 2 && wizardData.suggestions && (
                    <IncomeStep
                        onBack={isReturningUser ? prevStep : null}
                        onComplete={handleIncomeConfirmed}
                        suggestions={wizardData.suggestions.suggestedIncome}
                        existingIncome={wizardData.confirmedIncome}
                    />
                )}
                 {step === 3 && wizardData.suggestions && (
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
                        existingCategories={wizardData.learned_spending_categories}
                    />
                )}
            </div>
        </div>
    );
}
export default GuidedWizard;