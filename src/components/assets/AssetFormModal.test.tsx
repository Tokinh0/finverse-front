import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { asset } from "../../test/fixtures";
import { inLocale } from "../../test/i18n";
import AssetFormModal from "./AssetFormModal";
import { EMPTY_ASSET_FORM, validateAsset } from "./assetForm";

const assetTypes = { reserva: "Reserva", criptomoedas: "Criptomoedas" };

const renderForm = (props: Partial<Parameters<typeof AssetFormModal>[0]> = {}) => {
  const onSave = vi.fn(async () => {});
  const onClose = vi.fn();
  render(<AssetFormModal asset={null} assetTypes={assetTypes} onSave={onSave} onClose={onClose} errorText="Could not save the asset." {...props} />);
  return { onSave, onClose };
};

describe("validateAsset", () => {
  it("requires type, description, a valid value, rating 1-10 and a positive quantity", () => {
    expect(validateAsset({ ...EMPTY_ASSET_FORM, current_value: "abc", rating: 11 })).toEqual({
      asset_type: "Asset type is required",
      description: "Description is required",
      current_value: "Invalid value",
      rating: "Rating must be between 1 and 10",
      quantity: "Quantity must be greater than 0",
    });
  });
});

describe("AssetFormModal", () => {
  it("shows validation errors next to the fields instead of saving", async () => {
    const { onSave } = renderForm();

    expect(screen.getByRole("dialog", { name: "New asset" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add asset" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Description")).toHaveClass("is-invalid");
    expect(screen.getByText("Description is required")).toBeInTheDocument();
  });

  it("edits an asset and sends the parsed amount", async () => {
    const { onSave } = renderForm({ asset: asset({ current_value: 1500.5 }) });

    const value = screen.getByLabelText("Current value (total)");
    expect(value).toHaveValue("1500,5");
    await userEvent.clear(value);
    await userEvent.type(value, "2.345,67");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      ticker: "CDB",
      asset_type: "reserva",
      description: "Reserva de emergência",
      current_value: 2345.67,
      rating: 5,
      quantity: 1,
    });
  });

  it("keeps the dialog open with a message when saving fails", async () => {
    renderForm({ asset: asset(), onSave: vi.fn(async () => Promise.reject(new Error("down"))) });

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Could not save the asset.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("does not offer the 'Todos' filter as an asset type", () => {
    renderForm({ assetTypes: { Todos: "Todos", ...assetTypes } });

    const options = Array.from((screen.getByLabelText("Asset type") as HTMLSelectElement).options).slice(1);
    expect(options.map((o) => o.textContent)).toEqual(["Emergency reserve", "Crypto"]);
  });

  it("speaks Portuguese when that is the language", async () => {
    render(inLocale("pt-BR", <AssetFormModal asset={null} assetTypes={assetTypes} onSave={vi.fn()} onClose={vi.fn()} errorText="x" />));

    await userEvent.click(screen.getByRole("button", { name: "Adicionar ativo" }));

    expect(screen.getByRole("dialog", { name: "Novo ativo" })).toBeInTheDocument();
    expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
  });
});
