"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  InputAdornment,
} from "@mui/material"
import { Close as CloseIcon } from "@mui/icons-material"

const assetTypes = [
  "Ações Internacionais",
  "Ações Nacionais",
  "Fundos Imobiliários",
  "REITs",
  "Criptomoedas",
  "Renda Fixa",
  "Renda Fixa Internacional",
  "Reserva",
]

export default function AssetFormModal({ open, onClose, onSave, asset, mode }: AssetModalProps) {
  const [formData, setFormData] = useState<Asset>({
    ticker: "",
    asset_type: "",
    description: "",
    current_value: "",
    rating: 1,
    quantity: 0,
  })

  const [errors, setErrors] = useState<Partial<Asset>>({})

  useEffect(() => {
    if (asset && mode === "edit") {
      setFormData({
        id: asset.id,
        ticker: asset.ticker,
        asset_type: asset.asset_type,
        description: asset.description,
        current_value: asset.current_value,
        rating: asset.rating,
        quantity: asset.quantity,
      })
    } else {
      setFormData({
        ticker: "",
        asset_type: "",
        description: "",
        current_value: "",
        rating: 1,
        quantity: 0,
      })
    }
    setErrors({})
  }, [asset, mode, open])

  const handleInputChange = (field: keyof Asset, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const handleCurrencyChange = (value: string) => {
    handleInputChange("current_value", value)
  }

  const validateForm = () => {
    const newErrors: Partial<Asset> = {}

    if (!formData.asset_type) {
      newErrors.asset_type = "Tipo de ativo é obrigatório"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória"
    }

    if (!formData.current_value.trim()) {
      newErrors.current_value = "Valor atual é obrigatório"
    }

    if (formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = "Nota deve ser entre 1 e 10"
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
      ticker: "",
      asset_type: "",
      description: "",
      current_value: "",
      rating: 1,
      quantity: 0,
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          color: "text.primary",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">{mode === "create" ? "Adicionar Novo Ativo" : "Editar Ativo"}</Typography>
        <Button onClick={handleClose} sx={{ minWidth: "auto", p: 1 }} color="inherit">
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          {/* Ticker */}
          <TextField
            label="Ticker"
            value={formData.ticker}
            onChange={(e) => handleInputChange("ticker", e.target.value)}
            error={!!errors.ticker}
            helperText={errors.ticker}
            fullWidth
            placeholder="Ex: AAPL, PETR4, BTC"
          />

          {/* Asset Type */}
          <FormControl fullWidth error={!!errors.asset_type}>
            <InputLabel>Tipo de Ativo</InputLabel>
            <Select
              value={formData.asset_type}
              onChange={(e) => handleInputChange("asset_type", e.target.value)}
              label="Tipo de Ativo"
            >
              {assetTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {errors.asset_type && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.asset_type}
              </Typography>
            )}
          </FormControl>

          {/* Description */}
          <TextField
            label="Descrição"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva o ativo..."
          />

          {/* Current Value */}
          <TextField
            label="Valor Atual"
            value={formData.current_value}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            error={!!errors.current_value}
            helperText={errors.current_value}
            fullWidth
            placeholder="0,00"
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />

          {/* Rating */}
          <TextField
            label="Nota"
            type="number"
            value={formData.rating}
            onChange={(e) => handleInputChange("rating", Number.parseInt(e.target.value) || 1)}
            error={!!errors.rating}
            helperText={errors.rating || "Nota de 1 a 10"}
            fullWidth
            inputProps={{ min: 1, max: 10, step: 1 }}
          />

          {/* Quantity */}
          <TextField
            label="Quantidade"
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
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: "#eab308",
            color: "#000000",
            "&:hover": { backgroundColor: "#d97706" },
          }}
        >
          {mode === "create" ? "Adicionar" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
