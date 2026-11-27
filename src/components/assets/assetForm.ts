import type { AssetParams } from "../../api";
import { messages } from "../../i18n/locale";
import { parseAmount } from "../../utils/formatter";

export type AssetFormValues = Omit<AssetParams, "current_value"> & { current_value: string };
export type AssetFormErrors = Partial<Record<keyof AssetFormValues, string>>;

export const EMPTY_ASSET_FORM: AssetFormValues = { ticker: "", asset_type: "", description: "", current_value: "", rating: 1, quantity: 0 };

export function validateAsset(values: AssetFormValues): AssetFormErrors {
  const errors: AssetFormErrors = {};
  const t = messages().assetForm.errors;
  if (!values.asset_type) errors.asset_type = t.typeRequired;
  if (!values.description.trim()) errors.description = t.descriptionRequired;
  if (!values.current_value.trim()) errors.current_value = t.valueRequired;
  else if (Number.isNaN(parseAmount(values.current_value))) errors.current_value = t.valueInvalid;
  if (values.rating < 1 || values.rating > 10) errors.rating = t.ratingRange;
  if (values.quantity <= 0) errors.quantity = t.quantityPositive;
  return errors;
}
