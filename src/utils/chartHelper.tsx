// Recharts types every label prop as optional.
interface CustomPieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
  fill?: string;
  fontSize?: number;
  /** Slice index, used to stagger label distance so neighbouring labels overlap less. */
  index?: number;
}

/** Pie slice label rendered outside the slice as "name (NN%)"; slices under 0.5% get no label. */
export const renderCustomPieLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  percent = 0,
  name,
  fill = "#333",
  fontSize = 14,
  index = 0,
}: CustomPieLabelProps) => {
  if (percent < 0.005) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20 + (index % 3) * 8;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={fontSize}
      fontWeight="bold"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};
