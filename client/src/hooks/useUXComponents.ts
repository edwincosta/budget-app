import { useUI } from '@/contexts/UIContext';

/**
 * Hook customizado que facilita o uso dos componentes UX
 * Fornece funções pré-configuradas para casos comuns de uso
 */
export const useUXComponents = () => {
    const { showLoading, hideLoading, showError, showConfirmation } = useUI();

    /**
     * Confirma exclusão de um item
     */
    const confirmDelete = (
        itemName: string,
        onConfirm: () => void | Promise<void>
    ) => {
        showConfirmation({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`,
            type: 'danger',
            confirmText: 'Sim, excluir',
            cancelText: 'Cancelar',
            onConfirm
        });
    };

    /**
     * Confirma uma ação genérica
     */
    const confirmAction = (
        title: string,
        message: string,
        onConfirm: () => void | Promise<void>,
        type: 'info' | 'warning' | 'danger' = 'info'
    ) => {
        showConfirmation({
            title,
            message,
            type,
            onConfirm
        });
    };

    /**
     * Executa uma operação assíncrona com loading automático
     */
    const withLoading = async (
        operation: () => Promise<void>,
        loadingMessage = 'Processando...'
    ) => {
        try {
            showLoading(loadingMessage);
            await operation();
        } finally {
            hideLoading();
        }
    };

    /**
     * Executa uma operação com loading e tratamento de erro automático
     */
    const executeWithUX = async (
        operation: () => Promise<void>,
        loadingMessage = 'Processando...',
        successMessage?: string,
        errorMessage = 'Ocorreu um erro durante a operação'
    ) => {
        try {
            showLoading(loadingMessage);
            await operation();
            if (successMessage) {
                showError(successMessage, 'success');
            }
        } catch (error: any) {
            console.error('Error in executeWithUX:', error);
            showError(
                error.response?.data?.message || error.message || errorMessage,
                'error'
            );
        } finally {
            hideLoading();
        }
    };

    return {
        // Funções básicas do UI Context
        showLoading,
        hideLoading,
        showError,
        showConfirmation,

        // Funções de conveniência
        confirmDelete,
        confirmAction,
        withLoading,
        executeWithUX,

        // Funções de erro comuns
        showSuccess: (message: string) => showError(message, 'success'),
        showWarning: (message: string) => showError(message, 'warning'),
        showInfo: (message: string) => showError(message, 'info'),
        showErrorMessage: (message: string) => showError(message, 'error'),
    };
};