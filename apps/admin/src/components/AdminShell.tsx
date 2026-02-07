import type { User } from "@supabase/supabase-js";
import {
  FileText,
  FolderTree,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

export type AdminView = "dashboard" | "items" | "categories" | "suggestions" | "audit";

type AdminShellProps = {
  user: User;
  activeView: AdminView;
  onChangeView: (view: AdminView) => void;
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

const MENU_ITEMS: Array<{ id: AdminView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "items", label: "Gerenciar Conteudo", icon: FileText },
  { id: "categories", label: "Categorias", icon: FolderTree },
  { id: "suggestions", label: "Sugestoes", icon: MessageSquareMore },
  { id: "audit", label: "Auditoria", icon: ShieldCheck },
];

export function AdminShell({ user, activeView, onChangeView, onSignOut, children }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand__icon">
            <Shield size={18} />
          </div>
          <div>
            <p className="sidebar-brand__title">BIZUS ADMIN</p>
            <p className="sidebar-brand__subtitle">Painel de Operacoes</p>
          </div>
        </div>

        <div className="sidebar-user">
          <p className="sidebar-user__label">Usuario Logado</p>
          <p className="sidebar-user__name">{resolveUserName(user)}</p>
          <p className="sidebar-user__email">{user.email ?? user.id}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={["sidebar-link", activeView === item.id ? "is-active" : ""].filter(Boolean).join(" ")}
                onClick={() => onChangeView(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => onChangeView("dashboard")}>
            <Home size={16} />
            <span>Voltar ao Inicio</span>
          </button>
          <button className="sidebar-link sidebar-link--danger" onClick={() => void onSignOut()}>
            <LogOut size={16} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main__content">{children}</div>
      </main>
    </div>
  );
}

function resolveUserName(user: User): string {
  const fromMeta =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

  if (fromMeta && fromMeta.trim()) {
    return fromMeta.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Operador";
}
