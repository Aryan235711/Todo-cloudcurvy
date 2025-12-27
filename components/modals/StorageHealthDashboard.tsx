import React, { useState, useEffect } from 'react';
import { X, Database, AlertTriangle, CheckCircle, Zap, HardDrive, Trash2 } from 'lucide-react';
import { storageHealthAnalyzer } from '../../services/storageHealthAnalyzer';
import { HEALTH_THRESHOLDS } from '../../config/chartConstants';

interface StorageHealthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageHealthDashboard: React.FC<StorageHealthDashboardProps> = ({ isOpen, onClose }) => {
  const [healthReport, setHealthReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storageBreakdown, setStorageBreakdown] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      analyzeHealth();
    }
  }, [isOpen]);

  const analyzeHealth = async () => {
    setIsLoading(true);
    try {
      const [report, breakdown] = await Promise.all([
        storageHealthAnalyzer.analyzeHealth(),
        Promise.resolve(storageHealthAnalyzer.getStorageBreakdown())
      ]);
      setHealthReport(report);
      setStorageBreakdown(breakdown);
    } catch (error) {
      console.error('Health analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeStorage = async () => {
    setIsLoading(true);
    try {
      await storageHealthAnalyzer.optimizeStorage();
      await analyzeHealth(); // Refresh after optimization
    } catch (error) {
      console.error('Storage optimization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const repairStorage = async () => {
    setIsLoading(true);
    try {
      await storageHealthAnalyzer.repairCorruption();
      await analyzeHealth(); // Refresh after repair
    } catch (error) {
      console.error('Storage repair failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'critical': return 'text-rose-600 bg-rose-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircle size={20} />;
      case 'warning':
      case 'critical':
        return <AlertTriangle size={20} />;
      default:
        return <Database size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="liquid-glass-dark w-full max-w-4xl rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-500 border-2 border-white max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 p-3 bg-white/80 rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-100 rounded-[2rem] text-indigo-600">
            <Database size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Storage Health</h2>
            <p className="text-sm text-slate-500 font-medium">Deep dive into local storage system</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Analyzing storage...</span>
          </div>
        ) : healthReport ? (
          <div className="space-y-6">
            {/* Overall Health */}
            <div className={`p-6 rounded-[2rem] border ${getHealthColor(healthReport.overall)}`}>
              <div className="flex items-center gap-3 mb-4">
                {getHealthIcon(healthReport.overall)}
                <h3 className="text-lg font-black capitalize">{healthReport.overall} Health</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-bold">Capacity</p>
                  <p>{healthReport.details.capacity.percentage}% used</p>
                </div>
                <div>
                  <p className="font-bold">Integrity</p>
                  <p>{Object.values(healthReport.details.integrity).filter(Boolean).length}/3 valid</p>
                </div>
                <div>
                  <p className="font-bold">Performance</p>
                  <p>{healthReport.details.performance.readTime.toFixed(1)}ms read</p>
                </div>
                <div>
                  <p className="font-bold">Corruption</p>
                  <p>{healthReport.details.corruption.length} issues</p>
                </div>
              </div>
            </div>

            {/* Storage Breakdown */}
            {storageBreakdown && (
              <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <HardDrive size={20} />
                  Storage Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Used:</span>
                    <span className="font-black">{(storageBreakdown.total / 1024).toFixed(1)} KB</span>
                  </div>
                  {Object.entries(storageBreakdown.percentages)
                    .filter(([key]) => key.startsWith('curvycloud_'))
                    .map(([key, percentage]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{key.replace('curvycloud_', '').replace('_', ' ')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${Math.min(percentage as number, 100)}%` }}
                            />
                          </div>
                          <span className="font-black w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {healthReport.recommendations.length > 0 && (
              <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60">
                <h3 className="text-lg font-black text-slate-800 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {healthReport.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={optimizeStorage}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap size={16} />
                Optimize Storage
              </button>
              
              {healthReport.details.corruption.length > 0 && (
                <button
                  onClick={repairStorage}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-[2rem] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Repair Corruption
                </button>
              )}
              
              <button
                onClick={analyzeHealth}
                disabled={isLoading}
                className="py-3 px-4 bg-white/60 text-slate-700 rounded-[2rem] font-black text-sm transition-all active:scale-95"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-600">Click analyze to check storage health</p>
            <button
              onClick={analyzeHealth}
              className="mt-4 py-3 px-6 bg-indigo-600 text-white rounded-[2rem] font-black transition-all active:scale-95"
            >
              Analyze Storage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};