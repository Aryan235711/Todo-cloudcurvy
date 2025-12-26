import { Capacitor } from '@capacitor/core';

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition {
  start(): void;
  stop(): void;
  // Add more properties/methods as needed
}

interface CurvyWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const getNativeSpeech = async () => {
  console.log('🎤 Checking if running on native platform...');
  if (!Capacitor.isNativePlatform()) {
    console.log('🎤 Not on native platform, skipping native speech');
    return null;
  }
  console.log('🎤 On native platform, loading speech recognition plugin...');
  try {
    const mod = await import('@capacitor-community/speech-recognition');
    console.log('🎤 Native speech plugin loaded successfully');
    return mod.SpeechRecognition;
  } catch (e) {
    console.warn('🎤 Native speech plugin unavailable', e);
    return null;
  }
};

export const getVoiceMode = async (): Promise<'native' | 'web' | 'none'> => {
  console.log('🎤 Checking voice mode...');
  
  // Skip native speech on iOS for now due to availability check hanging
  // Go straight to web speech which works reliably on Safari/iOS
  console.log('🎤 Skipping native speech, checking web speech directly...');
  
  const win = window as CurvyWindow;
  const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
  const webAvailable = !!SpeechRecognition;
  console.log('🎤 Web speech available:', webAvailable);
  
  if (webAvailable) {
    console.log('🎤 Voice mode detected: web');
    return 'web';
  } else {
    console.log('🎤 Voice mode detected: none');
    return 'none';
  }
};

export const startNativeVoice = async (opts: { language?: string; prompt?: string }): Promise<string | null> => {
  const nativeSpeech = await getNativeSpeech();
  if (!nativeSpeech) throw new Error('VOICE_UNAVAILABLE');

  let perm: { speechRecognition?: string };
  try {
    perm = await nativeSpeech.requestPermissions();
    console.log('🎤 Voice permissions:', perm);
  } catch (e) {
    console.warn('🎤 Voice permission request failed', e);
    throw new Error('VOICE_PERMISSION_ERROR');
  }

  if (perm?.speechRecognition !== 'granted') {
    console.warn('🎤 Voice permission denied:', perm?.speechRecognition);
    throw new Error('VOICE_PERMISSION_DENIED');
  }

  let res: { matches?: string[] };
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
