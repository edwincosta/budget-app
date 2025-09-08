import { useState, useEffect } from 'react'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface ForecastData {
  month: string;
  historical: number | null;
  predicted: number;
  optimistic: number;
  pessimistic: number;
}

interface ForecastSummary {
  nextMonthPrediction: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  recommendation: string;
}

interface FinancialForecastProps {
  period: string;
  budgetId?: string;
}

export default function FinancialForecast({ period, budgetId }: FinancialForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [summary, setSummary] = useState<ForecastSummary>({
    nextMonthPrediction: 0,
    growthRate: 0,
    trend: 'stable',
    confidence: 0,
    recommendation: ''
  });
  const [loading, setLoading] = useState(true);
  const [forecastType, setForecastType] = useState<'balance' | 'income' | 'expenses'>('balance');

  useEffect(() => {
    loadForecastData();
  }, [period, forecastType, budgetId]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      
      // Build URL with optional budgetId
      const baseUrl = budgetId 
        ? `/api/reports/forecast/${budgetId}` 
        : '/api/reports/forecast';
      
      // Fetch forecast data from backend
      const response = await fetch(`${baseUrl}?period=${period}&type=${forecastType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setForecastData(result.data?.forecastData || []);
        setSummary(result.data?.summary || {
          nextMonthPrediction: 0,
          growthRate: 0,
          trend: 'stable',
          confidence: 0,
          recommendation: 'Dados insuficientes para gerar previsões precisas.'
        });
      } else {
        console.error('Failed to fetch forecast data');
        setForecastData([]);
        setSummary({
          nextMonthPrediction: 0,
          growthRate: 0,
          trend: 'stable',
          confidence: 0,
          recommendation: 'Dados insuficientes para gerar previsões precisas.'
        });
      }
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setForecastData([]);
      setSummary({
        nextMonthPrediction: 0,
        growthRate: 0,
        trend: 'stable',
        confidence: 0,
        recommendation: 'Dados insuficientes para gerar previsões precisas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (confidence >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span className="text-sm font-medium text-gray-700">Previsão para:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setForecastType('balance')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                forecastType === 'balance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Saldo
            </button>
            <button
              onClick={() => setForecastType('income')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                forecastType === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => setForecastType('expenses')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                forecastType === 'expenses'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Despesas
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Próximo Mês</p>
              <p className={`text-xl sm:text-2xl font-bold ${getTrendColor(summary.trend)}`}>
                {formatCurrency(summary.nextMonthPrediction)}
              </p>
            </div>
            {getTrendIcon(summary.trend)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Crescimento</p>
              <p className={`text-xl sm:text-2xl font-bold ${getTrendColor(summary.trend)}`}>
                {summary.growthRate > 0 ? '+' : ''}{summary.growthRate.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(summary.trend)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confiança</p>
              <p className={`text-xl sm:text-2xl font-bold ${getConfidenceColor(summary.confidence)}`}>
                {summary.confidence}%
              </p>
            </div>
            {getConfidenceIcon(summary.confidence)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tendência</p>
              <p className={`text-lg font-bold capitalize ${getTrendColor(summary.trend)}`}>
                {summary.trend === 'up' ? 'Alta' : summary.trend === 'down' ? 'Baixa' : 'Estável'}
              </p>
            </div>
            {getTrendIcon(summary.trend)}
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">
          Previsão de {forecastType === 'balance' ? 'Saldo' : forecastType === 'income' ? 'Receitas' : 'Despesas'}
        </h3>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              
              {/* Historical area */}
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                name="Histórico"
                connectNulls={false}
              />
              
              {/* Prediction area */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
                name="Previsão"
                strokeDasharray="5 5"
              />
              
              {/* Optimistic scenario */}
              <Line
                type="monotone"
                dataKey="optimistic"
                stroke="#22C55E"
                strokeWidth={1}
                strokeDasharray="2 2"
                name="Cenário Otimista"
                dot={false}
              />
              
              {/* Pessimistic scenario */}
              <Line
                type="monotone"
                dataKey="pessimistic"
                stroke="#EF4444"
                strokeWidth={1}
                strokeDasharray="2 2"
                name="Cenário Pessimista"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Análise Preditiva</p>
            <p className="text-sm text-blue-600 mt-1">
              {summary.recommendation}
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Metodologia</h4>
          <p className="text-sm text-gray-600">
            As previsões são baseadas em análise de tendências históricas, sazonalidade e algoritmos de aprendizado de máquina. 
            A confiança indica a probabilidade de acerto da previsão com base nos dados históricos disponíveis.
          </p>
        </div>
      </div>
    </div>
  );
}
