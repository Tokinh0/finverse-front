import { Form, InputGroup } from "react-bootstrap";

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
  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className={size === "sm" ? "small" : undefined}>Only for amounts</span>
        <InputGroup size={size} style={{ width: 170 }}>
          <InputGroup.Text>from R$</InputGroup.Text>
          <Form.Control
            id={`${idPrefix}-min`}
            aria-label="Minimum amount"
            inputMode="decimal"
            placeholder="any"
            value={min}
            onChange={(e) => onChange(e.target.value, max)}
            disabled={disabled}
          />
        </InputGroup>
        <InputGroup size={size} style={{ width: 170 }}>
          <InputGroup.Text>to R$</InputGroup.Text>
          <Form.Control
            id={`${idPrefix}-max`}
            aria-label="Maximum amount"
            inputMode="decimal"
            placeholder="any"
            value={max}
            onChange={(e) => onChange(min, e.target.value)}
            disabled={disabled}
          />
        </InputGroup>
      </div>
      <Form.Text>
        Optional. Lets one keyword go to different subcategories by value, e.g. AMAZON up to R$ 99,99 → Assinatura and AMAZON from
        R$ 100 → Compras.
      </Form.Text>
    </div>
  );
}
