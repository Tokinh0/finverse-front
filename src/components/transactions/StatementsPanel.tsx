import { ChangeEvent, useRef, useState } from "react";
import { Badge, Button, Card, Collapse, Form, Table } from "react-bootstrap";
import { ApiError, statementsApi } from "../../api";
import { useSuggestionsSummary } from "../../hooks/suggestionsSummary";
import { useI18n } from "../../i18n/context";
import type { MonthlyStatementPresenter } from "../../presenters/MonthlyStatementPresenter";
import { SummaryLinePresenter } from "../../presenters/SummaryLinePresenter";
import { formatIsoDate } from "../../utils/dates";
import UploadSummaryModal from "../UploadSummaryModal";

interface Props {
  /** null while loading */
  statements: MonthlyStatementPresenter[] | null;
  loadError?: string | null;
  /** The statement whose transactions are listed, if any. */
  selectedId: string | null;
  /** Show only this statement's transactions. */
  onSelect: (id: number) => void;
  /** A statement was imported or deleted: reload the statements and the transactions. */
  onChanged: (change: { deletedId?: number }) => void;
  defaultOpen?: boolean;
}

const newestFirst = (a: MonthlyStatementPresenter, b: MonthlyStatementPresenter) =>
  (b.firstDate ?? "").localeCompare(a.firstDate ?? "") || b.id - a.id;

const STATUS_BADGES: Record<string, string> = { processed: "success", failed: "danger", unprocessed: "secondary" };

/**
 * The statements part of the transactions page: import a statement, see what was imported (newest
 * first), list one statement's transactions, or delete one with its transactions.
 */
export default function StatementsPanel({ statements, loadError, selectedId, onSelect, onChanged, defaultOpen = false }: Props) {
  const { t } = useI18n();
  const st = t.statements;
  const { refresh: refreshSuggestions } = useSuggestionsSummary();
  const [open, setOpen] = useState(defaultOpen);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [summaryLines, setSummaryLines] = useState<SummaryLinePresenter[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => setNewFile(e.target.files?.[0] ?? null);

  const handleUpload = async () => {
    if (!newFile) return;
    setBusy(true);
    try {
      const uploaded = await statementsApi.upload(newFile);
      setSummaryLines(SummaryLinePresenter.parseMany(uploaded.summary_lines));
      setSuggesting(Boolean(uploaded.suggestion_run));
      setShowSummary(true);
      refreshSuggestions();
      setNewFile(null);
      if (fileInput.current) fileInput.current.value = "";
      onChanged({});
    } catch (error) {
      console.error("Upload error:", error);
      const reason = error instanceof ApiError ? (error.body as { file?: string[] } | undefined)?.file?.[0] : undefined;
      alert(reason ? st.uploadFailedWith(reason) : st.uploadFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(st.confirmDelete)) return;
    setBusy(true);
    try {
      await statementsApi.remove(id);
      refreshSuggestions();
      onChanged({ deletedId: id });
    } catch (error) {
      console.error("Delete error:", error);
      alert(st.deleteFailed);
    } finally {
      setBusy(false);
    }
  };

  const sorted = statements ? [...statements].sort(newestFirst) : [];
  const period = (s: MonthlyStatementPresenter) =>
    s.firstDate && s.lastDate ? st.period(formatIsoDate(s.firstDate), formatIsoDate(s.lastDate)) : st.unknownDate;

  return (
    <Card className="mb-3">
      <Card.Body className="py-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            variant="link"
            className="p-0 text-decoration-none text-body fw-semibold"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="statements-list"
          >
            {open ? "▾" : "▸"} {st.title}
            {statements && <span className="text-muted fw-normal"> · {st.count(statements.length)}</span>}
            <span className="visually-hidden"> ({open ? st.hide : st.show})</span>
          </Button>
          <Form onSubmit={(e) => e.preventDefault()} className="ms-auto">
            <Form.Group controlId="statement-input" className="d-flex gap-2">
              <Form.Label visuallyHidden>{st.fileLabel}</Form.Label>
              <Form.Control ref={fileInput} type="file" size="sm" accept=".csv,.pdf" onChange={handleFileChange} />
              <Button variant="dark" size="sm" className="text-nowrap" onClick={handleUpload} disabled={busy || !newFile}>
                {busy && newFile ? st.uploading : st.upload}
              </Button>
            </Form.Group>
          </Form>
        </div>

        <Collapse in={open}>
          <div id="statements-list">
            <p className="small text-muted mt-2 mb-2">{st.help}</p>
            {loadError ? (
              <p className="text-danger small mb-1">{loadError}</p>
            ) : statements && sorted.length === 0 ? (
              <p className="text-muted small mb-1">{st.empty}</p>
            ) : (
              <Table size="sm" hover responsive className="align-middle small mb-1">
                <thead>
                  <tr>
                    <th scope="col">{st.columns.filename}</th>
                    <th scope="col">{st.columns.period}</th>
                    <th scope="col" className="text-end">{st.columns.transactions}</th>
                    <th scope="col">{st.columns.status}</th>
                    <th scope="col">{st.columns.uploadedAt}</th>
                    <th scope="col" className="text-end">{st.columns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const selected = selectedId === String(s.id);
                    return (
                      <tr key={s.id} className={selected ? "table-active" : undefined} aria-current={selected || undefined}>
                        <td className="text-break">{s.filename}</td>
                        <td className="text-nowrap">{period(s)}</td>
                        <td className="text-end">{s.transactionsCount ?? "—"}</td>
                        <td>
                          <Badge bg={STATUS_BADGES[s.status ?? ""] ?? "secondary"} className="fw-normal">
                            {(s.status && st.statuses[s.status]) || s.status}
                          </Badge>
                        </td>
                        <td className="text-nowrap">{/^\d{4}-\d{2}-\d{2}$/.test(s.uploadedAt) ? formatIsoDate(s.uploadedAt) : s.uploadedAt}</td>
                        <td className="text-end text-nowrap">
                          {selected ? (
                            <Badge bg="primary" className="me-2 fw-normal">
                              {st.showing}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                              aria-label={st.showTransactionsOf(s.filename)}
                              onClick={() => onSelect(s.id)}
                            >
                              {st.showTransactions}
                            </Button>
                          )}
                          <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => handleDelete(s.id)}>
                            {t.common.delete}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </Collapse>
      </Card.Body>
      <UploadSummaryModal show={showSummary} onHide={() => setShowSummary(false)} lines={summaryLines} suggesting={suggesting} />
    </Card>
  );
}
