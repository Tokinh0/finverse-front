export type ChartType = "bar" | "line" | "pie";

interface Props {
  id: string;
  value: ChartType;
  onChange: (value: ChartType) => void;
}

export default function ChartTypeSelect({ id, value, onChange }: Props) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor={id} style={{ marginRight: "0.5rem" }}>
        Choose chart type:
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as ChartType)}>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
        <option value="pie">Pie</option>
      </select>
    </div>
  );
}
