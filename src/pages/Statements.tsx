import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner, Table } from "react-bootstrap";
import { ApiError, statementsApi } from "../api";
import UploadSummaryModal from "../components/UploadSummaryModal";
import { useSuggestionsSummary } from "../hooks/suggestionsSummary";
import { MonthlyStatementPresenter } from "../presenters/MonthlyStatementPresenter";
import { SummaryLinePresenter } from "../presenters/SummaryLinePresenter";

const byFirstTransactionDate = (a: MonthlyStatementPresenter, b: MonthlyStatementPresenter) =>
  new Date(a.firstTransactionDate).getTime() - new Date(b.firstTransactionDate).getTime() || a.id - b.id;

export default function Statements() {
  const [files, setFiles] = useState<MonthlyStatementPresenter[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLines, setSummaryLines] = useState<SummaryLinePresenter[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const { refresh: refreshSuggestions } = useSuggestionsSummary();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    statementsApi
      .list()
      .then((data) => setFiles(MonthlyStatementPresenter.parseMany(data)))
      .catch((error) => console.error("Error fetching files:", error))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!newFile) return;

    setLoading(true);
    try {
      const uploaded = await statementsApi.upload(newFile);
      setFiles((prev) => [...prev, new MonthlyStatementPresenter(uploaded.statement)]);
      setSummaryLines(SummaryLinePresenter.parseMany(uploaded.summary_lines));
      setSuggesting(Boolean(uploaded.suggestion_run));
      setShowSummary(true);
      refreshSuggestions();
      setNewFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      const reason = error instanceof ApiError ? (error.body as { file?: string[] } | undefined)?.file?.[0] : undefined;
      alert(reason ? `Failed to upload file: ${reason}` : "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    setLoading(true);
    try {
      await statementsApi.remove(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="align-items-center mb-4">
        <Col>
          <h2>Uploaded Statements</h2>
        </Col>
        <Col md="auto">
          <Form onSubmit={(e) => e.preventDefault()}>
            <Form.Group controlId="statement-input" className="d-flex gap-2">
              <Form.Label visuallyHidden>Statement file</Form.Label>
              <Form.Control ref={fileInput} type="file" accept=".csv,.pdf" onChange={handleFileChange} />
              <Button variant="dark" onClick={handleUpload} disabled={loading || !newFile}>
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </Form.Group>
          </Form>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status" />
          <p>Loading...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Status</th>
              <th>Uploaded At</th>
              <th>First Transaction Date</th>
              <th>Last Transaction Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...files].sort(byFirstTransactionDate).map((file) => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.status}</td>
                <td>{file.uploadedAt}</td>
                <td>{file.firstTransactionDate}</td>
                <td>{file.lastTransactionDate}</td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(file.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <UploadSummaryModal show={showSummary} onHide={() => setShowSummary(false)} lines={summaryLines} suggesting={suggesting} />
    </Container>
  );
}
