import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'curvycloud_gemini_api_key';

const getSecureStorage = async () => {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const mod = await import('capacitor-secure-storage-plugin');
    return mod.SecureStoragePlugin;
  } catch {
    return null;
  }
};

export const getStoredApiKey = async (): Promise<string> => {
  const secure = await getSecureStorage();
  if (secure) {
    try {
      const res = await secure.get({ key: STORAGE_KEY });
      return (res?.value || '').trim();
    } catch {
      return '';
    }
  }

  if (Capacitor.isNativePlatform()) {
    const res = await Preferences.get({ key: STORAGE_KEY });
    return (res.value || '').trim();
  }

  return (localStorage.getItem(STORAGE_KEY) || '').trim();
};

export const setStoredApiKey = async (value: string): Promise<void> => {
  const trimmed = value.trim();
  const secure = await getSecureStorage();
  if (secure) {
    await secure.set({ key: STORAGE_KEY, value: trimmed });
    return;
  }

  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: STORAGE_KEY, value: trimmed });
    return;
  }

  localStorage.setItem(STORAGE_KEY, trimmed);
};

export const clearStoredApiKey = async (): Promise<void> => {
  const secure = await getSecureStorage();
  if (secure) {
    try {
      await secure.remove({ key: STORAGE_KEY });
    } catch {
      // ignore
    }
    return;
  }

  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: STORAGE_KEY });
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
};

export const promptForApiKey = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    const res = await Dialog.prompt({
      title: 'Gemini API Key',
      message: 'Paste your Gemini API key to enable AI features on this device.',
      inputPlaceholder: 'AIza…',
      okButtonTitle: 'Save',
      cancelButtonTitle: 'Cancel',
    });

    if (res.cancelled) return null;
    return (res.value || '').trim();
  }

  const res = window.prompt('Paste your Gemini API key to enable AI features:');
  if (res === null) return null;
  return res.trim();
};
