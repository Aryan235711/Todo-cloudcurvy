import React, { useState } from 'react';
import { TestDashboard } from './TestDashboard';
import { runAllNeuralNudgeTests, logTestResults, TestResult } from '../services/neuralNudgeTestSuite';

export const TestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runAllNeuralNudgeTests();
      setResults(testResults);
      logTestResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to App
          </button>
        </div>
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Neural Nudge Tests</h1>
          <p className="text-lg text-gray-600 mb-6">
            Verify the 3-phase optimization improvements on iOS
          </p>
          
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`px-8 py-4 rounded-lg text-white font-semibold text-lg transition-all ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.passed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{result.testName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Score:</span> {result.score.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Improvement:</span> +{result.improvement.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Baseline:</span> {result.baseline.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {result.executionTime}ms
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{result.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <TestDashboard />
      </div>
    </div>
  );
};