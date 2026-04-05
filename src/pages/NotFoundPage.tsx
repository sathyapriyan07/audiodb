import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFoundPage() {
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        The page you’re looking for doesn’t exist.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary">Go home</Button>
        </Link>
      </div>
    </Card>
  );
}
