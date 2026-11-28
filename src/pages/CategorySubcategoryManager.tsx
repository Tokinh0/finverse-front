import { useEffect, useMemo, useState } from "react";
import { categoriesApi, subcategoriesApi } from "../api";
import ColorThemePicker from "../components/categories/ColorThemePicker";
import type { Category, Subcategory } from "../types";
import { useI18n } from "../i18n/context";
import { subcategoryTypes } from "../utils/categories";

// Rows added in the UI get a negative temporary id until the API returns the real one.
let nextTempId = -1;
const isNew = (record: { id: number }) => record.id < 0;


export default function CategorySubcategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const c = t.categoryManager;

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setLoading(false));
  }, []);

  const updateCategory = (categoryId: number, changes: Partial<Category>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...changes } : cat)));
  };

  const updateSubcategory = (categoryId: number, subcategoryId: number, changes: Partial<Subcategory>) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subcategories: cat.subcategories.map((sub) => (sub.id === subcategoryId ? { ...sub, ...changes } : sub)) }
          : cat
      )
    );
  };

  const addCategory = () => {
    setCategories((prev) => [...prev, { id: nextTempId--, name: "", color_code: "#000000", subcategories: [] }]);
  };

  const addSubcategory = (categoryId: number) => {
    const subcategory: Subcategory = { id: nextTempId--, name: "", color_code: "#cccccc", subcategory_type: "" };
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, subcategory] } : cat))
    );
  };

  const saveCategory = async (category: Category) => {
    const params = { name: category.name, color_code: category.color_code };
    try {
      if (isNew(category)) {
        const saved = await categoriesApi.create(params);
        setCategories((prev) => prev.map((cat) => (cat.id === category.id ? saved : cat)));
      } else {
        await categoriesApi.update(category.id, params);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const saveSubcategory = async (subcategory: Subcategory, categoryId: number) => {
    const params = {
      name: subcategory.name,
      color_code: subcategory.color_code,
      subcategory_type: subcategory.subcategory_type,
      category_id: categoryId,
    };
    try {
      if (isNew(subcategory)) {
        const saved = await subcategoriesApi.create(params);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId
              ? { ...cat, subcategories: cat.subcategories.map((sub) => (sub.id === subcategory.id ? saved : sub)) }
              : cat
          )
        );
      } else {
        await subcategoriesApi.update(subcategory.id, params);
      }
    } catch (error) {
      console.error("Error saving subcategory:", error);
    }
  };

  // Themes only color what already exists in the API.
  const saved = useMemo(
    () => categories.filter((cat) => !isNew(cat)).map((cat) => ({ ...cat, subcategories: cat.subcategories.filter((sub) => !isNew(sub)) })),
    [categories]
  );

  const applyThemeColors = (updated: Category[]) => {
    const colors = new Map<string, string | null | undefined>();
    for (const cat of updated) {
      colors.set(`c${cat.id}`, cat.color_code);
      for (const sub of cat.subcategories) colors.set(`s${sub.id}`, sub.color_code);
    }
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        color_code: colors.has(`c${cat.id}`) ? colors.get(`c${cat.id}`) : cat.color_code,
        subcategories: cat.subcategories.map((sub) => ({ ...sub, color_code: colors.has(`s${sub.id}`) ? colors.get(`s${sub.id}`) : sub.color_code })),
      }))
    );
  };

  if (loading) return <p>{t.common.loading}</p>;

  return (
    <div style={{ padding: "1rem", maxWidth: "960px", margin: "0 auto" }}>
      <h2>{c.title}</h2>
      {saved.length > 0 && <ColorThemePicker categories={saved} onApplied={applyThemeColors} />}
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      {categories.map((category) => (
        <div key={category.id} style={{ marginBottom: "1.5rem", marginLeft: "6rem", marginTop: "3rem" }}>
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <input
                aria-label={c.categoryName}
                className="form-control form-control-sm w-50"
                type="text"
                value={category.name ?? ""}
                onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                onBlur={() => saveCategory(category)}
              />
              <input
                aria-label={c.categoryColor}
                className="form-control form-control-color"
                type="color"
                value={category.color_code ?? "#000000"}
                onChange={(e) => updateCategory(category.id, { color_code: e.target.value })}
                onBlur={() => saveCategory(category)}
              />
              <button className="btn btn-outline-primary btn-sm" onClick={() => addSubcategory(category.id)} disabled={isNew(category)}>
                {c.addSubcategory}
              </button>
            </div>

            {category.subcategories.map((sub) => (
              <div key={sub.id} className="ms-4 d-flex align-items-center gap-2 mb-1">
                <input
                  aria-label={c.subcategoryName}
                  className="form-control form-control-sm w-50"
                  type="text"
                  value={sub.name ?? ""}
                  onChange={(e) => updateSubcategory(category.id, sub.id, { name: e.target.value })}
                  onBlur={() => saveSubcategory(sub, category.id)}
                />
                <input
                  aria-label={c.subcategoryColor}
                  className="form-control form-control-color"
                  type="color"
                  value={sub.color_code ?? "#cccccc"}
                  onChange={(e) => updateSubcategory(category.id, sub.id, { color_code: e.target.value })}
                  onBlur={() => saveSubcategory(sub, category.id)}
                />
                <select
                  aria-label={c.subcategoryType}
                  className="form-select form-select-sm w-auto"
                  value={sub.subcategory_type ?? ""}
                  onChange={(e) =>
                    updateSubcategory(category.id, sub.id, { subcategory_type: e.target.value as Subcategory["subcategory_type"] })
                  }
                  onBlur={() => saveSubcategory(sub, category.id)}
                >
                  <option value="" disabled>
                    {c.selectType}
                  </option>
                  {subcategoryTypes().map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addCategory}>{c.addCategory}</button>
      </div>
    </div>
  );
}
