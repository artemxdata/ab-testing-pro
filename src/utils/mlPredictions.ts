// src/utils/mlPredictions.ts - Machine Learning Predictions
import { TestConfiguration, MLPredictions, RiskFactor } from '../types';

/**
 * Machine Learning predictor for A/B test outcomes
 */
export class MLPredictor {
  
  /**
   * Generate ML-powered predictions for test success
   */
  static async generatePredictions(config: TestConfiguration): Promise<MLPredictions> {
    // Simulate ML API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const industryFactors = this.getIndustryFactors(config.industry);
    const effectSizeScore = this.calculateEffectSizeScore(config.minimumDetectableEffect);
    const sampleSizeScore = this.calculateSampleSizeScore(config);
    const powerScore = config.power;
    
    // Composite probability calculation
    const probabilityOfSuccess = Math.min(0.98, Math.max(0.05,
      industryFactors.successRate * 0.3 +
      effectSizeScore * 0.25 +
      sampleSizeScore * 0.25 +
      powerScore * 0.2
    ));
    
    const expectedLift = this.predictExpectedLift(config, industryFactors);
    const confidenceScore = this.calculateConfidenceScore(config, probabilityOfSuccess);
    
    return {
      probabilityOfSuccess,
      expectedLift,
      confidenceScore,
      recommendation: this.getRecommendation(probabilityOfSuccess, expectedLift),
      insights: this.generateInsights(config, industryFactors, probabilityOfSuccess),
      riskFactors: this.assessRiskFactors(config)
    };
  }

  /**
   * Predict optimal stopping time for sequential testing
   */
  static predictOptimalStoppingTime(currentData: {
    currentSampleSize: number;
    currentPValue: number;
    currentEffect: number;
    targetSampleSize: number;
    dailyTraffic: number;
  }) {
    const progress = currentData.currentSampleSize / currentData.targetSampleSize;
    const effectStrength = Math.abs(currentData.currentEffect) / 5; // normalized
    const significanceStrength = Math.max(0, 1 - currentData.currentPValue);
    
    const stopProbability = Math.min(0.95, 
      progress * 0.4 + 
      effectStrength * 0.3 + 
      significanceStrength * 0.3
    );
    
    const estimatedDaysToSignificance = this.estimateDaysToSignificance(currentData);
    
    return {
      stopProbability,
      recommendedAction: this.getSequentialRecommendation(stopProbability, progress, currentData.currentPValue),
      estimatedDaysToSignificance,
      riskAssessment: this.calculateSequentialRisk(currentData)
    };
  }

  /**
   * Segment analysis with ML clustering simulation
   */
  static async performSegmentAnalysis(userData: {
    baselineRate: number;
    totalUsers: number;
  }) {
    // Simulate ML clustering
    const segments = [
      {
        name: 'High-Value Users',
        size: 0.15,
        baselineConversion: userData.baselineRate * 1.8,
        sensitivity: 'high' as const,
        predictedLift: 12.5,
        confidence: 0.87
      },
      {
        name: 'Regular Users',
        size: 0.65,
        baselineConversion: userData.baselineRate,
        sensitivity: 'medium' as const,
        predictedLift: 8.2,
        confidence: 0.92
      },
      {
        name: 'New Users',
        size: 0.20,
        baselineConversion: userData.baselineRate * 0.6,
        sensitivity: 'low' as const,
        predictedLift: 15.7,
        confidence: 0.78
      }
    ];

    return {
      segments,
      recommendations: this.getSegmentationRecommendations(segments),
      expectedImpact: this.calculateSegmentedImpact(segments, userData)
    };
  }

  // Private helper methods
  private static getIndustryFactors(industry: string) {
    const factors = {
      ecommerce: { successRate: 0.68, avgLift: 8.5, volatility: 0.3 },
      saas: { successRate: 0.75, avgLift: 12.3, volatility: 0.2 },
      media: { successRate: 0.62, avgLift: 6.8, volatility: 0.4 },
      fintech: { successRate: 0.71, avgLift: 10.1, volatility: 0.25 }
    };
    return factors[industry as keyof typeof factors] || factors.ecommerce;
  }

  private static calculateEffectSizeScore(effectSize: number): number {
    // Realistic effect sizes are easier to detect
    if (effectSize >= 1 && effectSize <= 5) return 0.9;
    if (effectSize > 5 && effectSize <= 10) return 0.8;
    if (effectSize > 10) return 0.7;
    if (effectSize < 1) return Math.max(0.2, effectSize / 1);
    return 0.5;
  }

  private static calculateSampleSizeScore(config: TestConfiguration): number {
    const requiredSample = this.estimateRequiredSample(config);
    const actualSample = config.dailyTraffic * config.testDuration;
    const ratio = actualSample / requiredSample;
    
    return Math.min(1, Math.max(0.1, ratio));
  }

  private static estimateRequiredSample(config: TestConfiguration): number {
    // Simplified sample size estimation
    const baselineRate = config.baselineRate / 100;
    const effectSize = config.minimumDetectableEffect / 100;
    return Math.ceil(16 * baselineRate * (1 - baselineRate) / (effectSize * effectSize));
  }

