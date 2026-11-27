import { Alert, Modal, Table, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { numberLocale } from "../utils/dates";
import { SummaryLinePresenter } from "../presenters/SummaryLinePresenter";

interface Props {
  show: boolean;
  onHide: () => void;
  lines: SummaryLinePresenter[];
  /** a suggestion run started for what keyword rules left uncategorized */
  suggesting?: boolean;
}

export default function UploadSummaryModal({ show, onHide, lines, suggesting = false }: Props) {
  const { t } = useI18n();
  const c = t.upload.columns;
  const processed = lines.filter((line) => line.status === "processed");
  const skipped = lines.filter((line) => line.status !== "processed");

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{t.upload.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {suggesting && (
          <Alert variant="info" data-testid="suggesting-note">
            {t.upload.suggestingBefore}{" "}
            <Link to="/suggestions" onClick={onHide}>
              {t.upload.suggestingLink}
            </Link>
            .
          </Alert>
        )}
        <h5>{t.upload.processed}</h5>
        <div style={{ overflowX: "auto" }}>
          <Table size="sm" striped bordered>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>{c.type}</th>
                <th style={{ width: "10%" }}>{c.date}</th>
                <th style={{ width: "10%" }}>{c.status}</th>
                <th style={{ width: "20%" }}>{c.parsedName}</th>
                <th style={{ width: "10%" }}>{c.parsedAmount}</th>
                <th style={{ width: "10%" }}>{c.parsedCategory}</th>
                <th style={{ width: "10%" }}>{c.parsedSubcategory}</th>
                <th style={{ width: "20%" }}>{c.originalRow}</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((line) => (
                <tr key={line.id}>
                  <td style={{ width: "10%" }}>{(line.transactionType && t.transactions.types[line.transactionType]) || line.transactionType}</td>
                  <td style={{ width: "10%" }}>
                    {line.transactionDate
                      ? new Date(line.transactionDate).toLocaleDateString(numberLocale())
                      : "-"}
                  </td>
                  <td style={{ width: "10%" }}>{t.upload.lineStatuses[line.status] ?? line.status}</td>
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

        <h5 className="mt-4">{t.upload.skipped}</h5>
        <Table size="sm" striped bordered>
          <thead>
            <tr>
              <th>{c.date}</th>
              <th>{c.status}</th>
              <th>{c.description}</th>
              <th>{c.error}</th>
              <th>{c.rawContent}</th>
            </tr>
          </thead>
          <tbody>
            {skipped.map((line) => (
              <tr key={line.id}>
                <td>{line.content[0]}</td>
                <td>{t.upload.lineStatuses[line.status] ?? line.status}</td>
                <td>{line.content[1]}</td>
                <td>{(line.error && t.upload.errorCodes[line.error]) || line.error}</td>
                <td>{line.content.slice(2).join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t.common.close}</Button>
      </Modal.Footer>
    </Modal>
  );
}
