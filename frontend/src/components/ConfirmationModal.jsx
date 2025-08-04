import React from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative text-white">
                <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
                <p className="text-center text-gray-400 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;