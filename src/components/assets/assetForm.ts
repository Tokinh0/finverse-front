import type { AssetParams } from "../../api";
import { parseAmount } from "../../utils/formatter";

export type AssetFormValues = Omit<AssetParams, "current_value"> & { current_value: string };
export type AssetFormErrors = Partial<Record<keyof AssetFormValues, string>>;

export const EMPTY_ASSET_FORM: AssetFormValues = { ticker: "", asset_type: "", description: "", current_value: "", rating: 1, quantity: 0 };

export function validateAsset(values: AssetFormValues): AssetFormErrors {
  const errors: AssetFormErrors = {};
  if (!values.asset_type) errors.asset_type = "Tipo de ativo é obrigatório";
  if (!values.description.trim()) errors.description = "Descrição é obrigatória";
  if (!values.current_value.trim()) errors.current_value = "Valor atual é obrigatório";
  else if (Number.isNaN(parseAmount(values.current_value))) errors.current_value = "Valor inválido";
  if (values.rating < 1 || values.rating > 10) errors.rating = "Nota deve ser entre 1 e 10";
  if (values.quantity <= 0) errors.quantity = "Quantidade deve ser maior que 0";
  return errors;
}
