import React from "react";
import { useUI } from "@/contexts/UIContext";

const TestPage: React.FC = () => {
  const { showLoading, hideLoading, showError, showConfirmation } = useUI();

  const handleShowLoading = () => {
    showLoading("Processando dados...");

    // Simular uma operação assíncrona
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  const handleShowLoadingShort = () => {
    showLoading("Salvando...");

    setTimeout(() => {
      hideLoading();
    }, 1000);
  };

  const handleShowError = () => {
    showError("Erro ao processar os dados. Verifique sua conexão.", "error");
  };

  const handleShowWarning = () => {
    showError("Atenção: Alguns dados podem estar desatualizados.", "warning");
  };

  const handleShowInfo = () => {
    showError("Informação: Os dados foram atualizados com sucesso.", "info");
  };

  const handleShowSuccess = () => {
    showError("Sucesso: Operação realizada com êxito!", "success");
  };

  const handleShowConfirmInfo = () => {
    showConfirmation({
      title: "Confirmar Ação",
      message: "Você tem certeza que deseja continuar com esta operação?",
      type: "info",
      onConfirm: () => showError("Ação confirmada!", "success"),
    });
  };

  const handleShowConfirmWarning = () => {
    showConfirmation({
      title: "Atenção",
      message:
        "Esta ação pode causar alterações nos seus dados. Deseja continuar?",
      type: "warning",
      confirmText: "Sim, continuar",
      cancelText: "Não, cancelar",
      onConfirm: () => showError("Ação executada com aviso!", "warning"),
    });
  };

  const handleShowConfirmDanger = () => {
    showConfirmation({
      title: "Confirmar Exclusão",
      message:
        "Esta ação é irreversível. Todos os dados serão perdidos permanentemente.",
      type: "danger",
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
      onConfirm: () => showError("Item excluído!", "success"),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Teste dos Componentes UX
        </h1>

        <div className="space-y-6">
          {/* Loading Tests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Componente Loading
            </h2>

            <div className="space-y-2">
              <button
                onClick={handleShowLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Testar Loading (3s)
              </button>

              <button
                onClick={handleShowLoadingShort}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors ml-2"
              >
                Testar Loading Rápido (1s)
              </button>
            </div>
          </div>

          {/* Error Messages Tests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Componente ErrorMessage
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                onClick={handleShowError}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Mostrar Erro
              </button>

              <button
                onClick={handleShowWarning}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Mostrar Warning
              </button>

              <button
                onClick={handleShowInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Mostrar Info
              </button>

              <button
                onClick={handleShowSuccess}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Mostrar Sucesso
              </button>
            </div>
          </div>

          {/* Confirmation Dialog Tests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Componente ConfirmDialog
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleShowConfirmInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Confirmação Info
              </button>

              <button
                onClick={handleShowConfirmWarning}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Confirmação Warning
              </button>

              <button
                onClick={handleShowConfirmDanger}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Confirmação Danger
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Próximos componentes:
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>✅ Componente Loading (concluído)</li>
              <li>✅ Componente ErrorMessage (concluído)</li>
              <li>✅ Componente ConfirmDialog (concluído)</li>
              <li>� Implementação em todas as páginas (próximo)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
