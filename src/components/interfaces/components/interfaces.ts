interface PortfolioData {
  name: string
  value: number
  percentage: string
  color: string
}

interface AssetModalProps {
  open: boolean
  onClose: () => void
  onSave: (asset: Asset) => void
  asset?: Asset | null
  mode: "create" | "edit"
}
