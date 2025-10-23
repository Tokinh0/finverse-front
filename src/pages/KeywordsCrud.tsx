"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Form, Table, Row, Col, Spinner, Alert } from "react-bootstrap";
import { API_BASE_URL } from "../constants/env";

type Keyword = {
  id: number;
  name: string;
  subcategory_id: number;
};

type Subcategory = {
  id: number;
  name: string;
};


function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content ?? null;
}

export default function KeywordsCrud() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState({ name: "", subcategory_id: "" });

  // Optional subcategories support
  const [subcats, setSubcats] = useState<Subcategory[] | null>(null);
  const [subcatErr, setSubcatErr] = useState<string | null>(null);

  const csrf = useMemo(getCsrfToken, []);

  // Fetch keywords
  const loadKeywords = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/keywords`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Failed to load keywords (${res.status})`);
      const data: Keyword[] = await res.json();
      setKeywords(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  // Try to fetch subcategories (if your API has it)
  const loadSubcategories = async () => {
    setSubcatErr(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1//subcategories`, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        // If the route doesn't exist yet, we'll fall back to a numeric input
        throw new Error(`Subcategories endpoint returned ${res.status}`);
      }
      const data: Subcategory[] = await res.json();
      setSubcats(data);
    } catch (_e) {
      setSubcats(null);
      setSubcatErr("Subcategories endpoint not available; falling back to manual ID entry.");
    }
  };

  useEffect(() => {
    loadKeywords();
    loadSubcategories();
  }, []);

  const openCreate = () => {
    setEditingKeyword(null);
    setFormData({ name: "", subcategory_id: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      name: keyword.name,
      subcategory_id: String(keyword.subcategory_id),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this keyword?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1//keywords/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to delete (status ${res.status})`);
      // Remove locally
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete keyword");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subcategory_id) {
      alert("Please fill in all fields");
      return;
    }

    const body = JSON.stringify({
      keyword: {
        name: formData.name,
        subcategory_id: Number.parseInt(formData.subcategory_id, 10),
      },
    });

    try {
      const isEdit = Boolean(editingKeyword);
      const url = isEdit
        ? `${API_BASE_URL}/api/v1/keywords/${editingKeyword!.id}`
        : `${API_BASE_URL}/api/v1//keywords`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        body,
      });

      if (!res.ok) {
        const maybeErrors = await safeJson(res);
        const msg = formatRailsErrors(maybeErrors) || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const saved: Keyword = await res.json();

      if (isEdit) {
        setKeywords((prev) => prev.map((k) => (k.id === saved.id ? saved : k)));
      } else {
        setKeywords((prev) => [...prev, saved]);
      }

      setIsDialogOpen(false);
      setFormData({ name: "", subcategory_id: "" });
      setEditingKeyword(null);
    } catch (e: any) {
      alert(e?.message || "Failed to save keyword");
    }
  };

  const getSubcatName = (id: number) =>
    subcats?.find((s) => s.id === id)?.name ?? `#${id}`;

  return (
    <div className="container my-4">
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h2 className="h4 mb-0">Keywords Management</h2>
            </Col>
            <Col xs="auto">
              <Button onClick={openCreate}>+ Add Keyword</Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {err && <Alert variant="danger" className="mb-3">{err}</Alert>}
          {loading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" /> Loading keywords…
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Subcategory</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      No keywords found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  keywords.map((k) => (
                    <tr key={k.id}>
                      <td className="fw-medium">{k.id}</td>
                      <td>{k.name}</td>
                      <td>{subcats ? getSubcatName(k.subcategory_id) : `#${k.subcategory_id}`}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openEdit(k)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(k.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={isDialogOpen} onHide={() => setIsDialogOpen(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingKeyword ? "Edit Keyword" : "Add New Keyword"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted small mb-3">
              {editingKeyword
                ? "Update the keyword details below."
                : "Fill in the details to create a new keyword."}
            </p>

            <Form.Group controlId="name" className="mb-3">
              <Form.Label>Keyword Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter keyword name"
                value={formData.name}
                onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </Form.Group>

            {/* Prefer a select if /subcategories exists; otherwise fallback to numeric entry */}
            {subcats ? (
              <Form.Group controlId="subcategory" className="mb-0">
                <Form.Label>Subcategory</Form.Label>
                <Form.Select
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData((s) => ({ ...s, subcategory_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select a subcategory</option>
                  {subcats.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
                {subcatErr && (
                  <div className="form-text text-warning">{subcatErr}</div>
                )}
              </Form.Group>
            ) : (
              <Form.Group controlId="subcategory_id_fallback" className="mb-0">
                <Form.Label>Subcategory ID</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  placeholder="Enter subcategory ID"
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData((s) => ({ ...s, subcategory_id: e.target.value }))}
                  required
                />
                {subcatErr && (
                  <div className="form-text text-warning">{subcatErr}</div>
                )}
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline-secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingKeyword ? "Update" : "Add"} Keyword</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

/** Helpers */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function formatRailsErrors(json: any): string | null {
  if (!json || typeof json !== "object") return null;
  // Accept { field: ["msg1","msg2"], ... } OR { errors: { field: ["msg"] } }
  const errors = json.errors && typeof json.errors === "object" ? json.errors : json;
  const parts: string[] = [];
  Object.entries(errors).forEach(([field, msgs]) => {
    if (Array.isArray(msgs)) {
      parts.push(`${titleize(field)} ${msgs.join(", ")}`);
    } else if (typeof msgs === "string") {
      parts.push(`${titleize(field)} ${msgs}`);
    }
  });
  return parts.length ? parts.join("; ") : null;
}

function titleize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
