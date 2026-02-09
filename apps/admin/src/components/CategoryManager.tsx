import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Category } from "@bizu/shared";
import { deleteCategory, fetchCategories, fetchItems, saveCategory } from "../lib/catalogApi";
import { Badge, Button, Card, Input, Modal } from "./ui";

const EMPTY_FORM = {
  id: "",
  name: "",
  sortOrder: 0,
  published: false,
};

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);

  const totalItems = useMemo(() => {
    let count = 0;
    for (const value of itemsByCategory.values()) {
      count += value;
    }
    return count;
  }, [itemsByCategory]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [categoriesData, itemsData] = await Promise.all([
        fetchCategories(),
        fetchItems({ categoryId: "all", published: "all" }),
      ]);

      const counter = new Map<string, number>();
      for (const category of categoriesData) {
        counter.set(category.id, 0);
      }
      for (const item of itemsData) {
        counter.set(item.category_id, (counter.get(item.category_id) ?? 0) + 1);
      }

      setCategories(categoriesData);
      setItemsByCategory(counter);
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
      resetForm();
      setModalOpen(false);
    } catch (saveError) {
      setError(getMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function openNew() {
    resetForm();
    setModalOpen(true);
  }

  function startEdit(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      sortOrder: category.sort_order,
      published: category.published,
    });
    setModalOpen(true);
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(`Excluir categoria "${category.name}"?`);
    if (!confirmed) return;

    setError(null);
    try {
      await deleteCategory(category.id);
      await load();
    } catch (deleteError) {
      setError(getMessage(deleteError));
    }
  }

  async function handleTogglePublished(category: Category) {
    setError(null);
    try {
      await saveCategory({
        id: category.id,
        name: category.name,
        sortOrder: category.sort_order,
        published: !category.published,
      });
      await load();
    } catch (toggleError) {
      setError(getMessage(toggleError));
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  return (
    <section className="section">
      <header className="page-header">
        <div>
          <h1>Categorias</h1>
          <p className="text-muted">
            {categories.length} categorias cadastradas • {totalItems} itens vinculados
          </p>
        </div>
        <div className="toolbar-actions">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button onClick={openNew}>+ Nova Categoria</Button>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="text-muted">Carregando categorias...</p> : null}

      {!loading && categories.length === 0 ? (
        <Card>
          <p className="text-muted">Nenhuma categoria cadastrada.</p>
        </Card>
      ) : null}

      <div className="category-grid">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={["category-card", !category.published ? "category-card--draft" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="category-card__head">
              <h3>{category.name}</h3>
              <Badge variant={category.published ? "success" : "warning"}>
                {category.published ? "Publicado" : "Rascunho"}
              </Badge>
            </div>

            {!category.published ? (
              <div className="draft-note">Rascunho (Invisível no App)</div>
            ) : null}

            <p className="text-muted">Ordem de exibição: {category.sort_order}</p>
            <p className="text-muted">Itens vinculados: {itemsByCategory.get(category.id) ?? 0}</p>
            <p className="text-muted">Atualizado em: {formatDate(category.updated_at)}</p>

            <div className="category-card__actions">
              <Button variant="outline" size="sm" onClick={() => startEdit(category)}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void handleTogglePublished(category)}>
                {category.published ? "Despublicar" : "Publicar"}
              </Button>
              <Button variant="danger" size="sm" onClick={() => void handleDelete(category)}>
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? "Editar Categoria" : "Nova Categoria"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="category-form" disabled={saving}>
              {saving ? "Salvando..." : form.id ? "Salvar Categoria" : "Criar Categoria"}
            </Button>
          </>
        }
      >
        <form id="category-form" className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <Input
            label="Ordem"
            type="number"
            value={String(form.sortOrder)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value || 0) }))
            }
          />

          <label className="checkbox-row span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
            />
            Publicada
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

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
