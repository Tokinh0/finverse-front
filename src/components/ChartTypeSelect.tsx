import { useI18n } from "../i18n/context";

export type ChartType = "bar" | "line" | "pie";

interface Props {
  id: string;
  value: ChartType;
  onChange: (value: ChartType) => void;
}

export default function ChartTypeSelect({ id, value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor={id} style={{ marginRight: "0.5rem" }}>
        {t.charts.chooseType}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as ChartType)}>
        <option value="bar">{t.charts.bar}</option>
        <option value="line">{t.charts.line}</option>
        <option value="pie">{t.charts.pie}</option>
      </select>
    </div>
  );
}
