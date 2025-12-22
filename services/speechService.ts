import { Capacitor } from '@capacitor/core';

const getNativeSpeech = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capacitor-community/speech-recognition');
    return mod.SpeechRecognition;
  } catch {
    return null;
  }
};

export const getVoiceMode = async (): Promise<'native' | 'web' | 'none'> => {
  const nativeSpeech = await getNativeSpeech();
  if (nativeSpeech) {
    try {
      const { available } = await nativeSpeech.available();
      return available ? 'native' : 'none';
    } catch {
      return 'none';
    }
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognition ? 'web' : 'none';
};

export const startNativeVoice = async (opts: { language?: string; prompt?: string }): Promise<string | null> => {
  const nativeSpeech = await getNativeSpeech();
  if (!nativeSpeech) return null;

  const perm = await nativeSpeech.requestPermissions();
  if (perm.speechRecognition !== 'granted') return null;

  const res = await nativeSpeech.start({
    language: opts.language || 'en-US',
    maxResults: 1,
    prompt: opts.prompt || 'Speak now',
    partialResults: false,
    popup: true,
  });

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
