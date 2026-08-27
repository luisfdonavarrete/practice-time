interface MetronomeMarkProps {
  className?: string;
}

export function MetronomeMark({ className }: MetronomeMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Metronome"
    >
      <path
        d="M11 34 16.5 7h7L29 34H11Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <path
        d="M9 34h22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="m19.5 28 6-18"
        fill="none"
        stroke="var(--color-reward)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <rect
        width="7"
        height="4.5"
        x="22"
        y="10"
        fill="var(--color-reward)"
        rx="1.5"
        transform="rotate(-72 22 10)"
      />
      <circle cx="19.5" cy="28" r="2.25" fill="var(--color-reward)" />
    </svg>
  );
}
