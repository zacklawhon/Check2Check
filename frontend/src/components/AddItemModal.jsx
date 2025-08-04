import React from 'react';
import AddIncomeForm from './AddIncomeForm';
import AddBillForm from './AddBillForm';
import AddVariableForm from './AddVariableForm';

function AddItemModal({ budgetId, type, onClose, onSuccess }) {
    const getTitle = () => {
        switch (type) {
            case 'income': return 'Add New Income';
            case 'recurring': return 'Add a New Bill';
            case 'variable': return 'Add a New Spending Category';
            default: return 'Add Item';
        }
    };

    const renderForm = () => {
        switch (type) {
            case 'income':
                return <AddIncomeForm budgetId={budgetId} onSuccess={onSuccess} />;
            case 'recurring':
                return <AddBillForm budgetId={budgetId} onSuccess={onSuccess} />;
            case 'variable':
                return <AddVariableForm budgetId={budgetId} onSuccess={onSuccess} />;
            default:
                return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-white">{getTitle()}</h2>
                {renderForm()}
            </div>
        </div>
    );
}

export default AddItemModal;