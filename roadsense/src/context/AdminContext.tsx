import React, { createContext, useContext, useState, ReactNode } from "react";
import { Complaint } from "@/lib/api";

type AdminContextType = {
  selectedComplaint: Complaint | null;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  actionInProgress: boolean;
  setActionInProgress: (progress: boolean) => void;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  openConfirmDialog: (title: string, description: string, onConfirm: () => void) => void;
  closeConfirmDialog: () => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const openConfirmDialog = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm,
      onCancel: () => closeConfirmDialog(),
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: false,
    });
  };

  return (
    <AdminContext.Provider
      value={{
        selectedComplaint,
        setSelectedComplaint,
        actionInProgress,
        setActionInProgress,
        confirmDialog,
        openConfirmDialog,
        closeConfirmDialog,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};
