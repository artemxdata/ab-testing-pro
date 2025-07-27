// src/webVitals.js - Web Performance Monitoring
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Enhanced performance monitoring for A/B Testing Pro
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Core Web Vitals
    this.measureCoreWebVitals();
    
    // Custom metrics
    this.measureCustomMetrics();
    
    // User interactions
    this.measureUserInteractions();
    
    // Resource loading
    this.measureResourceLoading();
  }

  measureCoreWebVitals() {
    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.logMetric('CLS', clsValue, 'layout stability');
    });

    // First Input Delay
    this.observeMetric('first-input', (list) => {
      for (const entry of list.getEntries()) {
        this.logMetric('FID', entry.processingStart - entry.startTime, 'interactivity');
      }
    });

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.logMetric('LCP', lastEntry.startTime, 'loading performance');
    });
  }

  measureCustomMetrics() {
    // Time to Interactive
    this.measureTTI();
    
    // First Meaningful Paint
    this.measureFMP();
    
    // Bundle size impact
    this.measureBundleMetrics();
    
    // React-specific metrics
    this.measureReactMetrics();
  }

  measureUserInteractions() {
    // Button clicks
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON') {
        this.trackInteraction('button_click', {
          text: event.target.textContent,
          timestamp: Date.now()
        });
      }
    });

    // Tab navigation
    document.addEventListener('click', (event) => {
      if (event.target.closest('[role="tab"]') || event.target.dataset.tab) {
        this.trackInteraction('tab_change', {
          tab: event.target.dataset.tab || event.target.textContent,
          timestamp: Date.now()
        });
      }
    });

    // Form interactions
    document.addEventListener('input', (event) => {
      if (event.target.type === 'number' || event.target.type === 'text') {
        this.trackInteraction('input_change', {
          field: event.target.name || event.target.id,
          timestamp: Date.now()
        });
      }
    });
  }

  measureResourceLoading() {
    // Monitor large resources
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.transferSize > 100000) { // > 100KB
          this.logMetric('Large Resource', {
            name: entry.name,
            size: entry.transferSize,
            duration: entry.duration
          }, 'resource loading');
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  observeMetric(type, callback) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(callback);
        observer.observe({ type, buffered: true });
      } catch (error) {
        console.warn(`Could not observe ${type}:`, error);
      }
    }
  }

  measureTTI() {
    // Simplified TTI measurement
    let ttiTime = null;
    const checkTTI = () => {
      if (document.readyState === 'complete' && !ttiTime) {
        ttiTime = performance.now();
        this.logMetric('TTI', ttiTime, 'time to interactive');
      }
    };

    if (document.readyState === 'complete') {
      checkTTI();
    } else {
      window.addEventListener('load', checkTTI);
    }
  }

  measureFMP() {
    // First Meaningful Paint approximation
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.logMetric('FMP', entry.startTime, 'first meaningful paint');
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  measureBundleMetrics() {
    // Measure JavaScript bundle sizes
    const scripts = document.getElementsByTagName('script');
    let totalBundleSize = 0;

    Array.from(scripts).forEach(script => {
      if (script.src && script.src.includes('static/js/')) {
        fetch(script.src, { method: 'HEAD' })
          .then(response => {
            const size = response.headers.get('content-length');
            if (size) {
              totalBundleSize += parseInt(size);
              this.logMetric('Bundle Size', totalBundleSize, 'bundle optimization');
            }
          })
          .catch(() => {}); // Ignore errors
      }
    });
  }

  measureReactMetrics() {
    // React DevTools profiler integration
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id, root, priorityLevel) => {
        const renderTime = performance.now() - this.startTime;
        this.logMetric('React Render', renderTime, 'react performance');
      };
    }

    // Component mount times
    this.measureComponentMounts();
  }

  measureComponentMounts() {
    // Hook into React lifecycle (simplified)
    const originalComponentDidMount = React.Component.prototype.componentDidMount;
    
    React.Component.prototype.componentDidMount = function() {
      const mountTime = performance.now();
      console.log(`Component ${this.constructor.name} mounted in ${mountTime}ms`);
      
      if (originalComponentDidMount) {
        originalComponentDidMount.call(this);
      }
    };
  }

  trackInteraction(type, data) {
    this.metrics.interactions = this.metrics.interactions || [];
    this.metrics.interactions.push({
      type,
      data,
      timestamp: Date.now()
    });

    // Log frequent interactions
    if (this.metrics.interactions.length % 10 === 0) {
      this.sendMetricsToAnalytics();
    }
  }

  logMetric(name, value, category = 'performance') {
    const metric = {
      name,
      value,
      category,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    this.metrics[name] = metric;

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 ${category.toUpperCase()}: ${name}`);
      console.log('Value:', value);
      console.log('Timestamp:', new Date(metric.timestamp).toISOString());
      console.groupEnd();
    }

    // Store in localStorage for debugging
    this.storeMetric(metric);
  }

  storeMetric(metric) {
    try {
      const stored = JSON.parse(localStorage.getItem('ab-testing-pro-metrics') || '[]');
      stored.push(metric);
      
      // Keep only last 100 metrics
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('ab-testing-pro-metrics', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not store metrics:', error);
    }
  }

  sendMetricsToAnalytics() {
    // Send to Google Analytics, Mixpanel, etc.
    if (window.gtag) {
      Object.values(this.metrics).forEach(metric => {
        if (typeof metric.value === 'number') {
          window.gtag('event', 'performance_metric', {
            metric_name: metric.name,
            metric_value: metric.value,
            metric_category: metric.category
          });
        }
      });
    }

    // Send to custom analytics endpoint
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app: 'ab-testing-pro',
          version: '2.0.0',
          metrics: this.metrics,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      }).catch(() => {}); // Ignore errors
    }
  }

  getMetricsSummary() {
    return {
      coreWebVitals: {
        CLS: this.metrics.CLS?.value || 'Not measured',
        FID: this.metrics.FID?.value || 'Not measured',
        LCP: this.metrics.LCP?.value || 'Not measured'
      },
      customMetrics: {
        TTI: this.metrics.TTI?.value || 'Not measured',
        FMP: this.metrics.FMP?.value || 'Not measured',
        bundleSize: this.metrics['Bundle Size']?.value || 'Not measured'
      },
      interactions: this.metrics.interactions?.length || 0,
      timestamp: Date.now()
    };
  }

  exportMetrics() {
    const summary = this.getMetricsSummary();
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-testing-pro-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Export core web vitals functions
export const getCLS = (onPerfEntry) => {
  performanceMonitor.observeMetric('layout-shift', (list) => {
    let clsValue = 0;
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    onPerfEntry({ name: 'CLS', value: clsValue });
  });
};

export const getFID = (onPerfEntry) => {
  performanceMonitor.observeMetric('first-input', (list) => {
    for (const entry of list.getEntries()) {
      onPerfEntry({ 
        name: 'FID', 
        value: entry.processingStart - entry.startTime 
      });
    }
  });
};

export const getFCP = (onPerfEntry) => {
  performanceMonitor.observeMetric('paint', (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        onPerfEntry({ name: 'FCP', value: entry.startTime });
      }
    }
  });
};

export const getLCP = (onPerfEntry) => {
  performanceMonitor.observeMetric('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    onPerfEntry({ name: 'LCP', value: lastEntry.startTime });
  });
};

export const getTTFB = (onPerfEntry) => {
  performanceMonitor.observeMetric('navigation', (list) => {
    for (const entry of list.getEntries()) {
      onPerfEntry({ name: 'TTFB', value: entry.responseStart });
    }
  });
};

// Export performance monitor instance
export { performanceMonitor };

export default reportWebVitals;
