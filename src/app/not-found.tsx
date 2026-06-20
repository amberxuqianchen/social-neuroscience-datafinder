import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-4 py-28 text-center sm:px-6">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">
        The page or dataset you&apos;re looking for doesn&apos;t exist. It may have been moved or the
        link may be incorrect.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90">
          Go home
        </Link>
        <Link href="/datasets" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
          Browse datasets
        </Link>
      </div>
    </div>
  );
}
