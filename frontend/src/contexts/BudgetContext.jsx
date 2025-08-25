import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../utils/api';

const BudgetContext = createContext();

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
    const [activeBudget, setActiveBudget] = useState(null);
    const [loading, setLoading] = useState(true);

     const fetchActiveBudget = async () => {
        try {
            const data = await api.getActiveBudget();
            setActiveBudget(data);
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