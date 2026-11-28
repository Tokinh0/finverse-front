import { useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import { errorText } from "../../utils/categorization";

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  /** runs the deletion; a rejection shows the API's message and keeps the dialog open */
  onConfirm: () => Promise<void>;
  onHide: () => void;
}

/** Asks before deleting something. Mount it only while it's open. */
export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onHide }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      console.error(err);
      setError(errorText(err, t.categorization.deleteFailed));
      setBusy(false);
    }
  };

  return (
    <Modal show onHide={busy ? undefined : onHide} centered aria-labelledby="cz-confirm-title">
      <Modal.Header closeButton={!busy}>
        <Modal.Title id="cz-confirm-title" as="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{body}</p>
        {error && (
          <Alert variant="danger" className="mt-3 mb-0 py-2">
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={busy}>
          {t.common.cancel}
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
