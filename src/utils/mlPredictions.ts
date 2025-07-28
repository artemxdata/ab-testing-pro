// src/utils/mlPredictions.ts - Machine Learning prediction utilities
import { TestConfiguration, MLPredictions } from '../types';

export class MLPredictor {
  /**
   * Generate ML predictions for A/B test success
   */
  static async generatePredictions(config: TestConfiguration): Promise<MLPredictions> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const {
      baselineRate,
      minimumDetectableEffect,
      alpha,
      power,
      testDuration,
      dailyTraffic,
      industry,
      testType
    } = config;

    // Calculate various prediction factors
    const effectSizeScore = this.calculateEffectSizeScore(minimumDetectableEffect);
    const sampleSizeScore = this.calculateSampleSizeScore(dailyTraffic, testDuration);
    const industryScore = this.getIndustryScore(industry);
    const testTypeScore = this.getTestTypeScore(testType);
    const statisticalRigorScore = this.calculateStatisticalRigor(alpha, power);

    // Weighted probability calculation
    const probabilityOfSuccess = Math.min(0.98, Math.max(0.05,
      effectSizeScore * 0.25 +
      sampleSizeScore * 0.20 +
      industryScore * 0.15 +
      testTypeScore * 0.15 +
      statisticalRigorScore * 0.25
    ));

    // Expected lift prediction
    const expectedLift = this.predictExpectedLift(
      baselineRate,
      minimumDetectableEffect,
      industryScore,
      probabilityOfSuccess
    );

    // Confidence score
    const confidenceScore = this.calculateConfidenceScore(
      probabilityOfSuccess,
      sampleSizeScore,
      statisticalRigorScore
    );

    // Generate insights
    const insights = this.generateInsights(config, probabilityOfSuccess, expectedLift);

    // Assess risk factors
    const riskFactors = this.assessRiskFactors(config, probabilityOfSuccess);

    // Generate recommendations
    const recommendations = this.generateRecommendations(config, riskFactors);

