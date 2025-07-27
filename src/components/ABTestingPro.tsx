// src/components/ABTestingPro.tsx - Main A/B Testing Component
import React, { useState, useEffect } from 'react';
import { 
  Calculator, BarChart3, TrendingUp, Users, Target, AlertCircle, CheckCircle, 
  Info, Brain, Download, Share2, Settings, Moon, Sun, Play, Pause, Zap, 
  Globe, Shield, Cpu, Bell 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { useABTesting, useRealTimeMetrics, useTheme, useNotifications, useChartData, useExport } from '../hooks/useABTesting';

const ABTestingPro: React.FC = () => {
  // Hooks
  const {
    testConfig,
    testData,
    mlPredictions,
    isLoading,
    error,
    requiredSampleSize,
    statisticalResults,
    bayesianResults,
    roiAnalysis,
    updateTestConfig,
    updateTestData,
    generateMLPredictions,
    resetToDefaults,
    isValidConfiguration,
    isValidTestData
  } = useABTesting();

  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { chartData, segmentData, performanceData } = useChartData(testConfig, statisticalResults);
  const { isExporting, exportToPDF, exportToCSV } = useExport();

  // Local state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('ru');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const { metrics: realTimeMetrics } = useRealTimeMetrics(isRealTimeEnabled);

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Translations
  const t = {
    ru: {
      dashboard: 'Дашборд',
      planning: 'Планирование',
      analysis: 'Анализ',
      bayesian: 'Байесовский',
      roi: 'ROI',
      ml: 'ML Предсказания',
      activeVisitors: 'Активные посетители',
      conversionRate: 'Конверсия',
      revenue: 'Доход',
      testsRunning: 'Активные тесты',
      implement: 'Внедрить',
      reject: 'Отклонить',
      continue: 'Продолжить тест'
    },
    en: {
      dashboard: 'Dashboard',
      planning: 'Planning',
      analysis: 'Analysis',
      bayesian: 'Bayesian',
      roi: 'ROI',
      ml: 'ML Predictions',
      activeVisitors: 'Active Visitors',
      conversionRate: 'Conversion Rate',
      revenue: 'Revenue',
      testsRunning: 'Tests Running',
      implement: 'Implement',
      reject: 'Reject',
      continue: 'Continue Test'
    }
  }[language];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 text-center">
          <span className="mr-4">📱 Install A/B Testing Pro for offline access</span>
          <button onClick={installPWA} className="bg-white text-blue-600 px-4 py-1 rounded font-medium">
            Install
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  A/B Testing Pro
                </h1>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>v2.0</span>
                  <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isRealTimeEnabled ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {[
                { id: 'dashboard', icon: BarChart3, label: t.dashboard },
                { id: 'planning', icon: Calculator, label: t.planning },
                { id: 'analysis', icon: TrendingUp, label: t.analysis },
                { id: 'bayesian', icon: Brain, label: t.bayesian },
                { id: 'ml', icon: Cpu, label: t.ml }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : `${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}>
                  <div className="relative">
                    <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    {notifications.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              </div>

              {/* Real-time toggle */}
              <button
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isRealTimeEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isRealTimeEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="ru">🇷🇺 RU</option>
                <option value="en">🇺🇸 EN</option>
              </select>

              {/* Export menu */}
              <div className="relative group">
                <button className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}>
                  <Download className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <div className="py-2">
                    <button 
                      onClick={() => exportToPDF({ testConfig, testData, statisticalResults, roiAnalysis })}
                      disabled={isExporting}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      📄 Export PDF Report
                    </button>
                    <button 
                      onClick={() => exportToCSV({ testData, statisticalResults })}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      📊 Export CSV Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: t.activeVisitors, 
                  value: realTimeMetrics.activeVisitors.toLocaleString(), 
                  change: '+12.5%', 
                  trend: 'up', 
                  icon: Users, 
                  color: 'blue' 
                },
                { 
                  title: t.conversionRate, 
                  value: `${realTimeMetrics.avgConversion.toFixed(1)}%`, 
                  change: '+2.3%', 
                  trend: 'up', 
                  icon: TrendingUp, 
                  color: 'green' 
                },
                { 
                  title: t.revenue, 
                  value: `$${realTimeMetrics.totalRevenue.toLocaleString()}`, 
                  change: '+8.7%', 
                  trend: 'up', 
                  icon: Target, 
                  color: 'purple' 
                },
                { 
                  title: t.testsRunning, 
                  value: realTimeMetrics.testsRunning, 
                  change: '2 завершено', 
                  trend: 'neutral', 
                  icon: Zap, 
                  color: 'orange' 
                }
              ].map((metric, index) => (
                <div key={index} className={`rounded-xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{metric.title}</p>
                      <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metric.value}</p>
                      {metric.change && (
                        <div className="flex items-center mt-2">
                          <span className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600' : 
                            metric.trend === 'down' ? 'text-red-600' : 
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} {metric.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/20`}>
                      <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time Chart */}
            <div className={`rounded-xl p-6 shadow-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📈 Live Test Performance
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Updated {realTimeMetrics.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="controlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="treatmentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="day" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="control"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#controlGradient)"
                    name="Control Group"
                  />
                  <Area
                    type="monotone"
                    dataKey="treatment"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#treatmentGradient)"
                    name="Treatment Group"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Radar */}
              <div className={`rounded-xl p-6 shadow-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Performance Score
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={performanceData}>
                    <PolarGrid stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    <Radar name="Target" dataKey="target" stroke="#10B981" fill="transparent" strokeDasharray="5 5" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Segment Analysis */}
              <div className={`rounded-xl p-6 shadow-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  👥 User Segments
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {segmentData.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{segment.name}</span>
                      </div>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {segment.conversion}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className={`rounded-xl p-6 shadow-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Brain className="w-5 h-5 mr-2 text-purple-500" />
                  AI Insights
                </h4>
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                      notification.type === 'success' ? 
                        `${isDarkMode ? 'bg-green-900/20 border-green-400' : 'bg-green-50 border-green-500'}` :
                      notification.type === 'warning' ? 
                        `${isDarkMode ? 'bg-yellow-900/20 border-yellow-400' : 'bg-yellow-50 border-yellow-500'}` :
                        `${isDarkMode ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}`
                    }`}>
                      <div className="flex items-start space-x-3">
                        {notification.type === 'success' ? 
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> :
                          notification.type === 'warning' ?
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" /> :
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Planning Tab */}
        {activeTab === 'planning' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div className={`rounded-xl p-6 shadow-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Test Configuration
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Baseline Rate (%)
                      </label>
                      <input
                        type="number"
                        value={testConfig.baselineRate}
                        onChange={(e) => updateTestConfig({ baselineRate: Number(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Min Detectable Effect (%)
                      </label>
                      <input
                        type="number"
                        value={testConfig.minimumDetectableEffect}
                        onChange={(e) => updateTestConfig({ minimumDetectableEffect: Number(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Significance Level
                      </label>
                      <select
                        value={testConfig.alpha}
                        onChange={(e) => updateTestConfig({ alpha: Number(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value={0.01}>0.01 (99% confidence)</option>
                        <option value={0.05}>0.05 (95% confidence)</option>
                        <option value={0.10}>0.10 (90% confidence)</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Statistical Power
                      </label>
                      <select
                        value={testConfig.power}
                        onChange={(e) => updateTestConfig({ power: Number(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value={0.7}>70%</option>
                        <option value={0.8}>80%</option>
                        <option value={0.9}>90%</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={generateMLPredictions}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Brain className="w-5 h-5" />
                    <span>{isLoading ? '🤖 Generating...' : '🤖 Generate ML Predictions'}</span>
                  </button>
                </div>
              </div>

              {/* Results Panel */}
             <div className={`rounded-xl p-6 shadow-lg border ${
               isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
             }`}>
               <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 📈 Statistical Analysis
               </h3>

               {statisticalResults && (
                 <>
                   {/* Main Result */}
                   <div className={`p-6 rounded-lg mb-6 ${
                     statisticalResults.isSignificant 
                       ? isDarkMode ? 'bg-green-900/30 border-green-400' : 'bg-green-50 border-green-500'
                       : isDarkMode ? 'bg-yellow-900/30 border-yellow-400' : 'bg-yellow-50 border-yellow-500'
                   } border-l-4`}>
                     <div className="text-center">
                       <p className={`text-4xl font-bold ${
                         statisticalResults.lift > 0 ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {statisticalResults.lift > 0 ? '+' : ''}{statisticalResults.lift.toFixed(2)}%
                       </p>
                       <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         Observed Lift
                       </p>
                       <div className={`mt-4 px-4 py-2 rounded-full ${
                         statisticalResults.isSignificant 
                           ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                           : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                       }`}>
                         {statisticalResults.isSignificant ? '✅ Significant' : '⏳ Not Significant'}
                       </div>
                     </div>
                   </div>

                   {/* Detailed Stats */}
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>P-value:</span>
                         <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {statisticalResults.pValue.toFixed(4)}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Z-score:</span>
                         <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {statisticalResults.zScore.toFixed(3)}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Effect Size:</span>
                         <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {statisticalResults.effectSize.toFixed(2)}%
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Significance:</span>
                         <span className={`font-medium ${
                           statisticalResults.isSignificant ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {statisticalResults.isSignificant ? 'Yes' : 'No'}
                         </span>
                       </div>
                     </div>

                     <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                       <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         95% Confidence Interval
                       </p>
                       <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         [{statisticalResults.confidenceInterval[0].toFixed(2)}%, {statisticalResults.confidenceInterval[1].toFixed(2)}%]
                       </p>
                     </div>

                     {/* Business Decision */}
                     <div className={`p-4 rounded-lg border-l-4 ${
                       statisticalResults.isSignificant && statisticalResults.lift > 0
                         ? isDarkMode ? 'bg-green-900/20 border-green-400' : 'bg-green-50 border-green-500'
                         : statisticalResults.isSignificant && statisticalResults.lift < 0
                         ? isDarkMode ? 'bg-red-900/20 border-red-400' : 'bg-red-50 border-red-500'
                         : isDarkMode ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'
                     }`}>
                       <div className="flex items-center space-x-3">
                         {statisticalResults.isSignificant && statisticalResults.lift > 0 ? (
                           <CheckCircle className="w-5 h-5 text-green-600" />
                         ) : (
                           <AlertCircle className={`w-5 h-5 ${
                             statisticalResults.isSignificant && statisticalResults.lift < 0 ? 'text-red-600' : 'text-blue-600'
                           }`} />
                         )}
                         <div>
                           <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                             {statisticalResults.isSignificant && statisticalResults.lift > 0
                               ? `🚀 ${t.implement}`
                               : statisticalResults.isSignificant && statisticalResults.lift < 0
                               ? `❌ ${t.reject}`
                               : `⏳ ${t.continue}`
                             }
                           </p>
                           <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                             {statisticalResults.isSignificant && statisticalResults.lift > 0
                               ? 'Significant positive improvement detected'
                               : statisticalResults.isSignificant && statisticalResults.lift < 0
                               ? 'Significant negative impact detected'
                               : 'Continue test until significance reached'
                             }
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </>
               )}

               {!statisticalResults && (
                 <div className="text-center py-12">
                   <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     Enter test data to see statistical analysis results
                   </p>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Bayesian Tab */}
       {activeTab === 'bayesian' && (
         <div className="space-y-8">
           <div className="grid md:grid-cols-2 gap-8">
             {/* Bayesian Results */}
             <div className={`rounded-xl p-6 shadow-lg border ${
               isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
             }`}>
               <h3 className={`text-xl font-semibold mb-6 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 <Brain className="w-6 h-6 mr-2 text-purple-600" />
                 🧠 Bayesian Analysis
               </h3>

               {bayesianResults && (
                 <>
                   {/* Probability Gauge */}
                   <div className={`p-6 rounded-lg mb-6 ${
                     isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                   }`}>
                     <div className="text-center">
                       <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         Probability P(B > A)
                       </p>
                       <p className="text-5xl font-bold text-purple-600 mb-4">
                         {(bayesianResults.probabilityBWins * 100).toFixed(1)}%
                       </p>
                       
                       {/* Visual gauge */}
                       <div className={`w-full h-4 rounded-full mb-4 ${
                         isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                       }`}>
                         <div 
                           className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                           style={{ width: `${bayesianResults.probabilityBWins * 100}%` }}
                         ></div>
                       </div>

                       <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         {bayesianResults.probabilityBWins > 0.95 
                           ? '🎯 Very Strong Evidence for B'
                           : bayesianResults.probabilityBWins > 0.8
                           ? '📈 Strong Evidence for B'
                           : bayesianResults.probabilityBWins > 0.6
                           ? '📊 Moderate Evidence for B'
                           : bayesianResults.probabilityBWins > 0.4
                           ? '⚖️ Weak Evidence (Either Direction)'
                           : '📉 Evidence Against B'
                         }
                       </div>
                     </div>
                   </div>

                   {/* Expected Lift */}
                   <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                     <div className="flex justify-between items-center">
                       <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         Expected Lift:
                       </span>
                       <span className={`text-lg font-bold ${
                         bayesianResults.expectedLift > 0 ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {bayesianResults.expectedLift > 0 ? '+' : ''}{bayesianResults.expectedLift.toFixed(2)}%
                       </span>
                     </div>
                   </div>

                   {/* Posterior Parameters */}
                   <div className="mt-6 space-y-3">
                     <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                       📊 Posterior Distributions
                     </h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                         <p className={`font-medium text-blue-600`}>Control (A)</p>
                         <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                           Beta(α={bayesianResults.posteriorA.alpha}, β={bayesianResults.posteriorA.beta})
                         </p>
                       </div>
                       <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                         <p className={`font-medium text-green-600`}>Treatment (B)</p>
                         <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                           Beta(α={bayesianResults.posteriorB.alpha}, β={bayesianResults.posteriorB.beta})
                         </p>
                       </div>
                     </div>
                   </div>
                 </>
               )}

               {!bayesianResults && (
                 <div className="text-center py-12">
                   <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     Enter test data to see Bayesian analysis
                   </p>
                 </div>
               )}
             </div>

             {/* ROI Analysis */}
             <div className={`rounded-xl p-6 shadow-lg border ${
               isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
             }`}>
               <h3 className={`text-xl font-semibold mb-6 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 💰 Business Impact & ROI
               </h3>

               {roiAnalysis && (
                 <>
                   {/* ROI Summary */}
                   <div className={`p-6 rounded-lg mb-6 ${
                     roiAnalysis.roi > 0
                       ? isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                       : isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
                   }`}>
                     <div className="text-center">
                       <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         Return on Investment
                       </p>
                       <p className={`text-4xl font-bold ${
                         roiAnalysis.roi > 0 ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {roiAnalysis.roi > 0 ? '+' : ''}{roiAnalysis.roi.toFixed(1)}%
                       </p>
                       <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         {roiAnalysis.roi > 0 ? 'Profitable' : 'Loss Making'}
                       </p>
                     </div>
                   </div>

                   {/* Financial Breakdown */}
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Test Cost:</span>
                         <span className={`font-medium text-red-600`}>
                           -${roiAnalysis.totalCost.toFixed(2)}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Add. Revenue:</span>
                         <span className={`font-medium ${
                           roiAnalysis.additionalRevenue > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {roiAnalysis.additionalRevenue > 0 ? '+' : ''}${roiAnalysis.additionalRevenue.toFixed(2)}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Net Profit:</span>
                         <span className={`font-medium ${
                           roiAnalysis.netPresentValue > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {roiAnalysis.netPresentValue > 0 ? '+' : ''}${roiAnalysis.netPresentValue.toFixed(2)}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Payback:</span>
                         <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {roiAnalysis.paybackPeriod > 0 && roiAnalysis.paybackPeriod < 1000 
                             ? `${roiAnalysis.paybackPeriod.toFixed(1)} days` 
                             : '∞'
                           }
                         </span>
                       </div>
                     </div>

                     {/* Annual Projection */}
                     <div className={`p-4 rounded-lg border ${
                       isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                     }`}>
                       <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                         📅 Annual Projection
                       </p>
                       <p className={`text-lg font-bold ${
                         roiAnalysis.annualizedRevenue > 0 ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {roiAnalysis.annualizedRevenue > 0 ? '+' : ''}${roiAnalysis.annualizedRevenue.toLocaleString()}
                       </p>
                       <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         Extrapolated annual impact
                       </p>
                     </div>

                     {/* Business Decision */}
                     <div className={`p-4 rounded-lg border-l-4 ${
                       roiAnalysis.roi > 20
                         ? isDarkMode ? 'bg-green-900/20 border-green-400' : 'bg-green-50 border-green-500'
                         : roiAnalysis.roi > 0
                         ? isDarkMode ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'
                         : isDarkMode ? 'bg-red-900/20 border-red-400' : 'bg-red-50 border-red-500'
                     }`}>
                       <p className={`font-medium ${
                         roiAnalysis.roi > 20 ? 'text-green-700 dark:text-green-400' :
                         roiAnalysis.roi > 0 ? 'text-blue-700 dark:text-blue-400' :
                         'text-red-700 dark:text-red-400'
                       }`}>
                         🎯 Business Decision: {
                           roiAnalysis.roi > 20 ? 'Strong Implementation' :
                           roiAnalysis.roi > 0 ? 'Proceed with Caution' :
                           'Do Not Implement'
                         }
                       </p>
                       <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         {roiAnalysis.roi > 20 ? 'Excellent ROI justifies immediate rollout' :
                          roiAnalysis.roi > 0 ? 'Positive but modest returns' :
                          'Negative ROI suggests implementation would be costly'}
                       </p>
                     </div>
                   </div>
                 </>
               )}

               {!roiAnalysis && (
                 <div className="text-center py-12">
                   <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     Enter test data to see ROI analysis
                   </p>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* ML Tab */}
       {activeTab === 'ml' && (
         <div className="space-y-8">
           <div className={`rounded-xl p-8 shadow-lg border ${
             isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
           }`}>
             <div className="text-center mb-8">
               <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 🤖 Machine Learning Predictions
               </h2>
               <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                 Advanced AI-powered insights for your A/B testing strategy
               </p>
             </div>

             {mlPredictions && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                 {/* Success Probability */}
                 <div className={`p-6 rounded-xl text-center ${
                   isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                 }`}>
                   <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Brain className="w-8 h-8 text-white" />
                   </div>
                   <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     Success Probability
                   </h3>
                   <p className="text-4xl font-bold text-purple-600 mb-2">
                     {(mlPredictions.probabilityOfSuccess * 100).toFixed(1)}%
                   </p>
                   <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     Likelihood of achieving significance
                   </p>
                 </div>

                 {/* Expected Impact */}
                 <div className={`p-6 rounded-xl text-center ${
                   isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                 }`}>
                   <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <TrendingUp className="w-8 h-8 text-white" />
                   </div>
                   <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     Predicted Lift
                   </h3>
                   <p className="text-4xl font-bold text-green-600 mb-2">
                     +{mlPredictions.expectedLift.toFixed(1)}%
                   </p>
                   <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     Expected conversion improvement
                   </p>
                 </div>

                 {/* AI Confidence */}
                 <div className={`p-6 rounded-xl text-center ${
                   isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                 }`}>
                   <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Shield className="w-8 h-8 text-white" />
                   </div>
                   <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     Model Confidence
                   </h3>
                   <p className="text-4xl font-bold text-blue-600 mb-2">
                     {(mlPredictions.confidenceScore * 100).toFixed(0)}%
                   </p>
                   <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                     AI prediction reliability
                   </p>
                 </div>
               </div>
             )}

             {/* ML Insights */}
             {mlPredictions && (
               <div className="grid md:grid-cols-2 gap-8">
                 <div>
                   <h4 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     🔍 Key Insights
                   </h4>
                   {mlPredictions.insights.map((insight, index) => (
                     <div key={index} className={`p-4 rounded-lg mb-3 ${
                       isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                     }`}>
                       <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         • {insight}
                       </p>
                     </div>
                   ))}
                 </div>

                 <div>
                   <h4 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     ⚠️ Risk Assessment
                   </h4>
                   {mlPredictions.riskFactors.map((risk, index) => (
                     <div key={index} className={`flex items-center justify-between p-4 rounded-lg mb-3 ${
                       isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                     }`}>
                       <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                         {risk.factor}
                       </span>
                       <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                         risk.level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                         risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                         'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                       }`}>
                         {risk.level}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {!mlPredictions && (
               <div className="text-center py-12">
                 <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                   Generate ML predictions from the Planning tab to see AI insights here.
                 </p>
                 <button
                   onClick={() => setActiveTab('planning')}
                   className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                 >
                   Go to Planning
                 </button>
               </div>
             )}
           </div>
         </div>
       )}
     </main>

     {/* Footer */}
     <footer className={`border-t mt-16 ${
       isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
     }`}>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div>
             <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               A/B Testing Pro
             </h3>
             <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               Professional statistical analysis with ML-powered insights for data-driven decisions.
             </p>
           </div>
           <div>
             <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               Features
             </h4>
             <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               <li>Statistical Analysis</li>
               <li>Bayesian Methods</li>
               <li>ML Predictions</li>
               <li>ROI Calculations</li>
             </ul>
           </div>
           <div>
             <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               Export
             </h4>
             <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               <li>PDF Reports</li>
               <li>CSV Data</li>
               <li>Excel Workbooks</li>
               <li>API Integration</li>
             </ul>
           </div>
           <div>
             <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               About
             </h4>
             <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               Built with React, TypeScript, and advanced statistical methods. 
               Open source and available on GitHub.
             </p>
           </div>
         </div>
         <div className={`border-t mt-8 pt-8 text-center text-sm ${
           isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
         }`}>
           <p>© 2024 A/B Testing Pro. Made with ❤️ for data scientists and growth teams.</p>
         </div>
       </div>
     </footer>
   </div>
 );
};

export default ABTestingPro;
