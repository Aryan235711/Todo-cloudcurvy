// components/ExportDashboard.tsx - Export all app data and logs
import React, { useState } from 'react';
import { activityLogger } from '../services/activityLogger';
import { useTodoStore } from '../stores/todoStore';
import { StructuredExporter } from '../services/structuredExporter';

export const ExportDashboard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { todos, templates } = useTodoStore();

  const exportStructuredAnalysis = async () => {
    setIsExporting(true);
    
    try {
      const structuredData = StructuredExporter.generateComprehensiveExport();
      const exportJson = JSON.stringify(structuredData, null, 2);
      
      if (window.navigator && window.navigator.share) {
        const file = new File([exportJson], `loop-analysis-${new Date().toISOString().split('T')[0]}.json`, {
          type: 'application/json'
        });
        await navigator.share({ files: [file] });
      } else {
        await navigator.clipboard.writeText(exportJson);
        alert('Structured analysis copied to clipboard! This is optimized for sharing and analysis.');
      }

      activityLogger.log('system', 'structured_export', {
        dataSize: exportJson.length,
        totalActivities: structuredData.summary.totalActivities,
        sessionDuration: structuredData.metadata.sessionDuration,
        method: window.navigator?.share ? 'native_share' : 'clipboard'
      });

    } catch (error) {
      console.error('Structured export failed:', error);
      activityLogger.log('system', 'export_error', { error: error.message, type: 'structured' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportComprehensiveData = async () => {
    setIsExporting(true);
    
    try {
      // Gather all app data
      const exportData = {
        metadata: {
          exportTime: new Date().toISOString(),
          appVersion: '1.0.0',
          platform: navigator.platform,
          userAgent: navigator.userAgent
        },
        
        // User data
        userData: {
          todos: todos,
          templates: templates,
          preferences: localStorage.getItem('preferences'),
          settings: localStorage.getItem('settings')
        },
        
        // Activity logs
        activityLogs: JSON.parse(activityLogger.exportActivityReport()),
        
        // System state
        systemState: {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          networkStatus: navigator.onLine,
          memory: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          } : null
        },
        
        // Performance metrics
        performance: {
          timing: performance.timing,
          navigation: performance.navigation,
          entries: performance.getEntries().slice(-100) // Last 100 entries
        }
      };

      // Create downloadable file (mobile-compatible)
      const exportJson = JSON.stringify(exportData, null, 2);
      
      if (window.navigator && window.navigator.share) {
        // Use native sharing on mobile
        const file = new File([exportJson], `loop-export-${new Date().toISOString().split('T')[0]}.json`, {
          type: 'application/json'
        });
        await navigator.share({ files: [file] });
      } else {
        // Fallback: copy to clipboard and show instructions
        await navigator.clipboard.writeText(exportJson);
        alert('Export data copied to clipboard! Paste into a text file and save as .json');
      }

      // Log the export action
      activityLogger.log('system', 'data_export', {
        totalTodos: todos.length,
        totalTemplates: templates.length,
        totalActivities: JSON.parse(activityLogger.exportActivityReport()).totalActivities,
        exportSize: exportJson.length,
        method: window.navigator?.share ? 'native_share' : 'clipboard'
      });

    } catch (error) {
      console.error('Export failed:', error);
      activityLogger.log('system', 'export_error', { error: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const exportActivityLogsOnly = async () => {
    const activityReport = activityLogger.exportActivityReport();
    
    if (window.navigator && window.navigator.share) {
      const file = new File([activityReport], `loop-activity-logs-${new Date().toISOString().split('T')[0]}.json`, {
        type: 'application/json'
      });
      await navigator.share({ files: [file] });
    } else {
      await navigator.clipboard.writeText(activityReport);
      alert('Activity logs copied to clipboard! Paste into a text file and save as .json');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        📊 Data Export Center
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={exportStructuredAnalysis}
          disabled={isExporting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isExporting ? '⏳ Exporting...' : '🎯 Export Structured Analysis (Optimized)'}
        </button>
        
        <button
          onClick={exportComprehensiveData}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isExporting ? '⏳ Exporting...' : '📦 Export Complete App Data'}
        </button>
        
        <button
          onClick={exportActivityLogsOnly}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          📋 Export Activity Logs Only
        </button>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• <strong>Structured Analysis</strong>: Optimized summary with patterns, analytics & insights (recommended for sharing)</p>
          <p>• <strong>Complete export</strong>: All raw data including todos, templates, settings, activity logs, performance data</p>
          <p>• <strong>Activity logs</strong>: Just the interaction history and system events</p>
          <p>• All sensitive data is automatically sanitized</p>
        </div>
      </div>
    </div>
  );
};