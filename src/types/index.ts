// Core Types for A/B Testing Pro

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
  industry: IndustryType;
  testType: TestType;
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
  isSignificant: boolean;
  confidenceInterval: [number, number];
  effectSize: number;
}

export interface BayesianResults {
  probabilityBWins: number;
  expectedLift: number;
  posteriorA: BetaDistribution;
  posteriorB: BetaDistribution;
  expectedLoss?: number;
}

export interface BetaDistribution {
  alpha: number;
  beta: number;
}

export interface ROIAnalysis {
  totalCost: number;
  additionalRevenue: number;
  roi: number;
  paybackPeriod: number;
  annualizedRevenue: number;
  netPresentValue: number;
}

export interface MLPredictions {
  probabilityOfSuccess: number;
  expectedLift: number;
  confidenceScore: number;
  recommendation: RecommendationType;
  insights: string[];
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  factor: string;
  level: RiskLevel;
  score?: number;
}

export interface RealTimeMetrics {
  activeVisitors: number;
  testsRunning: number;
  totalRevenue: number;
  avgConversion: number;
  topVariant: string;
  lastUpdate: Date;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  action?: string;
}

// Enums
export type IndustryType = 'ecommerce' | 'saas' | 'media' | 'fintech';
export type TestType = 'conversion' | 'revenue' | 'engagement' | 'retention';
export type RecommendationType = 'implement' | 'reject' | 'continue';
export type RiskLevel = 'low' | 'medium' | 'high';
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

// Chart Types
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
