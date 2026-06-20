/**
 * Renders a JSON-LD structured-data block. Server component — the serialized
 * object is inlined into the static HTML so crawlers (notably Google Dataset
 * Search) can read it without executing any JavaScript.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own trusted catalog data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
