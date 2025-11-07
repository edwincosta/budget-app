import { useState, useEffect } from 'react';
import axios from 'axios';

interface HealthStatus {
    isHealthy: boolean;
    isChecking: boolean;
    error: string | null;
    lastCheck: Date | null;
}

interface HealthResponse {
    status: string;
    timestamp: string;
    environment: string;
    runtime: string;
    version: string;
    message: string;
}

export const useServerHealth = () => {
    const [healthStatus, setHealthStatus] = useState<HealthStatus>({
        isHealthy: false,
        isChecking: true,
        error: null,
        lastCheck: null,
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const checkHealth = async (retries = 3): Promise<boolean> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                setHealthStatus(prev => ({
                    ...prev,
                    isChecking: true,
                    error: null
                }));

                console.log(`🏥 Health check attempt ${attempt}/${retries}...`);

                const response = await axios.get<HealthResponse>(`${API_URL}/health`, {
                    timeout: 10000, // 10 segundos de timeout
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                });

                if (response.data.status === 'OK') {
                    console.log('✅ Server is healthy:', response.data);
                    setHealthStatus({
                        isHealthy: true,
                        isChecking: false,
                        error: null,
                        lastCheck: new Date(),
                    });
                    return true;
                }
            } catch (error: any) {
                console.warn(`⚠️ Health check attempt ${attempt} failed:`, error.message);

                if (attempt === retries) {
                    const errorMessage = error.code === 'ECONNREFUSED'
                        ? 'Server is unavailable. Waking up Render service...'
                        : error.response?.data?.message || error.message || 'Server health check failed';

                    setHealthStatus({
                        isHealthy: false,
                        isChecking: false,
                        error: errorMessage,
                        lastCheck: new Date(),
                    });
                    return false;
                }

                // Esperar antes da próxima tentativa (backoff exponencial)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        return false;
    };

    const forceHealthCheck = () => {
        checkHealth();
    };

    // 🔄 Health check inteligente: apenas quando necessário
    const keepAlive = () => {
        console.log('🔄 Keep-alive health check triggered by user activity');
        checkHealth(1);
    };

    useEffect(() => {
        // Realizar health check inicial
        checkHealth();

        // ⚠️ ESTRATÉGIA OTIMIZADA PARA PLANO GRATUITO:
        // - Sem health check periódico automático (evita manter servidor sempre ativo)
        // - Servidor dormirá após 15min de inatividade (economia de horas)
        // - Health check apenas quando usuário acessa a aplicação
        // - Render free tier: 750h/mês, servidor dormindo economiza ~500h/mês

        // Se precisar de health check periódico, descomente a linha abaixo:
        // const interval = setInterval(() => checkHealth(1), 30 * 60 * 1000); // 30min

        return () => {
            // clearInterval(interval);
        };
    }, []);

    return {
        ...healthStatus,
        checkHealth: forceHealthCheck,
        keepAlive, // Para uso futuro em ações do usuário
    };
};