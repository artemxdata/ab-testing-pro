// src/utils/exportUtils.ts - Export and Integration Utilities
import { TestConfiguration, TestData, StatisticalResults, ROIAnalysis } from '../types';

/**
 * Export manager for generating reports and data exports
 */
export class ExportManager {
  
  /**
   * Generate PDF report content
   */
  static async generatePDFContent(data: {
    testConfig: TestConfiguration;
    testData: TestData;
    statisticalResults: StatisticalResults;
    roiAnalysis: ROIAnalysis;
  }): Promise<any> {
    // This would integrate with jsPDF in a real implementation
    const reportData = {
      title: 'A/B Test Report',
      generatedAt: new Date().toISOString(),
      summary: this.generateExecutiveSummary(data),
      configuration: this.formatTestConfiguration(data.testConfig),
      results: this.formatStatisticalResults(data.statisticalResults),
      businessImpact: this.formatROIAnalysis(data.roiAnalysis),
      recommendations: this.generateRecommendations(data)
    };
    
    return reportData;
  }

  /**
   * Export test data to CSV format
   */
  static exportToCSV(data: {
    testData: TestData;
    statisticalResults: StatisticalResults;
  }): string {
    const headers = ['Metric', 'Control', 'Treatment', 'Difference', 'P-Value'];
    const rows = [
      headers,
      ['Conversions', data.testData.controlConversions.toString(), data.testData.treatmentConversions.toString(), '', ''],
      ['Total Visitors', data.testData.controlTotal.toString(), data.testData.treatmentTotal.toString(), '', ''],
      ['Conversion Rate (%)', data.statisticalResults.controlRate.toFixed(4), data.statisticalResults.treatmentRate.toFixed(4), data.statisticalResults.lift.toFixed(4), data.statisticalResults.pValue.toFixed(6)],
      ['', '', '', '', ''],
      ['Statistical Metrics', '', '', '', ''],
      ['Z-Score', '', '', data.statisticalResults.zScore.toFixed(4), ''],
      ['Effect Size', '', '', data.statisticalResults.effectSize.toFixed(4), ''],
      ['95% CI Lower', '', '', data.statisticalResults.confidenceInterval[0].toFixed(4), ''],
      ['95% CI Upper', '', '', data.statisticalResults.confidenceInterval[1].toFixed(4), ''],
      ['Statistically Significant', '', '', data.statisticalResults.isSignificant ? 'YES' : 'NO', '']
    ];

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Generate Excel workbook structure
   */
  static generateExcelData(data: {
    testConfig: TestConfiguration;
    testData: TestData;
    statisticalResults: StatisticalResults;
    roiAnalysis: ROIAnalysis;
  }): any {
    return {
      Summary: this.createSummarySheet(data),
      RawData: this.createRawDataSheet(data.testData),
      Statistics: this.createStatisticsSheet(data.statisticalResults),
      ROI: this.createROISheet(data.roiAnalysis),
      Configuration: this.createConfigSheet(data.testConfig)
    };
  }

  /**
   * Generate API payload for integrations
   */
  static generateAPIPayload(data: {
    testConfig: TestConfiguration;
    testData: TestData;
    statisticalResults: StatisticalResults;
    roiAnalysis: ROIAnalysis;
  }): any {
    return {
      test_id: `test_${Date.now()}`,
      test_name: 'A/B Test Analysis',
      status: data.statisticalResults.isSignificant ? 'significant' : 'running',
      created_at: new Date().toISOString(),
      configuration: {
        baseline_rate: data.testConfig.baselineRate,
        minimum_detectable_effect: data.testConfig.minimumDetectableEffect,
        alpha: data.testConfig.alpha,
        power: data.testConfig.power,
        traffic_split: data.testConfig.trafficSplit,
        industry: data.testConfig.industry
      },
      results: {
        control: {
          conversions: data.testData.controlConversions,
          total: data.testData.controlTotal,
          rate: data.statisticalResults.controlRate
        },
        treatment: {
          conversions: data.testData.treatmentConversions,
          total: data.testData.treatmentTotal,
          rate: data.statisticalResults.treatmentRate
        },
        statistics: {
          lift: data.statisticalResults.lift,
          p_value: data.statisticalResults.pValue,
          z_score: data.statisticalResults.zScore,
          is_significant: data.statisticalResults.isSignificant,
          confidence_interval: data.statisticalResults.confidenceInterval,
          effect_size: data.statisticalResults.effectSize
        }
      },
      business_metrics: {
        total_cost: data.roiAnalysis.totalCost,
        additional_revenue: data.roiAnalysis.additionalRevenue,
        roi_percentage: data.roiAnalysis.roi,
        payback_period_days: data.roiAnalysis.paybackPeriod,
        net_present_value: data.roiAnalysis.netPresentValue
      },
      metadata: {
        generated_by: 'AB_Testing_Pro_v2.0',
        export_timestamp: new Date().toISOString(),
        data_version: '1.0'
      }
    };
  }

  /**
   * Send webhook notification
   */
  static async sendWebhook(
    webhookUrl: string, 
    payload: any, 
    options: { headers?: Record<string, string> } = {}
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AB-Testing-Pro/2.0.0',
          ...options.headers
        },
        body: JSON.stringify(payload)
      });

      return {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods
  private static generateExecutiveSummary(data: any): string {
    const { statisticalResults, roiAnalysis } = data;
    
    if (!statisticalResults) {
      return 'This A/B test is currently in progress. Results will be available once sufficient data is collected.';
    }

    const direction = statisticalResults.lift > 0 ? 'increase' : 'decrease';
    const significance = statisticalResults.isSignificant ? 'statistically significant' : 'not statistically significant';
    
    let summary = `The A/B test showed a ${Math.abs(statisticalResults.lift).toFixed(2)}% ${direction} in conversion rate from the control group (${statisticalResults.controlRate.toFixed(2)}%) to the treatment group (${statisticalResults.treatmentRate.toFixed(2)}%). This result is ${significance} (p=${statisticalResults.pValue.toFixed(4)}).`;
    
    if (roiAnalysis) {
      summary += ` From a business perspective, this represents a ${roiAnalysis.roi.toFixed(1)}% ROI with an estimated additional revenue of $${roiAnalysis.additionalRevenue.toFixed(2)}.`;
    }
    
    return summary;
  }

  private static formatTestConfiguration(config: TestConfiguration): any {
    return {
      'Baseline Conversion Rate': `${config.baselineRate}%`,
      'Minimum Detectable Effect': `${config.minimumDetectableEffect}%`,
      'Significance Level (α)': config.alpha,
      'Statistical Power': `${(config.power * 100)}%`,
      'Traffic Split': `${config.trafficSplit}% / ${100 - config.trafficSplit}%`,
      'Test Duration': `${config.testDuration} days`,
      'Daily Traffic': config.dailyTraffic.toLocaleString(),
      'Industry': config.industry,
      'Cost per Visitor': `$${config.costPerVisitor}`,
      'Revenue per Conversion': `$${config.revenuePerConversion}`
    };
  }

  private static formatStatisticalResults(results: StatisticalResults): any {
    return {
      'Control Rate': `${results.controlRate.toFixed(4)}%`,
      'Treatment Rate': `${results.treatmentRate.toFixed(4)}%`,
      'Observed Lift': `${results.lift.toFixed(4)}%`,
      'P-value': results.pValue.toFixed(6),
      'Z-score': results.zScore.toFixed(4),
      'Statistically Significant': results.isSignificant ? 'YES' : 'NO',
      'Effect Size': `${results.effectSize.toFixed(4)}%`,
      '95% Confidence Interval': `[${results.confidenceInterval[0].toFixed(4)}%, ${results.confidenceInterval[1].toFixed(4)}%]`
    };
  }

  private static formatROIAnalysis(roi: ROIAnalysis): any {
    return {
      'Total Test Cost': `$${roi.totalCost.toFixed(2)}`,
      'Additional Revenue': `$${roi.additionalRevenue.toFixed(2)}`,
      'Return on Investment': `${roi.roi.toFixed(2)}%`,
      'Payback Period': `${roi.paybackPeriod.toFixed(1)} days`,
      'Net Present Value': `$${roi.netPresentValue.toFixed(2)}`,
      'Annualized Revenue Impact': `$${roi.annualizedRevenue.toFixed(2)}`
    };
  }

  private static generateRecommendations(data: any): string[] {
    const { statisticalResults, roiAnalysis } = data;
    const recommendations: string[] = [];
    
    if (statisticalResults.isSignificant && statisticalResults.lift > 0) {
      recommendations.push('✅ IMPLEMENT: The test shows significant positive results.');
      recommendations.push('📊 MONITOR: Track metrics for 2-4 weeks post-implementation.');
      if (roiAnalysis.roi > 20) {
        recommendations.push('🚀 SCALE: Consider expanding to similar features.');
      }
    } else if (statisticalResults.isSignificant && statisticalResults.lift < 0) {
      recommendations.push('❌ DO NOT IMPLEMENT: Significant negative impact detected.');
      recommendations.push('🔍 ANALYZE: Investigate why the treatment performed worse.');
      recommendations.push('🔄 ITERATE: Design new variation based on learnings.');
    } else {
      recommendations.push('⏳ CONTINUE TESTING: Results not yet statistically significant.');
      recommendations.push('📈 EXTEND: Consider longer test duration if needed.');
    }
    
    recommendations.push('📝 DOCUMENT: Record all learnings for future tests.');
    recommendations.push('👥 SHARE: Communicate results to stakeholders.');
    
    return recommendations;
  }

  private static createSummarySheet(data: any): any[] {
    return [
      ['Metric', 'Value'],
      ['Test Date', new Date().toLocaleDateString()],
      ['Control Conversions', data.testData.controlConversions],
      ['Control Total', data.testData.controlTotal],
      ['Treatment Conversions', data.testData.treatmentConversions],
      ['Treatment Total', data.testData.treatmentTotal],
      ['Lift (%)', data.statisticalResults.lift.toFixed(4)],
      ['P-value', data.statisticalResults.pValue.toFixed(6)],
      ['Significant', data.statisticalResults.isSignificant ? 'YES' : 'NO'],
      ['ROI (%)', data.roiAnalysis.roi.toFixed(2)]
    ];
  }

  private static createRawDataSheet(testData: TestData): any[] {
    const data = [['Group', 'User_ID', 'Converted', 'Revenue']];
    
    // Generate sample data for demonstration
    for (let i = 1; i <= Math.min(testData.controlTotal, 1000); i++) {
      const converted = i <= testData.controlConversions ? 1 : 0;
      data.push(['Control', `user_${i}`, converted, converted * 25]);
    }
    
    for (let i = 1; i <= Math.min(testData.treatmentTotal, 1000); i++) {
      const converted = i <= testData.treatmentConversions ? 1 : 0;
      data.push(['Treatment', `user_${testData.controlTotal + i}`, converted, converted * 25]);
    }
    
    return data;
  }

  private static createStatisticsSheet(results: StatisticalResults): any[] {
    return [
      ['Statistical Metric', 'Value'],
      ['Control Rate (%)', results.controlRate.toFixed(6)],
      ['Treatment Rate (%)', results.treatmentRate.toFixed(6)],
      ['Lift (%)', results.lift.toFixed(6)],
      ['Z-Score', results.zScore.toFixed(6)],
      ['P-Value', results.pValue.toFixed(8)],
      ['Effect Size', results.effectSize.toFixed(6)],
      ['CI Lower Bound', results.confidenceInterval[0].toFixed(6)],
      ['CI Upper Bound', results.confidenceInterval[1].toFixed(6)],
      ['Statistically Significant', results.isSignificant ? 'TRUE' : 'FALSE']
    ];
  }

  private static createROISheet(roi: ROIAnalysis): any[] {
    return [
      ['ROI Metric', 'Value ($)'],
      ['Total Cost', roi.totalCost.toFixed(2)],
      ['Additional Revenue', roi.additionalRevenue.toFixed(2)],
      ['Net Present Value', roi.netPresentValue.toFixed(2)],
      ['Annualized Revenue', roi.annualizedRevenue.toFixed(2)],
      ['ROI (%)', roi.roi.toFixed(4)],
      ['Payback Period (days)', roi.paybackPeriod.toFixed(2)]
    ];
  }

  private static createConfigSheet(config: TestConfiguration): any[] {
    return [
      ['Configuration Parameter', 'Value'],
      ['Baseline Rate (%)', config.baselineRate],
      ['Minimum Detectable Effect (%)', config.minimumDetectableEffect],
      ['Alpha', config.alpha],
      ['Power', config.power],
      ['Traffic Split (%)', config.trafficSplit],
      ['Test Duration (days)', config.testDuration],
      ['Daily Traffic', config.dailyTraffic],
      ['Cost per Visitor ($)', config.costPerVisitor],
      ['Revenue per Conversion ($)', config.revenuePerConversion],
      ['Industry', config.industry],
      ['Test Type', config.testType]
    ];
  }
}
