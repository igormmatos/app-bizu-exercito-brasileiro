import { BarChart3, Boxes, CheckCircle2, FolderOpen, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchCategories, fetchItems } from "../lib/catalogApi";
import { listSuggestions } from "../lib/suggestionsApi";
import { Button, Card } from "./ui";

type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  icon: typeof FolderOpen;
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [chartData, setChartData] = useState<Array<{ name: string; total: number }>>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [categories, items, suggestionsResult, newSuggestionsResult] = await Promise.all([
        fetchCategories(),
        fetchItems({ categoryId: "all", published: "all" }),
        listSuggestions({ page: 0, pageSize: 300, status: "all" }),
        listSuggestions({ page: 0, pageSize: 300, status: "new" }),
      ]);

      const publishedItems = items.filter((item) => item.published).length;
      const suggestions = suggestionsResult.items;
      const newSuggestions = newSuggestionsResult.items;

      setMetrics([
        { id: "m1", label: "Categorias", value: String(categories.length), icon: FolderOpen },
        { id: "m2", label: "Conteudos", value: String(items.length), icon: Boxes },
        { id: "m3", label: "Publicados", value: String(publishedItems), icon: CheckCircle2 },
        { id: "m4", label: "Sugestoes (new)", value: String(newSuggestions.length), icon: MessageSquareText },
      ]);

      const data = buildChartData(categories, items);
      setChartData(data);

      // Keep a tiny dependency on suggestions for future expansion without business logic changes.
      void suggestions;
    } catch (loadError) {
      setError(getMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Visao geral do catalogo e status de publicacao.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Atualizar
        </Button>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      {loading ? <p className="text-muted">Carregando metricas...</p> : null}

      {!loading ? (
        <>
          <div className="metric-grid">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.id} className="metric-card">
                  <div className="metric-card__top">
                    <span className="metric-card__label">{metric.label}</span>
                    <span className="metric-card__icon">
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="metric-card__value">{metric.value}</p>
                </Card>
              );
            })}
          </div>

          <Card
            title="Distribuicao de Conteudo por Categoria"
            subtitle="Itens cadastrados por categoria (publicados + rascunhos)"
            className="chart-card"
          >
            {chartData.length === 0 ? (
              <p className="text-muted">Sem dados para o grafico.</p>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#40694D" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="dashboard-footnote">
            <p className="text-muted">
              <BarChart3 size={14} /> Visual de dashboard em modo MVP, mantendo a mesma base de dados e regras atuais.
            </p>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function buildChartData(
  categories: Array<{ id: string; name: string }>,
  items: Array<{ category_id: string }>,
): Array<{ name: string; total: number }> {
  const totals = new Map<string, number>();

  for (const category of categories) {
    totals.set(category.id, 0);
  }

  for (const item of items) {
    totals.set(item.category_id, (totals.get(item.category_id) ?? 0) + 1);
  }

  return categories
    .map((category) => ({
      name: truncateLabel(category.name, 16),
      total: totals.get(category.id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function truncateLabel(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
