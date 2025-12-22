import { Capacitor } from '@capacitor/core';

const getNativeSpeech = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capacitor-community/speech-recognition');
    return mod.SpeechRecognition;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Native speech plugin unavailable', e);
    return null;
  }
};

export const getVoiceMode = async (): Promise<'native' | 'web' | 'none'> => {
  const nativeSpeech = await getNativeSpeech();
  if (nativeSpeech) {
    try {
      const { available } = await nativeSpeech.available();
      return available ? 'native' : 'none';
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Native speech availability check failed', e);
      return 'none';
    }
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognition ? 'web' : 'none';
};

export const startNativeVoice = async (opts: { language?: string; prompt?: string }): Promise<string | null> => {
  const nativeSpeech = await getNativeSpeech();
  if (!nativeSpeech) throw new Error('VOICE_UNAVAILABLE');

  let perm: any;
  try {
    perm = await nativeSpeech.requestPermissions();
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Voice permission request failed', e);
    throw new Error('VOICE_PERMISSION_ERROR');
  }

  if (perm?.speechRecognition !== 'granted') throw new Error('VOICE_PERMISSION_DENIED');

  let res: any;
  try {
    res = await nativeSpeech.start({
      language: opts.language || 'en-US',
      maxResults: 1,
      prompt: opts.prompt || 'Speak now',
      partialResults: false,
      popup: true,
    });
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Native speech start failed', e);
    throw new Error('VOICE_START_FAILED');
  }

  const first = res.matches?.[0];
  return first ? first.trim() : null;
};

export const stopNativeVoice = async (): Promise<void> => {
  const nativeSpeech = await getNativeSpeech();
  if (!nativeSpeech) return;
  try {
    await nativeSpeech.stop();
  } catch {
    // ignore
  }
};
