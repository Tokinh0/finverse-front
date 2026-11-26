import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorMessage, Loading } from "./LoadingState";

describe("LoadingState", () => {
  it("renders a spinner with a message and an error alert", () => {
    render(
      <>
        <Loading message="Carregando..." />
        <ErrorMessage message="Falhou" />
      </>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });
});
