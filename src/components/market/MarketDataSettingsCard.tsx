import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { settingsApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { MarketSettings } from "../../types";

/** Settings: the account's brapi.dev token (B3 stocks, FIIs and Ibovespa). Only its masked form comes back. */
export default function MarketDataSettingsCard() {
  const { t } = useI18n();
  const s = t.settings.market;
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ variant: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    settingsApi
      .market()
      .then(setSettings)
      .catch((err) => {
        console.error(err);
        setNotice({ variant: "danger", text: s.saveError });
      });
  }, [s.saveError]);

  const run = async (action: () => Promise<MarketSettings>, success: string) => {
    setSaving(true);
    setNotice(null);
    try {
      setSettings(await action());
      setToken("");
      setNotice({ variant: "success", text: success });
    } catch (err) {
      console.error(err);
      setNotice({ variant: "danger", text: s.saveError });
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = token.trim();
    if (value) run(() => settingsApi.updateMarket({ brapi_token: value }), s.savedNotice);
  };

  const remove = () => {
    if (window.confirm(s.confirmRemove)) run(() => settingsApi.removeBrapiToken(), s.removedNotice);
  };

  const configured = settings?.brapi_configured ?? false;

  return (
    <Card className="mb-3">
      <Card.Body className="d-grid gap-2">
        <Card.Title className="mb-0">{s.title}</Card.Title>
        <Card.Text className="text-muted mb-0">{s.description}</Card.Text>
        {notice && (
          <Alert variant={notice.variant} className="mb-0 py-2">
            {notice.text}
          </Alert>
        )}
        {settings && (
          <p className="mb-0 small" data-testid="brapi-status">
            {configured && settings.masked_brapi_token
              ? s.saved(settings.masked_brapi_token)
              : settings.brapi_from_env
                ? s.fromEnv
                : s.none}
          </p>
        )}
        <Form onSubmit={submit} className="d-grid gap-2">
          <Form.Group controlId="brapi-token" style={{ maxWidth: 420 }}>
            <Form.Label>{configured ? s.replace : s.label}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={saving}
            />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving || !token.trim()}>
              {s.save}
            </Button>
            {configured && (
              <Button variant="outline-danger" onClick={remove} disabled={saving}>
                {s.remove}
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
