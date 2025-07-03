import React from "react";

const usedLabelPositions: { x: number; y: number }[] = [];

function isTooClose(x1: number, y1: number, x2: number, y2: number, threshold: number) {
  return Math.hypot(x1 - x2, y1 - y2) < threshold;
}

function getNonOverlappingXY(x: number, y: number, threshold = 14): { x: number; y: number } {
  const MAX_ATTEMPTS = 100;
  let attempts = 0;
  let offset = 0;

  while (
    usedLabelPositions.some(p => isTooClose(p.x, p.y, x, y, threshold)) &&
    attempts < MAX_ATTEMPTS
  ) {
    offset += threshold;
    const angle = (attempts % 2 === 0 ? 1 : -1) * Math.PI / 6; // Alternate ±30°
    x += offset * Math.cos(angle);
    y += offset * Math.sin(angle);
    attempts++;
  }

  usedLabelPositions.push({ x, y });
  return { x, y };
}

interface CustomPieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  name: string;
  fill?: string;
  fontSize?: number;
  index?: number; // ← pass this to help offset per slice
}

export const renderCustomPieLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  fill = "#333",
  fontSize = 14,
  index = 0,
}: CustomPieLabelProps) => {
  if (percent < 0.005) return null; // too small to label clearly

  const RADIAN = Math.PI / 180;
  const baseRadius = outerRadius + 20 + (index % 3) * 8; // spread by index

  const x = cx + baseRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + baseRadius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={fontSize}
      fontWeight={"bold"}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};
