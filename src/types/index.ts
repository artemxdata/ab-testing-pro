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
