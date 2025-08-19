import React, { createContext, useContext } from 'react';

// Create the context with a default value of null
const ContentContext = createContext(null);

// Create a provider component that will wrap our authenticated app
export const ContentProvider = ({ children, content }) => {
    return (
        <ContentContext.Provider value={content}>
            {children}
        </ContentContext.Provider>
    );
};

// Create a custom hook for easy access to the content
export const useContent = () => {
    return useContext(ContentContext);
};