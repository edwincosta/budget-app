import React from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  type: "error" | "warning" | "info" | "success";
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const getStyles = () => {
    switch (type) {
      case "error":
        return {
          containerClass: "bg-red-50 border-red-200 text-red-800",
          iconColor: "text-red-500",
          icon: AlertCircle,
        };
      case "warning":
        return {
          containerClass: "bg-yellow-50 border-yellow-200 text-yellow-800",
          iconColor: "text-yellow-500",
          icon: AlertTriangle,
        };
      case "info":
        return {
          containerClass: "bg-blue-50 border-blue-200 text-blue-800",
          iconColor: "text-blue-500",
          icon: Info,
        };
      case "success":
        return {
          containerClass: "bg-green-50 border-green-200 text-green-800",
          iconColor: "text-green-500",
          icon: CheckCircle,
        };
      default:
        return {
          containerClass: "bg-gray-50 border-gray-200 text-gray-800",
          iconColor: "text-gray-500",
          icon: Info,
        };
    }
  };

  const { containerClass, iconColor, icon: Icon } = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 max-w-md w-full mx-4 sm:mx-0 z-50 animate-in slide-in-from-top-2 duration-300`}
    >
      <div className={`${containerClass} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-start">
          <Icon className={`${iconColor} w-5 h-5 mt-0.5 flex-shrink-0`} />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`ml-3 flex-shrink-0 ${iconColor} hover:opacity-75 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
