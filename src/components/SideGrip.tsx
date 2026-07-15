import { useState } from 'react';

interface SideGripProps {
  expanded: boolean;
  onToggle: () => void;
}

export function SideGrip({ expanded, onToggle }: SideGripProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <button
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative w-12 h-36 flex flex-col items-center justify-center gap-2 rounded-l-xl border-y border-l border-cyber-cyan/30 bg-cyber-panel transition-all duration-200 hover:bg-[#151b26] hover:border-cyber-cyan/60"
        data-tauri-drag-region
        title={expanded ? '收起' : '展开'}
      >
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-cyber-cyan to-transparent opacity-50 group-hover:opacity-80 transition-opacity" />

        <svg
          className="w-5 h-5 text-cyber-cyan drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>

        <span
          className={`text-[10px] font-semibold tracking-wider leading-none transition-colors ${
            hovered ? 'text-white' : 'text-cyber-cyan/80'
          }`}
          style={{ writingMode: 'vertical-rl' }}
        >
          {expanded ? '收起' : '密码'}
        </span>

        <svg
          className={`w-4 h-4 text-cyber-cyan/70 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 17l-5-5 5-5m7 10l-5-5 5-5" />
        </svg>
      </button>
    </div>
  );
}
