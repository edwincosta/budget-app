import React from "react";
import { useUI } from "@/contexts/UIContext";
import Loading from "./Loading";
import ErrorMessage from "./ErrorMessage";
import ConfirmDialog from "./ConfirmDialog";

const UIManager: React.FC = () => {
  const {
    isLoading,
    loadingMessage,
    error,
    errorType,
    hideError,
    confirmation,
  } = useUI();

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && <Loading message={loadingMessage} overlay={true} />}

      {/* Error/Warning Messages */}
      {error && (
        <ErrorMessage
          message={error}
          type={errorType}
          onClose={hideError}
          autoClose={true}
          autoCloseDelay={5000}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmation && (
        <ConfirmDialog
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          type={confirmation.type}
        />
      )}
    </>
  );
};

export default UIManager;
