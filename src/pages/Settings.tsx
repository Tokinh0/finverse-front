import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { ApiError, settingsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import { useSuggestionsSummary } from "../hooks/suggestionsSummary";
import type { ClaudeSettings } from "../types";

const MODEL_OPTIONS = [
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5 — cheapest, good for this job (default)" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 — more careful, ~20× the cost" },
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 — most capable, ~40× the cost" },
];

const errorText = (err: unknown, fallback: string) =>
  (err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors?.join(", ") : undefined) || fallback;

export default function Settings() {
  const { refresh } = useSuggestionsSummary();
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
        setLoadError("Could not load settings.");
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
      setNotice(saved.warning ? { variant: "warning", text: saved.warning } : { variant: "success", text: "Settings saved." });
      refresh();
    } catch (err) {
      setError(errorText(err, "Could not save the settings."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove your Claude API key? Imports will use your keyword rules and history only.")) return;
    setSaving(true);
    setError(null);
    try {
      setSettings(await settingsApi.removeClaudeKey());
      setNotice({ variant: "success", text: "API key removed. Nothing is sent to Claude anymore." });
      refresh();
    } catch (err) {
      setError(errorText(err, "Could not remove the key."));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!settings) return <Loading message="Loading settings..." />;

  return (
    <Container className="mt-4 text-start" style={{ maxWidth: 760 }}>
      <h2 className="mb-3">Settings</h2>

      <Card>
        <Card.Body className="d-grid gap-3">
          <div>
            <Card.Title className="mb-1">Claude categorization suggestions</Card.Title>
            <Card.Text className="text-muted mb-0">
              With your own Claude API key, each import gets suggestions for what your keyword rules couldn't categorize, plus
              ideas for new or better rules. Suggestions never change anything until you accept them.
            </Card.Text>
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
                <strong>Key saved:</strong> <code>{settings.masked_key}</code>
              </>
            ) : (
              <span className="text-muted">No API key saved. Imports use your keyword rules and your own history only.</span>
            )}
          </div>

          <Form onSubmit={save} className="d-grid gap-3">
            <Form.Group controlId="claude-api-key">
              <Form.Label>{settings.configured ? "Replace API key" : "API key"}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="off"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
              />
              <Form.Text>
                It's checked with Anthropic, stored encrypted and never shown again (only the masked form above).
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="claude-model">
              <Form.Label>Model</Form.Label>
              <Form.Select value={model} onChange={(e) => setModel(e.target.value)} disabled={saving}>
                {MODEL_OPTIONS.some((o) => o.value === model) ? null : <option value={model}>{model}</option>}
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="dark" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              {settings.configured && (
                <Button variant="outline-danger" onClick={remove} disabled={saving}>
                  Remove key
                </Button>
              )}
            </div>
          </Form>

          <Alert variant="light" className="border mb-0 small">
            <strong>What is sent to Claude.</strong> Saving a key is your opt-in. After each import, only transactions your
            rules and your history couldn't place are sent, usually in a single request:
            <ul className="mb-1 mt-1">
              <li>
                each merchant's description, with long numbers (CPF, CNPJ, PIX keys, account numbers) replaced by <code>#</code>
              </li>
              <li>how many times it appears, its average amount, debit or credit, and card or checking account</li>
              <li>your category and subcategory names, your keyword rules, and a few past transactions you categorized</li>
              <li>the reasons you wrote when re-categorizing transactions (long numbers removed)</li>
            </ul>
            No dates, balances, totals or statement files are sent. Without a key, nothing leaves Finverse.
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
}
