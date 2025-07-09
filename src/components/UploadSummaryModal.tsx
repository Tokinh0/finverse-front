import { Modal, Table, Button } from "react-bootstrap";
import { SummaryLinePresenter } from "../presenters/SummaryLinePresenter";

interface Props {
  show: boolean;
  onHide: () => void;
  lines: SummaryLinePresenter[];
}

export default function UploadSummaryModal({ show, onHide, lines }: Props) {
  const processed = lines.filter((line) => line.status === "processed");
  const skipped = lines.filter((line) => line.status !== "processed");

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Upload Summary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>✅ Processed Transactions</h5>
        <div style={{ overflowX: "auto" }}>
          <Table size="sm" striped bordered>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Type</th>
                <th style={{ width: "10%" }}>Date</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "20%" }}>Parsed Name</th>
                <th style={{ width: "10%" }}>Parsed Amount</th>
                <th style={{ width: "10%" }}>Parsed Category</th>
                <th style={{ width: "10%" }}>Parsed Subcategory</th>
                <th style={{ width: "20%" }}>Original Row</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((line) => (
                <tr key={line.id}>
                  <td style={{ width: "10%" }}>{line.transactionType}</td>
                  <td style={{ width: "10%" }}>
                    {line.transactionDate
                      ? new Date(line.transactionDate).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td style={{ width: "10%" }}>{line.status}</td>
                  <td style={{ width: "20%" }}>{line.parsedName}</td>
                  <td style={{ width: "10%" }}>
                    {typeof line.amount === "number" ? `R$ ${line.amount.toFixed(2)}` : "-"}
                  </td>
                  <td style={{ width: "10%" }}>{line.categoryName ?? "-"}</td>
                  <td style={{ width: "10%" }}>{line.subcategoryName ?? "-"}</td>
                  <td style={{ width: "20%" }}>{line.content}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h5 className="mt-4">❌ Skipped/Errored Rows</h5>
        <Table size="sm" striped bordered>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Description</th>
              <th>Error</th>
              <th>Raw Content</th>
            </tr>
          </thead>
          <tbody>
            {skipped.map((line) => (
              <tr key={line.id}>
                <td>{line.content[0]}</td>
                <td>{line.status}</td>
                <td>{line.content[1]}</td>
                <td>{line.error}</td>
                <td>{line.content.slice(2).join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
