import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { AssetParams } from "../../api";
import type { Asset, AssetTypes } from "../../types";
import { parseAmount } from "../../utils/formatter";
import { EMPTY_ASSET_FORM as EMPTY_FORM, validateAsset, type AssetFormErrors as FormErrors, type AssetFormValues as FormValues } from "./assetForm";
import { useI18n } from "../../i18n/context";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (asset: AssetParams) => void;
  asset?: Asset | null;
  mode: "create" | "edit";
  /** enum key => label; a "Todos" filter entry is ignored */
  assetTypes: AssetTypes;
}

export default function AssetFormModal({ open, onClose, onSave, asset, mode, assetTypes }: Props) {
  const { t } = useI18n();
  const f = t.assetForm;
  const [formData, setFormData] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormData(
      asset && mode === "edit"
        ? {
            ticker: asset.ticker ?? "",
            asset_type: asset.asset_type ?? "",
            description: asset.description ?? "",
            current_value: String(asset.current_value ?? ""),
            rating: asset.rating,
            quantity: asset.quantity,
          }
        : EMPTY_FORM
    );
    setErrors({});
  }, [asset, mode, open]);

  const handleInputChange = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = () => {
    const newErrors = validateAsset(formData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSave({ ...formData, current_value: parseAmount(formData.current_value) });
    onClose();
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const typeOptions = Object.entries(assetTypes).filter(([key]) => key !== "Todos");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { bgcolor: "background.paper", color: "text.primary" } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" component="span">
          {mode === "create" ? f.newTitle : f.editTitle}
        </Typography>
        <Button onClick={handleClose} sx={{ minWidth: "auto", p: 1 }} color="inherit" aria-label={f.close}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label={f.ticker}
            value={formData.ticker}
            onChange={(e) => handleInputChange("ticker", e.target.value)}
            fullWidth
            placeholder={f.tickerPlaceholder}
          />

          <FormControl fullWidth error={!!errors.asset_type}>
            <InputLabel id="asset-type-label">{f.type}</InputLabel>
            <Select
              labelId="asset-type-label"
              value={formData.asset_type}
              onChange={(e) => handleInputChange("asset_type", e.target.value)}
              label={f.type}
            >
              {typeOptions.map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {t.portfolio.types[key] ?? value}
                </MenuItem>
              ))}
            </Select>
            {errors.asset_type && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.asset_type}
              </Typography>
            )}
          </FormControl>

          <TextField
            label={f.description}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            fullWidth
            multiline
            rows={3}
            placeholder={f.descriptionPlaceholder}
          />

          <TextField
            label={f.currentValue}
            value={formData.current_value}
            onChange={(e) => handleInputChange("current_value", e.target.value)}
            error={!!errors.current_value}
            helperText={errors.current_value}
            fullWidth
            placeholder="0,00"
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
          />

          <TextField
            label={f.rating}
            type="number"
            value={formData.rating}
            onChange={(e) => handleInputChange("rating", Number.parseInt(e.target.value) || 1)}
            error={!!errors.rating}
            helperText={errors.rating || f.ratingHelp}
            fullWidth
            inputProps={{ min: 1, max: 10, step: 1 }}
          />

          <TextField
            label={f.quantity}
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", Number.parseFloat(e.target.value) || 0)}
            error={!!errors.quantity}
            helperText={errors.quantity}
            fullWidth
            inputProps={{ min: 0, step: 0.000001 }}
            placeholder="0.000000"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} color="inherit">
          {t.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ backgroundColor: "#eab308", color: "#000000", "&:hover": { backgroundColor: "#d97706" } }}
        >
          {mode === "create" ? f.add : t.common.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
