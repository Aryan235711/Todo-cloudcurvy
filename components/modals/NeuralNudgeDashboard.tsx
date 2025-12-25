import React, { useState, useEffect } from 'react';
import { X, Brain, Target, TrendingUp, Clock, Zap, AlertTriangle } from 'lucide-react';

interface NeuralNudgeDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  insights: {
    procrastinationRisk: 'low' | 'medium' | 'high';
    interventionTiming: 'immediate' | 'gentle' | 'delayed';
    completionProbability: number;
    suggestedAction: string;
    confidence: number;
    nextOptimalHour: number;
    behaviorPattern: string;
  };
  stats: {
    streak: number;
    engagement: number;
    isQuietTime: boolean;
    nextOptimalDelay: number;
  };
}

export const NeuralNudgeDashboard: React.FC<NeuralNudgeDashboardProps> = ({
  isOpen,
  onClose,
  insights,
  stats
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getEngagementLevel = (score: number) => {
    if (score > 0.7) return { label: 'High', color: 'text-emerald-600' };
    if (score > 0.4) return { label: 'Medium', color: 'text-amber-600' };
    return { label: 'Low', color: 'text-rose-600' };
  };

  const engagement = getEngagementLevel(stats.engagement);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/10 backdrop-blur-md px-4 pt-[calc(var(--safe-top)+1rem)] pb-4">
      <div 
        className="liquid-glass-dark w-full max-w-3xl max-h-[92vh] shadow-2xl px-4 sm:px-8 py-6 sm:py-8 flex flex-col rounded-b-[3rem] overflow-y-auto transition-transform duration-500 ease-out"
        style={{
          transform: isAnimating ? 'translateY(0)' : 'translateY(-100%)'
        }}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Brain className="text-indigo-500" size={28} sm:size={32} />
            Neural Nudge
          </h2>
          <button onClick={onClose} className="p-3 bg-white/60 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 sm:space-y-6">
          {/* Procrastination Risk */}
          <div className={`p-4 sm:p-6 rounded-2xl border ${getRiskColor(insights.procrastinationRisk)}`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} />
              <span className="font-bold text-sm uppercase tracking-wide">Procrastination Risk</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black capitalize mb-2">{insights.procrastinationRisk}</div>
            <div className="text-sm sm:text-base opacity-75">{insights.suggestedAction}</div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/60 p-4 sm:p-5 rounded-2xl border border-white/40">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-600 uppercase">Completion</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800">
                {Math.round(insights.completionProbability * 100)}%
              </div>
            </div>

            <div className="bg-white/60 p-4 sm:p-5 rounded-2xl border border-white/40">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-600 uppercase">Streak</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800">{stats.streak}</div>
            </div>

            <div className="bg-white/60 p-4 sm:p-5 rounded-2xl border border-white/40">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-600 uppercase">Engagement</span>
              </div>
              <div className={`text-xl sm:text-2xl font-black ${engagement.color}`}>{engagement.label}</div>
            </div>

            <div className="bg-white/60 p-4 sm:p-5 rounded-2xl border border-white/40">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-slate-600" />
                <span className="text-xs font-bold text-slate-600 uppercase">Optimal Hour</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800">{insights.nextOptimalHour}:00</div>
            </div>
          </div>

          {/* Behavior Pattern */}
          <div className="bg-indigo-50 p-4 sm:p-6 rounded-2xl border border-indigo-200">
            <div className="flex items-center gap-3 mb-3">
              <Brain size={16} className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase">Behavior Pattern</span>
            </div>
            <div className="text-sm sm:text-base text-indigo-800">{insights.behaviorPattern}</div>
          </div>

          {/* System Status */}
          <div className="flex items-center justify-center text-sm text-slate-500 py-3">
            <span>{stats.isQuietTime ? '🌙 Quiet Hours' : '☀️ Active Hours'}</span>
          </div>
          
          {/* Rate Limiting Status */}
          {stats.rateLimitStatus && (
            <div className={`p-3 rounded-xl border text-xs ${
              stats.rateLimitStatus.cooldownActive 
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wide">
                  {stats.rateLimitStatus.cooldownActive ? '⏳ Cooldown Active' : '✅ Ready to Notify'}
                </span>
                <span>{stats.rateLimitStatus.notificationsInWindow}/{stats.rateLimitStatus.maxNotifications}</span>
              </div>
              {stats.rateLimitStatus.cooldownActive && (
                <div className="text-xs opacity-75">
                  Next notification in {Math.round(stats.rateLimitStatus.timeUntilNext / 60000)}m
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};