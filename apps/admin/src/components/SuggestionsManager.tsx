import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  listSuggestions,
  type Suggestion,
  type SuggestionStatus,
  type SuggestionStatusFilter,
  SuggestionsPermissionError,
  updateSuggestionStatus,
} from "../lib/suggestionsApi";

const PAGE_SIZE = 50;
const BASE_CATEGORY_OPTIONS = ["Conteudo", "Bug", "UX", "Outro"];

export function SuggestionsManager() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SuggestionStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [statusDraft, setStatusDraft] = useState<SuggestionStatus>("new");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusReadOnly, setStatusReadOnly] = useState(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];

    for (const baseCategory of BASE_CATEGORY_OPTIONS) {
      seen.add(baseCategory);
      options.push(baseCategory);
    }

    for (const suggestion of suggestions) {
      const category = suggestion.category?.trim();
      if (!category || seen.has(category)) {
        continue;
      }
      seen.add(category);
      options.push(category);
    }

    const normalizedFilterCategory = categoryFilter.trim();
    if (normalizedFilterCategory && normalizedFilterCategory !== "all" && !seen.has(normalizedFilterCategory)) {
      options.unshift(normalizedFilterCategory);
    }

    return options;
  }, [categoryFilter, suggestions]);

  useEffect(() => {
    void refreshFirstPage();
  }, [statusFilter, categoryFilter, searchTerm]);

  async function refreshFirstPage() {
    setLoading(true);
    setError(null);

    try {
      const result = await listSuggestions({
        page: 0,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
      });

      setSuggestions(result.items);
      setHasMore(result.hasMore);
      setPage(0);
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!hasMore || loading || loadingMore) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);

    try {
      const result = await listSuggestions({
        page: nextPage,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
      });

      setSuggestions((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function openDetails(suggestion: Suggestion) {
    setSelected(suggestion);
    setStatusDraft(suggestion.status);
    setModalNotice(null);
  }

  function closeDetails() {
    setSelected(null);
    setModalNotice(null);
  }

  async function handleSaveStatus() {
    if (!selected) {
      return;
    }

    setSavingStatus(true);
    setModalNotice(null);

    try {
      const updated = await updateSuggestionStatus(selected.id, statusDraft);
      setSuggestions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
      setStatusDraft(updated.status);
    } catch (updateError) {
      if (updateError instanceof SuggestionsPermissionError) {
        setStatusReadOnly(true);
        setModalNotice(updateError.message);
      } else {
        setModalNotice(getMessage(updateError));
      }
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <section className="section">
      <header className="section-header">
        <h2>Sugestoes</h2>
        <button onClick={() => void refreshFirstPage()} disabled={loading}>
          Atualizar
        </button>
      </header>

      <form className="panel filters" onSubmit={handleSearch}>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as SuggestionStatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="new">new</option>
            <option value="triaged">triaged</option>
            <option value="done">done</option>
          </select>
        </label>

        <label>
          Categoria
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">Todas</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="suggestions-search">
          Busca (mensagem)
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ex: login, conteudo, erro..."
          />
        </label>

        <div className="actions">
          <button type="submit">Buscar</button>
        </div>
      </form>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="panel">
        <h3>Lista ({suggestions.length})</h3>
        {loading ? <p>Carregando sugestoes...</p> : null}
        {!loading && suggestions.length === 0 ? <p>Nenhuma sugestao encontrada.</p> : null}

        {!loading && suggestions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Criada em</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Contato</th>
                <th>Mensagem</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={suggestion.id}>
                  <td>{formatDate(suggestion.created_at)}</td>
                  <td>
                    <span className={`status-badge status-${suggestion.status}`}>{suggestion.status}</span>
                  </td>
                  <td>{suggestion.category ?? "-"}</td>
                  <td>{suggestion.contact ?? "-"}</td>
                  <td className="message-preview">{toPreview(suggestion.message)}</td>
                  <td className="actions">
                    <button type="button" onClick={() => openDetails(suggestion)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {hasMore ? (
          <div className="actions">
            <button type="button" onClick={() => void handleLoadMore()} disabled={loadingMore}>
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="suggestion-detail-title">
          <div className="modal-panel">
            <header className="section-header">
              <h3 id="suggestion-detail-title">Detalhe da sugestao</h3>
              <button type="button" className="ghost" onClick={closeDetails}>
                Fechar
              </button>
            </header>

            <div className="suggestion-detail-grid">
              <div>
                <strong>Criada em:</strong> {formatDate(selected.created_at)}
              </div>
              <div>
                <strong>Status:</strong> <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
              </div>
              <div>
                <strong>Categoria:</strong> {selected.category ?? "-"}
              </div>
              <div>
                <strong>Contato:</strong> {selected.contact ?? "-"}
              </div>
              <div>
                <strong>App version:</strong> {selected.app_version ?? "-"}
              </div>
              <div>
                <strong>Device:</strong> {selected.device ?? "-"}
              </div>
            </div>

            <div className="panel">
              <strong>Mensagem</strong>
              <p className="message-full">{selected.message}</p>
            </div>

            <div className="panel form-grid">
              <h4>Atualizar status</h4>
              <label>
                Status
                <select
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as SuggestionStatus)}
                  disabled={statusReadOnly}
                >
                  <option value="new">new</option>
                  <option value="triaged">triaged</option>
                  <option value="done">done</option>
                </select>
              </label>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => void handleSaveStatus()}
                  disabled={statusReadOnly || savingStatus || statusDraft === selected.status}
                >
                  {savingStatus ? "Salvando..." : "Salvar"}
                </button>
              </div>
              {statusReadOnly ? (
                <div className="readonly-note">Sem permissao para alterar status; somente leitura.</div>
              ) : null}
              {modalNotice ? <div className="error-box">{modalNotice}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("pt-BR");
}

function toPreview(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 90) {
    return normalized;
  }
  return `${normalized.slice(0, 87)}...`;
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
