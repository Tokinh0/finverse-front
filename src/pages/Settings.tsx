import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { ApiError, settingsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import { useSuggestionsSummary } from "../hooks/suggestionsSummary";
import { useI18n } from "../i18n/context";
import { LOCALES, isLocale, messages } from "../i18n/locale";
import type { ClaudeSettings } from "../types";

const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];

const errorText = (err: unknown, fallback: string) =>
  (err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors?.join(", ") : undefined) || fallback;

/** The app's language: saved on the API, so its messages and Claude's reasons follow it too. */
function LanguageCard() {
  const { t, locale, setLocale } = useI18n();
  const l = t.settings.language;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (value: string) => {
    if (!isLocale(value) || value === locale) return;
    setSaving(true);
    setError(null);
    try {
      await setLocale(value);
    } catch (err) {
      console.error(err);
      setError(l.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body className="d-grid gap-2">
        <Card.Title className="mb-0">{l.title}</Card.Title>
        <Card.Text className="text-muted mb-0">{l.description}</Card.Text>
        {error && (
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        )}
        <Form.Group controlId="app-language" style={{ maxWidth: 320 }}>
          <Form.Label>{l.label}</Form.Label>
          <Form.Select value={locale} onChange={(e) => change(e.target.value)} disabled={saving}>
            {LOCALES.map((value) => (
              <option key={value} value={value} lang={value}>
                {l.names[value]}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Card.Body>
    </Card>
  );
}

export default function Settings() {
  const { refresh } = useSuggestionsSummary();
  const { t } = useI18n();
  const st = t.settings;
  const c = st.claude;
  const [settings, setSettings] = useState<ClaudeSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ variant: "success" | "warning"; text: string } | null>(null);

  useEffect(() => {
    settingsApi
      .claude()
      .then((loaded) => {
        setSettings(loaded);
        setModel(loaded.model);
      })
      .catch((err) => {
        console.error(err);
        setLoadError(messages().settings.loadError);
      });
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await settingsApi.updateClaude({ ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}), model });
      setSettings(saved);
      setApiKey("");
      setNotice(saved.warning ? { variant: "warning", text: saved.warning } : { variant: "success", text: st.saved });
      refresh();
    } catch (err) {
      setError(errorText(err, st.saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(c.confirmRemove)) return;
    setSaving(true);
    setError(null);
    try {
      setSettings(await settingsApi.removeClaudeKey());
      setNotice({ variant: "success", text: c.removed });
      refresh();
    } catch (err) {
      setError(errorText(err, c.removeError));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!settings) return <Loading message={st.loading} />;

  return (
    <Container className="mt-4 text-start" style={{ maxWidth: 760 }}>
      <h2 className="mb-3">{st.title}</h2>

      <LanguageCard />

      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title className="mb-1">{c.title}</Card.Title>
            <Card.Text className="text-muted mb-0">{c.description}</Card.Text>
          </div>

          {notice && (
            <Alert variant={notice.variant} className="mb-0" dismissible onClose={() => setNotice(null)}>
              {notice.text}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          )}

          <div data-testid="key-status">
            {settings.configured ? (
              <>
                <strong>{c.keySaved}</strong> <code>{settings.masked_key}</code>
              </>
            ) : (
              <span className="text-muted">{c.noKey}</span>
            )}
          </div>

          <Form onSubmit={save} className="d-grid gap-3">
            <Form.Group controlId="claude-api-key">
              <Form.Label>{settings.configured ? c.replaceKey : c.apiKey}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="off"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
              />
              <Form.Text>{c.keyHelp}</Form.Text>
            </Form.Group>

            <Form.Group controlId="claude-model">
              <Form.Label>{c.model}</Form.Label>
              <Form.Select value={model} onChange={(e) => setModel(e.target.value)} disabled={saving}>
                {MODELS.includes(model) ? null : <option value={model}>{model}</option>}
                {MODELS.map((value) => (
                  <option key={value} value={value}>
                    {c.models[value]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="dark" disabled={saving}>
                {saving ? t.common.saving : t.common.save}
              </Button>
              {settings.configured && (
                <Button variant="outline-danger" onClick={remove} disabled={saving}>
                  {c.removeKey}
                </Button>
              )}
            </div>
          </Form>

          <Alert variant="light" className="border mb-0 small">
            <strong>{c.privacyTitle}</strong> {c.privacyIntro}
            <ul className="mb-1 mt-1">
              <li>
                {c.privacyDescriptionBefore} <code>#</code>
              </li>
              <li>{c.privacyCounts}</li>
              <li>{c.privacyRules}</li>
              <li>{c.privacyNotes}</li>
            </ul>
            {c.privacyOutro}
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
}
