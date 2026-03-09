import React, { createContext, useContext } from 'react';

const PageContext = createContext<string | undefined>(undefined);

export const PageProvider: React.FC<{ pageId: string | undefined; children: React.ReactNode }> = ({ pageId, children }) => {
  return <PageContext.Provider value={pageId}>{children}</PageContext.Provider>;
};

export const usePageId = () => useContext(PageContext);
