import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'curvycloud_gemini_api_key';

export const getStoredApiKey = async (): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    const res = await Preferences.get({ key: STORAGE_KEY });
    return (res.value || '').trim();
  }

  return (localStorage.getItem(STORAGE_KEY) || '').trim();
};

export const setStoredApiKey = async (value: string): Promise<void> => {
  const trimmed = value.trim();
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: STORAGE_KEY, value: trimmed });
    return;
  }

  localStorage.setItem(STORAGE_KEY, trimmed);
};

export const clearStoredApiKey = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: STORAGE_KEY });
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
};

export const promptForApiKey = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    const res = await Dialog.prompt({
      title: 'AI API Key',
      message: 'Paste your AI API key to enable AI features on this device. (Currently supports Gemini keys.)',
      inputPlaceholder: 'Paste key…',
      okButtonTitle: 'Save',
      cancelButtonTitle: 'Cancel',
    });

    if (res.cancelled) return null;
    return (res.value || '').trim();
  }

  const res = window.prompt('Paste your AI API key to enable AI features (currently Gemini):');
  if (res === null) return null;
  return res.trim();
};
