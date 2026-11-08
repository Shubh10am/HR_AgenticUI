import { useId } from 'react';
import { cn } from '@/lib/utils';

/** The silver HR sidekick from the landing page, sized for Copilot entry points. */
export default function CopilotMascot({ className }: { className?: string }) {
  const id = useId();
  const silver = `${id}-silver`;
  const body = `${id}-body`;
  const visor = `${id}-visor`;
  const glow = `${id}-glow`;

  return (
    <svg viewBox="0 0 200 270" role="img" aria-label="HR Copilot" className={cn('h-12 w-12', className)}>
      <defs>
        <linearGradient id={silver} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d8daea" />
          <stop offset="1" stopColor="#969db9" />
        </linearGradient>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafaff" />
          <stop offset="0.65" stopColor="#c6cbdf" />
          <stop offset="1" stopColor="#8b95b2" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#252a42" />
          <stop offset="1" stopColor="#080b17" />
        </linearGradient>
        <filter id={glow} x="-150%" y="-100%" width="400%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <path d="M100 15v25" stroke="#c4c9dc" strokeWidth="5" />
      <circle cx="100" cy="12" r="6.5" fill="#b7a6ff" />
      <rect x="18" y="35" width="164" height="126" rx="48" fill={`url(#${silver})`} />
      <rect x="33" y="55" width="134" height="74" rx="28" fill={`url(#${visor})`} />
      <g fill="#a5b4fc" filter={`url(#${glow})`}>
        <rect x="75" y="81" width="10" height="21" rx="5" />
        <rect x="114" y="81" width="10" height="21" rx="5" />
      </g>
      <g fill="#c4d4ff">
        <rect x="75" y="81" width="10" height="21" rx="5" />
        <rect x="114" y="81" width="10" height="21" rx="5" />
      </g>
      <rect x="90" y="138" width="20" height="5" rx="2.5" fill="#858da9" />
      <rect x="37" y="168" width="126" height="88" rx="30" fill={`url(#${body})`} />
      <rect x="4" y="178" width="23" height="62" rx="12" transform="rotate(15 15.5 209)" fill={`url(#${silver})`} />
      <rect x="173" y="178" width="23" height="62" rx="12" transform="rotate(-15 184.5 209)" fill={`url(#${silver})`} />
      <g transform="translate(87 199) scale(1.08)" fill="none" stroke="#5e5790" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />
        <path d="M20 2v4m-2-2h4M4 18v3m-1.5-1.5h3" />
      </g>
      <rect x="90" y="241" width="20" height="3" rx="1.5" fill="#5bcaad" />
    </svg>
  );
}
