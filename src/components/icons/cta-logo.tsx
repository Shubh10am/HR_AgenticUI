import type { SVGProps } from 'react';

export default function CtaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.8"/>
      <circle cx="18" cy="18" r="3" fill="#3B82F6"/>
      <circle cx="30" cy="18" r="3" fill="#F59E0B"/>
      <circle cx="18" cy="30"r="3" fill="#10B981"/>
      <circle cx="30" cy="30" r="3" fill="#EF4444"/>
    </svg>
  );
}
