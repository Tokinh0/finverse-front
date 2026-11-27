import { Form } from "react-bootstrap";
import type { Category } from "../../types";

interface Props {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "lg";
}

/** A subcategory picker grouped by category. */
export default function SubcategorySelect({ categories, value, onChange, label, disabled, size }: Props) {
  return (
    <Form.Select aria-label={label} size={size} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="" disabled>
        Pick a subcategory
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
    </Form.Select>
  );
}
