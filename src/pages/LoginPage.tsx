import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle, signInWithMagicLink } from "@/services/auth/auth";
import { useAuth } from "@/services/auth/AuthProvider";
import { toErrorMessage } from "@/services/db/errors";

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from ?? "/library";

  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  React.useEffect(() => {
    if (!isLoading && user) navigate(from, { replace: true });
  }, [from, isLoading, navigate, user]);

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-3xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] dark:bg-white dark:text-slate-900">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-semibold">Sign in</div>
              <div className="text-sm text-[rgb(var(--muted))]">Favorites, playlists, and recently played.</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={async () => {
                setError(null);
                try {
                  await signInWithGoogle();
                } catch (e) {
                  setError(toErrorMessage(e));
                }
              }}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
              <div className="text-xs text-[rgb(var(--muted))]">or</div>
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
            </div>

            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(async (values) => {
                setError(null);
                setSent(false);
                try {
                  await signInWithMagicLink(values.email);
                  setSent(true);
                } catch (e) {
                  setError(toErrorMessage(e));
                }
              })}
            >
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Email</div>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                  <Input className="pl-9" placeholder="you@example.com" {...form.register("email")} />
                </div>
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending…" : "Send magic link"}
              </Button>
            </form>

            {sent ? (
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-black/5 p-3 text-sm dark:bg-white/5">
                Check your email for the sign-in link.
              </div>
            ) : null}

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="pt-2 text-xs text-[rgb(var(--muted))]">
              Admins sign in at <Link to="/admin/login" className="underline">/admin/login</Link>.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

