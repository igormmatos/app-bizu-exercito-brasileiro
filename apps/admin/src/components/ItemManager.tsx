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

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

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
    } catch (saveError) {
      setError(getMessage(saveError));
    } finally {
      setSaving(false);
    }
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
      <header className="section-header">
        <h2>Itens</h2>
        <button onClick={() => void loadItems()} disabled={loading}>
          Atualizar
        </button>
      </header>

      <div className="panel filters">
        <label>
          Categoria
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Publicacao
          <select
            value={filterPublished}
            onChange={(event) => setFilterPublished(event.target.value as ItemPublishedFilter)}
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </label>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <h3>{form.id ? "Editar item" : "Novo item"}</h3>

        <label>
          Titulo
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>

        <label>
          Categoria
          <select
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
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

        <label>
          Tipo
          <select value={form.type} onChange={(event) => handleTypeChange(event.target.value as ItemType)}>
            <option value="pdf">pdf</option>
            <option value="audio">audio</option>
            <option value="image">image</option>
            <option value="text">text</option>
          </select>
        </label>

        <label>
          Tags (separadas por virgula)
          <input
            value={form.tagsInput}
            onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
          />
        </label>

        <label className="span-2">
          Descricao
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>

        {form.type === "text" ? (
          <label className="span-2">
            Texto (obrigatorio para type=text)
            <textarea
              rows={6}
              value={form.textBody}
              onChange={(event) => setForm((prev) => ({ ...prev, textBody: event.target.value }))}
              required
            />
          </label>
        ) : (
          <label className="span-2">
            Arquivo ({form.type}) {form.id ? "(opcional na edicao)" : "(obrigatorio)"}
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
          </label>
        )}

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
          />
          Publicado
        </label>

        <div className="actions span-2">
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : form.id ? "Salvar alteracoes" : "Criar item"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setForm(EMPTY_FORM);
                setSelectedFile(null);
              }}
              disabled={saving}
            >
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="panel">
        <h3>Lista ({items.length})</h3>
        {loading ? <p>Carregando itens...</p> : null}
        {!loading && items.length === 0 ? <p>Nenhum item encontrado para os filtros atuais.</p> : null}

        {!loading && items.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Titulo</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Arquivo</th>
                <th>Atualizado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{categoriesById.get(item.category_id) ?? item.category_id}</td>
                  <td>{item.type}</td>
                  <td>{item.published ? "Publicado" : "Rascunho"}</td>
                  <td>
                    {item.storage_path ? (
                      <a href={getPublicFileUrl(item.storage_path)} target="_blank" rel="noreferrer">
                        Abrir arquivo
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td className="actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => void handleDelete(item)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
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
