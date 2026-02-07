import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, Card, Input } from "./ui";

type LoginFormProps = {
  onSuccess: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(`Login failed: ${signInError.message}`);
      return;
    }

    onSuccess();
  }

  return (
    <div className="auth-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <Card className="login-card">
          <h1>Bizu EB Admin</h1>
          <p>Entre com email e senha do Supabase Auth.</p>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error ? <div className="error-box">{error}</div> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
