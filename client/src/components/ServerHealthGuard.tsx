import { useServerHealth } from "@/hooks/useServerHealth";

interface ServerHealthGuardProps {
  children: React.ReactNode;
}

const ServerHealthGuard: React.FC<ServerHealthGuardProps> = ({ children }) => {
  const { isHealthy, isChecking, error, checkHealth } = useServerHealth();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Conectando ao servidor...
            </h2>
            <p className="text-gray-600 text-sm">
              Verificando a disponibilidade do servidor. Se for a primeira vez
              hoje, o servidor pode estar "dormindo" e levará alguns segundos
              para despertar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isHealthy && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Servidor Indisponível
            </h2>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={checkHealth}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
            <p className="text-xs text-gray-500 mt-3">
              💡 Se for a primeira vez hoje, aguarde alguns segundos e tente
              novamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Servidor saudável, renderizar a aplicação normalmente
  return <>{children}</>;
};

export default ServerHealthGuard;
