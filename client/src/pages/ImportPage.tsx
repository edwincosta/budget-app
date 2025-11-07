import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUXComponents } from "@/hooks/useUXComponents";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Trash2,
} from "lucide-react";
import { useBudget } from "@/contexts/BudgetContext";
import { accountService, importService } from "@/services/api";
import type { Account, ImportSession } from "@/types";

interface ImportPageProps {}

export const ImportPage: React.FC<ImportPageProps> = () => {
  const { activeBudget, isOwner } = useBudget();
  const { confirmDelete } = useUXComponents();
  // Seguindo o padrão do copilot-context.md:
  // - activeBudget = null → orçamento próprio (usar APIs /api/resource)
  // - activeBudget = objeto → orçamento compartilhado (usar APIs /api/budgets/:id/resource)
  const budgetId = activeBudget?.budgetId;
  const canWrite = isOwner || activeBudget?.permission === "WRITE";

  // Debug logs - seguindo padrões do sistema
  console.log("🔍 ImportPage Debug:", {
    activeBudget,
    isOwner,
    budgetId,
    canWrite,
    permission: activeBudget?.permission,
    budgetName: activeBudget?.budget?.name,
    pattern: activeBudget ? "SHARED_BUDGET" : "OWN_BUDGET",
  });

  const [currentStep, setCurrentStep] = useState<
    "upload" | "classify" | "confirm"
  >("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
    enabled: boolean;
  }>({
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar contas disponíveis - PADRÃO COPILOT-CONTEXT.MD
  const {
    data: accounts,
    isLoading: loadingAccounts,
    error: accountsError,
  } = useQuery({
    queryKey: ["accounts", budgetId],
    queryFn: async () => {
      console.log(
        "🔍 Fetching accounts - Pattern:",
        activeBudget ? "SHARED_BUDGET" : "OWN_BUDGET",
        "budgetId:",
        budgetId
      );
      try {
        // Padrão oficial do copilot-context.md:
        // activeBudget = null → GET /api/accounts (orçamento próprio)
        // activeBudget = obj → GET /api/budgets/:budgetId/accounts (compartilhado)
        const result = await accountService.getAccounts(budgetId);
        console.log("✅ Accounts fetched successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Error fetching accounts:", error);
        throw error;
      }
    },
    enabled: true,
    retry: false,
    onError: (error) => {
      console.error("❌ Accounts query error:", error);
    },
  });

  // Buscar sessões de importação - PADRÃO COPILOT-CONTEXT.MD
  const {
    data: sessions,
    refetch: refetchSessions,
    error: sessionsError,
  } = useQuery({
    queryKey: ["import-sessions", budgetId],
    queryFn: async () => {
      console.log(
        "🔍 Fetching sessions - Pattern:",
        activeBudget ? "SHARED_BUDGET" : "OWN_BUDGET",
        "budgetId:",
        budgetId
      );
      try {
        // Padrão oficial do copilot-context.md:
        // activeBudget = null → GET /api/import/sessions (orçamento próprio)
        // activeBudget = obj → GET /api/budgets/:budgetId/import/sessions (compartilhado)
        const result = await importService.getSessions(budgetId);
        console.log("✅ Sessions fetched successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Error fetching sessions:", error);
        throw error;
      }
    },
    enabled: true,
    retry: false,
    onError: (error) => {
      console.error("❌ Sessions query error:", error);
    },
  }); // Monitor de erros em tempo real
  useEffect(() => {
    if (accountsError) {
      console.error("🚨 Accounts Error Details:", {
        error: accountsError,
        message: (accountsError as any).message,
        response: (accountsError as any).response?.data,
        status: (accountsError as any).response?.status,
      });
    }
  }, [accountsError]);

  useEffect(() => {
    if (sessionsError) {
      console.error("🚨 Sessions Error Details:", {
        error: sessionsError,
        message: (sessionsError as any).message,
        response: (sessionsError as any).response?.data,
        status: (sessionsError as any).response?.status,
      });
    }
  }, [sessionsError]);

  // Upload de arquivo
  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      accountId,
      dateRange,
    }: {
      file: File;
      accountId: string;
      dateRange?: { startDate: string; endDate: string; enabled: boolean };
    }) =>
      importService.uploadFile(
        file,
        accountId,
        budgetId,
        dateRange?.enabled
          ? {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            }
          : undefined
      ),
    onSuccess: (data) => {
      toast.success(
        `Arquivo processado: ${data.totalTransactions} transações encontradas`
      );
      if (data.duplicatesFound > 0) {
        toast.error(`${data.duplicatesFound} possíveis duplicatas detectadas`);
      }
      setCurrentSessionId(data.sessionId);
      setCurrentStep("classify");
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao processar arquivo");
    },
  });

  // Cancelar/excluir sessão
  const cancelSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      importService.cancelSession(sessionId, budgetId),
    onSuccess: () => {
      toast.success("Sessão de importação cancelada com sucesso");
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao cancelar sessão");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedAccount) {
      toast.error("Selecione um arquivo e uma conta");
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      accountId: selectedAccount,
      dateRange: dateRange,
    });
  };

  const handleCancelSession = (sessionId: string, sessionFilename: string) => {
    confirmDelete(`a importação "${sessionFilename}"`, () => {
      cancelSessionMutation.mutate(sessionId);
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "ERROR":
        return "text-red-600 bg-red-100";
      case "PROCESSING":
        return "text-blue-600 bg-blue-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "CANCELLED":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "ERROR":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <AlertTriangle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  if (currentStep === "classify" && currentSessionId) {
    return (
      <ClassificationStep
        sessionId={currentSessionId}
        budgetId={budgetId}
        onBack={() => setCurrentStep("upload")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Banner de orçamento compartilhado */}
        {activeBudget && (
          <div
            className={`border rounded-lg p-4 mb-6 ${
              !canWrite
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center">
              <Users
                className={`h-5 w-5 mr-3 ${
                  !canWrite ? "text-red-600" : "text-blue-600"
                }`}
              />
              <div>
                <h3
                  className={`text-sm font-medium ${
                    !canWrite ? "text-red-800" : "text-blue-800"
                  }`}
                >
                  {!canWrite ? "Acesso Limitado" : "Importando para"}:{" "}
                  {activeBudget.budget?.name}
                </h3>
                <p
                  className={`text-sm ${
                    !canWrite ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  Orçamento compartilhado por {activeBudget.budget?.owner?.name}{" "}
                  • Permissão:{" "}
                  {activeBudget.permission === "READ"
                    ? "Visualização"
                    : "Edição"}
                  {!canWrite && " (Não é possível importar arquivos)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso quando não há orçamento ativo (apenas para usuários não-proprietários) */}
        {!activeBudget && !isOwner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-3 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Nenhum orçamento ativo
                </h3>
                <p className="text-sm text-yellow-600">
                  Você precisa ter um orçamento ativo para importar extratos.
                  Acesse a página de Orçamentos para criar ou selecionar um.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Importar Extratos Bancários
              </h1>
              <p className="text-gray-600 mt-1">
                Importe transações de arquivos CSV ou PDF de extratos e faturas
              </p>
            </div>
          </div>

          {/* Informativo sobre formatos suportados */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Formatos Suportados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>
                  <strong>CSV:</strong> Extratos de bancos como Nubank, Itaú, BB
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-red-600" />
                <span>
                  <strong>PDF:</strong> Faturas de cartão de crédito
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div
          className={`bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 ${
            !canWrite ? "opacity-60" : ""
          }`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Selecionar Arquivo e Conta
            {!canWrite && (
              <span className="ml-2 text-sm text-red-600 font-normal">
                (Requer permissão de edição)
              </span>
            )}
          </h2>

          {/* Seleção de conta */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conta de Destino
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loadingAccounts || !canWrite}
            >
              <option value="">Selecione uma conta...</option>
              {accounts?.map((account: Account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por período (opcional) */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="dateRangeFilter"
                checked={dateRange.enabled}
                onChange={(e) =>
                  setDateRange({ ...dateRange, enabled: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                disabled={!canWrite}
              />
              <label
                htmlFor="dateRangeFilter"
                className="text-sm font-medium text-gray-700"
              >
                Filtrar por período (opcional)
              </label>
            </div>

            {dateRange.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!canWrite}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!canWrite}
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">
                    ℹ️ Apenas transações dentro do período selecionado serão
                    importadas. Deixe em branco para importar todas as
                    transações do arquivo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              !canWrite
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-gray-400 cursor-pointer"
            }`}
            onDragOver={canWrite ? handleDragOver : undefined}
            onDrop={canWrite ? handleDrop : undefined}
            onClick={canWrite ? () => fileInputRef.current?.click() : undefined}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  {getFileIcon(selectedFile.name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remover arquivo
                </button>
              </div>
            ) : !canWrite ? (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-500">
                    Importação não disponível
                  </p>
                  <p className="text-sm text-gray-400">
                    Você precisa de permissão de edição para importar arquivos
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Clique ou arraste o arquivo aqui
                  </p>
                  <p className="text-sm text-gray-500">
                    Suporta CSV e PDF até 10MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Botão de upload */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                !selectedAccount ||
                uploadMutation.isPending ||
                !canWrite
              }
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
            >
              {!canWrite
                ? "Sem Permissão"
                : uploadMutation.isPending
                ? "Processando..."
                : "Processar Arquivo"}
            </button>
          </div>
        </div>

        {/* Histórico de importações */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Importações Recentes
          </h2>

          {sessions?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma importação realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions?.map((session: ImportSession) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(session.filename)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.filename}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.account.name} • {session.totalTransactions}{" "}
                          transações
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusIcon(session.status)}
                        <span>{session.status}</span>
                      </span>

                      {/* Botões de ação */}
                      <div className="flex items-center space-x-2">
                        {session.status === "PENDING" && (
                          <button
                            onClick={() => {
                              setCurrentSessionId(session.id);
                              setCurrentStep("classify");
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                            title="Continuar classificação das transações"
                          >
                            Continuar
                          </button>
                        )}

                        {/* Botão de exclusão para sessões pendentes ou com erro */}
                        {(session.status === "PENDING" ||
                          session.status === "ERROR") &&
                          canWrite && (
                            <button
                              onClick={() =>
                                handleCancelSession(
                                  session.id,
                                  session.filename
                                )
                              }
                              disabled={cancelSessionMutation.isPending}
                              className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Excluir esta importação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente separado para classificação
interface ClassificationStepProps {
  sessionId: string;
  budgetId?: string;
  onBack: () => void;
}

const ClassificationStep: React.FC<ClassificationStepProps> = ({
  sessionId,
  budgetId,
  onBack,
}) => {
  const { activeBudget, isOwner } = useBudget();

  // Verificar permissões - pode escrever se é o owner ou se tem permissão WRITE
  const canWrite =
    isOwner || (activeBudget && activeBudget.permission === "WRITE");

  // Buscar detalhes da sessão
  const {
    data: sessionDetails,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["import-session-details", sessionId, budgetId],
    queryFn: () => importService.getSessionDetails(sessionId, budgetId),
  });

  // Mutation para classificar transação
  const classifyMutation = useMutation({
    mutationFn: ({
      transactionId,
      categoryId,
    }: {
      transactionId: string;
      categoryId: string;
    }) =>
      importService.classifyTransaction(transactionId, categoryId, budgetId),
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erro ao classificar transação"
      );
    },
  });

  // Mutation para confirmar importação
  const confirmMutation = useMutation({
    mutationFn: ({ importDuplicates }: { importDuplicates: boolean }) =>
      importService.confirmImport(sessionId, importDuplicates, budgetId),
    onSuccess: (data) => {
      toast.success(
        `Importação concluída: ${data.importedCount} transações importadas`
      );
      onBack();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erro ao confirmar importação"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando transações...</p>
        </div>
      </div>
    );
  }

  const handleClassify = (transactionId: string, categoryId: string) => {
    classifyMutation.mutate({ transactionId, categoryId });
  };

  const handleConfirmImport = (importDuplicates = false) => {
    confirmMutation.mutate({ importDuplicates });
  };

  const unclassifiedCount = sessionDetails?.summary.pending || 0;
  const duplicatesCount = sessionDetails?.summary.duplicates || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-4 sm:space-y-0">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-700 w-fit"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div className="text-left sm:text-right">
              <h1 className="text-xl font-bold text-gray-900">
                Classificar Transações
              </h1>
              <p className="text-gray-600">
                {sessionDetails?.session.filename}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionDetails?.summary.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sessionDetails?.summary.classified}
              </div>
              <div className="text-sm text-gray-600">Classificadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {unclassifiedCount}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {duplicatesCount}
              </div>
              <div className="text-sm text-gray-600">Duplicatas</div>
            </div>
          </div>
        </div>

        {/* Lista de transações */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Transações Encontradas
            </h2>
            <p className="text-gray-600">
              Classifique cada transação antes de importar
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {sessionDetails?.transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  {/* Info da transação */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          transaction.type === "INCOME"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <h3 className="font-medium text-gray-900">
                        {transaction.description}
                      </h3>
                      {transaction.isDuplicate && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Possível Duplicata
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span
                          className={
                            transaction.type === "INCOME"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          R$ {transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {transaction.duplicateReason && (
                      <p className="text-xs text-red-600 mt-1">
                        {transaction.duplicateReason}
                      </p>
                    )}
                  </div>

                  {/* Classificação */}
                  <div className="flex items-center space-x-3">
                    {transaction.isClassified ? (
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span
                          className="text-sm font-medium"
                          style={{ color: transaction.category?.color }}
                        >
                          {transaction.category?.name}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleClassify(transaction.id, e.target.value);
                            }
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          disabled={classifyMutation.isPending}
                        >
                          <option value="">Selecionar categoria...</option>
                          {sessionDetails?.availableCategories
                            .filter((cat) => cat.type === transaction.type)
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ações finais */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-600">
                  {unclassifiedCount > 0
                    ? `${unclassifiedCount} transações ainda precisam ser classificadas`
                    : "Todas as transações foram classificadas!"}
                </p>
                {duplicatesCount > 0 && (
                  <p className="text-sm text-red-600">
                    {duplicatesCount} possíveis duplicatas detectadas
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                {duplicatesCount > 0 && (
                  <button
                    onClick={() => handleConfirmImport(true)}
                    disabled={
                      !canWrite ||
                      unclassifiedCount > 0 ||
                      confirmMutation.isPending
                    }
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm"
                    title={
                      !canWrite
                        ? "Você não tem permissão para importar dados neste orçamento"
                        : undefined
                    }
                  >
                    Importar Incluindo Duplicatas
                  </button>
                )}

                <button
                  onClick={() => handleConfirmImport(false)}
                  disabled={
                    !canWrite ||
                    unclassifiedCount > 0 ||
                    confirmMutation.isPending
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium"
                  title={
                    !canWrite
                      ? "Você não tem permissão para importar dados neste orçamento"
                      : undefined
                  }
                >
                  {confirmMutation.isPending
                    ? "Importando..."
                    : "Confirmar Importação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
