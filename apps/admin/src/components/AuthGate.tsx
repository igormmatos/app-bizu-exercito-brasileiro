import { ReactNode, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { LoginForm } from "./LoginForm";

type AuthGateProps = {
  children: (context: { user: User; signOut: () => Promise<void> }) => ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setAuthError(`Auth session error: ${error.message}`);
          setLoading(false);
          return;
        }
        setSession(data.session);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setAuthError(`Auth session error: ${String(error)}`);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Logout failed: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="ui-card">Carregando sessão...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        {authError ? (
          <div className="global-banner error-box">{authError}</div>
        ) : null}
        <LoginForm onSuccess={() => setAuthError(null)} />
      </>
    );
  }

  return (
    <>
      {authError ? (
        <div className="global-banner error-box">{authError}</div>
      ) : null}
      {children({ user: session.user, signOut: handleSignOut })}
    </>
  );
}
