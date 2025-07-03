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
        <Table size="sm" striped bordered>
          <thead>
            <tr>
              <th>Date</th>
              <th>Parsed Name</th>
              <th>Parsed Amount</th>
              <th>Parsed Category</th>
              <th>Parsed Subcategory</th>
              <th>Original Row</th>
            </tr>
          </thead>
          <tbody>
            {processed.map((line) => (
              <tr key={line.id}>
                <td>{line.transactionDate}</td>
                <td>{line.parsedName}</td>
                <td>
                  {typeof line.amount === "number" ? `R$ ${line.amount.toFixed(2)}` : "-"}
                </td>
                <td>{line.categoryName ?? "-"}</td>
                <td>{line.subcategoryName ?? "-"}</td>
                <td>{line.content}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h5 className="mt-4">❌ Skipped/Errored Rows</h5>
        <Table size="sm" striped bordered>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Error</th>
              <th>Raw Content</th>
            </tr>
          </thead>
          <tbody>
            {skipped.map((line) => (
              <tr key={line.id}>
                <td>{line.content[0]}</td>
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
