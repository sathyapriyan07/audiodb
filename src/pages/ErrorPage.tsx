import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ErrorPage() {
  const err = useRouteError();
  const message = isRouteErrorResponse(err)
    ? `${err.status} ${err.statusText}`
    : err instanceof Error
      ? err.message
      : "Unexpected error";

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{message}</p>
      <div className="mt-6 flex gap-2">
        <Link to="/">
          <Button variant="primary">Go home</Button>
        </Link>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </Card>
  );
}
