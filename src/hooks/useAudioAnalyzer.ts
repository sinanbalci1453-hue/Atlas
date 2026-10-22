import { useEffect, useRef, useState } from 'react';

export function useAudioAnalyzer(isActive: boolean) {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioData(new Uint8Array(0));
      return;
    }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // Low FFT for smooth "peak" detection
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const update = () => {
          analyser.getByteFrequencyData(dataArray);
          // Create a copy to trigger state update or pass by reference if using refs
          setAudioData(new Uint8Array(dataArray));
          animationFrameRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.warn('Audio analyzer failed:', err);
      }
    };

    init();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive]);

  return audioData;
}
