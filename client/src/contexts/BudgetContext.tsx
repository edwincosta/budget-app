import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sharingService } from '@/services/api';
import { UserShare } from '@/types';
import { getCookie, setCookie } from '@/utils';

interface BudgetContextType {
  availableBudgets: UserShare[];
  activeBudget: UserShare | null;
  isOwner: boolean;
  setActiveBudget: (budget: UserShare | null) => void;
  refreshAvailableBudgets: () => Promise<void>;
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget deve ser usado dentro de um BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [availableBudgets, setAvailableBudgets] = useState<UserShare[]>([]);
  const [activeBudget, setActiveBudgetState] = useState<UserShare | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveBudget = (budget: UserShare | null) => {
    setActiveBudgetState(budget);
    
    // Salvar no cookie para persistir a seleção
    if (budget) {
      setCookie('active_budget_id', budget.id, 30);
    } else {
      setCookie('active_budget_id', '', -1); // Remove o cookie
    }
  };

  const refreshAvailableBudgets = async () => {
    try {
      setLoading(true);
      const activeShares = await sharingService.getActiveShares();
      
      // Combinar orçamentos compartilhados comigo
      const allBudgets = [...activeShares.sharedWithMe];
      
      setAvailableBudgets(allBudgets);
      
      // Se não há orçamento ativo definido, tentar restaurar do cookie
      if (!activeBudget) {
        const savedBudgetId = getCookie('active_budget_id');
        if (savedBudgetId) {
          const savedBudget = allBudgets.find(b => b.id === savedBudgetId);
          if (savedBudget) {
            setActiveBudgetState(savedBudget);
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar orçamentos disponíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailableBudgets();
  }, []);

  // Verificar se o usuário é proprietário do orçamento ativo
  const isOwner = activeBudget ? false : true; // Se não há orçamento ativo, assume que é o proprietário

  const value: BudgetContextType = {
    availableBudgets,
    activeBudget,
    isOwner,
    setActiveBudget,
    refreshAvailableBudgets,
    loading,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};
