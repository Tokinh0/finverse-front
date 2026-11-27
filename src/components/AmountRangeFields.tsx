import { Form, InputGroup } from "react-bootstrap";
import { useI18n } from "../i18n/context";

interface Props {
  idPrefix: string;
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  disabled?: boolean;
  size?: "sm";
}

/** Optional amount range for a keyword rule: blank on both sides = any amount. */
export default function AmountRangeFields({ idPrefix, min, max, onChange, disabled, size }: Props) {
  const t = useI18n().t.amountRange;
  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className={size === "sm" ? "small" : undefined}>{t.onlyFor}</span>
        <InputGroup size={size} style={{ width: 170 }}>
          <InputGroup.Text>{t.from}</InputGroup.Text>
          <Form.Control
            id={`${idPrefix}-min`}
            aria-label={t.minimum}
            inputMode="decimal"
            placeholder={t.any}
            value={min}
            onChange={(e) => onChange(e.target.value, max)}
            disabled={disabled}
          />
        </InputGroup>
        <InputGroup size={size} style={{ width: 170 }}>
          <InputGroup.Text>{t.to}</InputGroup.Text>
          <Form.Control
            id={`${idPrefix}-max`}
            aria-label={t.maximum}
            inputMode="decimal"
            placeholder={t.any}
            value={max}
            onChange={(e) => onChange(min, e.target.value)}
            disabled={disabled}
          />
        </InputGroup>
      </div>
      <Form.Text>{t.help}</Form.Text>
    </div>
  );
}
