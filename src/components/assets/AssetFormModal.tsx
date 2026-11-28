import { FormEvent, useState } from "react";
import { Alert, Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import type { AssetParams } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Asset, AssetTypes } from "../../types";
import { parseAmount } from "../../utils/formatter";
import { EMPTY_ASSET_FORM, validateAsset, type AssetFormErrors, type AssetFormValues } from "./assetForm";

interface Props {
  /** the asset to edit, or null to add one */
  asset: Asset | null;
  /** enum key => label; a "Todos" filter entry is ignored */
  assetTypes: AssetTypes;
  /** saves the asset; a rejection keeps the dialog open with `errorText` */
  onSave: (asset: AssetParams) => Promise<void>;
  onClose: () => void;
  /** message shown when onSave rejects */
  errorText: string;
}

const valuesOf = (asset: Asset | null): AssetFormValues =>
  asset
    ? {
        ticker: asset.ticker ?? "",
        asset_type: asset.asset_type ?? "",
        description: asset.description ?? "",
        current_value: asset.current_value == null ? "" : String(asset.current_value).replace(".", ","),
        rating: asset.rating,
        quantity: asset.quantity,
      }
    : EMPTY_ASSET_FORM;

/** Adds or edits an asset. Mount it only while it's open, so it starts from `asset`. */
export default function AssetFormModal({ asset, assetTypes, onSave, onClose, errorText }: Props) {
  const { t } = useI18n();
  const f = t.assetForm;
  const [values, setValues] = useState<AssetFormValues>(() => valuesOf(asset));
  const [errors, setErrors] = useState<AssetFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const set = <K extends keyof AssetFormValues>(field: K, value: AssetFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateAsset(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSave({ ...values, current_value: parseAmount(values.current_value) });
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const typeOptions = Object.entries(assetTypes).filter(([key]) => key !== "Todos");

  return (
    <Modal show onHide={saving ? undefined : onClose} backdrop={saving ? "static" : true} centered aria-labelledby="asset-form-title">
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton={!saving} closeLabel={f.close}>
          <Modal.Title id="asset-form-title">{asset ? f.editTitle : f.newTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {failed && (
            <Alert variant="danger" className="py-2 mb-0">
              {errorText}
            </Alert>
          )}
          <Row className="g-3">
            <Col sm={5}>
              <Form.Group controlId="asset-ticker">
                <Form.Label>{f.ticker}</Form.Label>
                <Form.Control value={values.ticker} placeholder={f.tickerPlaceholder} onChange={(e) => set("ticker", e.target.value)} disabled={saving} autoFocus />
              </Form.Group>
            </Col>
            <Col sm={7}>
              <Form.Group controlId="asset-type">
                <Form.Label>{f.type}</Form.Label>
                <Form.Select value={values.asset_type} onChange={(e) => set("asset_type", e.target.value)} isInvalid={!!errors.asset_type} disabled={saving}>
                  <option value="" disabled>
                    {f.type}
                  </option>
                  {typeOptions.map(([key, label]) => (
                    <option key={key} value={key}>
                      {t.portfolio.types[key] ?? label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.asset_type}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="asset-description">
            <Form.Label>{f.description}</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={values.description}
              placeholder={f.descriptionPlaceholder}
              onChange={(e) => set("description", e.target.value)}
              isInvalid={!!errors.description}
              disabled={saving}
            />
            <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
          </Form.Group>

          <Row className="g-3">
            <Col sm={6}>
              <Form.Group controlId="asset-value">
                <Form.Label>{f.currentValue}</Form.Label>
                <InputGroup hasValidation>
                  <InputGroup.Text>R$</InputGroup.Text>
                  <Form.Control
                    inputMode="decimal"
                    placeholder="0,00"
                    value={values.current_value}
                    onChange={(e) => set("current_value", e.target.value)}
                    isInvalid={!!errors.current_value}
                    disabled={saving}
                  />
                  <Form.Control.Feedback type="invalid">{errors.current_value}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group controlId="asset-quantity">
                <Form.Label>{f.quantity}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step="any"
                  value={values.quantity}
                  onChange={(e) => set("quantity", Number.parseFloat(e.target.value) || 0)}
                  isInvalid={!!errors.quantity}
                  disabled={saving}
                />
                <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="asset-rating">
            <Form.Label className="d-flex justify-content-between">
              <span>{f.rating}</span>
              <strong>{t.portfolio.ratingOf(values.rating)}</strong>
            </Form.Label>
            <Form.Range min={1} max={10} step={1} value={values.rating} onChange={(e) => set("rating", Number(e.target.value))} disabled={saving} />
            <Form.Text className={errors.rating ? "text-danger" : undefined}>{errors.rating ?? f.ratingHelp}</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={saving}>
            {saving ? t.common.saving : asset ? t.common.save : f.add}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
