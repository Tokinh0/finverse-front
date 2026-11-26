import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Form, Modal, Table } from "react-bootstrap";
import { keywordsApi, subcategoriesApi } from "../api";
import { Loading } from "../components/LoadingState";
import type { Keyword, Subcategory } from "../types";

type FormState = { name: string; subcategory_id: string };

const EMPTY_FORM: FormState = { name: "", subcategory_id: "" };

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export default function KeywordsCrud() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  const subcategoryNames = useMemo(() => new Map(subcategories.map((s) => [s.id, s.name])), [subcategories]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keywordsData, subcategoriesData] = await Promise.all([keywordsApi.list(), subcategoriesApi.list()]);
      setKeywords(keywordsData);
      setSubcategories(subcategoriesData);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Unexpected error loading data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDialog = (keyword: Keyword | null) => {
    setEditingKeyword(keyword);
    setFormData(keyword ? { name: keyword.name, subcategory_id: String(keyword.subcategory_id) } : EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingKeyword(null);
    setFormData(EMPTY_FORM);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this keyword?")) return;

    try {
      await keywordsApi.remove(id);
      setKeywords((prev) => prev.filter((keyword) => keyword.id !== id));
    } catch (err) {
      console.error(err);
      alert(errorMessage(err, "Unexpected error deleting keyword."));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subcategory_id) {
      alert("Please fill in all fields");
      return;
    }

    const params = { name: formData.name, subcategory_id: Number(formData.subcategory_id) };
    setIsSubmitting(true);
    try {
      const saved = editingKeyword ? await keywordsApi.update(editingKeyword.id, params) : await keywordsApi.create(params);
      setKeywords((prev) => (editingKeyword ? prev.map((k) => (k.id === saved.id ? saved : k)) : [...prev, saved]));
      setIsDialogOpen(false);
      setEditingKeyword(null);
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      alert(editingKeyword ? "Failed to update keyword" : "Failed to create keyword");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subcategoryName = (keyword: Keyword) =>
    keyword.subcategory?.name ?? subcategoryNames.get(keyword.subcategory_id) ?? "Unknown";

  if (loading) return <Loading message="Loading keywords..." />;

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <p className="fw-medium mb-1">Unable to load keywords.</p>
          <p className="mb-0">{error}</p>
        </Alert>
        <Button variant="outline-secondary" onClick={loadData}>
          Try again
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="mb-4 d-flex align-items-center justify-content-between border rounded p-3">
        <h2 className="mb-0">Keywords Management</h2>
        <Button variant="outline-dark" onClick={() => openDialog(null)}>
          + Add Keyword
        </Button>
      </div>

      <Modal show={isDialogOpen} onHide={closeDialog} backdrop={isSubmitting ? "static" : true}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!isSubmitting}>
            <Modal.Title>{editingKeyword ? "Edit Keyword" : "Add New Keyword"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted">
              {editingKeyword ? "Update the keyword details below." : "Fill in the details to create a new keyword."}
            </p>
            <Form.Group className="mb-3" controlId="keyword-name">
              <Form.Label>Keyword Name</Form.Label>
              <Form.Control
                placeholder="Enter keyword name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </Form.Group>
            <Form.Group controlId="keyword-subcategory">
              <Form.Label>Subcategory</Form.Label>
              <Form.Select
                value={formData.subcategory_id}
                onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                required
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
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="dark" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingKeyword ? "Update Keyword" : "Add Keyword"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Table bordered hover responsive>
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
            keywords.map((keyword) => (
              <tr key={keyword.id}>
                <td className="fw-medium">{keyword.id}</td>
                <td>{keyword.name}</td>
                <td>{subcategoryName(keyword)}</td>
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => openDialog(keyword)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(keyword.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
}
