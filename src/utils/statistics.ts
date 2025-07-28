// src/utils/statistics.ts - Statistical calculation utilities
import { TestConfiguration, TestData, StatisticalResults, BayesianResults, ROIAnalysis } from '../types';

export class StatisticsCalculator {
  /**
   * Perform Z-test for two proportions
   */
  static performZTest(testData: TestData): StatisticalResults {
    const { controlConversions, controlTotal, treatmentConversions, treatmentTotal } = testData;
    
    if (controlTotal === 0 || treatmentTotal === 0) {
      throw new Error('Sample sizes must be greater than 0');
    }

    const controlRate = controlConversions / controlTotal;
    const treatmentRate = treatmentConversions / treatmentTotal;
    
    // Pooled proportion for standard error calculation
    const pooledRate = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlTotal + 1/treatmentTotal));
    
    // Z-score calculation
    const zScore = (treatmentRate - controlRate) / standardError;
    
    // P-value calculation (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    // Lift calculation
    const lift = controlRate !== 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;
    
    // Effect size (Cohen's h for proportions)
    const effectSize = 2 * (Math.asin(Math.sqrt(treatmentRate)) - Math.asin(Math.sqrt(controlRate)));
    
    // Confidence interval for the difference
    const diffStandardError = Math.sqrt(
      (controlRate * (1 - controlRate) / controlTotal) +
      (treatmentRate * (1 - treatmentRate) / treatmentTotal)
    );
    const marginOfError = 1.96 * diffStandardError;
    const diffLower = (treatmentRate - controlRate) - marginOfError;
    const diffUpper = (treatmentRate - controlRate) + marginOfError;
    
    // Convert to lift confidence interval
    const liftLower = controlRate !== 0 ? (diffLower / controlRate) * 100 : 0;
    const liftUpper = controlRate !== 0 ? (diffUpper / controlRate) * 100 : 0;
    
    return {
      controlRate,
      treatmentRate,
      lift,
      pValue,
      zScore,
      standardError,
      confidenceInterval: [liftLower, liftUpper],
      isSignificant: pValue < 0.05,
      effectSize,
      requiredSampleSize: this.calculateSampleSizeFromData(controlRate, treatmentRate)
    };
  }

  /**
   * Perform Bayesian analysis using Beta distributions
   */
  static performBayesianAnalysis(testData: TestData): BayesianResults {
    const { controlConversions, controlTotal, treatmentConversions, treatmentTotal } = testData;
    
    // Using uniform priors (Beta(1,1))
    const priorAlpha = 1;
    const priorBeta = 1;
    
    // Posterior parameters
    const posteriorA = {
      alpha: priorAlpha + controlConversions,
      beta: priorBeta + controlTotal - controlConversions
    };
    
    const posteriorB = {
      alpha: priorAlpha + treatmentConversions,
      beta: priorBeta + treatmentTotal - treatmentConversions
    };
    
    // Monte Carlo simulation to calculate P(B > A)
    const simulations = 100000;
    let bWinsCount = 0;
    let liftSum = 0;
    
    for (let i = 0; i < simulations; i++) {
      const sampleA = this.betaRandom(posteriorA.alpha, posteriorA.beta);
      const sampleB = this.betaRandom(posteriorB.alpha, posteriorB.beta);
      
      if (sampleB > sampleA) {
        bWinsCount++;
      }
      
      const lift = sampleA !== 0 ? ((sampleB - sampleA) / sampleA) * 100 : 0;
      liftSum += lift;
    }
    
    const probabilityBWins = bWinsCount / simulations;
    const expectedLift = liftSum / simulations;
    
    // Calculate credible interval for lift
    const liftSamples: number[] = [];
    for (let i = 0; i < 10000; i++) {
      const sampleA = this.betaRandom(posteriorA.alpha, posteriorA.beta);
      const sampleB = this.betaRandom(posteriorB.alpha, posteriorB.beta);
      const lift = sampleA !== 0 ? ((sampleB - sampleA) / sampleA) * 100 : 0;
      liftSamples.push(lift);
    }
    
    liftSamples.sort((a, b) => a - b);
    const credibleInterval: [number, number] = [
      liftSamples[Math.floor(0.025 * liftSamples.length)],
      liftSamples[Math.floor(0.975 * liftSamples.length)]
    ];
    
    return {
      probabilityBWins,
      expectedLift,
      credibleInterval,
      posteriorA,
      posteriorB
    };
  }

  /**
   * Calculate ROI analysis
   */
  static calculateROI(
    testData: TestData, 
    testConfig: TestConfiguration, 
    statisticalResults: StatisticalResults
  ): ROIAnalysis {
    const { treatmentTotal } = testData;
    const { costPerVisitor, revenuePerConversion, testDuration, dailyTraffic } = testConfig;
    
    // Test costs
    const totalVisitors = treatmentTotal * 2; // Assuming equal split
    const testingCost = totalVisitors * costPerVisitor;
    const opportunityCost = dailyTraffic * (testDuration / 2) * costPerVisitor * 0.1; // 10% opportunity cost
    const totalCost = testingCost + opportunityCost;
    
    // Revenue calculations
    const controlRevenue = statisticalResults.controlRate * treatmentTotal * revenuePerConversion;
    const treatmentRevenue = statisticalResults.treatmentRate * treatmentTotal * revenuePerConversion;
    const additionalRevenue = treatmentRevenue - controlRevenue;
    
    // ROI metrics
    const netPresentValue = additionalRevenue - totalCost;
    const roi = totalCost !== 0 ? (netPresentValue / totalCost) * 100 : 0;
    const paybackPeriod = additionalRevenue > 0 ? totalCost / (additionalRevenue / testDuration) : Infinity;
    const annualizedRevenue = additionalRevenue * (365 / testDuration);
    
    // Risk-adjusted return (assuming 80% implementation success rate)
    const riskAdjustedReturn = netPresentValue * 0.8;
    
    return {
      totalCost,
      additionalRevenue,
      netPresentValue,
      roi,
      paybackPeriod,
      annualizedRevenue,
      riskAdjustedReturn
    };
  }

  /**
   * Calculate required sample size for A/B test
   */
  static calculateSampleSize(config: TestConfiguration): number {
    const { baselineRate, minimumDetectableEffect, alpha, power } = config;
    
    const p1 = baselineRate / 100;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);
    
    const zAlpha = this.normalInverse(1 - alpha / 2);
    const zBeta = this.normalInverse(power);
    
    const pooledP = (p1 + p2) / 2;
    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pooledP * (1 - pooledP);
    const denominator = Math.pow(p2 - p1, 2);
    
    return Math.ceil(numerator / denominator);
  }

  /**
   * Calculate sample size from observed data
   */
  private static calculateSampleSizeFromData(controlRate: number, treatmentRate: number): number {
    const pooledRate = (controlRate + treatmentRate) / 2;
    const effect = Math.abs(treatmentRate - controlRate);
    
    const zAlpha = this.normalInverse(0.975); // 95% confidence
    const zBeta = this.normalInverse(0.8);    // 80% power
    
    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pooledRate * (1 - pooledRate);
    const denominator = Math.pow(effect, 2);
    
    return Math.ceil(numerator / denominator);
  }

  /**
   * Normal cumulative distribution function
   */
  private static normalCDF(x: number): number {
    return (1 + this.erf(x / Math.sqrt(2))) / 2;
  }

  /**
   * Error function approximation
   */
  private static erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Inverse normal distribution
   */
  private static normalInverse(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('p must be between 0 and 1');
    }

    // Rational approximation for central region
    if (p > 0.5) {
      return -this.normalInverse(1 - p);
    }

    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    const t = Math.sqrt(-2 * Math.log(p));
    return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  }

  /**
   * Generate random sample from Beta distribution
   */
  private static betaRandom(alpha: number, beta: number): number {
    const x = this.gammaRandom(alpha);
    const y = this.gammaRandom(beta);
    return x / (x + y);
  }

  /**
   * Generate random sample from Gamma distribution
   */
  private static gammaRandom(shape: number): number {
    if (shape < 1) {
      return this.gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  /**
   * Generate random sample from standard normal distribution
   */
  private static normalRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}