  private static predictExpectedLift(config: TestConfiguration, industryFactors: any): number {
    const baseLift = config.minimumDetectableEffect;
    const industryMultiplier = industryFactors.avgLift / 10;
    const seasonalityFactor = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
    
    return baseLift * industryMultiplier * seasonalityFactor;
  }

  private static calculateConfidenceScore(config: TestConfiguration, probability: number): number {
    const powerScore = config.power;
    const alphaScore = 1 - config.alpha;
    const probabilityScore = probability;
    
    return (powerScore * 0.4 + alphaScore * 0.3 + probabilityScore * 0.3);
  }

  private static getRecommendation(probability: number, expectedLift: number): 'implement' | 'continue' | 'reject' {
    if (probability > 0.8 && expectedLift > 2) return 'implement';
    if (probability > 0.5) return 'continue';
    return 'reject';
  }

  private static generateInsights(config: TestConfiguration, industryFactors: any, probability: number): string[] {
    const insights: string[] = [];
    
    insights.push(`${config.industry} industry shows ${(industryFactors.successRate * 100).toFixed(0)}% typical success rate`);
    
    if (config.minimumDetectableEffect < 2) {
      insights.push('Small effect size may require larger sample sizes for reliable detection');
    }
    
    if (config.power < 0.8) {
      insights.push('Consider increasing statistical power to 80% or higher');
    }
    
    if (probability > 0.8) {
      insights.push('High probability of success based on current parameters');
    } else if (probability < 0.3) {
      insights.push('Low success probability - consider adjusting test parameters');
    }
    
    const estimatedDuration = Math.ceil((config.dailyTraffic * config.testDuration) / 1000);
    if (estimatedDuration > 30) {
      insights.push('Long test duration may be affected by external factors');
    }
    
    return insights;
  }

  private static assessRiskFactors(config: TestConfiguration): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    // Seasonality risk
    factors.push({
      factor: 'Seasonality',
      level: Math.random() > 0.5 ? 'medium' : 'low',
      score: Math.random() * 40 + 30
    });
    
    // Sample size risk
    const sampleRisk = config.dailyTraffic < 1000 ? 'high' : 
                      config.dailyTraffic < 5000 ? 'medium' : 'low';
    factors.push({
      factor: 'Sample Size',
      level: sampleRisk,
      score: config.dailyTraffic < 1000 ? 30 : config.dailyTraffic < 5000 ? 60 : 85
    });
    
    // External validity
    factors.push({
      factor: 'External Validity',
      level: 'medium',
      score: 65
    });
    
    // Competition impact
    factors.push({
      factor: 'Competition Impact',
      level: config.industry === 'ecommerce' ? 'high' : 'medium',
      score: config.industry === 'ecommerce' ? 40 : 55
    });
    
    return factors;
  }

  private static getSequentialRecommendation(stopProb: number, progress: number, pValue: number) {
    if (pValue < 0.05 && stopProb > 0.8) {
      return { action: 'stop', reason: 'Достигнута значимость с высокой уверенностью' };
    } else if (progress > 0.9 && pValue > 0.1) {
      return { action: 'stop', reason: 'Мало шансов достичь значимости' };
    } else if (progress < 0.5) {
      return { action: 'continue', reason: 'Недостаточно данных для решения' };
    } else {
      return { action: 'monitor', reason: 'Продолжайте с осторожным мониторингом' };
    }
  }

  private static estimateDaysToSignificance(currentData: any): number {
    const remainingSamples = Math.max(0, currentData.targetSampleSize - currentData.currentSampleSize);
    return Math.ceil(remainingSamples / currentData.dailyTraffic);
  }

  private static calculateSequentialRisk(currentData: any) {
    return {
      falsePositiveRisk: currentData.currentPValue < 0.05 ? 'Low' : 'High',
      practicalSignificanceRisk: Math.abs(currentData.currentEffect) > 2 ? 'Low' : 'Medium',
      overallRisk: currentData.currentPValue < 0.05 && Math.abs(currentData.currentEffect) > 2 ? 'Low' : 'High'
    };
  }

  private static getSegmentationRecommendations(segments: any[]) {
    return segments.map(segment => ({
      segment: segment.name,
      testStrategy: segment.sensitivity === 'high' ? 'Conservative approach' : 'Standard testing',
      expectedROI: segment.predictedLift * segment.confidence,
      priority: segment.sensitivity === 'high' ? 'High' : 'Medium'
    }));
  }

  private static calculateSegmentedImpact(segments: any[], userData: any) {
    let totalImpact = 0;
    
    segments.forEach(segment => {
      const segmentImpact = segment.size * segment.baselineConversion * 
                           (segment.predictedLift / 100);
      totalImpact += segmentImpact;
    });
    
    return {
      totalLift: totalImpact,
      confidence: segments.reduce((acc, s) => acc + s.confidence * s.size, 0),
      timeToImplement: '2-4 weeks'
    };
  }
}
