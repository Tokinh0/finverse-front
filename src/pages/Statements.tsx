import { useState, useEffect, ChangeEvent } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  MonthlyStatementPresenter,
  RawMonthlyStatement,
} from "../presenters/MonthlyStatementPresenter";

export default function Statements() {
  const [files, setFiles] = useState<MonthlyStatementPresenter[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/v1/monthly_statements");
      if (!response.ok) throw new Error("Failed to fetch files");

      const data: RawMonthlyStatement[] = await response.json();
      setFiles(MonthlyStatementPresenter.parseMany(data));
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!newFile) return;

    const formData = new FormData();
    formData.append("monthly_statement[file]", newFile);

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/v1/monthly_statements", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const uploaded: RawMonthlyStatement = await response.json();
      const parsed = new MonthlyStatementPresenter(uploaded);
      setFiles((prev) => [...prev, parsed]);

      setNewFile(null);
      (document.getElementById("statement-input") as HTMLInputElement).value = "";
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/monthly_statements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="align-items-center mb-4">
        <Col><h2>Uploaded Statements</h2></Col>
        <Col md="auto">
          <Form inline="true">
            <Form.Group controlId="statement-input" className="d-flex gap-2">
              <Form.Control type="file" accept=".csv,.pdf" onChange={handleFileChange} />
              <Button variant="dark" onClick={handleUpload} disabled={loading}>
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
              <th>Type</th>
              <th>Filename</th>
              <th>Uploaded At</th>
              <th>First Transaction Date</th>
              <th>Last Transaction Date</th>
              <th style={{ width: "200px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
          {[...files]
            .sort((a, b) => {
              const dateA = new Date(a.firstTransactionDate || "1970-01-01").getTime();
              const dateB = new Date(b.firstTransactionDate || "1970-01-01").getTime();
              return dateA - dateB;
            })
            .map((file) => (
              <tr key={file.id}>
                <td>{file.statementType}</td>
                <td>{file.filename}</td>
                <td>{file.uploadedAt}</td>
                <td>{file.firstTransactionDate}</td>
                <td>{file.lastTransactionDate}</td>
                <td>
                  <Button variant="primary" size="sm" className="me-2">View</Button>
                  <Button variant="warning" size="sm" className="me-2">Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(file.id)}>Delete</Button>
                </td>
              </tr>
          ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
