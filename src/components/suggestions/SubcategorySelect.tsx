import { Form } from "react-bootstrap";
import type { Category } from "../../types";
import { useI18n } from "../../i18n/context";

interface Props {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "lg";
  /** adds a "+ New subcategory…" option; the callback creates one and selects it */
  onCreateNew?: () => void;
}

const CREATE_NEW = "__create__";

/** A subcategory picker grouped by category. */
export default function SubcategorySelect({ categories, value, onChange, label, disabled, size, onCreateNew }: Props) {
  const s = useI18n().t.suggestions.subcategorySelect;
  return (
    <Form.Select
      aria-label={label}
      size={size}
      value={value}
      onChange={(e) => (e.target.value === CREATE_NEW ? onCreateNew?.() : onChange(e.target.value))}
      disabled={disabled}
    >
      <option value="" disabled>
        {s.pick}
      </option>
      {categories.map((category) => (
        <optgroup key={category.id} label={category.name}>
          {category.subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </optgroup>
      ))}
      {onCreateNew && <option value={CREATE_NEW}>{s.createNew}</option>}
    </Form.Select>
  );
}
