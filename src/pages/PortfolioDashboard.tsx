"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import {
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { API_BASE_URL } from "../constants/env"
import AssetFormModal from "../components/assets/AssetFormModal"
import { formatCurrency } from "../utils/formatter"
import { useAppSelector } from "../store/hooks"

type SnackbarInfo = { open: boolean; message: string; severity: 'success' | 'error' }

type Mode = 'create' | 'edit'

// Dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#111827', paper: '#1f2937' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
  },
})

// Static filter categories
const FILTER_CATEGORIES = [
  'Todos',
  'Ações Internacionais',
  'Ações Nacionais',
  'Fundos Imobiliários',
  'REITs',
  'Criptomoedas',
  'Renda Fixa',
  'Renda Fixa Internacional',
  'Reserva',
] as const


export default function PortfolioDashboardMUI() {
  // State
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([])
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_CATEGORIES[number]>('Todos')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<Mode>('create')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarInfo>({ open: false, message: '', severity: 'success' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null)
  const showTotals = useAppSelector((s) => s.ui.showTotals);
  
  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/portfolio_dashboard`)
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        setAssets(data.assets)
        setPortfolioData(data.portfolioData)
      } catch (err) {
        console.error(err)
        setSnackbar({ open: true, message: 'Erro ao carregar dados.', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtered lists
  const filteredAssets = useMemo(
    () =>
      assets.filter(
        a => activeFilter === 'Todos' || a.asset_type === activeFilter
      ),
    [assets, activeFilter]
  )

  const filteredPortfolio = useMemo(
    () =>
      portfolioData.filter(
        p => activeFilter === 'Todos' || p.name === activeFilter
      ),
    [portfolioData, activeFilter]
  )

  // Total value
  const totalValue = useMemo(
    () => filteredPortfolio.reduce((sum, item) => sum + item.value, 0),
    [filteredPortfolio]
  )

  // Handlers
  const handleAddAsset = useCallback(() => {
    setModalMode('create')
    setSelectedAsset(null)
    setModalOpen(true)
  }, [])

  const handleEditAsset = useCallback((asset: Asset) => {
    setModalMode('edit')
    setSelectedAsset(asset)
    setModalOpen(true)
  }, [])

  const handleSaveAsset = useCallback(
    async (assetData: Omit<Asset, 'id' | 'percent_by_type' | 'rating' | 'quantity'> & { asset_type: string }) => {
      const payload = { ...assetData, category: assetData.asset_type }
      setLoading(true)
      try {
        const url =
          modalMode === 'create'
            ? `${API_BASE_URL}/api/v1/assets`
            : `${API_BASE_URL}/api/v1/assets/${selectedAsset?.id}`
        const method = modalMode === 'create' ? 'POST' : 'PATCH'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(res.statusText)
        const saved: Asset = await res.json()
        setAssets(prev =>
          modalMode === 'create'
            ? [...prev, saved]
            : prev.map(a => (a.id === saved.id ? saved : a))
        )
        setSnackbar({
          open: true,
          message:
            modalMode === 'create'
              ? 'Ativo adicionado com sucesso!'
              : 'Ativo atualizado com sucesso!',
          severity: 'success',
        })
      } catch (err: any) {
        console.error(err)
        setSnackbar({ open: true, message: err.message, severity: 'error' })
      } finally {
        setLoading(false)
        setModalOpen(false)
      }
    },
    [modalMode, selectedAsset]
  )

  const handleDelete = useCallback(async () => {
    if (!assetToDelete) return
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/assets/${assetToDelete}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error(res.statusText)
      setAssets(prev => prev.filter(a => a.id !== assetToDelete))
      setSnackbar({ open: true, message: 'Ativo excluído com sucesso!', severity: 'success' })
    } catch (err: any) {
      console.error(err)
      setSnackbar({ open: true, message: err.message, severity: 'error' })
    } finally {
      setLoading(false)
      setConfirmOpen(false)
      setAssetToDelete(null)
    }
  }, [assetToDelete])

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  // Render loading state
  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ p: 3 }}>
          <Typography>Carregando...</Typography>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        {/* Header with filter chips and add button */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {FILTER_CATEGORIES.map(cat => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setActiveFilter(cat)}
                color={activeFilter === cat ? 'primary' : 'default'}
                clickable
              />
            ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}            
            onClick={handleAddAsset}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Adicionar ativo
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Assets Table */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Lista de Ativos
                </Typography>
                <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#eab308' }}>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Ticker</TableCell>
                        <TableCell>Valor atual</TableCell>
                        <TableCell>% p/tipo</TableCell>
                        <TableCell>Nota</TableCell>
                        <TableCell>Quantidade</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAssets.map(asset => (
                        <TableRow key={asset.id} hover>
                          <TableCell>
                            <Chip label={asset.asset_type} size="small" sx={{ backgroundColor: asset.color_code }} />
                          </TableCell>
                          <TableCell>{asset.description}</TableCell>
                          <TableCell>{asset.ticker}</TableCell>
                          <TableCell fontWeight="bold" color="success.main">
                            {showTotals && formatCurrency(asset.current_value)}
                          </TableCell>
                          <TableCell>{asset.percent_by_type}</TableCell>
                          <TableCell>{asset.rating}</TableCell>
                          <TableCell>{asset.quantity}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              onClick={() => handleEditAsset(asset)}
                              startIcon={<EditIcon />}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                setAssetToDelete(asset.id)
                                setConfirmOpen(true)
                              }}
                              startIcon={<DeleteIcon />}
                              sx={{ ml: 1 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Portfolio Chart */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: 'background.paper', minWidth: '20rem' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Carteira
                </Typography>

                <Box sx={{ position: 'relative', mb: 3, height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={filteredPortfolio.filter(p => p.value > 0)}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        cx="50%"
                        cy="50%"
                      >
                        {filteredPortfolio.filter(p => p.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {showTotals && formatCurrency(totalValue)}
                    </Typography>
                  </Box>
                </Box>

                {/* Legend */}
                <Box>
                  {filteredPortfolio.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.percentage}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Modals and Snackbars */}
        <AssetFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveAsset}
          asset={selectedAsset}
          mode={modalMode}
        />

        <Dialog open={confirmOpen} onClose={() => { if (!loading) handleDelete() }}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            Você tem certeza que deseja excluir este ativo?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}
