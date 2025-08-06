import React, { createContext, useState, useEffect, useContext } from 'react';

const BudgetContext = createContext();

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
    const [activeBudget, setActiveBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchActiveBudget = async () => {
        try {
            const response = await fetch('/api/user/active-budget', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setActiveBudget(data);
            } else {
                setActiveBudget(null);
            }
        } catch (error) {
            console.error("Failed to fetch active budget", error);
            setActiveBudget(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveBudget();
    }, []);

    const refreshActiveBudget = () => {
        setLoading(true);
        fetchActiveBudget();
    };

    const value = {
        activeBudget,
        loading,
        refreshActiveBudget
    };

    return (
        <BudgetContext.Provider value={value}>
            {children}
        </BudgetContext.Provider>
    );
};