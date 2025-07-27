// src/hooks/useABTesting.ts - Custom React Hooks for A/B Testing
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TestConfiguration, 
  TestData, 
  StatisticalResults, 
  BayesianResults, 
  ROIAnalysis, 
  MLPredictions 
} from '../types';
import { StatisticsCalculator } from '../utils/statistics';
import { MLPredictor } from '../utils/mlPredictions';

/**
 * Main hook for A/B testing functionality
 */
export const useABTesting = () => {
  // Core state
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    baselineRate: 12.5,
    minimumDetectableEffect: 2.5,
    alpha: 0.05,
    power: 0.8,
    trafficSplit: 50,
    testDuration: 14,
    dailyTraffic: 2500,
    costPerVisitor: 0.15,
    revenuePerConversion: 25.0,
    industry: 'ecommerce',
    testType: 'conversion'
  });

  const [testData, setTestData] = useState<TestData>({
    controlConversions: 1247,
    controlTotal: 12500,
    treatmentConversions: 1398,
    treatmentTotal: 12500
  });

  const [mlPredictions, setMlPredictions] = useState<MLPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated values using useMemo for performance
  const requiredSampleSize = useMemo(() => {
    try {
      return StatisticsCalculator.calculateSampleSize(testConfig);
    } catch (err) {
      console.error('Error calculating sample size:', err);
      return 0;
    }
  }, [testConfig]);

  const statisticalResults = useMemo((): StatisticalResults | null => {
    try {
      if (testData.controlTotal === 0 || testData.treatmentTotal === 0) {
        return null;
      }
      return StatisticsCalculator.performZTest(testData);
    } catch (err) {
      console.error('Error calculating statistical results:', err);
      return null;
    }
  }, [testData]);

  const bayesianResults = useMemo((): BayesianResults | null => {
    try {
      if (testData.controlTotal === 0 || testData.treatmentTotal === 0) {
        return null;
      }
      return StatisticsCalculator.performBayesianAnalysis(testData);
    } catch (err) {
      console.error('Error calculating Bayesian results:', err);
      return null;
    }
  }, [testData]);

  const roiAnalysis = useMemo((): ROIAnalysis | null => {
    try {
      if (!statisticalResults) return null;
      return StatisticsCalculator.calculateROI(testData, testConfig, statisticalResults);
    } catch (err) {
      console.error('Error calculating ROI:', err);
      return null;
    }
  }, [testData, testConfig, statisticalResults]);

  // ML Predictions generator
  const generateMLPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const predictions = await MLPredictor.generatePredictions(testConfig);
      setMlPredictions(predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ML predictions');
    } finally {
      setIsLoading(false);
    }
  }, [testConfig]);

  // Configuration updaters
  const updateTestConfig = useCallback((updates: Partial<TestConfiguration>) => {
    setTestConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTestData = useCallback((updates: Partial<TestData>) => {
    setTestData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset functions
  const resetToDefaults = useCallback(() => {
    setTestConfig({
      baselineRate: 12.5,
      minimumDetectableEffect: 2.5,
      alpha: 0.05,
      power: 0.8,
      trafficSplit: 50,
      testDuration: 14,
      dailyTraffic: 2500,
      costPerVisitor: 0.15,
      revenuePerConversion: 25.0,
      industry: 'ecommerce',
      testType: 'conversion'
    });
    setTestData({
      controlConversions: 1247,
      controlTotal: 12500,
      treatmentConversions: 1398,
      treatmentTotal: 12500
    });
    setMlPredictions(null);
    setError(null);
  }, []);

  // Validation
  const isValidConfiguration = useMemo(() => {
    return (
      testConfig.baselineRate > 0 && testConfig.baselineRate < 100 &&
      testConfig.minimumDetectableEffect > 0 &&
      testConfig.alpha > 0 && testConfig.alpha < 1 &&
      testConfig.power > 0 && testConfig.power < 1 &&
      testConfig.dailyTraffic > 0 &&
      testConfig.testDuration > 0
    );
  }, [testConfig]);

  const isValidTestData = useMemo(() => {
    return (
      testData.controlTotal > 0 &&
      testData.treatmentTotal > 0 &&
      testData.controlConversions >= 0 &&
      testData.treatmentConversions >= 0 &&
      testData.controlConversions <= testData.controlTotal &&
      testData.treatmentConversions <= testData.treatmentTotal
    );
  }, [testData]);

  return {
    // State
    testConfig,
    testData,
    mlPredictions,
    isLoading,
    error,

    // Calculated values
    requiredSampleSize,
    statisticalResults,
    bayesianResults,
    roiAnalysis,

    // Actions
    updateTestConfig,
    updateTestData,
    generateMLPredictions,
    resetToDefaults,

    // Validation
    isValidConfiguration,
    isValidTestData
  };
};

/**
 * Hook for real-time metrics simulation
 */
export const useRealTimeMetrics = (isEnabled: boolean = true) => {
  const [metrics, setMetrics] = useState({
    activeVisitors: 2847,
    testsRunning: 5,
    totalRevenue: 47320,
    avgConversion: 13.2,
    topVariant: 'B',
    lastUpdate: new Date()
  });

  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeVisitors: Math.max(0, prev.activeVisitors + Math.floor(Math.random() * 20 - 10)),
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 100),
        avgConversion: Math.max(8, Math.min(18, prev.avgConversion + (Math.random() - 0.5) * 0.3)),
        lastUpdate: new Date()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  const toggleRealTime = useCallback(() => {
    // This would be handled by parent component
  }, []);

  return {
    metrics,
    isEnabled,
    toggleRealTime
  };
};

/**
 * Hook for theme management
 */
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(newValue));
        document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
      }
      return newValue;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleTheme
  };
};

