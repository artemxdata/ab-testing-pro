import React, { useState, useEffect } from 'react';

const ABTestingPro = () => {
  const [controlVisitors, setControlVisitors] = useState(1000);
  const [controlConversions, setControlConversions] = useState(50);
  const [treatmentVisitors, setTreatmentVisitors] = useState(1000);
  const [treatmentConversions, setTreatmentConversions] = useState(58);
  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

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
  const isSignificant = Math.abs(zScore) > 1.96;
  const pValue = zScore !== 0 ? 2 * (1 - Math.abs(zScore) / Math.sqrt(2 * Math.PI)) : 1;

  const loadSampleData = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setControlVisitors(2847);
      setControlConversions(156);
      setTreatmentVisitors(2903);
      setTreatmentConversions(189);
      setIsAnimating(false);
    }, 500);
  };

  const generateRandomData = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const baseVisitors = Math.floor(Math.random() * 5000) + 1000;
      const baseRate = Math.random() * 0.15 + 0.02; // 2-17%
      const lift = (Math.random() - 0.5) * 0.6; // -30% to +30%
      
      setControlVisitors(baseVisitors);
      setControlConversions(Math.floor(baseVisitors * baseRate));
      setTreatmentVisitors(baseVisitors + Math.floor(Math.random() * 200 - 100));
      setTreatmentConversions(Math.floor((baseVisitors + Math.floor(Math.random() * 200 - 100)) * baseRate * (1 + lift)));
      setIsAnimating(false);
    }, 500);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const getConfidenceColor = () => {
    if (isSignificant && improvement > 0) return 'from-green-500 to-emerald-600';
    if (isSignificant && improvement < 0) return 'from-red-500 to-rose-600';
    return 'from-yellow-500 to-orange-600';
  };

  const getSignificanceEmoji = () => {
    if (isSignificant && improvement > 0) return '🚀';
    if (isSignificant && improvement < 0) return '⚠️';
    return '⏳';
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-cyan-50'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-4 -right-4 w-72 h-72 ${darkMode ? 'bg-purple-500' : 'bg-blue-300'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse`}></div>
        <div className={`absolute -bottom-8 -left-4 w-72 h-72 ${darkMode ? 'bg-pink-500' : 'bg-pink-300'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 ${darkMode ? 'bg-indigo-500' : 'bg-yellow-300'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500`}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <header className="text-center py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>
                  A/B Testing Pro
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                  Professional Statistical Analysis Platform
                </p>
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                darkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                  : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex justify-center space-x-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg max-w-md mx-auto`}>
            {[
              { id: 'calculator', label: '📊 Calculator', icon: '📊' },
              { id: 'insights', label: '🧠 Insights', icon: '🧠' },
              { id: 'history', label: '📈 History', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? darkMode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </header>

        {activeTab === 'calculator' && (
          <div className="space-y-8">
            {/* Input Cards */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Control Group */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">A</span>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Control Group
                    </h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Baseline variant</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      👥 Visitors
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 group-hover:border-blue-400`}
                      value={controlVisitors}
                      onChange={(e) => setControlVisitors(Number(e.target.value))}
                      placeholder="Enter visitors..."
                    />
                  </div>
                  
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ✅ Conversions
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 group-hover:border-blue-400`}
                      value={controlConversions}
                      onChange={(e) => setControlConversions(Number(e.target.value))}
                      placeholder="Enter conversions..."
                    />
                  </div>
                  
                  {/* Conversion Rate Display */}
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border-2 border-blue-200`}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Conversion Rate
                    </p>
                    <p className={`text-4xl font-black ${isAnimating ? 'animate-pulse' : ''} ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {controlRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Treatment Group */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">B</span>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Treatment Group
                    </h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Test variant</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      👥 Visitors
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
                      } focus:ring-4 focus:ring-green-500/20 group-hover:border-green-400`}
                      value={treatmentVisitors}
                      onChange={(e) => setTreatmentVisitors(Number(e.target.value))}
                      placeholder="Enter visitors..."
                    />
                  </div>
                  
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ✅ Conversions
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-4 rounded-xl border-2 font-semibold text-lg transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
                      } focus:ring-4 focus:ring-green-500/20 group-hover:border-green-400`}
                      value={treatmentConversions}
                      onChange={(e) => setTreatmentConversions(Number(e.target.value))}
                      placeholder="Enter conversions..."
                    />
                  </div>
                  
                  {/* Conversion Rate Display */}
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} border-2 border-green-200`}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                      Conversion Rate
                    </p>
                    <p className={`text-4xl font-black ${isAnimating ? 'animate-pulse' : ''} ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {treatmentRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Dashboard */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center space-x-3 mb-8">
                <div className={`w-12 h-12 bg-gradient-to-r ${getConfidenceColor()} rounded-xl flex items-center justify-center`}>
                  <span className="text-2xl">{getSignificanceEmoji()}</span>
                </div>
                <div>
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Statistical Results
                  </h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Comprehensive analysis of your A/B test
                  </p>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50' : 'bg-gradient-to-r from-purple-50 to-purple-100'} border ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    📈 Improvement
                  </p>
                  <p className={`text-3xl font-black ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
                  </p>
                </div>
                
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50' : 'bg-gradient-to-r from-blue-50 to-blue-100'} border ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    📊 Z-Score
                  </p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {zScore.toFixed(2)}
                  </p>
                </div>
                
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-indigo-900/50 to-indigo-800/50' : 'bg-gradient-to-r from-indigo-50 to-indigo-100'} border ${darkMode ? 'border-indigo-700' : 'border-indigo-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    🎯 P-Value
                  </p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {pValue.toFixed(4)}
                  </p>
                </div>
                
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-pink-900/50 to-pink-800/50' : 'bg-gradient-to-r from-pink-50 to-pink-100'} border ${darkMode ? 'border-pink-700' : 'border-pink-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                    🏆 Winner
                  </p>
                  <p className={`text-2xl font-black ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                    {treatmentRate > controlRate ? 'B' : controlRate > treatmentRate ? 'A' : 'Tie'}
                  </p>
                </div>
              </div>

              {/* Significance Banner */}
              <div className={`p-8 rounded-2xl bg-gradient-to-r ${getConfidenceColor()} text-white`}>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {getSignificanceEmoji()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {isSignificant && improvement > 0
                        ? '🚀 Implement Treatment B!'
                        : isSignificant && improvement < 0
                        ? '⚠️ Reject Treatment B'
                        : '⏳ Continue Testing'
                      }
                    </h3>
                    <p className="text-lg opacity-90">
                      {isSignificant && improvement > 0
                        ? `Statistical significance achieved! Treatment B shows ${improvement.toFixed(1)}% improvement.`
                        : isSignificant && improvement < 0
                        ? `Statistical significance shows Treatment B performs ${Math.abs(improvement).toFixed(1)}% worse.`
                        : 'More data needed to reach 95% statistical confidence. Keep the test running!'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={loadSampleData}
                  disabled={isAnimating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnimating ? '🔄 Loading...' : '📊 Load Sample Data'}
                </button>
                
                <button
                  onClick={generateRandomData}
                  disabled={isAnimating}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnimating ? '🎲 Generating...' : '🎲 Generate Random Test'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🧠 AI-Powered Insights
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} border ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  📈 Performance Analysis
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your test shows {Math.abs(improvement).toFixed(1)}% difference between variants. 
                  {isSignificant ? ' This result is statistically significant!' : ' More data needed for significance.'}
                </p>
              </div>
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  🎯 Recommendations
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isSignificant && improvement > 0 
                    ? 'Strong evidence for implementing variant B across your platform.'
                    : 'Consider running the test longer or increasing sample size for decisive results.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📈 Test History
            </h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Test history feature coming soon!
              </p>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                Track your experiments over time with detailed analytics.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-12">
          <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-lg`}>
            <span>⚡</span>
            <span className="font-medium">Powered by Statistical Science</span>
            <span>•</span>
            <span>Built with React</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ABTestingPro;
