import React from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "info",
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconColor: "text-red-500",
          confirmButtonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          icon: AlertTriangle,
        };
      case "warning":
        return {
          iconColor: "text-yellow-500",
          confirmButtonClass:
            "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          icon: AlertTriangle,
        };
      case "info":
      default:
        return {
          iconColor: "text-blue-500",
          confirmButtonClass:
            "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          icon: HelpCircle,
        };
    }
  };

  const { iconColor, confirmButtonClass, icon: Icon } = getStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            <Icon className={`${iconColor} w-6 h-6 mr-3 flex-shrink-0`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={() => {
                onConfirm();
                onCancel(); // Fecha o modal após confirmação
              }}
              className={`${confirmButtonClass} text-white px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
