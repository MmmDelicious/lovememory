import React from 'react';
import styles from './HexagonChart.module.css';
interface HexagonChartProps {
  data: {
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
  }[];
  title?: string;
  size?: number;
}
const HexagonChart: React.FC<HexagonChartProps> = ({ 
  data, 
  title = "Гексагональная диаграмма",
  size = 300 
}) => {
  const center = size / 2;
  const radius = (size * 0.35);
  const angleStep = (2 * Math.PI) / data.length;
  const generatePolygonPoints = (values: number[]) => {
    return values.map((value, index) => {
      const angle = index * angleStep - Math.PI / 2; // Начинаем сверху
      const normalizedValue = value / 100; // Нормализуем до 0-1
      const pointRadius = radius * normalizedValue;
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };
  const generateGridLines = () => {
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    return gridLevels.map((level, levelIndex) => {
      const points = data.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const pointRadius = radius * level;
        const x = center + pointRadius * Math.cos(angle);
        const y = center + pointRadius * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      return (
        <polygon
          key={levelIndex}
          points={points}
          fill="none"
          stroke={level === 1.0 ? "#e2e8f0" : "#f1f5f9"}
          strokeWidth={level === 1.0 ? "2" : "1"}
          opacity={0.6}
        />
      );
    });
  };
  const generateRadialLines = () => {
    return data.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="#e2e8f0"
          strokeWidth="1"
          opacity={0.6}
        />
      );
    });
  };
  const generateLabels = () => {
    return data.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius * 1.15;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      return (
        <g key={index}>
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={styles.label}
            fill="#64748b"
            fontSize="12"
            fontWeight="600"
          >
            {item.label}
          </text>
          <text
            x={x}
            y={y + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            className={styles.value}
            fill="#1a202c"
            fontSize="14"
            fontWeight="700"
          >
            {item.value}%
          </text>
        </g>
      );
    });
  };
  return (
    <div className={styles.hexagonChart}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chartContainer}>
        <svg width={size} height={size} className={styles.svg}>
          {}
          <defs>
            <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(217, 122, 108, 0.05)" />
              <stop offset="100%" stopColor="rgba(217, 122, 108, 0.02)" />
            </radialGradient>
            <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(217, 122, 108, 0.8)" />
              <stop offset="50%" stopColor="rgba(201, 106, 92, 0.6)" />
              <stop offset="100%" stopColor="rgba(234, 223, 216, 0.4)" />
            </linearGradient>
          </defs>
          {}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="url(#backgroundGradient)"
          />
          {}
          {generateGridLines()}
          {generateRadialLines()}
          {}
          <polygon
            points={generatePolygonPoints(data.map(d => d.value))}
            fill="url(#dataGradient)"
            stroke="#D97A6C"
            strokeWidth="3"
            strokeLinejoin="round"
            className={styles.dataPolygon}
          />
          {}
          {data.map((item, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const normalizedValue = item.value / 100;
            const pointRadius = radius * normalizedValue;
            const x = center + pointRadius * Math.cos(angle);
            const y = center + pointRadius * Math.sin(angle);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="6"
                fill="#D97A6C"
                stroke="white"
                strokeWidth="3"
                className={styles.dataPoint}
              />
            );
          })}
          {}
          {generateLabels()}
        </svg>
      </div>
    </div>
  );
};
export default HexagonChart;

