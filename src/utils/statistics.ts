// src/utils/statistics.ts - Statistical Functions
import { TestConfiguration, TestData, StatisticalResults, BayesianResults } from '../types';

/**
 * Statistical utility functions for A/B testing
 */
export class StatisticsCalculator {
  
  /**
   * Calculate required sample size for A/B test
   */
  static calculateSampleSize(config: TestConfiguration): number {
    const p1 = config.baselineRate / 100;
    const p2 = p1 + (config.minimumDetectableEffect / 100);
    const pooledP = (p1 + p2) / 2;
    
    const zAlpha = this.getZScore(config.alpha);
    const zBeta = this.getZScore(1 - config.power);
    
    const numerator = Math.pow(
      zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + 
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 
      2
    );
    const denominator = Math.pow(p2 - p1, 2);
    
    return Math.ceil(numerator / denominator);
  }

  /**
   * Perform Z-test for proportions
   */
  static performZTest(testData: TestData): StatisticalResults {
    const p1 = testData.controlConversions / testData.controlTotal;
    const p2 = testData.treatmentConversions / testData.treatmentTotal;
    const pooledP = (testData.controlConversions + testData.treatmentConversions) / 
                   (testData.controlTotal + testData.treatmentTotal);
    
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/testData.controlTotal + 1/testData.treatmentTotal));
    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const lift = ((p2 - p1) / p1) * 100;
    
    const marginOfError = 1.96 * se;
    const confidenceInterval: [number, number] = [
      ((p2 - p1) - marginOfError) * 100,
      ((p2 - p1) + marginOfError) * 100
    ];

    return {
      controlRate: p1 * 100,
      treatmentRate: p2 * 100,
      lift,
      pValue,
      zScore,
      isSignificant: pValue < 0.05,
      confidenceInterval,
      effectSize: Math.abs(lift)
    };
  }

  /**
   * Bayesian analysis using Beta-Binomial model
   */
  static performBayesianAnalysis(
    testData: TestData, 
    priorAlpha: number = 1, 
    priorBeta: number = 1
  ): BayesianResults {
    const alphaA = priorAlpha + testData.controlConversions;
    const betaA = priorBeta + testData.controlTotal - testData.controlConversions;
    const alphaB = priorAlpha + testData.treatmentConversions;
    const betaB = priorBeta + testData.treatmentTotal - testData.treatmentConversions;
    
    // Monte Carlo simulation for P(B > A)
    const samples = 10000;
    let bWins = 0;
    
    for (let i = 0; i < samples; i++) {
      const sampleA = this.betaRandom(alphaA, betaA);
      const sampleB = this.betaRandom(alphaB, betaB);
      if (sampleB > sampleA) bWins++;
    }
    
    const probability = bWins / samples;
    const expectedLift = ((alphaB / (alphaB + betaB)) - (alphaA / (alphaA + betaA))) * 100;
    
    return {
      probabilityBWins: probability,
      expectedLift,
      posteriorA: { alpha: alphaA, beta: betaA },
      posteriorB: { alpha: alphaB, beta: betaB }
    };
  }

  /**
   * Calculate ROI analysis
   */
  static calculateROI(
    testData: TestData,
    config: TestConfiguration,
    statisticalResults: StatisticalResults
  ) {
    const totalCost = (testData.controlTotal + testData.treatmentTotal) * config.costPerVisitor;
    const additionalRevenue = (statisticalResults.lift / 100) * 
                             (testData.controlConversions * config.revenuePerConversion);
    const roi = ((additionalRevenue - totalCost) / totalCost) * 100;
    const paybackPeriod = totalCost / (additionalRevenue / config.testDuration);
    
    return {
      totalCost,
      additionalRevenue,
      roi,
      paybackPeriod,
      annualizedRevenue: (additionalRevenue - totalCost) * 365 / config.testDuration,
      netPresentValue: additionalRevenue - totalCost
    };
  }

  // Helper methods
  private static getZScore(alpha: number): number {
    if (alpha === 0.05) return 1.96;
    if (alpha === 0.01) return 2.58;
    if (alpha === 0.10) return 1.64;
    if (alpha === 0.2) return 0.84; // for power calculations
    if (alpha === 0.1) return 1.28; // for power calculations
    return 1.96;
  }

  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  private static betaRandom(alpha: number, beta: number): number {
    let u, v, x, y;
    do {
      u = Math.random();
      v = Math.random();
      x = Math.pow(u, 1/alpha);
      y = Math.pow(v, 1/beta);
    } while (x + y > 1);
    return x / (x + y);
  }
}
