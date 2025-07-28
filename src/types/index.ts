// src/types/index.ts - TypeScript type definitions for A/B Testing Pro

export interface TestConfiguration {
  baselineRate: number;
  minimumDetectableEffect: number;
  alpha: number;
  power: number;
  trafficSplit: number;
  testDuration: number;
  dailyTraffic: number;
  costPerVisitor: number;
  revenuePerConversion: number;
  industry: string;
  testType: string;
}

export interface TestData {
  controlConversions: number;
  controlTotal: number;
  treatmentConversions: number;
  treatmentTotal: number;
}

export interface StatisticalResults {
  controlRate: number;
  treatmentRate: number;
  lift: number;
  pValue: number;
  zScore: number;
  standardError: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
  effectSize: number;
  requiredSampleSize: number;
}

export interface BayesianResults {
  probabilityBWins: number;
  expectedLift: number;
  credibleInterval: [number, number];
  posteriorA: {
    alpha: number;
    beta: number;
  };
  posteriorB: {
    alpha: number;
    beta: number;
  };
}

export interface ROIAnalysis {
  totalCost: number;
  additionalRevenue: number;
  netPresentValue: number;
  roi: number;
  paybackPeriod: number;
  annualizedRevenue: number;
  riskAdjustedReturn: number;
}

export interface MLPredictions {
  probabilityOfSuccess: number;
  expectedLift: number;
  confidenceScore: number;
  insights: string[];
  riskFactors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
}

export interface ChartDataPoint {
  day: number;
  control: number;
  treatment: number;
  visitors: number;
}

export interface SegmentData {
  name: string;
  value: number;
  conversion: number;
  revenue: number;
  color: string;
}

export interface PerformanceMetric {
  metric: string;
  score: number;
  target: number;
}

export interface Notification {
  id: number;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
}

export interface RealTimeMetrics {
  activeVisitors: number;
  testsRunning: number;
  totalRevenue: number;
  avgConversion: number;
  topVariant: string;
  lastUpdate: Date;
}

// Export utility types
export type TestType = 'conversion' | 'revenue' | 'engagement' | 'retention';
export type Industry = 'ecommerce' | 'saas' | 'media' | 'finance' | 'education' | 'other';
export type ConfidenceLevel = 0.90 | 0.95 | 0.99;
export type PowerLevel = 0.70 | 0.80 | 0.90;
