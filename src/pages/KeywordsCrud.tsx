"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../config";

type CategorySummary = {
  id: number;
  name: string;
  color_code?: string | null;
};

type Subcategory = {
  id: number;
  name: string;
  color_code?: string | null;
  subcategory_type?: string | null;
  category?: CategorySummary | null;
};

type Keyword = {
  id: number;
  name: string;
  subcategory_id: number;
  description?: string | null;
  color_code?: string | null;
  keyword_type?: string | null;
  subcategory?: Subcategory | null;
};

type FormState = {
  name: string;
  subcategory_id: string;
};

const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export default function KeywordsCrud() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    subcategory_id: "",
  });

  const subcategoryMap = useMemo(() => {
    const map = new Map<number, Subcategory>();
    subcategories.forEach((subcategory) => {
      map.set(subcategory.id, subcategory);
    });
    return map;
  }, [subcategories]);

  const resetForm = () => {
    setFormData({ name: "", subcategory_id: "" });
    setEditingKeyword(null);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keywordsResponse, subcategoriesResponse] = await Promise.all([
        fetch(`${apiUrl}/api/v1/keywords`, { headers: API_HEADERS }),
        fetch(`${apiUrl}/api/v1/subcategories`, { headers: API_HEADERS }),
      ]);

      if (!keywordsResponse.ok) throw new Error("Failed to fetch keywords");
      if (!subcategoriesResponse.ok)
        throw new Error("Failed to fetch subcategories");

      const [keywordsData, subcategoriesData] = await Promise.all([
        keywordsResponse.json(),
        subcategoriesResponse.json(),
      ]);

      setKeywords(keywordsData);
      setSubcategories(subcategoriesData);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unexpected error loading data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      name: keyword.name,
      subcategory_id: keyword.subcategory_id.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this keyword?")) return;

    try {
      const response = await fetch(`${apiUrl}/api/v1/keywords/${id}`, {
        method: "DELETE",
        headers: API_HEADERS,
      });

      if (!response.ok) {
        throw new Error("Failed to delete keyword");
      }

      setKeywords((prev) => prev.filter((keyword) => keyword.id !== id));
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Unexpected error deleting keyword."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subcategory_id) {
      alert("Please fill in all fields");
      return;
    }

    const payload = {
      keyword: {
        name: formData.name,
        subcategory_id: Number.parseInt(formData.subcategory_id, 10),
      },
    };

    setIsSubmitting(true);

    try {
      const url = editingKeyword
        ? `${apiUrl}/api/v1/keywords/${editingKeyword.id}`
        : `${apiUrl}/api/v1/keywords`;
      const method = editingKeyword ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: API_HEADERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          editingKeyword
            ? "Failed to update keyword"
            : "Failed to create keyword"
        );
      }

      const savedKeyword: Keyword = await response.json();

      setKeywords((prev) =>
        editingKeyword
          ? prev.map((keyword) =>
              keyword.id === savedKeyword.id ? savedKeyword : keyword
            )
          : [...prev, savedKeyword]
      );

      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Unexpected error submitting keyword."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubcategoryName = (keyword: Keyword) =>
    keyword.subcategory?.name ??
    subcategoryMap.get(keyword.subcategory_id)?.name ??
    "Unknown";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <p className="text-gray-600">Loading keywords...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-medium">Unable to load keywords.</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="rounded-md border px-3 py-2 font-medium hover:bg-gray-50"
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header / Actions */}
      <div className="mb-4 flex items-center justify-between border rounded-lg p-4">
        <h2 className="text-2xl font-bold">Keywords Management</h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 font-medium hover:bg-gray-50"
          type="button"
        >
          + Add Keyword
        </button>
      </div>

      {/* Modal */}
      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            // allow clicking outside to close
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsDialogOpen(false);
              resetForm();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
            <div className="border-b p-4">
              <h3 className="text-lg font-semibold">
                {editingKeyword ? "Edit Keyword" : "Add New Keyword"}
              </h3>
              <p className="text-sm text-gray-600">
                {editingKeyword
                  ? "Update the keyword details below."
                  : "Fill in the details to create a new keyword."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-medium">
                    Keyword Name
                  </label>
                  <input
                    id="name"
                    placeholder="Enter keyword name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full rounded-md border px-3 py-2"
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="subcategory" className="text-sm font-medium">
                    Subcategory
                  </label>
                  <select
                    id="subcategory"
                    value={formData.subcategory_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subcategory_id: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-md border px-3 py-2 bg-black"
                    disabled={isSubmitting}
                  >
                    <option value="" disabled>
                      Select a subcategory
                    </option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    if (isSubmitting) return;
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingKeyword
                    ? "Update Keyword"
                    : "Add Keyword"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-sm font-semibold p-3 border-b">ID</th>
              <th className="text-left text-sm font-semibold p-3 border-b">
                Name
              </th>
              <th className="text-left text-sm font-semibold p-3 border-b">
                Subcategory
              </th>
              <th className="text-right text-sm font-semibold p-3 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No keywords found. Add one to get started.
                </td>
              </tr>
            ) : (
              keywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b font-medium">{keyword.id}</td>
                  <td className="p-3 border-b">{keyword.name}</td>
                  <td className="p-3 border-b">
                    {getSubcategoryName(keyword)}
                  </td>
                  <td className="p-3 border-b">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(keyword)}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(keyword.id)}
                        className="rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
