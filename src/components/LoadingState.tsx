import { Alert, Container, Spinner } from "react-bootstrap";
import { useI18n } from "../i18n/context";

export function Loading({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <Container className="text-center mt-5">
      <Spinner animation="border" role="status" />
      <p>{message ?? t.common.loading}</p>
    </Container>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <Container className="mt-5">
      <Alert variant="danger">{message}</Alert>
    </Container>
  );
}
