import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  message = "Carregando...",
  size = "md",
  overlay = true,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const containerContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
        {message}
      </p>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-4">
          {containerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {containerContent}
    </div>
  );
};

export default Loading;
