import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import AudioProtection from '../plugins/audioProtection';

interface UseAudioProtectionOptions {
  onRecordingDetected?: () => void;
  onRecordingStopped?: () => void;
  autoMute?: boolean; // Automatically mute audio when recording detected
}

export const useAudioProtection = (
  audioRef?: React.RefObject<HTMLAudioElement>,
  options: UseAudioProtectionOptions = {}
) => {
  const { onRecordingDetected, onRecordingStopped, autoMute = true } = options;
  const wasPlayingRef = useRef(false);
  const volumeBeforeMuteRef = useRef(1);

  const handleRecordingDetected = useCallback(() => {
    console.log('[AudioProtection] Screen recording detected!');
    
    if (audioRef?.current) {
      const audio = audioRef.current;
      
      // Save current state
      wasPlayingRef.current = !audio.paused;
      volumeBeforeMuteRef.current = audio.volume;
      
      if (autoMute) {
        // Pause and mute the audio
        audio.pause();
        audio.volume = 0;
        audio.muted = true;
        console.log('[AudioProtection] Audio paused and muted');
      }
    }
    
    onRecordingDetected?.();
  }, [audioRef, autoMute, onRecordingDetected]);

  const handleRecordingStopped = useCallback(() => {
    console.log('[AudioProtection] Screen recording stopped');
    
    if (audioRef?.current && autoMute) {
      const audio = audioRef.current;
      
      // Restore audio state
      audio.muted = false;
      audio.volume = volumeBeforeMuteRef.current;
      
      // Resume playback if it was playing before
      if (wasPlayingRef.current) {
        audio.play().catch(err => {
          console.error('[AudioProtection] Failed to resume audio:', err);
        });
        console.log('[AudioProtection] Audio resumed');
      }
    }
    
    onRecordingStopped?.();
  }, [audioRef, autoMute, onRecordingStopped]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listener: any = null;

    const setupProtection = async () => {
      // Start monitoring
      await AudioProtection.startMonitoring();
      console.log('[AudioProtection] Monitoring started');

      // Listen for screen recording changes
      listener = await AudioProtection.addListener(
        'screenRecordingChanged',
        (info) => {
          if (info.isRecording) {
            handleRecordingDetected();
          } else {
            handleRecordingStopped();
          }
        }
      );

      // Check initial state
      const { isRecording } = await AudioProtection.isScreenRecording();
      if (isRecording) {
        handleRecordingDetected();
      }
    };

    setupProtection();

    return () => {
      if (listener) {
        listener.remove();
      }
      if (Capacitor.isNativePlatform()) {
        AudioProtection.stopMonitoring();
      }
    };
  }, [handleRecordingDetected, handleRecordingStopped]);

  return {
    // Manual check if needed
    checkRecording: async () => {
      if (Capacitor.isNativePlatform()) {
        const result = await AudioProtection.isScreenRecording();
        return result.isRecording;
      }
      return false;
    },
  };
};
