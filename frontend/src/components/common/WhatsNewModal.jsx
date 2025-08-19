import React from 'react';

function WhatsNewModal({ isOpen, onClose, announcement }) {
    if (!isOpen || !announcement) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">{announcement.title}</h2>
                
                {/* ## START: THIS IS THE FIX ## */}
                {/* Instead of mapping the content, we use a single div with 
                  the 'dangerouslySetInnerHTML' prop. This tells React to render 
                  the string from your database as actual HTML.
                */}
                <div 
                  className="text-gray-300 space-y-3 mb-6 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.content[0] }}
                />
                {/* ## END: THIS IS THE FIX ## */}

                <div className="text-right">
                    <button 
                        onClick={onClose} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WhatsNewModal;