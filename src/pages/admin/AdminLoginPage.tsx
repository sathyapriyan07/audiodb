import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { signInWithPassword } from "@/services/auth/auth";
import { toErrorMessage } from "@/services/db/errors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from ?? "/admin";

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signInWithPassword(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(toErrorMessage(err));
    }
  });

  return (
    <div className="container-app grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] dark:bg-white dark:text-slate-900">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-semibold">Admin sign in</div>
              <div className="text-sm text-[rgb(var(--muted))]">Supabase Auth (email + password)</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" autoComplete="email" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" autoComplete="current-password" {...register("password")} />
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-[rgb(var(--muted))]">
            Not an admin? <Link to="/" className="underline">Go back</Link>.
          </div>
        </Card>
      </div>
    </div>
  );
}

