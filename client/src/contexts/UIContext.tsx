import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  // Loading state
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;

  // Error/Warning state
  error: string | null;
  errorType: "error" | "warning" | "info" | "success";
  showError: (
    message: string,
    type?: "error" | "warning" | "info" | "success"
  ) => void;
  hideError: () => void;

  // Confirmation state
  confirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText: string;
    cancelText: string;
    type: "warning" | "danger" | "info";
  } | null;
  showConfirmation: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "warning" | "danger" | "info";
  }) => void;
  hideConfirmation: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI deve ser usado dentro de um UIProvider");
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando...");
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "error" | "warning" | "info" | "success"
  >("error");
  const [confirmation, setConfirmation] =
    useState<UIContextType["confirmation"]>(null);

  const showLoading = (message = "Carregando...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const showError = (
    message: string,
    type: "error" | "warning" | "info" | "success" = "error"
  ) => {
    setError(message);
    setErrorType(type);
  };

  const hideError = () => {
    setError(null);
  };

  const showConfirmation = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "warning" | "danger" | "info";
  }) => {
    setConfirmation({
      isOpen: true,
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel || (() => hideConfirmation()),
      confirmText: config.confirmText || "Confirmar",
      cancelText: config.cancelText || "Cancelar",
      type: config.type || "info",
    });
  };

  const hideConfirmation = () => {
    setConfirmation(null);
  };

  return (
    <UIContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoading,
        hideLoading,
        error,
        errorType,
        showError,
        hideError,
        confirmation,
        showConfirmation,
        hideConfirmation,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
