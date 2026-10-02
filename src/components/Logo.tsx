import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#004e8c" />
          <stop offset="50%" stopColor="#026db5" />
          <stop offset="100%" stopColor="#017fc2" />
        </linearGradient>
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Rounded App Icon Base */}
      <rect width="100" height="100" rx="22" fill="url(#logoBlueGrad)" />

      {/* Graduation Cap (White) */}
      <g filter="url(#logoShadow)">
        {/* Diamond Top Cap */}
        <polygon points="50,22 80,35 50,48 20,35" fill="#ffffff" />
        {/* Cap Bottom Skull Base */}
        <path
          d="M 31 43 L 31 56 C 31 66, 69 66, 69 56 L 69 43 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Tassel */}
        <path d="M 78 35.5 L 80 57" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="60" r="3.5" fill="#38bdf8" />

        {/* Medical Cross (Light Turquoise / Cyan) */}
        <path
          d="M 46 51 H 54 V 56 H 59 V 64 H 54 V 69 H 46 V 64 H 41 V 56 H 46 Z"
          fill="#38bdf8"
        />
      </g>
    </svg>
  );
};
