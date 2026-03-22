'use client';

import * as React from 'react';

interface QuickActionsContextType {
  createContactOpen: boolean;
  setCreateContactOpen: (open: boolean) => void;
  createTaskOpen: boolean;
  setCreateTaskOpen: (open: boolean) => void;
}

const QuickActionsContext = React.createContext<QuickActionsContextType>({
  createContactOpen: false,
  setCreateContactOpen: () => {},
  createTaskOpen: false,
  setCreateTaskOpen: () => {},
});

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [createContactOpen, setCreateContactOpen] = React.useState(false);
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);

  const value = React.useMemo(() => ({
    createContactOpen,
    setCreateContactOpen,
    createTaskOpen,
    setCreateTaskOpen,
  }), [createContactOpen, createTaskOpen]);

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  return React.useContext(QuickActionsContext);
}
