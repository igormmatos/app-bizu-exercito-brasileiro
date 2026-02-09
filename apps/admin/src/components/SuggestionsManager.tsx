import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  listSuggestions,
  type Suggestion,
  type SuggestionStatus,
  type SuggestionStatusFilter,
  SuggestionsPermissionError,
  updateSuggestionStatus,
} from "../lib/suggestionsApi";
import { Badge, Button, Card, Input, Modal } from "./ui";

const PAGE_SIZE = 50;
const BASE_CATEGORY_OPTIONS = ["Conteúdo", "Bug", "UX", "Outro"];

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
      if (!category || seen.has(category)) continue;
      seen.add(category);
      options.push(category);
    }

    if (categoryFilter !== "all" && categoryFilter && !seen.has(categoryFilter)) {
      options.unshift(categoryFilter);
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
    setStatusReadOnly(false);
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
      setStatusReadOnly(false);
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
      <header className="page-header">
        <div>
          <h1>Sugestões</h1>
          <p className="text-muted">{suggestions.length} registros na listagem atual</p>
        </div>
        <Button variant="outline" onClick={() => void refreshFirstPage()} disabled={loading}>
          Atualizar
        </Button>
      </header>

      <Card>
        <form className="filters-grid" onSubmit={handleSearch}>
          <label className="ui-field">
            <span className="ui-field__label">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as SuggestionStatusFilter)}
              className="ui-select"
            >
              <option value="all">Todos</option>
              <option value="new">new</option>
              <option value="triaged">triaged</option>
              <option value="done">done</option>
            </select>
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Categoria</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="ui-select">
              <option value="all">Todas</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Busca (mensagem)"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ex: login, conteúdo, erro..."
          />

          <div className="filters-actions">
            <Button type="submit">Buscar</Button>
          </div>
        </form>
      </Card>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="text-muted">Carregando sugestões...</p> : null}

      {!loading && suggestions.length === 0 ? (
        <Card>
          <p className="text-muted">Nenhuma sugestão encontrada.</p>
        </Card>
      ) : null}

      {!loading && suggestions.length > 0 ? (
        <Card className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Criada em</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Contato</th>
                <th>Mensagem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={suggestion.id}>
                  <td>{formatDate(suggestion.created_at)}</td>
                  <td>
                    <Badge variant={statusBadgeVariant(suggestion.status)}>{suggestion.status}</Badge>
                  </td>
                  <td>{suggestion.category ?? "-"}</td>
                  <td>{suggestion.contact ?? "-"}</td>
                  <td className="message-preview">{toPreview(suggestion.message)}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => openDetails(suggestion)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore ? (
            <div className="actions">
              <Button variant="ghost" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Modal
        open={Boolean(selected)}
        title="Detalhe da sugestão"
        onClose={closeDetails}
        footer={
          <>
            <Button variant="outline" onClick={closeDetails}>
              Fechar
            </Button>
            <Button
              onClick={() => void handleSaveStatus()}
              disabled={statusReadOnly || savingStatus || !selected || statusDraft === selected.status}
            >
              {savingStatus ? "Salvando..." : "Salvar status"}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="suggestion-detail">
            <div className="suggestion-detail-grid">
              <div>
                <strong>Criada em:</strong> {formatDate(selected.created_at)}
              </div>
              <div>
                <strong>Status:</strong> <Badge variant={statusBadgeVariant(selected.status)}>{selected.status}</Badge>
              </div>
              <div>
                <strong>Categoria:</strong> {selected.category ?? "-"}
              </div>
              <div>
                <strong>Contato:</strong> {selected.contact ?? "-"}
              </div>
              <div>
                <strong>Versão do app:</strong> {selected.app_version ?? "-"}
              </div>
              <div>
                <strong>Dispositivo:</strong> {selected.device ?? "-"}
              </div>
            </div>

            <Card>
              <strong>Mensagem</strong>
              <p className="message-full">{selected.message}</p>
            </Card>

            <label className="ui-field">
              <span className="ui-field__label">Atualizar status</span>
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as SuggestionStatus)}
                disabled={statusReadOnly}
                className="ui-select"
              >
                <option value="new">new</option>
                <option value="triaged">triaged</option>
                <option value="done">done</option>
              </select>
            </label>

            {statusReadOnly ? (
              <div className="readonly-note">Sem permissão para alterar status; somente leitura.</div>
            ) : null}
            {modalNotice ? <div className="error-box">{modalNotice}</div> : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

function statusBadgeVariant(status: SuggestionStatus): "success" | "warning" | "neutral" | "info" {
  if (status === "done") return "success";
  if (status === "triaged") return "info";
  return "warning";
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
