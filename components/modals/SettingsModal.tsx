import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Database, Smartphone, Bell, Palette, ToggleLeft, ToggleRight, ShieldCheck, Unlock, AlertCircle, CheckCircle, Zap, HardDrive, Trash2 } from 'lucide-react';
import { userPreferencesService, UserPreferences } from '../../services/userPreferencesService';
import { storageHealthAnalyzer } from '../../services/storageHealthAnalyzer';
import { triggerHaptic } from '../../services/notificationService';
import { HelpTooltip } from '../ui/HelpTooltip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  onConnect: (manualKey?: string | null) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, hasApiKey, onConnect }) => {
  const [activeTab, setActiveTab] = useState<'api' | 'preferences' | 'storage'>('api');
  const [preferences, setPreferences] = useState<UserPreferences>(userPreferencesService.getPreferences());
  const [healthReport, setHealthReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      try {
        setPreferences(userPreferencesService.getPreferences());
        if (activeTab === 'storage') {
          analyzeHealth();
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Set safe defaults if service fails
        setPreferences({
          hapticFeedback: { enabled: true, intensity: 'medium', taskCompletion: true, navigation: true, notifications: true },
          notifications: { enabled: true, quietHours: { start: 22, end: 7 }, frequency: 'medium' },
          ui: { theme: 'auto', animations: true, compactMode: false }
        });
      }
    }
  }, [isOpen, activeTab]);

  const analyzeHealth = async () => {
    setIsLoading(true);
    try {
      const report = await storageHealthAnalyzer.analyzeHealth();
      setHealthReport(report);
    } catch (error) {
      console.error('Health analysis failed:', error);
      // Set safe fallback report
      setHealthReport({
        overall: 'error',
        details: {
          capacity: { used: 0, available: 5000000, percentage: 0 },
          integrity: { todos: false, templates: false, preferences: false },
          performance: { readTime: -1, writeTime: -1 },
          fragmentation: 0,
          redundancy: false,
          corruption: ['Analysis failed']
        },
        recommendations: ['Unable to analyze storage health']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKeyFormat = (key: string): { isValid: boolean; error?: string } => {
    const trimmed = key.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'API key cannot be empty' };
    }
    
    if (trimmed.length < 20) {
      return { isValid: false, error: 'API key too short' };
    }
    
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
      return { isValid: false, error: 'Invalid API key format' };
    }
    
    return { isValid: true };
  };

  const handleSaveApiKey = async () => {
    if (!inputValue.trim()) return;
    
    // Format validation first
    const validation = validateApiKeyFormat(inputValue);
    if (!validation.isValid) {
      setSaveStatus('error');
      triggerHaptic('warning');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onConnect(inputValue.trim());
      setInputValue('');
      setSaveStatus('success');
      triggerHaptic('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('API key save failed:', error);
      setSaveStatus('error');
      triggerHaptic('warning');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHapticPreferences = (updates: Partial<UserPreferences['hapticFeedback']>) => {
    const newPrefs = { ...preferences.hapticFeedback, ...updates };
    setPreferences(prev => ({ ...prev, hapticFeedback: newPrefs }));
    userPreferencesService.updateHapticPreferences(updates);
    
    // Notify app of preference changes
    window.dispatchEvent(new CustomEvent('preferencesChanged', {
      detail: { type: 'haptic', preferences: newPrefs }
    }));
    
    if (updates.enabled !== false) {
      triggerHaptic('light', 'navigation');
    }
  };

  const updateNotificationPreferences = (updates: Partial<UserPreferences['notifications']>) => {
    const newPrefs = { ...preferences.notifications, ...updates };
    setPreferences(prev => ({ ...prev, notifications: newPrefs }));
    userPreferencesService.updateNotificationPreferences(updates);
    
    // Notify app of preference changes
    window.dispatchEvent(new CustomEvent('preferencesChanged', {
      detail: { type: 'notifications', preferences: newPrefs }
    }));
  };

  const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ 
    enabled, 
    onChange, 
    disabled = false 
  }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      {enabled ? (
        <ToggleRight size={24} className="text-indigo-600" />
      ) : (
        <ToggleLeft size={24} className="text-slate-300" />
      )}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-start bg-slate-900/10 backdrop-blur-md" onClick={onClose}>
      <div 
        className="liquid-glass-dark w-full max-w-2xl h-full shadow-2xl px-6 pb-[calc(var(--safe-bottom)+1.5rem)] pt-[calc(var(--safe-top)+1.5rem)] sm:p-8 flex flex-col rounded-r-[3rem] transition-transform duration-500 ease-out"
        style={{
          transform: isAnimating ? 'translateX(0)' : 'translateX(-100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Settings className="text-indigo-500" size={32} />
            Settings
          </h2>
          <button onClick={onClose} className="p-3 bg-white/60 rounded-xl">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 bg-white/30 p-2 rounded-[1.8rem] border border-white/40">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === 'api' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600'
              }`}
            >
              <Key size={16} className="inline mr-2" />
              API
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === 'preferences' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600'
              }`}
            >
              <Smartphone size={16} className="inline mr-2" />
              Prefs
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                activeTab === 'storage' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600'
              }`}
            >
              <Database size={16} className="inline mr-2" />
              Storage
            </button>
          </div>

        {/* Tab Content */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60">
              <div className="flex items-center gap-3 mb-4">
                {hasApiKey ? <ShieldCheck size={24} className="text-emerald-500" /> : <Unlock size={24} className="text-amber-500" />}
                <h3 className="text-lg font-black text-slate-800">
                  {hasApiKey ? 'AI Connection Secured' : 'Connect Your AI Key'}
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">
                Loop uses BYOK (Bring Your Own Key) model. Connect your AI API key for intelligent features.
              </p>

              <div className="space-y-3">
                <input
                  className="w-full p-3 rounded-xl bg-white/80 border border-white/30 text-sm"
                  placeholder="Enter your AI API key..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isSaving || !inputValue.trim()}
                  className={`w-full py-3 rounded-2xl font-black disabled:opacity-50 transition-all ${
                    saveStatus === 'success' ? 'bg-emerald-600 text-white' :
                    saveStatus === 'error' ? 'bg-red-600 text-white' :
                    'bg-indigo-600 text-white'
                  }`}
                >
                  {isSaving ? 'Validating...' : 
                   saveStatus === 'success' ? '✓ Saved!' :
                   saveStatus === 'error' ? '✗ Failed' :
                   hasApiKey ? 'Update Key' : 'Save Key'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Haptic Feedback */}
            <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60 space-y-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Smartphone size={20} />
                Haptic Feedback
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Enable Haptics</p>
                  <p className="text-xs text-slate-500">Feel vibrations for interactions</p>
                </div>
                <Toggle
                  enabled={preferences.hapticFeedback.enabled}
                  onChange={(enabled) => updateHapticPreferences({ enabled })}
                />
              </div>

              {preferences.hapticFeedback.enabled && (
                <div>
                  <p className="font-bold text-slate-800 mb-3">Intensity</p>
                  <div className="flex gap-2">
                    {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => {
                          updateHapticPreferences({ intensity });
                          triggerHaptic(intensity, 'navigation');
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          preferences.hapticFeedback.intensity === intensity
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/60 text-slate-600 hover:bg-white/80'
                        }`}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60 space-y-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Bell size={20} />
                Notifications
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Smart Nudges</p>
                  <p className="text-xs text-slate-500">AI-powered productivity reminders</p>
                </div>
                <Toggle
                  enabled={preferences.notifications.enabled}
                  onChange={(enabled) => updateNotificationPreferences({ enabled })}
                />
              </div>
              
              {preferences.notifications.enabled && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium">
                    ✓ Notifications enabled - you'll receive smart productivity nudges
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-600">Analyzing storage...</span>
              </div>
            ) : (
              <>
                {healthReport && (
                  <div className="bg-white/40 rounded-[2rem] p-6 border border-white/60">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Database size={20} />
                      Storage Health: {healthReport.overall}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-bold">Usage</p>
                        <p>{healthReport.details.capacity.percentage}%</p>
                      </div>
                      <div>
                        <p className="font-bold">Performance</p>
                        <p>{healthReport.details.performance.readTime.toFixed(1)}ms</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      await storageHealthAnalyzer.optimizeStorage();
                      await analyzeHealth();
                    }}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={16} />
                    Optimize
                  </button>
                  <button
                    onClick={analyzeHealth}
                    disabled={isLoading}
                    className="py-3 px-4 bg-white/60 text-slate-700 rounded-[2rem] font-black text-sm disabled:opacity-50"
                  >
                    Refresh
                  </button>
                  <HelpTooltip 
                    content="Optimize: Cleans old deleted tasks (30+ days), limits templates to 100, removes expired cache. Refresh: Analyzes storage health and checks for corruption."
                    position="top"
                  />
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};