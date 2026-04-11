'use client';

import * as React from 'react';

interface QuickActionsContextType {
  createContactOpen: boolean;
  setCreateContactOpen: (open: boolean) => void;
  createTaskOpen: boolean;
  setCreateTaskOpen: (open: boolean) => void;
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
}

const QuickActionsContext = React.createContext<QuickActionsContextType>({
  createContactOpen: false,
  setCreateContactOpen: () => {},
  createTaskOpen: false,
  setCreateTaskOpen: () => {},
  feedbackOpen: false,
  setFeedbackOpen: () => {},
});

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [createContactOpen, setCreateContactOpen] = React.useState(false);
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const value = React.useMemo(() => ({
    createContactOpen,
    setCreateContactOpen,
    createTaskOpen,
    setCreateTaskOpen,
    feedbackOpen,
    setFeedbackOpen,
  }), [createContactOpen, createTaskOpen, feedbackOpen]);

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  return React.useContext(QuickActionsContext);
}
