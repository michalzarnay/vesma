import { getScoreLevel } from '../../types/scoring';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const { color, label: levelLabel } = getScoreLevel(score);

  const dimensions = {
    sm: { width: 100, height: 100, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 140, height: 140, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 200, height: 200, strokeWidth: 14, fontSize: 'text-4xl', labelSize: 'text-base' },
  };

  const d = dimensions[size];
  const radius = (d.width - d.strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={d.width} height={d.width / 2 + 22} viewBox={`0 0 ${d.width} ${d.width / 2 + 22}`}>
        {/* Background arc */}
        <path
          d={`M ${d.strokeWidth / 2} ${d.width / 2} A ${radius} ${radius} 0 0 1 ${d.width - d.strokeWidth / 2} ${d.width / 2}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={d.strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${d.strokeWidth / 2} ${d.width / 2} A ${radius} ${radius} 0 0 1 ${d.width - d.strokeWidth / 2} ${d.width / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={d.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text
          x={d.width / 2}
          y={d.width / 2 - 5}
          textAnchor="middle"
          className={`${d.fontSize} font-bold`}
          fill={color}
        >
          {Math.round(score)}
        </text>
        <text
          x={d.width / 2}
          y={d.width / 2 + 15}
          textAnchor="middle"
          className="text-xs"
          fill="#6B7280"
        >
          zo 100
        </text>
      </svg>
      <div className="text-center mt-1">
        <div className={`font-medium text-gray-800 ${d.labelSize}`}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color }}>{levelLabel}</div>
      </div>
    </div>
  );
}
