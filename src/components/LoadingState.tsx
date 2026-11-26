import { Alert, Container, Spinner } from "react-bootstrap";

export function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <Container className="text-center mt-5">
      <Spinner animation="border" role="status" />
      <p>{message}</p>
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
