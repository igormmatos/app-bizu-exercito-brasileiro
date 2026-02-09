import { CheckCircle2, Edit3, FilePlus2, FolderTree, MessageSquareText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchItems } from "../lib/catalogApi";
import { listSuggestions } from "../lib/suggestionsApi";
import { Badge, Button, Card } from "./ui";

type AuditEntry = {
  id: string;
  type: "PUBLISH" | "LOGIN" | "UPDATE" | "CREATE";
  message: string;
  at: string;
  source: "items" | "categories" | "suggestions" | "auth";
};

export function AuditFeed() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [categories, items, suggestionsResult] = await Promise.all([
        fetchCategories(),
        fetchItems({ categoryId: "all", published: "all" }),
        listSuggestions({ page: 0, pageSize: 120, status: "all" }),
      ]);

      const categoryEntries: AuditEntry[] = categories.map((category) => ({
        id: `c-${category.id}`,
        type: category.published ? "PUBLISH" : "UPDATE",
        message: `Categoria "${category.name}" ${category.published ? "publicada" : "atualizada como rascunho"}.`,
        at: category.updated_at,
        source: "categories",
      }));

      const itemEntries: AuditEntry[] = items.map((item) => ({
        id: `i-${item.id}`,
        type: item.published ? "PUBLISH" : "UPDATE",
        message: `Conteúdo "${item.title}" ${item.published ? "publicado" : "atualizado"} (${item.type}).`,
        at: item.updated_at,
        source: "items",
      }));

      const suggestionEntries: AuditEntry[] = suggestionsResult.items.map((suggestion) => ({
        id: `s-${suggestion.id}`,
        type: "CREATE",
        message: `Nova sugestão recebida${suggestion.category ? ` (${suggestion.category})` : ""}.`,
        at: suggestion.created_at,
        source: "suggestions",
      }));

      const authEntry: AuditEntry = {
        id: "auth-current-session",
        type: "LOGIN",
        message: "Sessão autenticada no painel administrativo.",
        at: new Date().toISOString(),
        source: "auth",
      };

      const merged = [...itemEntries, ...categoryEntries, ...suggestionEntries, authEntry]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 40);

      setEntries(merged);
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  const groupedCount = useMemo(
    () => ({
      publish: entries.filter((e) => e.type === "PUBLISH").length,
      update: entries.filter((e) => e.type === "UPDATE").length,
      create: entries.filter((e) => e.type === "CREATE").length,
    }),
    [entries],
  );

  return (
    <section className="section">
      <header className="page-header">
        <div>
          <h1>Auditoria</h1>
          <p className="text-muted">
            Histórico consolidado de publicações, atualizações e sugestões recentes.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} startIcon={<ShieldCheck size={15} />}>
          Atualizar
        </Button>
      </header>

      <div className="audit-summary">
        <Badge variant="success">PUBLISH: {groupedCount.publish}</Badge>
        <Badge variant="info">UPDATE: {groupedCount.update}</Badge>
        <Badge variant="neutral">CREATE: {groupedCount.create}</Badge>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="text-muted">Carregando auditoria...</p> : null}

      {!loading && entries.length === 0 ? (
        <Card>
          <p className="text-muted">Nenhum evento encontrado.</p>
        </Card>
      ) : null}

      <div className="audit-list">
        {entries.map((entry) => (
          <Card key={entry.id} className="audit-item">
            <div className="audit-item__left">
              <span className="audit-item__icon">{iconBySource(entry.source)}</span>
              <div>
                <p className="audit-item__message">{entry.message}</p>
                <small className="text-muted">{entry.source}</small>
              </div>
            </div>
            <div className="audit-item__right">
              <Badge variant={badgeByType(entry.type)}>{entry.type}</Badge>
              <small className="text-muted">{formatDate(entry.at)}</small>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function iconBySource(source: AuditEntry["source"]) {
  if (source === "items") return <Edit3 size={14} />;
  if (source === "categories") return <FolderTree size={14} />;
  if (source === "suggestions") return <MessageSquareText size={14} />;
  if (source === "auth") return <CheckCircle2 size={14} />;
  return <FilePlus2 size={14} />;
}

function badgeByType(type: AuditEntry["type"]): "success" | "warning" | "neutral" | "info" {
  if (type === "PUBLISH") return "success";
  if (type === "LOGIN") return "warning";
  if (type === "UPDATE") return "info";
  return "neutral";
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("pt-BR");
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
