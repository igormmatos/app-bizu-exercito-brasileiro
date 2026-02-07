import { useState } from "react";
import { AuthGate } from "./components/AuthGate";
import { CategoryManager } from "./components/CategoryManager";
import { ItemManager } from "./components/ItemManager";

type View = "categories" | "items";

export default function App() {
  const [view, setView] = useState<View>("categories");

  return (
    <AuthGate>
      {({ user, signOut }) => (
        <div className="app-shell">
          <header className="topbar">
            <div>
              <h1>Bizu EB Admin MVP</h1>
              <p className="muted">Autenticado como {user.email ?? user.id}</p>
            </div>
            <button className="danger" onClick={() => void signOut()}>
              Sair
            </button>
          </header>

          <nav className="menu">
            <button
              className={view === "categories" ? "active" : ""}
              onClick={() => setView("categories")}
            >
              Categorias
            </button>
            <button className={view === "items" ? "active" : ""} onClick={() => setView("items")}>
              Itens
            </button>
          </nav>

          <main>{view === "categories" ? <CategoryManager /> : <ItemManager />}</main>
        </div>
      )}
    </AuthGate>
  );
}
