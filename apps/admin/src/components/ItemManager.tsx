import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  parseSafeHtml,
  type CatalogItem,
  type Category,
  type HtmlBlockNode,
  type HtmlInlineNode,
  type ItemType,
} from "@bizu/shared";
import {
  deleteItem,
  fetchCategories,
  fetchItems,
  getPublicFileUrl,
  saveItem,
  updateItemPublished,
  type ItemPublishedFilter,
  type UploadProgressInfo,
} from "../lib/catalogApi";
import { ItemPreviewModal } from "./ItemPreviewModal";
import { Badge, Button, Card, Input, Modal } from "./ui";

type ItemFormState = {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  categoryId: string;
  tagsInput: string;
  published: boolean;
  link: string;
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
  link: "",
  textBody: "",
  existingStoragePath: null,
};

type SortKey = "title" | "category" | "type" | "published" | "updated_at";
type SortDirection = "asc" | "desc";
type UploadStatus = "idle" | "uploading" | "finalizing" | "error" | "cancelled";

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
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [uploadAbortController, setUploadAbortController] = useState<AbortController | null>(null);
  const [updatingPublishedIds, setUpdatingPublishedIds] = useState<Set<string>>(new Set());
  const textBodyRef = useRef<HTMLTextAreaElement | null>(null);

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);
  const sortedItems = useMemo(() => {
    const data = [...visibleItems];
    data.sort((a, b) => compareItems(a, b, sortKey, sortDirection, categoriesById));
    return data;
  }, [visibleItems, sortKey, sortDirection, categoriesById]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);
  const htmlPreviewBlocks = useMemo(() => parseSafeHtml(form.textBody), [form.textBody]);

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadItems();
  }, [filterCategory, filterPublished]);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterPublished, pageSize]);

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
    resetUploadState();
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
      link: item.link ?? "",
      textBody: item.text_body ?? "",
      existingStoragePath: item.storage_path ?? null,
    });
    setSelectedFile(null);
    resetUploadState();
    setModalOpen(true);
  }

  function resetUploadState() {
    setUploadStatus("idle");
    setUploadProgress(null);
    setUploadAbortController(null);
  }

  function closeEditorModal() {
    if (saving) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    resetUploadState();
  }

  function handleCancelUpload() {
    uploadAbortController?.abort();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.categoryId) {
      setError("Category is required.");
      return;
    }

    const normalizedLink = form.link.trim();
    if (form.type === "video") {
      if (selectedFile) {
        setError("Itens de vídeo não aceitam upload de arquivo. Informe apenas o link do YouTube.");
        return;
      }

      if (!normalizedLink) {
        setError("Link do YouTube é obrigatório para itens de vídeo.");
        return;
      }

      if (!isYoutubeUrl(normalizedLink)) {
        setError("Informe um link válido do YouTube (youtube.com ou youtu.be).");
        return;
      }
    }

    if (form.type !== "text" && form.type !== "video" && !selectedFile && !form.existingStoragePath) {
      setError("File upload is required for pdf, audio or image items.");
      return;
    }

    if ((form.type === "text" || form.type === "image") && selectedFile && !selectedFile.type.startsWith("image/")) {
      setError("Para conteúdos de texto/imagem, selecione um arquivo de imagem válido.");
      return;
    }

    const uploadingNewFile = Boolean(selectedFile);
    const uploadController = uploadingNewFile ? new AbortController() : null;

    if (uploadingNewFile && selectedFile) {
      setUploadStatus("uploading");
      setUploadProgress({
        loadedBytes: 0,
        totalBytes: selectedFile.size,
        percent: 0,
        remainingBytes: selectedFile.size,
      });
      setUploadAbortController(uploadController);
    } else {
      resetUploadState();
    }

    setSaving(true);
    try {
      await saveItem(
        {
          id: form.id || undefined,
          title: form.title,
          description: form.description,
          type: form.type,
          categoryId: form.categoryId,
          tagsInput: form.tagsInput,
          published: form.published,
          link: normalizedLink,
          textBody: form.textBody,
          existingStoragePath: form.existingStoragePath,
          file: selectedFile,
        },
        uploadingNewFile
          ? {
              signal: uploadController?.signal,
              onUploadProgress: (progress) => {
                setUploadProgress(progress);
                if (progress.percent >= 100) {
                  setUploadStatus("finalizing");
                } else {
                  setUploadStatus("uploading");
                }
              },
            }
          : undefined,
      );

      await loadItems();
      setForm(EMPTY_FORM);
      setSelectedFile(null);
      resetUploadState();
      setModalOpen(false);
    } catch (saveError) {
      if (isAbortError(saveError)) {
        setUploadStatus("cancelled");
        setError("Upload cancelado pelo usuário.");
      } else {
        if (uploadingNewFile) {
          setUploadStatus("error");
        }
        setError(getMessage(saveError));
      }
    } finally {
      setSaving(false);
      setUploadAbortController(null);
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
        resetUploadState();
      }
    } catch (deleteError) {
      setError(getMessage(deleteError));
    }
  }

  async function handleTogglePublished(item: CatalogItem, nextPublished: boolean) {
    if (updatingPublishedIds.has(item.id)) {
      return;
    }

    setError(null);
    setUpdatingPublishedIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });

    try {
      await updateItemPublished(item.id, nextPublished);
      await loadItems();
    } catch (toggleError) {
      setError(getMessage(toggleError));
    } finally {
      setUpdatingPublishedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  function handleTypeChange(nextType: ItemType) {
    setForm((prev) => ({
      ...prev,
      type: nextType,
      link: nextType === "video" ? prev.link : "",
      textBody: nextType === "text" || nextType === "image" || nextType === "audio" || nextType === "video" ? prev.textBody : "",
      existingStoragePath: isStoragePathCompatibleWithType(prev.existingStoragePath, nextType)
        ? prev.existingStoragePath
        : null,
    }));
    setSelectedFile(null);
    resetUploadState();
  }

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "updated_at" ? "desc" : "asc");
  }

  function handleInsertBold() {
    insertHtmlWrapperTag("strong", "texto em destaque");
  }

  function handleInsertItalic() {
    insertHtmlWrapperTag("em", "texto em ênfase");
  }

  function handleInsertList() {
    const textarea = textBodyRef.current;
    const value = form.textBody;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(selectionStart, selectionEnd).trim() || "Item";
    const items = selected
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `  <li>${line}</li>`)
      .join("\n");
    const normalized = `<ul>\n${items || "  <li>Item</li>"}\n</ul>`;
    const nextValue = `${value.slice(0, selectionStart)}${normalized}${value.slice(selectionEnd)}`;

    setForm((prev) => ({ ...prev, textBody: nextValue }));
    window.requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + normalized.length);
    });
  }

  function handleInsertLink() {
    const textarea = textBodyRef.current;
    const value = form.textBody;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(selectionStart, selectionEnd).trim() || "texto";
    const template = `<a href="https://">${selected}</a>`;
    const nextValue = `${value.slice(0, selectionStart)}${template}${value.slice(selectionEnd)}`;
    const urlStart = selectionStart + "<a href=\"".length;
    const urlEnd = urlStart + "https://".length;

    setForm((prev) => ({ ...prev, textBody: nextValue }));
    window.requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlEnd);
    });
  }

  function insertHtmlWrapperTag(tagName: "strong" | "em", placeholder: string) {
    const textarea = textBodyRef.current;
    const value = form.textBody;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const insertion = `<${tagName}>${selected}</${tagName}>`;
    const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
    const nextStart = selectionStart + tagName.length + 2;
    const nextEnd = nextStart + selected.length;

    setForm((prev) => ({ ...prev, textBody: nextValue }));
    window.requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <section className="section">
      <header className="page-header">
        <div>
          <h1>Gerenciar Conteúdo</h1>
          <p className="text-muted">{sortedItems.length} itens listados</p>
        </div>
        <Button startIcon={<Plus size={15} />} onClick={openNew}>
          Novo Item
        </Button>
      </header>

      <Card className="content-toolbar">
        <Input
          placeholder="Buscar por título, descrição ou tags..."
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
          <span className="ui-field__label">Publicação</span>
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

      {!loading && sortedItems.length === 0 ? (
        <Card>
          <p className="text-muted">Nenhum item encontrado para os filtros atuais.</p>
        </Card>
      ) : null}

      {!loading && sortedItems.length > 0 ? (
        <Card className="table-card">
          <div className="datatable-head">
            <div className="datatable-head__info">
              Mostrando {paginatedItems.length} de {sortedItems.length} itens
            </div>
            <label className="datatable-page-size">
              <span>Linhas por página</span>
              <select
                value={String(pageSize)}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="ui-select"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>

          <table className="table table--items">
            <thead>
              <tr>
                <th>
                  <button type="button" className="datatable-sort" onClick={() => handleSort("title")}>
                    Título <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>
                  <button type="button" className="datatable-sort" onClick={() => handleSort("category")}>
                    Categoria <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>
                  <button type="button" className="datatable-sort" onClick={() => handleSort("type")}>
                    Tipo <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>Versão</th>
                <th>
                  <button type="button" className="datatable-sort" onClick={() => handleSort("published")}>
                    Status <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>
                  <button type="button" className="datatable-sort" onClick={() => handleSort("updated_at")}>
                    Atualizado <ArrowUpDown size={13} />
                  </button>
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table-title-cell">
                      <strong className="table-title-cell__title" title={item.title}>
                        {item.title}
                      </strong>
                      <small className="text-muted table-title-cell__description" title={item.description ?? "-"}>
                        {item.description ?? "-"}
                      </small>
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
                    <div className="status-inline-cell">
                      <input
                        type="checkbox"
                        checked={item.published}
                        onChange={(event) => void handleTogglePublished(item, event.target.checked)}
                        disabled={loading || updatingPublishedIds.has(item.id)}
                        aria-label={`Alterar status de publicação de ${item.title}`}
                        className="status-inline-cell__checkbox"
                      />
                      <Badge variant={item.published ? "success" : "warning"}>
                        {item.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                  </td>
                  <td>{formatDate(item.updated_at)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="icon-button icon-button--preview"
                        onClick={() => setPreviewItem(item)}
                        title="Visualizar"
                      >
                        <Eye size={15} />
                      </button>
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

          <div className="datatable-footer">
            <span className="text-muted">
              Página {currentPage} de {totalPages}
            </span>
            <div className="datatable-footer__actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                startIcon={<ChevronLeft size={14} />}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                startIcon={<ChevronRight size={14} />}
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Modal
        open={modalOpen}
        title={form.id ? "Editar Conteúdo" : "Novo Conteúdo"}
        onClose={closeEditorModal}
        width="xl"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={closeEditorModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="item-form" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Conteúdo"}
            </Button>
          </>
        }
      >
        <form id="item-form" className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Título"
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
              <option value="video">video</option>
            </select>
          </label>

          <Input
            label="Tags (separadas por vírgula)"
            value={form.tagsInput}
            onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
          />

          <label className="ui-field span-2">
            <span className="ui-field__label">Descrição</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="ui-textarea"
            />
          </label>

          {form.type === "text" || form.type === "image" ? (
            <div className="ui-field span-2">
              <span className="ui-field__label">
                {form.type === "text"
                  ? "Texto (HTML simples, obrigatório)"
                  : "Texto complementar (HTML simples, opcional)"}
              </span>

              <div className="markdown-toolbar" role="toolbar" aria-label="Formatação de texto">
                <button type="button" className="markdown-toolbar__btn" onClick={handleInsertBold}>
                  Negrito
                </button>
                <button type="button" className="markdown-toolbar__btn" onClick={handleInsertItalic}>
                  Itálico
                </button>
                <button type="button" className="markdown-toolbar__btn" onClick={handleInsertList}>
                  Lista
                </button>
                <button type="button" className="markdown-toolbar__btn" onClick={handleInsertLink}>
                  Link
                </button>
              </div>

              <textarea
                ref={textBodyRef}
                rows={8}
                value={form.textBody}
                onChange={(event) => setForm((prev) => ({ ...prev, textBody: event.target.value }))}
                className="ui-textarea markdown-editor"
                required={form.type === "text"}
                placeholder='Ex.: <p><strong>Título</strong> com <em>ênfase</em> e <a href="https://...">link</a></p>'
              />

              <div className="markdown-preview">
                <span className="ui-field__label">Pré-visualização</span>
                <div className="markdown-preview__body">
                  {htmlPreviewBlocks.length > 0 ? (
                    renderHtmlBlocks(htmlPreviewBlocks)
                  ) : (
                    <p className="markdown-preview__empty">Nada para pré-visualizar.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {form.type === "video" ? (
            <label className="ui-field span-2">
              <span className="ui-field__label">Link (YouTube)</span>
              <input
                type="url"
                value={form.link}
                onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
                className="ui-input"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </label>
          ) : null}

          {form.type === "audio" || form.type === "video" ? (
            <label className="ui-field span-2">
              <span className="ui-field__label">Letra (opcional)</span>
              <textarea
                rows={6}
                value={form.textBody}
                onChange={(event) => setForm((prev) => ({ ...prev, textBody: event.target.value }))}
                className="ui-textarea"
                placeholder="Digite a letra da canção (opcional)"
              />
            </label>
          ) : null}

          {form.type !== "video" ? (
            <div className="ui-field span-2">
              <span className="ui-field__label">Upload ({uploadLabelByType(form.type)})</span>
              <label className="upload-dropzone">
                <UploadCloud size={18} />
                <p>{uploadHintByType(form.type)}</p>
                <input
                  type="file"
                  accept={getAcceptForType(form.type)}
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null);
                    setUploadStatus("idle");
                    setUploadProgress(null);
                  }}
                  required={form.type !== "text" && !form.id && !form.existingStoragePath}
                  disabled={saving}
                />
                {form.existingStoragePath ? (
                  <small>
                    Arquivo atual: <code>{form.existingStoragePath}</code>
                  </small>
                ) : null}
              </label>

              {form.existingStoragePath ? (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setForm((prev) => ({ ...prev, existingStoragePath: null }));
                  }}
                >
                  Remover arquivo atual
                </Button>
              ) : null}

              {uploadProgress ? (
                <div className="upload-progress-panel" role="status" aria-live="polite">
                  <div className="upload-progress-track">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress.percent}%` }} />
                  </div>
                  <p className="upload-progress-label">
                    {uploadProgress.percent}% • faltam {formatMegabytes(uploadProgress.remainingBytes)} de{" "}
                    {formatMegabytes(uploadProgress.totalBytes)}
                  </p>
                  {uploadStatus === "finalizing" ? (
                    <p className="upload-progress-note">Finalizando cadastro...</p>
                  ) : null}
                  {uploadStatus === "cancelled" ? (
                    <p className="upload-progress-note upload-progress-note--warning">Upload cancelado.</p>
                  ) : null}
                  {uploadStatus === "error" ? (
                    <p className="upload-progress-note upload-progress-note--error">Falha no upload.</p>
                  ) : null}
                </div>
              ) : null}

              {saving && uploadStatus === "uploading" && uploadAbortController ? (
                <Button variant="outline" type="button" onClick={handleCancelUpload}>
                  Cancelar upload
                </Button>
              ) : null}
            </div>
          ) : null}

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

      <ItemPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
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
  if (type === "video") return "";
  return "image/*";
}

function uploadLabelByType(type: ItemType): string {
  if (type === "text") return "imagem opcional";
  if (type === "image") return "imagem obrigatória";
  if (type === "video") return "não aplicável";
  return type;
}

function uploadHintByType(type: ItemType): string {
  if (type === "text") return "Selecione uma imagem para complementar o texto (opcional)";
  if (type === "image") return "Selecione uma imagem para upload";
  if (type === "video") return "Upload não disponível para vídeo";
  return "Selecione um arquivo para upload";
}

function isStoragePathCompatibleWithType(storagePath: string | null, type: ItemType): boolean {
  if (!storagePath) return true;
  if (type === "text" || type === "image") {
    return storagePath.startsWith("image/");
  }
  if (type === "pdf") {
    return storagePath.startsWith("pdf/");
  }
  if (type === "video") {
    return false;
  }
  return storagePath.startsWith("audio/");
}

function isYoutubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be" ||
      hostname.endsWith(".youtu.be")
    );
  } catch {
    return false;
  }
}

function renderHtmlBlocks(blocks: HtmlBlockNode[]): JSX.Element {
  return (
    <div className="markdown-render">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`paragraph-${index}`} className="markdown-render__paragraph">
              {renderHtmlInlineNodes(block.inlines)}
            </p>
          );
        }

        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag key={`list-${index}`} className="markdown-render__list">
            {block.items.map((item, itemIndex) => (
              <li key={`list-item-${index}-${itemIndex}`}>{renderHtmlInlineNodes(item)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}

function renderHtmlInlineNodes(nodes: HtmlInlineNode[]): JSX.Element[] {
  return nodes.map((node, index) => {
    if (node.type === "br") {
      return <br key={`br-${index}`} />;
    }

    let content: JSX.Element = <span>{node.text}</span>;
    if (node.bold) {
      content = <strong>{content}</strong>;
    }
    if (node.italic) {
      content = <em>{content}</em>;
    }
    if (node.href) {
      content = (
        <a href={node.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
    return <span key={`text-${index}`}>{content}</span>;
  });
}

function compareItems(
  a: CatalogItem,
  b: CatalogItem,
  key: SortKey,
  direction: SortDirection,
  categoriesById: Map<string, string>,
): number {
  const factor = direction === "asc" ? 1 : -1;

  if (key === "title") {
    return factor * a.title.localeCompare(b.title, "pt-BR");
  }

  if (key === "category") {
    const categoryA = categoriesById.get(a.category_id) ?? a.category_id;
    const categoryB = categoriesById.get(b.category_id) ?? b.category_id;
    return factor * categoryA.localeCompare(categoryB, "pt-BR");
  }

  if (key === "type") {
    return factor * a.type.localeCompare(b.type, "pt-BR");
  }

  if (key === "published") {
    const statusA = a.published ? 1 : 0;
    const statusB = b.published ? 1 : 0;
    return factor * (statusA - statusB);
  }

  return factor * a.updated_at.localeCompare(b.updated_at, "pt-BR");
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function formatMegabytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const megaBytes = bytes / (1024 * 1024);
  return megaBytes >= 10 ? `${megaBytes.toFixed(1)} MB` : `${megaBytes.toFixed(2)} MB`;
}
