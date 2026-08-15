import { useEffect, useRef, useState } from 'react';

export function Metronome() {
  const [bpm, setBpm] = useState(90);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!playing) return;
    const context = new AudioContext();
    audioContextRef.current = context;
    const click = () => playClick(context);
    click();
    intervalRef.current = window.setInterval(click, 60_000 / bpm);
    return () => {
      if (intervalRef.current !== null)
        window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      void context.close();
      audioContextRef.current = null;
    };
  }, [bpm, playing]);

  return (
    <section className="metronome" aria-labelledby="metronome-title">
      <div>
        <span className="tool-label" id="metronome-title">
          Metronome
        </span>
        <strong>{bpm} BPM</strong>
      </div>
      <input
        aria-label="Metronome tempo"
        type="range"
        min="40"
        max="220"
        step="1"
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
      />
      <button
        type="button"
        className="tool-button"
        aria-pressed={playing}
        onClick={() => setPlaying((value) => !value)}
      >
        {playing ? 'Stop click' : 'Start click'}
      </button>
    </section>
  );
}

function playClick(context: AudioContext): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.16, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
}
