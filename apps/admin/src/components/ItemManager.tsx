import { Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CatalogItem, Category, ItemType } from "@bizu/shared";
import {
  deleteItem,
  fetchCategories,
  fetchItems,
  getPublicFileUrl,
  saveItem,
  type ItemPublishedFilter,
} from "../lib/catalogApi";
import { Badge, Button, Card, Input, Modal } from "./ui";

type ItemFormState = {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  categoryId: string;
  tagsInput: string;
  published: boolean;
  textBody: string;
  existingStoragePath: string | null;
};

const EMPTY_FORM: ItemFormState = {
  id: "",
  title: "",
  description: "",
  type: "pdf",
  categoryId: "",
  tagsInput: "",
  published: false,
  textBody: "",
  existingStoragePath: null,
};

export function ItemManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPublished, setFilterPublished] = useState<ItemPublishedFilter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadItems();
  }, [filterCategory, filterPublished]);

  async function loadCategories() {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (loadError) {
      setError(getMessage(loadError));
    }
  }

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchItems({
        categoryId: filterCategory,
        published: filterPublished,
      });
      setItems(data);
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setModalOpen(true);
  }

  function startEdit(item: CatalogItem) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      type: item.type,
      categoryId: item.category_id,
      tagsInput: item.tags?.join(", ") ?? "",
      published: item.published,
      textBody: item.type === "text" ? item.text_body : "",
      existingStoragePath: item.storage_path ?? null,
    });
    setSelectedFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError("Category is required.");
      return;
    }

    if (form.type !== "text" && !selectedFile && !form.existingStoragePath) {
      setError("File upload is required for pdf, audio or image items.");
      return;
    }

    setSaving(true);
    try {
      await saveItem({
        id: form.id || undefined,
        title: form.title,
        description: form.description,
        type: form.type,
        categoryId: form.categoryId,
        tagsInput: form.tagsInput,
        published: form.published,
        textBody: form.textBody,
        existingStoragePath: form.existingStoragePath,
        file: selectedFile,
      });

      await loadItems();
      setForm(EMPTY_FORM);
      setSelectedFile(null);
      setModalOpen(false);
    } catch (saveError) {
      setError(getMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CatalogItem) {
    const confirmed = window.confirm(`Excluir item "${item.title}"?`);
    if (!confirmed) return;

    setError(null);
    try {
      await deleteItem(item.id);
      await loadItems();
      if (form.id === item.id) {
        setForm(EMPTY_FORM);
        setSelectedFile(null);
      }
    } catch (deleteError) {
      setError(getMessage(deleteError));
    }
  }

  function handleTypeChange(nextType: ItemType) {
    setForm((prev) => ({
      ...prev,
      type: nextType,
      textBody: nextType === "text" ? prev.textBody : "",
      existingStoragePath: nextType === "text" ? null : prev.existingStoragePath,
    }));
    setSelectedFile(null);
  }

  return (
    <section className="section">
      <header className="page-header">
        <div>
          <h1>Gerenciar Conteudo</h1>
          <p className="text-muted">{visibleItems.length} itens listados</p>
        </div>
        <Button startIcon={<Plus size={15} />} onClick={openNew}>
          Novo Item
        </Button>
      </header>

      <Card className="content-toolbar">
        <Input
          placeholder="Buscar por titulo, descricao ou tags..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label className="ui-field">
          <span className="ui-field__label">Categoria</span>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="ui-select">
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="ui-field">
          <span className="ui-field__label">Publicacao</span>
          <select
            value={filterPublished}
            onChange={(event) => setFilterPublished(event.target.value as ItemPublishedFilter)}
            className="ui-select"
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </label>

        <Button variant="outline" onClick={() => void loadItems()} disabled={loading}>
          Atualizar
        </Button>
      </Card>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="text-muted">Carregando itens...</p> : null}

      {!loading && visibleItems.length === 0 ? (
        <Card>
          <p className="text-muted">Nenhum item encontrado para os filtros atuais.</p>
        </Card>
      ) : null}

      {!loading && visibleItems.length > 0 ? (
        <Card className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Titulo</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Versao</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table-title-cell">
                      <strong>{item.title}</strong>
                      <small className="text-muted">{item.description ?? "-"}</small>
                    </div>
                  </td>
                  <td>
                    <Badge variant="neutral">{categoriesById.get(item.category_id) ?? item.category_id}</Badge>
                  </td>
                  <td>
                    <Badge variant="info">{item.type}</Badge>
                  </td>
                  <td>
                    <Badge variant="neutral">v1</Badge>
                  </td>
                  <td>
                    <Badge variant={item.published ? "success" : "warning"}>
                      {item.published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td>
                    <div className="actions">
                      <button className="icon-button icon-button--edit" onClick={() => startEdit(item)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button icon-button--danger" onClick={() => void handleDelete(item)}>
                        <Trash2 size={15} />
                      </button>
                      {item.storage_path ? (
                        <a className="file-link" href={getPublicFileUrl(item.storage_path)} target="_blank" rel="noreferrer">
                          Arquivo
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Modal
        open={modalOpen}
        title={form.id ? "Editar Conteudo" : "Novo Conteudo"}
        onClose={() => {
          setModalOpen(false);
          setForm(EMPTY_FORM);
          setSelectedFile(null);
        }}
        width="xl"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setModalOpen(false);
                setForm(EMPTY_FORM);
                setSelectedFile(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="item-form" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Conteudo"}
            </Button>
          </>
        }
      >
        <form id="item-form" className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Titulo"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />

          <label className="ui-field">
            <span className="ui-field__label">Categoria</span>
            <select
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              className="ui-select"
              required
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Tipo</span>
            <select value={form.type} onChange={(event) => handleTypeChange(event.target.value as ItemType)} className="ui-select">
              <option value="pdf">pdf</option>
              <option value="audio">audio</option>
              <option value="image">image</option>
              <option value="text">text</option>
            </select>
          </label>

          <Input
            label="Tags (separadas por virgula)"
            value={form.tagsInput}
            onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
          />

          <label className="ui-field span-2">
            <span className="ui-field__label">Descricao</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="ui-textarea"
            />
          </label>

          {form.type === "text" ? (
            <label className="ui-field span-2">
              <span className="ui-field__label">Texto (obrigatorio para type=text)</span>
              <textarea
                rows={6}
                value={form.textBody}
                onChange={(event) => setForm((prev) => ({ ...prev, textBody: event.target.value }))}
                className="ui-textarea"
                required
              />
            </label>
          ) : (
            <label className="ui-field span-2">
              <span className="ui-field__label">Upload ({form.type})</span>
              <div className="upload-dropzone">
                <UploadCloud size={18} />
                <p>Selecione um arquivo para upload</p>
                <input
                  type="file"
                  accept={getAcceptForType(form.type)}
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  required={!form.id && !form.existingStoragePath}
                />
                {form.existingStoragePath ? (
                  <small>
                    Arquivo atual: <code>{form.existingStoragePath}</code>
                  </small>
                ) : null}
              </div>
            </label>
          )}

          <label className="checkbox-row span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
            />
            Publicado
          </label>
        </form>
      </Modal>
    </section>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("pt-BR");
}

function getAcceptForType(type: ItemType): string {
  if (type === "pdf") return ".pdf,application/pdf";
  if (type === "audio") return "audio/*";
  if (type === "image") return "image/*";
  return "*/*";
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
