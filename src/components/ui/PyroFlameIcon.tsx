import { FC } from 'react';

export const PyroFlameIcon: FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="50%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FF4500" />
        </linearGradient>
      </defs>
      
      {/* Main flame shape */}
      <path
        d="M100 30 C120 50, 140 70, 140 100 C140 130, 120 150, 100 150 C80 150, 60 130, 60 100 C60 70, 80 50, 100 30 Z"
        fill="url(#flameGradient)"
      />
      
      {/* Left flame curve */}
      <path
        d="M70 80 C75 90, 70 110, 65 120 C60 115, 55 105, 60 95 C65 85, 68 82, 70 80 Z"
        fill="url(#flameGradient)"
        opacity="0.9"
      />
      
      {/* Right flame curve */}
      <path
        d="M130 60 C140 75, 145 90, 140 105 C135 100, 130 90, 128 80 C126 70, 128 65, 130 60 Z"
        fill="url(#flameGradient)"
        opacity="0.9"
      />
      
      {/* Inner flame detail */}
      <path
        d="M100 50 C110 65, 120 80, 120 100 C120 115, 110 125, 100 125 C90 125, 80 115, 80 100 C80 80, 90 65, 100 50 Z"
        fill="#FFB84D"
        opacity="0.6"
      />
    </svg>
  );
};