/**
 * Hook for notifications management
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success' as const, title: 'Test Completed', message: 'Homepage CTA test reached significance', time: '2 min ago' },
    { id: 2, type: 'warning' as const, title: 'Low Traffic', message: 'Checkout flow test needs more samples', time: '1 hour ago' },
    { id: 3, type: 'info' as const, title: 'ML Insight', message: 'Predicted 85% chance of positive outcome', time: '3 hours ago' }
  ]);

  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id'>) => {
    setNotifications(prev => [
      { ...notification, id: Date.now() },
      ...prev.slice(0, 9) // Keep only 10 notifications
    ]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

/**
 * Hook for chart data generation
 */
export const useChartData = (testConfig: TestConfiguration, statisticalResults: StatisticalResults | null) => {
  const chartData = useMemo(() => {
    if (!statisticalResults) return [];

    return Array.from({ length: testConfig.testDuration }, (_, i) => ({
      day: i + 1,
      control: Number((statisticalResults.controlRate + (Math.random() - 0.5) * 2).toFixed(1)),
      treatment: Number((statisticalResults.treatmentRate + (Math.random() - 0.5) * 2).toFixed(1)),
      visitors: Math.floor(testConfig.dailyTraffic * (0.8 + Math.random() * 0.4))
    }));
  }, [testConfig.testDuration, testConfig.dailyTraffic, statisticalResults]);

  const segmentData = useMemo(() => [
    { name: 'Desktop', value: 45, conversion: 14.2, revenue: 8900, color: '#3B82F6' },
    { name: 'Mobile', value: 42, conversion: 11.8, revenue: 6200, color: '#10B981' },
    { name: 'Tablet', value: 13, conversion: 13.5, revenue: 2100, color: '#F59E0B' }
  ], []);

  const performanceData = useMemo(() => [
    { metric: 'Test Velocity', score: 92, target: 85 },
    { metric: 'Statistical Power', score: 88, target: 80 },
    { metric: 'ROI Impact', score: 94, target: 90 },
    { metric: 'Sample Efficiency', score: 86, target: 85 },
    { metric: 'Risk Management', score: 91, target: 80 }
  ], []);

  return {
    chartData,
    segmentData,
    performanceData
  };
};

/**
 * Hook for export functionality
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = useCallback(async (data: any) => {
    setIsExporting(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const blob = new Blob(['PDF content would be here'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ab-test-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportToCSV = useCallback((data: any) => {
    const csvContent = `Metric,Control,Treatment,Lift,P-Value
Conversions,${data.testData.controlConversions},${data.testData.treatmentConversions},,
Total,${data.testData.controlTotal},${data.testData.treatmentTotal},,
Rate,${data.statisticalResults?.controlRate.toFixed(4)},${data.statisticalResults?.treatmentRate.toFixed(4)},${data.statisticalResults?.lift.toFixed(4)},${data.statisticalResults?.pValue.toFixed(6)}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ab-test-data-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isExporting,
    exportToPDF,
    exportToCSV
  };
};
