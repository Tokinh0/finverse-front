import { useState, useEffect } from "react";
import { apiUrl } from "../config";

interface Subcategory {
  id: number;
  name: string;
  color_code: string;
}

interface Category {
  id: number;
  name: string;
  color_code: string;
  subcategories: Subcategory[];
}

export default function CategorySubcategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const apiHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/categories`, {
        headers: apiHeaders,
      });      
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = (categoryId: number, field: keyof Category, value: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    );
  };

  const updateSubcategory = (
    categoryId: number,
    subcategoryId: number,
    field: keyof Subcategory,
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((sub) =>
                sub.id === subcategoryId ? { ...sub, [field]: value } : sub
              ),
            }
          : cat
      )
    );
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: `temp-${Date.now()}` as unknown as number,
      name: "",
      color_code: "#000000",
      subcategories: [],
    };
    setCategories((prev) => [...prev, newCategory]);
  };
  
  const addSubcategory = (categoryId: number) => {
    const newSubcategory: Subcategory = {
      id: `temp-${Date.now()}` as unknown as number,
      name: "",
      color_code: "#cccccc",
    };
  
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: [...cat.subcategories, newSubcategory],
            }
          : cat
      )
    );
  };  

  const saveCategory = async (category: Category) => {
    const method = category.id.toString().startsWith("temp") ? "POST" : "PATCH";
    const url =
      method === "POST"
        ? `${apiUrl}/api/v1/categories`
        : `${apiUrl}/api/v1/categories/${category.id}`;
  
    const response = await fetch(url, {
      method,
      headers: apiHeaders,
      body: JSON.stringify({
        category: {
          name: category.name,
          color_code: category.color_code,
        },
      }),
    });
  
    const data = await response.json();
    if (method === "POST") {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...data } : cat
        )
      );
    }
  };
  
  const saveSubcategory = async (subcategory: Subcategory, categoryId: number) => {
    const method = subcategory.id.toString().startsWith("temp") ? "POST" : "PATCH";
    const url =
      method === "POST"
        ? `${apiUrl}/api/v1/subcategories`
        : `${apiUrl}/api/v1/subcategories/${subcategory.id}`;
  
    const response = await fetch(url, {
      method,
      headers: apiHeaders,
      body: JSON.stringify({
        subcategory: {
          name: subcategory.name,
          color_code: subcategory.color_code,
          category_id: categoryId,
        },
      }),
    });
  
    const data = await response.json();
  
    if (method === "POST") {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                subcategories: cat.subcategories.map((sub) =>
                  sub.id === subcategory.id ? { ...data } : sub
                ),
              }
            : cat
        )
      );
    }
  };
  
  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Category/Subcategory Manager</h2>
      {categories.map((category) => (
        <div key={category.id} style={{ marginBottom: "1.5rem", marginLeft: "6rem", marginTop: "3rem" }}>
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <input
                className="form-control form-control-sm w-50"
                type="text"
                value={category.name ?? ''}
                onChange={(e) => updateCategory(category.id, "name", e.target.value)}
                onBlur={() => saveCategory(category)}
              />
              <input
                className="form-control form-control-color"
                type="color"
                value={category.color_code ?? '#000000'}
                onChange={(e) => updateCategory(category.id, "color_code", e.target.value)}
                onBlur={() => saveCategory(category)}
              />
              <button className="btn btn-outline-primary btn-sm" onClick={() => addSubcategory(category.id)}>
                + Subcategory
              </button>
            </div>

            {category.subcategories.map((sub) => (
              <div key={sub.id} className="ms-4 d-flex align-items-center gap-2 mb-1">
                <input
                  className="form-control form-control-sm w-50"
                  type="text"
                  value={sub.name ?? ''}
                  onChange={(e) =>
                    updateSubcategory(category.id, sub.id, "name", e.target.value)
                  }
                  onBlur={() => saveSubcategory(sub, category.id)}
                />
                <input
                  className="form-control form-control-color"
                  type="color"
                  value={sub.color_code ?? '#cccccc'}
                  onChange={(e) =>
                    updateSubcategory(category.id, sub.id, "color_code", e.target.value)
                  }
                  onBlur={() => saveSubcategory(sub, category.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addCategory}>+ Add Category</button>
    </div>
  );
}
