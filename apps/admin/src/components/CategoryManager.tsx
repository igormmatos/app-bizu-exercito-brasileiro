import { FormEvent, useEffect, useState } from "react";
import type { Category } from "@bizu/shared";
import { deleteCategory, fetchCategories, saveCategory } from "../lib/catalogApi";

const EMPTY_FORM = {
  id: "",
  name: "",
  sortOrder: 0,
  published: false,
};

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveCategory({
        id: form.id || undefined,
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder),
        published: form.published,
      });
      await load();
      setForm(EMPTY_FORM);
    } catch (saveError) {
      setError(getMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      sortOrder: category.sort_order,
      published: category.published,
    });
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(`Excluir categoria "${category.name}"?`);
    if (!confirmed) return;

    setError(null);
    try {
      await deleteCategory(category.id);
      await load();
      if (form.id === category.id) {
        setForm(EMPTY_FORM);
      }
    } catch (deleteError) {
      setError(getMessage(deleteError));
    }
  }

  return (
    <section className="section">
      <header className="section-header">
        <h2>Categorias</h2>
        <button onClick={() => void load()} disabled={loading}>
          Atualizar
        </button>
      </header>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <h3>{form.id ? "Editar categoria" : "Nova categoria"}</h3>

        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>

        <label>
          Ordem
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value || 0) }))
            }
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
          />
          Publicada
        </label>

        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : form.id ? "Salvar alteracoes" : "Criar categoria"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="ghost"
              onClick={() => setForm(EMPTY_FORM)}
              disabled={saving}
            >
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="panel">
        <h3>Lista ({categories.length})</h3>
        {loading ? <p>Carregando categorias...</p> : null}
        {!loading && categories.length === 0 ? <p>Nenhuma categoria cadastrada.</p> : null}

        {!loading && categories.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ordem</th>
                <th>Status</th>
                <th>Atualizado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.sort_order}</td>
                  <td>{category.published ? "Publicado" : "Rascunho"}</td>
                  <td>{formatDate(category.updated_at)}</td>
                  <td className="actions">
                    <button type="button" onClick={() => startEdit(category)}>
                      Editar
                    </button>
                    <button type="button" className="danger" onClick={() => void handleDelete(category)}>
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

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
