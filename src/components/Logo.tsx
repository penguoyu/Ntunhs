import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', size = 36 }) => {
  // 每個 Logo 實例使用獨立 id，避免同頁面出現兩個 Logo 時（桌面/手機 Header）漸層參照失效
  const shadowId = `logoShadow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
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
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Rounded App Icon Base */}
      <rect width="100" height="100" rx="22" fill="#00355f" />

      {/* Graduation Cap (White) */}
      <g filter={`url(#${shadowId})`}>
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
        <path d="M 78 35.5 L 80 57" stroke="#7cc4f5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="60" r="3.5" fill="#7cc4f5" />

        {/* Medical Cross (Light Turquoise / Cyan) */}
        <path
          d="M 46 51 H 54 V 56 H 59 V 64 H 54 V 69 H 46 V 64 H 41 V 56 H 46 Z"
          fill="#7cc4f5"
        />
      </g>
    </svg>
  );
};
