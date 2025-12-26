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
  
  const nativeSpeech = await getNativeSpeech();
  if (nativeSpeech) {
    console.log('🎤 Native speech plugin found, checking availability...');
    try {
      // Add timeout to prevent hanging
      const availabilityPromise = nativeSpeech.available();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Availability check timeout')), 3000)
      );
      
      const { available } = await Promise.race([availabilityPromise, timeoutPromise]) as any;
      console.log('🎤 Native speech available:', available);
      return available ? 'native' : 'web';
    } catch (e) {
      console.warn('🎤 Native speech availability check failed', e);
      console.log('🎤 Falling back to web speech...');
    }
  } else {
    console.log('🎤 No native speech plugin found, checking web speech...');
  }

  const win = window as CurvyWindow;
  const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
  const webAvailable = !!SpeechRecognition;
  console.log('🎤 Web speech available:', webAvailable);
  return webAvailable ? 'web' : 'none';
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
