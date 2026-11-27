import { useCallback, useEffect, useMemo, useState } from "react"
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
import { assetsApi, type AssetParams } from "../api"
import AssetFormModal from "../components/assets/AssetFormModal"
import type { Asset, AssetTypes, PortfolioSlice } from "../types"
import { formatCurrency } from "../utils/formatter"
import { useI18n } from '../i18n/context'
import { messages } from '../i18n/locale'

type SnackbarInfo = { open: boolean; message: string; severity: 'success' | 'error' }

type Mode = 'create' | 'edit'

// Dark theme
const ALL = 'Todos'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#111827', paper: '#1f2937' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
  },
})

interface Props {
  showTotals: boolean
}

export default function PortfolioDashboard({ showTotals }: Props) {
  // State
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolioData, setPortfolioData] = useState<PortfolioSlice[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetTypes>({})
  const [activeFilter, setActiveFilter] = useState<string>(ALL)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<Mode>('create')
  const { t } = useI18n()
  const pf = t.portfolio
  const typeLabel = (key: string) => pf.types[key] ?? assetTypes[key] ?? key
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarInfo>({ open: false, message: '', severity: 'success' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await assetsApi.dashboard()
        setAssets(data.assets)
        setPortfolioData(data.portfolioData)
        setAssetTypes(data.asset_types)
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
        a => activeFilter === ALL || a.asset_type === activeFilter
      ),
    [assets, activeFilter]
  )

  const filteredPortfolio = useMemo(
    () =>
      portfolioData.filter(
        p => activeFilter === ALL || p.name === activeFilter
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
    async (assetData: AssetParams) => {
      setLoading(true)
      try {
        const saved =
          modalMode === 'edit' && selectedAsset
            ? await assetsApi.update(selectedAsset.id, assetData)
            : await assetsApi.create(assetData)
        setAssets(prev =>
          modalMode === 'create'
            ? [...prev, saved]
            : prev.map(a => (a.id === saved.id ? saved : a))
        )
        setSnackbar({
          open: true,
          message:
            modalMode === 'create'
              ? messages().portfolio.added
              : messages().portfolio.updated,
          severity: 'success',
        })
      } catch (err) {
        console.error(err)
        setSnackbar({ open: true, message: messages().portfolio.saveError, severity: 'error' })
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
      await assetsApi.remove(assetToDelete)
      setAssets(prev => prev.filter(a => a.id !== assetToDelete))
      setSnackbar({ open: true, message: messages().portfolio.deleted, severity: 'success' })
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: messages().portfolio.deleteError, severity: 'error' })
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
          <Typography>{pf.loading}</Typography>
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
            {[ALL, ...Object.keys(assetTypes)].map((key) => (
              <Chip
                key={key}
                label={key === ALL ? pf.all : typeLabel(key)}
                onClick={() => setActiveFilter(key)}
                color={activeFilter === key ? 'primary' : 'default'}
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
            {pf.addAsset}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Assets Table */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {pf.assetList}
                </Typography>
                <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#eab308' }}>
                        <TableCell>{pf.columns.type}</TableCell>
                        <TableCell>{pf.columns.description}</TableCell>
                        <TableCell>{pf.columns.ticker}</TableCell>
                        <TableCell>{pf.columns.currentValue}</TableCell>
                        <TableCell>{pf.columns.sharePerType}</TableCell>
                        <TableCell>{pf.columns.rating}</TableCell>
                        <TableCell>{pf.columns.quantity}</TableCell>
                        <TableCell align="center">{pf.columns.actions}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAssets.map(asset => (
                        <TableRow key={asset.id} hover>
                          <TableCell>
                            <Chip label={typeLabel(asset.asset_type)} size="small" sx={{ backgroundColor: asset.color_code ?? undefined }} />
                          </TableCell>
                          <TableCell>{asset.description}</TableCell>
                          <TableCell>{asset.ticker}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
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
                              aria-label={pf.edit(asset.ticker)}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                setAssetToDelete(asset.id)
                                setConfirmOpen(true)
                              }}
                              startIcon={<DeleteIcon />}
                              aria-label={pf.remove(asset.ticker)}
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
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ bgcolor: 'background.paper', minWidth: '20rem' }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {pf.portfolio}
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
                          <Cell key={i} fill={entry.color ?? undefined} />
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
                          {typeLabel(item.name)}
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
          assetTypes={assetTypes}
        />

        <Dialog open={confirmOpen} onClose={() => { if (!loading) setConfirmOpen(false) }}>
          <DialogTitle>{pf.confirmDeleteTitle}</DialogTitle>
          <DialogContent>{pf.confirmDelete}</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? pf.deleting : t.common.delete}
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
