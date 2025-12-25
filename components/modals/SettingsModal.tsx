import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Database, Smartphone, Bell, Palette, ToggleLeft, ToggleRight, ShieldCheck, Unlock, AlertCircle, CheckCircle, Zap, HardDrive, Trash2 } from 'lucide-react';
import { userPreferencesService, UserPreferences } from '../../services/userPreferencesService';
import { storageHealthAnalyzer } from '../../services/storageHealthAnalyzer';
import { triggerHaptic } from '../../services/notificationService';

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

  useEffect(() => {
    if (isOpen) {
      setPreferences(userPreferencesService.getPreferences());
      if (activeTab === 'storage') {
        analyzeHealth();
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!inputValue.trim()) return;
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
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHapticPreferences = (updates: Partial<UserPreferences['hapticFeedback']>) => {
    const newPrefs = { ...preferences.hapticFeedback, ...updates };
    setPreferences(prev => ({ ...prev, hapticFeedback: newPrefs }));
    userPreferencesService.updateHapticPreferences(updates);
    if (updates.enabled !== false) {
      triggerHaptic('light', 'navigation');
    }
  };

  const updateNotificationPreferences = (updates: Partial<UserPreferences['notifications']>) => {
    const newPrefs = { ...preferences.notifications, ...updates };
    setPreferences(prev => ({ ...prev, notifications: newPrefs }));
    userPreferencesService.updateNotificationPreferences(updates);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="liquid-glass-dark w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-500 border-2 border-white max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 p-3 bg-white/80 rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-100 rounded-[2rem] text-indigo-600">
            <Settings size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Settings</h2>
            <p className="text-sm text-slate-500 font-medium">Manage your app preferences</p>
          </div>
        </div>

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
            ) : healthReport ? (
              <>
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

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      await storageHealthAnalyzer.optimizeStorage();
                      await analyzeHealth();
                    }}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-2"
                  >
                    <Zap size={16} />
                    Optimize
                  </button>
                  <button
                    onClick={analyzeHealth}
                    className="py-3 px-4 bg-white/60 text-slate-700 rounded-[2rem] font-black text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={analyzeHealth}
                className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black"
              >
                Analyze Storage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};