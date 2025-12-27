/**
 * Neural Nudge Health Dashboard
 * Real-time monitoring and analytics for the neural nudge system
 */

import React, { useState, useEffect } from 'react';
import { neuralNudgeHealthMonitor, type HealthScore, type PerformanceMetrics, type SystemHealth } from '../services/neuralNudgeHealthMonitor';
import { HEALTH_THRESHOLDS } from '../config/chartConstants';

interface HealthDashboardProps {
  refreshInterval?: number; // in milliseconds
}

const NeuralNudgeHealthDashboard: React.FC<HealthDashboardProps> = ({ 
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      
      const [health, performance, system, recs] = await Promise.all([
        neuralNudgeHealthMonitor.assessOverallHealth(),
        Promise.resolve(neuralNudgeHealthMonitor.getPerformanceMetrics()),
        Promise.resolve(neuralNudgeHealthMonitor.getSystemHealthDetails()),
        Promise.resolve(neuralNudgeHealthMonitor.getHealthRecommendations())
      ]);

      setHealthScore(health);
      setPerformanceMetrics(performance);
      setSystemHealth(system);
      setRecommendations(recs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh neural nudge health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getScoreColor = (score: number): string => {
    if (score >= HEALTH_THRESHOLDS.EXCELLENT) return 'text-green-600';
    if (score >= HEALTH_THRESHOLDS.GOOD) return 'text-blue-600';
    if (score >= HEALTH_THRESHOLDS.FAIR) return 'text-yellow-600';
    if (score >= HEALTH_THRESHOLDS.POOR) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= HEALTH_THRESHOLDS.EXCELLENT) return 'bg-green-100';
    if (score >= HEALTH_THRESHOLDS.GOOD) return 'bg-blue-100';
    if (score >= HEALTH_THRESHOLDS.FAIR) return 'bg-yellow-100';
    if (score >= HEALTH_THRESHOLDS.POOR) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (score: number): string => {
    if (score >= HEALTH_THRESHOLDS.EXCELLENT) return '🟢';
    if (score >= HEALTH_THRESHOLDS.GOOD) return '🔵';
    if (score >= HEALTH_THRESHOLDS.FAIR) return '🟡';
    if (score >= HEALTH_THRESHOLDS.POOR) return '🟠';
    return '🔴';
  };

  const getRateLimitStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading && !healthScore) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neural Nudge Health Monitor</h1>
            <p className="text-gray-600 mt-1">Real-time system health and performance analytics</p>
          </div>
          <div className="text-right">
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '↻'} Refresh
            </button>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Health Score Overview */}
      {healthScore && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-6 rounded-lg shadow-lg ${getScoreBackground(healthScore.overall)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <p className={`text-3xl font-bold ${getScoreColor(healthScore.overall)}`}>
                  {getStatusIcon(healthScore.overall)} {(healthScore.overall * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${getScoreBackground(healthScore.effectiveness)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Effectiveness</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthScore.effectiveness)}`}>
                  {(healthScore.effectiveness * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${getScoreBackground(healthScore.reliability)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reliability</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthScore.reliability)}`}>
                  {(healthScore.reliability * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${getScoreBackground(healthScore.userSatisfaction)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthScore.userSatisfaction)}`}>
                  {(healthScore.userSatisfaction * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${getScoreBackground(healthScore.systemHealth)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className={`text-2xl font-bold ${getScoreColor(healthScore.systemHealth)}`}>
                  {(healthScore.systemHealth * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nudge Frequency</span>
                <span className="font-semibold">{performanceMetrics.nudgeFrequency.toFixed(2)}/hour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Timing Accuracy</span>
                <span className="font-semibold">{(performanceMetrics.optimalTimingAccuracy * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contextual Relevance</span>
                <span className="font-semibold">{(performanceMetrics.contextualRelevance * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prediction Accuracy</span>
                <span className="font-semibold">{(performanceMetrics.behavioralPredictionAccuracy * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">A/B Test Convergence</span>
                <span className="font-semibold">{(performanceMetrics.abTestConvergence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* System Health Details */}
        {systemHealth && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rate Limit Status</span>
                <span className={`font-semibold ${getRateLimitStatusColor(systemHealth.rateLimitStatus)}`}>
                  {systemHealth.rateLimitStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-semibold">{(systemHealth.errorRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-semibold">{systemHealth.responseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-semibold">{systemHealth.memoryUsage.toFixed(1)}KB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Experiments</span>
                <span className="font-semibold">{systemHealth.activeExperiments}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Recommendations</h2>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  rec.includes('🚨') ? 'bg-red-50 border-l-4 border-red-400' :
                  rec.includes('⚠️') ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                  rec.includes('✅') ? 'bg-green-50 border-l-4 border-green-400' :
                  'bg-blue-50 border-l-4 border-blue-400'
                }`}
              >
                <p className="text-sm font-medium text-gray-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => neuralNudgeHealthMonitor.resetDailyMetrics()}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-1">🔄</div>
            <div className="text-sm font-medium">Reset Metrics</div>
          </button>
          
          <button 
            onClick={() => {
              const report = neuralNudgeHealthMonitor.generateHealthReport();
              console.log('Health Report:', report);
              // Could also download as JSON or send to analytics
            }}
            className="p-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-medium">Export Report</div>
          </button>
          
          <button 
            onClick={() => {
              // Could trigger a test nudge
              console.log('Test nudge triggered');
            }}
            className="p-3 bg-green-100 hover:bg-green-200 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-1">🧪</div>
            <div className="text-sm font-medium">Test Nudge</div>
          </button>
          
          <button 
            onClick={() => {
              // Could open detailed analytics
              console.log('Opening detailed analytics');
            }}
            className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-1">📈</div>
            <div className="text-sm font-medium">Analytics</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuralNudgeHealthDashboard;