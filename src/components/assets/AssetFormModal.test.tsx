import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { asset } from "../../test/fixtures";
import AssetFormModal from "./AssetFormModal";
import { EMPTY_ASSET_FORM, validateAsset } from "./assetForm";

const assetTypes = { reserva: "Reserva", criptomoedas: "Criptomoedas" };

describe("validateAsset", () => {
  it("requires type, description, a valid value, rating 1-10 and a positive quantity", () => {
    expect(validateAsset({ ...EMPTY_ASSET_FORM, current_value: "abc", rating: 11 })).toEqual({
      asset_type: "Tipo de ativo é obrigatório",
      description: "Descrição é obrigatória",
      current_value: "Valor inválido",
      rating: "Nota deve ser entre 1 e 10",
      quantity: "Quantidade deve ser maior que 0",
    });
  });
});

describe("AssetFormModal", () => {
  it("shows validation errors instead of saving", async () => {
    const onSave = vi.fn();
    render(<AssetFormModal open mode="create" onClose={vi.fn()} onSave={onSave} assetTypes={assetTypes} />);

    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
  });

  it("edits an asset and sends the parsed amount", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<AssetFormModal open mode="edit" asset={asset()} onClose={onClose} onSave={onSave} assetTypes={assetTypes} />);

    const value = screen.getByLabelText(/Valor Atual/);
    expect(value).toHaveValue("1500");
    await userEvent.clear(value);
    await userEvent.type(value, "2.345,67");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith({
      ticker: "CDB",
      asset_type: "reserva",
      description: "Reserva de emergência",
      current_value: 2345.67,
      rating: 5,
      quantity: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not offer the 'Todos' filter as an asset type", async () => {
    render(<AssetFormModal open mode="create" onClose={vi.fn()} onSave={vi.fn()} assetTypes={{ Todos: "Todos", ...assetTypes }} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Reserva", "Criptomoedas"]);
  });
});
