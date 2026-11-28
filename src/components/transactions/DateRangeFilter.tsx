import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import { formatMonth } from "../../utils/dates";
import { DATE_PRESETS, rangeChoice, rangeForChoice, type DateRange } from "../../utils/transactionFilters";

interface Props {
  range: DateRange;
  /** Months that have transactions ("YYYY-MM", newest first), offered as quick choices. */
  months: string[];
  /** The first and last transaction dates, to bound the date pickers. */
  min?: string | null;
  max?: string | null;
  onChange: (range: DateRange) => void;
  /** For tests: what "this month" means. */
  today?: Date;
}

/** A date range: a quick choice (presets and each month with data) plus From / To date pickers. */
export default function DateRangeFilter({ range, months, min, max, onChange, today }: Props) {
  const { t } = useI18n();
  const tx = t.transactions;
  const choice = rangeChoice(range, months, today);

  const choose = (value: string) => {
    const next = rangeForChoice(value, today);
    if (next) onChange(next);
  };

  return (
    <fieldset>
      <legend className="visually-hidden">{tx.dates}</legend>
      <Row className="g-2">
        <Col xs={12} sm={4}>
          <Form.Select aria-label={tx.quickRange} value={choice} onChange={(e) => choose(e.target.value)}>
            <option value="">{tx.allDates}</option>
            {DATE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {tx.presets[preset]}
              </option>
            ))}
            {months.length > 0 && (
              <optgroup label={tx.monthsGroup}>
                {months.map((month) => (
                  <option key={month} value={`month:${month}`}>
                    {formatMonth(month)}
                  </option>
                ))}
              </optgroup>
            )}
            {choice === "custom" && <option value="custom">{tx.customRange}</option>}
          </Form.Select>
        </Col>
        <Col xs={12} sm={4}>
          <InputGroup>
            <InputGroup.Text>{tx.from}</InputGroup.Text>
            <Form.Control
              type="date"
              aria-label={tx.from}
              title={tx.from}
              value={range.from}
              min={min ?? undefined}
              max={range.to || max || undefined}
              onChange={(e) => onChange({ ...range, from: e.target.value })}
            />
          </InputGroup>
        </Col>
        <Col xs={12} sm={4}>
          <InputGroup>
            <InputGroup.Text>{tx.to}</InputGroup.Text>
            <Form.Control
              type="date"
              aria-label={tx.to}
              title={tx.to}
              value={range.to}
              min={range.from || min || undefined}
              max={max ?? undefined}
              onChange={(e) => onChange({ ...range, to: e.target.value })}
            />
          </InputGroup>
        </Col>
      </Row>
    </fieldset>
  );
}
