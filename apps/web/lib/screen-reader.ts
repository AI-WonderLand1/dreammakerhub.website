/**
 * Screen Reader Service
 * Web Speech API wrapper for text-to-speech narration
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

class ScreenReaderService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;
  private enabled: boolean = true;
  private queue: string[] = [];
  private isSpeaking: boolean = false;

  constructor() {
    // Check if we're in a browser environment before accessing window
    if (typeof window !== 'undefined') {
      this.isSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    } else {
      this.isSupported = false;
    }
  }

  /**
   * Check if speech synthesis is available
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Speak text with Web Speech API
   */
  speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.enabled) {
        console.warn('Screen Reader not supported or disabled');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure speech
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 0.8;
        utterance.lang = options.lang || 'en-US';

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
          console.log('[TTS] Speaking:', text);
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          // Process next item in queue if any
          if (this.queue.length > 0) {
            const nextText = this.queue.shift();
            if (nextText) {
              this.speak(nextText, options).then(resolve).catch(reject);
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          console.error('[TTS] Error:', event.error);
          reject(new Error(`Speech error: ${event.error}`));
        };

        this.utterance = utterance;
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Queue text for speech
   */
  queue(text: string): void {
    if (this.isSpeaking) {
      this.queue.push(text);
    } else {
      this.speak(text).catch(console.error);
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.queue = [];
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Enable/disable speech
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow(): boolean {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return this.isSpeaking || window.speechSynthesis.speaking;
    }
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * Set voice by index or name
   */
  setVoice(voiceOrIndex: SpeechSynthesisVoice | number): void {
    if (this.utterance) {
      if (typeof voiceOrIndex === 'number') {
        const voices = this.getVoices();
        this.utterance.voice = voices[voiceOrIndex] || null;
      } else {
        this.utterance.voice = voiceOrIndex;
      }
    }
  }
}

export const screenReader = new ScreenReaderService();
