import React, { useState } from 'react';

const ABTestingPro = () => {
  const [controlVisitors, setControlVisitors] = useState(1000);
  const [controlConversions, setControlConversions] = useState(50);
  const [treatmentVisitors, setTreatmentVisitors] = useState(1000);
  const [treatmentConversions, setTreatmentConversions] = useState(58);

  const calculateConversionRate = (conversions, visitors) => {
    return visitors > 0 ? (conversions / visitors) * 100 : 0;
  };

  const controlRate = calculateConversionRate(controlConversions, controlVisitors);
  const treatmentRate = calculateConversionRate(treatmentConversions, treatmentVisitors);
  const improvement = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;

  const calculateZScore = () => {
    if (controlVisitors === 0 || treatmentVisitors === 0) return 0;
    
    const p1 = controlConversions / controlVisitors;
    const p2 = treatmentConversions / treatmentVisitors;
    const pooledRate = (controlConversions + treatmentConversions) / (controlVisitors + treatmentVisitors);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlVisitors + 1/treatmentVisitors));
    
    return standardError > 0 ? (p2 - p1) / standardError : 0;
  };

  const zScore = calculateZScore();
  const isSignificant = Math.abs(zScore) > 1.96; // 95% confidence

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 A/B Testing Pro
          </h1>
          <p className="text-xl text-gray-600">
            Professional A/B Testing Tool with Statistical Analysis
          </p>
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Control Group */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              📊 Control Group (A)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitors
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={controlVisitors}
                  onChange={(e) => setControlVisitors(Number(e.target.value))}
                  placeholder="Enter number of visitors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversions
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={controlConversions}
                  onChange={(e) => setControlConversions(Number(e.target.value))}
                  placeholder="Enter number of conversions"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {controlRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Treatment Group */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              🧪 Treatment Group (B)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitors
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={treatmentVisitors}
                  onChange={(e) => setTreatmentVisitors(Number(e.target.value))}
                  placeholder="Enter number of visitors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversions
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={treatmentConversions}
                  onChange={(e) => setTreatmentConversions(Number(e.target.value))}
                  placeholder="Enter number of conversions"
                />
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {treatmentRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-8 rounded-lg shadow-lg border">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            📈 Test Results
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Improvement</p>
              <p className={`text-4xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Z-Score</p>
              <p className="text-3xl font-bold text-gray-800">
                {zScore.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Significance</p>
              <p className={`text-2xl font-semibold ${isSignificant ? 'text-green-600' : 'text-red-600'}`}>
                {isSignificant ? '✅ Significant' : '❌ Not Significant'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Winner</p>
              <p className="text-2xl font-semibold text-gray-800">
                {treatmentRate > controlRate ? 'Treatment B' : 
                 controlRate > treatmentRate ? 'Control A' : 
                 'Tie'}
              </p>
            </div>
          </div>

          {/* Statistical Summary */}
          <div className={`p-6 rounded-lg border-l-4 ${
            isSignificant && improvement > 0
              ? 'bg-green-50 border-green-500'
              : isSignificant && improvement < 0
              ? 'bg-red-50 border-red-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isSignificant && improvement > 0 ? 'bg-green-500' :
                isSignificant && improvement < 0 ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <div>
                <p className="font-semibold text-gray-900">
                  {isSignificant && improvement > 0
                    ? '🚀 Implement Treatment B'
                    : isSignificant && improvement < 0
                    ? '❌ Reject Treatment B'
                    : '⏳ Continue Testing'
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isSignificant && improvement > 0
                    ? 'Statistical significance achieved with positive improvement'
                    : isSignificant && improvement < 0
                    ? 'Statistical significance shows negative impact'
                    : 'More data needed to reach statistical significance (95% confidence)'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Sample Data Button */}
          <div className="text-center mt-8">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              onClick={() => {
                setControlVisitors(2500);
                setControlConversions(125);
                setTreatmentVisitors(2500);
                setTreatmentConversions(156);
              }}
            >
              📊 Load Sample Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-600">
          <p>Built with React • Statistical Analysis • Open Source</p>
        </footer>
      </div>
    </div>
  );
};

export default ABTestingPro;
