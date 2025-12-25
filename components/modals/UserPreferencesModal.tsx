import React, { useState, useEffect } from 'react';
import { X, Settings, Smartphone, Bell, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import { userPreferencesService, UserPreferences } from '../../services/userPreferencesService';
import { triggerHaptic } from '../../services/notificationService';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(userPreferencesService.getPreferences());

  useEffect(() => {
    if (isOpen) {
      setPreferences(userPreferencesService.getPreferences());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateHapticPreferences = (updates: Partial<UserPreferences['hapticFeedback']>) => {
    const newPrefs = { ...preferences.hapticFeedback, ...updates };
    setPreferences(prev => ({ ...prev, hapticFeedback: newPrefs }));
    userPreferencesService.updateHapticPreferences(updates);
    
    // Test haptic feedback when enabled
    if (updates.enabled !== false) {
      triggerHaptic('light', 'navigation');
    }
  };

  const updateNotificationPreferences = (updates: Partial<UserPreferences['notifications']>) => {
    const newPrefs = { ...preferences.notifications, ...updates };
    setPreferences(prev => ({ ...prev, notifications: newPrefs }));
    userPreferencesService.updateNotificationPreferences(updates);
  };

  const updateUIPreferences = (updates: Partial<UserPreferences['ui']>) => {
    const newPrefs = { ...preferences.ui, ...updates };
    setPreferences(prev => ({ ...prev, ui: newPrefs }));
    userPreferencesService.updateUIPreferences(updates);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="liquid-glass-dark w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-500 border-2 border-white max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 p-3 bg-white/80 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 rounded-[2rem] text-indigo-600">
              <Settings size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Preferences</h2>
              <p className="text-sm text-slate-500 font-medium">Customize your experience</p>
            </div>
          </div>

          {/* Haptic Feedback Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-slate-600" />
              <h3 className="text-lg font-black text-slate-800">Haptic Feedback</h3>
            </div>
            
            <div className="bg-white/40 rounded-[2rem] p-6 space-y-4 border border-white/60">
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

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Task Completion</p>
                  <p className="text-xs text-slate-500">Vibrate when completing tasks</p>
                </div>
                <Toggle
                  enabled={preferences.hapticFeedback.taskCompletion}
                  onChange={(enabled) => updateHapticPreferences({ taskCompletion: enabled })}
                  disabled={!preferences.hapticFeedback.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Navigation</p>
                  <p className="text-xs text-slate-500">Vibrate for button taps</p>
                </div>
                <Toggle
                  enabled={preferences.hapticFeedback.navigation}
                  onChange={(enabled) => updateHapticPreferences({ navigation: enabled })}
                  disabled={!preferences.hapticFeedback.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Notifications</p>
                  <p className="text-xs text-slate-500">Vibrate for smart nudges</p>
                </div>
                <Toggle
                  enabled={preferences.hapticFeedback.notifications}
                  onChange={(enabled) => updateHapticPreferences({ notifications: enabled })}
                  disabled={!preferences.hapticFeedback.enabled}
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
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-slate-600" />
              <h3 className="text-lg font-black text-slate-800">Notifications</h3>
            </div>
            
            <div className="bg-white/40 rounded-[2rem] p-6 space-y-4 border border-white/60">
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
                <>
                  <div>
                    <p className="font-bold text-slate-800 mb-3">Frequency</p>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((frequency) => (
                        <button
                          key={frequency}
                          onClick={() => updateNotificationPreferences({ frequency })}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            preferences.notifications.frequency === frequency
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/60 text-slate-600 hover:bg-white/80'
                          }`}
                        >
                          {frequency}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-3">Quiet Hours</p>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Start</label>
                        <select
                          value={preferences.notifications.quietHours.start}
                          onChange={(e) => updateNotificationPreferences({
                            quietHours: { ...preferences.notifications.quietHours, start: parseInt(e.target.value) }
                          })}
                          className="w-full p-2 rounded-lg bg-white/80 border border-white/30 text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">End</label>
                        <select
                          value={preferences.notifications.quietHours.end}
                          onChange={(e) => updateNotificationPreferences({
                            quietHours: { ...preferences.notifications.quietHours, end: parseInt(e.target.value) }
                          })}
                          className="w-full p-2 rounded-lg bg-white/80 border border-white/30 text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* UI Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-slate-600" />
              <h3 className="text-lg font-black text-slate-800">Interface</h3>
            </div>
            
            <div className="bg-white/40 rounded-[2rem] p-6 space-y-4 border border-white/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Animations</p>
                  <p className="text-xs text-slate-500">Smooth transitions and effects</p>
                </div>
                <Toggle
                  enabled={preferences.ui.animations}
                  onChange={(enabled) => updateUIPreferences({ animations: enabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Compact Mode</p>
                  <p className="text-xs text-slate-500">Denser layout for more content</p>
                </div>
                <Toggle
                  enabled={preferences.ui.compactMode}
                  onChange={(enabled) => updateUIPreferences({ compactMode: enabled })}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};