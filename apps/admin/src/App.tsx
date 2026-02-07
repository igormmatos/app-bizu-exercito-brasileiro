import { useState } from "react";
import { AdminShell, type AdminView } from "./components/AdminShell";
import { AuditFeed } from "./components/AuditFeed";
import { AuthGate } from "./components/AuthGate";
import { CategoryManager } from "./components/CategoryManager";
import { Dashboard } from "./components/Dashboard";
import { ItemManager } from "./components/ItemManager";
import { SuggestionsManager } from "./components/SuggestionsManager";

export default function App() {
  const [view, setView] = useState<AdminView>("dashboard");

  return (
    <AuthGate>
      {({ user, signOut }) => (
        <AdminShell user={user} activeView={view} onChangeView={setView} onSignOut={signOut}>
          {view === "dashboard" ? <Dashboard /> : null}
          {view === "items" ? <ItemManager /> : null}
          {view === "categories" ? <CategoryManager /> : null}
          {view === "suggestions" ? <SuggestionsManager /> : null}
          {view === "audit" ? <AuditFeed /> : null}
        </AdminShell>
      )}
    </AuthGate>
  );
}