    return {
      probabilityOfSuccess,
      expectedLift,
      confidenceScore,
      insights,
      riskFactors,
      recommendations
    };
  }

  /**
   * Calculate effect size score (0-1)
   */
  private static calculateEffectSizeScore(mde: number): number {
    if (mde >= 20) return 0.95;
    if (mde >= 15) return 0.85;
    if (mde >= 10) return 0.75;
    if (mde >= 5) return 0.60;
    if (mde >= 2) return 0.40;
    return 0.20;
  }

  /**
   * Calculate sample size score (0-1)
   */
  private static calculateSampleSizeScore(dailyTraffic: number, testDuration: number): number {
    const totalSample = dailyTraffic * testDuration;
    if (totalSample >= 100000) return 0.95;
    if (totalSample >= 50000) return 0.85;
    if (totalSample >= 20000) return 0.75;
    if (totalSample >= 10000) return 0.65;
    if (totalSample >= 5000) return 0.50;
    if (totalSample >= 1000) return 0.35;
    return 0.15;
  }

  /**
   * Get industry-specific score
   */
  private static getIndustryScore(industry: string): number {
    const industryScores: Record<string, number> = {
      'ecommerce': 0.80,
      'saas': 0.75,
      'media': 0.70,
      'finance': 0.65,
      'education': 0.60,
      'other': 0.55
    };
    return industryScores[industry] || 0.55;
  }

  /**
   * Get test type score
   */
  private static getTestTypeScore(testType: string): number {
    const testTypeScores: Record<string, number> = {
      'conversion': 0.85,
      'revenue': 0.75,
      'engagement': 0.65,
      'retention': 0.55
    };
    return testTypeScores[testType] || 0.60;
  }

  /**
   * Calculate statistical rigor score
   */
  private static calculateStatisticalRigor(alpha: number, power: number): number {
    let score = 0;
    
    // Alpha contribution
    if (alpha <= 0.01) score += 0.5;
    else if (alpha <= 0.05) score += 0.4;
    else score += 0.2;
    
    // Power contribution
    if (power >= 0.9) score += 0.5;
    else if (power >= 0.8) score += 0.4;
    else score += 0.2;
    
    return score;
  }

  /**
   * Predict expected lift
   */
  private static predictExpectedLift(
    baselineRate: number,
    mde: number,
    industryScore: number,
    probabilityOfSuccess: number
  ): number {
    const baseExpectation = mde * 0.7; // Conservative estimate
    const industryAdjustment = baseExpectation * (industryScore - 0.5);
    const confidenceAdjustment = baseExpectation * (probabilityOfSuccess - 0.5) * 0.5;
    
    return Math.max(0, baseExpectation + industryAdjustment + confidenceAdjustment);
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidenceScore(
    probabilityOfSuccess: number,
    sampleSizeScore: number,
    statisticalRigorScore: number
  ): number {
    return Math.min(0.99, 
      probabilityOfSuccess * 0.4 +
      sampleSizeScore * 0.3 +
      statisticalRigorScore * 0.3
    );
  }

  /**
   * Generate ML insights
   */
  private static generateInsights(
    config: TestConfiguration,
    probabilityOfSuccess: number,
    expectedLift: number
  ): string[] {
    const insights: string[] = [];

    // Success probability insight
    if (probabilityOfSuccess > 0.8) {
      insights.push(`High confidence prediction: ${(probabilityOfSuccess * 100).toFixed(1)}% chance of detecting significant results`);
    } else if (probabilityOfSuccess > 0.6) {
      insights.push(`Moderate confidence: ${(probabilityOfSuccess * 100).toFixed(1)}% likelihood of achieving statistical significance`);
    } else {
      insights.push(`Low confidence scenario: ${(probabilityOfSuccess * 100).toFixed(1)}% probability suggests challenging test conditions`);
    }

    // Sample size insight
    const totalSample = config.dailyTraffic * config.testDuration;
    if (totalSample < 10000) {
      insights.push(`Sample size concern: ${totalSample.toLocaleString()} total visitors may be insufficient for reliable results`);
    } else {
      insights.push(`Adequate sample size: ${totalSample.toLocaleString()} visitors provides good statistical foundation`);
    }

    // Effect size insight
    if (config.minimumDetectableEffect < 5) {
      insights.push(`Small effect detection: ${config.minimumDetectableEffect}% MDE requires larger samples and longer duration`);
    } else if (config.minimumDetectableEffect > 15) {
      insights.push(`Large effect target: ${config.minimumDetectableEffect}% MDE should be easily detectable if true difference exists`);
    }

    // Expected lift insight
    insights.push(`AI prediction: Expected lift of ${expectedLift.toFixed(1)}% based on industry patterns and test parameters`);

    // Industry-specific insight
    const industryInsights: Record<string, string> = {
      'ecommerce': 'E-commerce tests typically show strong conversion lift potential, especially for checkout and product page optimizations',
      'saas': 'SaaS conversion tests often yield moderate but consistent improvements in signup and activation rates',
      'media': 'Media engagement tests can show variable results depending on content type and audience segment',
      'finance': 'Financial services tests require careful consideration of regulatory compliance and user trust factors',
      'education': 'Educational platform tests often focus on engagement metrics with conversion being secondary',
      'other': 'General industry patterns suggest moderate optimization potential across various metrics'
    };
    insights.push(industryInsights[config.industry] || industryInsights['other']);

    return insights;
  }

  /**
   * Assess risk factors
   */
  private static assessRiskFactors(config: TestConfiguration, probabilityOfSuccess: number): Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }> {
    const risks: Array<{factor: string; level: 'low' | 'medium' | 'high'; description: string}> = [];

    // Sample size risk
    const totalSample = config.dailyTraffic * config.testDuration;
    if (totalSample < 5000) {
      risks.push({
        factor: 'Sample Size',
        level: 'high',
        description: 'Insufficient sample size may lead to inconclusive results'
      });
    } else if (totalSample < 15000) {
      risks.push({
        factor: 'Sample Size',
        level: 'medium',
        description: 'Moderate sample size requires careful monitoring'
      });
    } else {
      risks.push({
        factor: 'Sample Size',
        level: 'low',
        description: 'Adequate sample size for reliable detection'
      });
    }

    // Effect size risk
    if (config.minimumDetectableEffect < 3) {
      risks.push({
        factor: 'Effect Size',
        level: 'high',
        description: 'Very small effects are difficult to detect reliably'
      });
    } else if (config.minimumDetectableEffect < 8) {
      risks.push({
        factor: 'Effect Size',
        level: 'medium',
        description: 'Small effects require larger samples and longer duration'
      });
    } else {
      risks.push({
        factor: 'Effect Size',
        level: 'low',
        description: 'Effect size is large enough for reliable detection'
      });
    }

    // Statistical power risk
    if (config.power < 0.7) {
      risks.push({
        factor: 'Statistical Power',
        level: 'high',
        description: 'Low power increases risk of missing true effects'
      });
    } else if (config.power < 0.8) {
      risks.push({
        factor: 'Statistical Power',
        level: 'medium',
        description: 'Moderate power may miss smaller true effects'
      });
    } else {
      risks.push({
        factor: 'Statistical Power',
        level: 'low',
        description: 'Adequate power for reliable effect detection'
      });
    }

    // Success probability risk
    if (probabilityOfSuccess < 0.5) {
      risks.push({
        factor: 'Overall Success',
        level: 'high',
        description: 'Low probability of achieving meaningful results'
      });
    } else if (probabilityOfSuccess < 0.7) {
      risks.push({
        factor: 'Overall Success',
        level: 'medium',
        description: 'Moderate success probability requires careful planning'
      });
    } else {
      risks.push({
        factor: 'Overall Success',
        level: 'low',
        description: 'High probability of successful test completion'
      });
    }

    return risks;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    config: TestConfiguration,
    riskFactors: Array<{factor: string; level: 'low' | 'medium' | 'high'; description: string}>
  ): string[] {
    const recommendations: string[] = [];

    // Check for high risks and provide recommendations
    const highRisks = riskFactors.filter(risk => risk.level === 'high');
    const mediumRisks = riskFactors.filter(risk => risk.level === 'medium');

    if (highRisks.some(risk => risk.factor === 'Sample Size')) {
      recommendations.push('Increase daily traffic allocation or extend test duration to achieve minimum 10,000 samples per variant');
    }

    if (highRisks.some(risk => risk.factor === 'Effect Size')) {
      recommendations.push('Consider increasing minimum detectable effect to 5% or higher for more reliable detection');
    }

    if (highRisks.some(risk => risk.factor === 'Statistical Power')) {
      recommendations.push('Increase statistical power to at least 80% by adjusting sample size or effect size parameters');
    }

    if (config.testDuration < 7) {
      recommendations.push('Extend test duration to at least 1 week to account for day-of-week variations');
    }

    if (config.alpha > 0.05) {
      recommendations.push('Consider using a more stringent significance level (α ≤ 0.05) for business-critical decisions');
    }

    // Positive recommendations
    if (riskFactors.every(risk => risk.level === 'low')) {
      recommendations.push('Excellent test setup! All parameters are optimized for reliable results');
      recommendations.push('Consider running parallel tests on different segments to maximize learning');
    }

    // Industry-specific recommendations
    if (config.industry === 'ecommerce') {
      recommendations.push('Monitor for seasonal effects and consider segmenting by device type for deeper insights');
    } else if (config.industry === 'saas') {
      recommendations.push('Track cohorted conversion rates and consider user onboarding stage as a key segment');
    } else if (config.industry === 'media') {
      recommendations.push('Monitor engagement patterns by content type and consider time-of-day effects');
    }

    // Default recommendations if no specific ones added
    if (recommendations.length === 0) {
      recommendations.push('Test configuration appears balanced - proceed with current setup');
      recommendations.push('Implement proper randomization and consider pre-test data collection');
    }

    return recommendations;
  }
}
