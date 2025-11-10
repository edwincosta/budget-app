import React, { useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { UserShare } from "@/types";

const BudgetSelector: React.FC = () => {
  const { availableBudgets, activeBudget, setActiveBudget, loading } =
    useBudget();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Carregando...</span>
      </div>
    );
  }

  const handleBudgetSelect = (budget: UserShare | null) => {
    setActiveBudget(budget);
    setIsOpen(false);
  };

  const displayText = activeBudget
    ? `📊 ${activeBudget.budget?.name || "Orçamento Compartilhado"}`
    : "🏠 Meu Orçamento";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span>{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* Opção do próprio orçamento */}
            <button
              onClick={() => handleBudgetSelect(null)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                !activeBudget ? "bg-blue-50 text-blue-700" : "text-gray-900"
              }`}
            >
              <span>🏠</span>
              <div>
                <div className="font-medium">Meu Orçamento</div>
                <div className="text-xs text-gray-500">Seus dados pessoais</div>
              </div>
            </button>

            {/* Separador se houver orçamentos compartilhados */}
            {availableBudgets.length > 0 && (
              <div className="border-t border-gray-200 my-1"></div>
            )}

            {/* Orçamentos compartilhados */}
            {availableBudgets.map((budget) => (
              <button
                key={budget.id}
                onClick={() => handleBudgetSelect(budget)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  activeBudget?.id === budget.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-900"
                }`}
              >
                <span>📊</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {budget.budget?.name || "Orçamento Compartilhado"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Por {budget.budget?.owner?.name} •
                    {budget.permission?.toUpperCase() === "READ"
                      ? " Visualização"
                      : " Edição"}
                  </div>
                </div>
                {activeBudget?.id === budget.id && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}

            {/* Mensagem se não houver orçamentos compartilhados */}
            {availableBudgets.length === 0 && (
              <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
                Nenhum orçamento compartilhado disponível
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default BudgetSelector;
