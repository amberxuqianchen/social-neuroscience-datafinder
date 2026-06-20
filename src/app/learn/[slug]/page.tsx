import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import type { ReactNode } from "react";
import { getTutorial, TUTORIALS, type Tutorial } from "@/lib/tutorials";

interface PageProps {
  params: { slug: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return TUTORIALS.map((tutorial) => ({ slug: tutorial.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tutorial = getTutorial(params.slug);

  if (!tutorial) {
    return {
      title: "Tutorial not found",
    };
  }

  return {
    title: `${tutorial.title} · Learn`,
    description: tutorial.blurb,
  };
}

async function readTutorialMarkdown(tutorial: Tutorial) {
  const filePath = path.join(process.cwd(), "tutorials", tutorial.dir, "README.md");
  const markdown = await readFile(filePath, "utf8");

  return markdown.replace(/^# .+\n+/, "");
}

function normalizeHref(href: string, tutorial: Tutorial) {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }

  if (href.startsWith("#")) {
    return href;
  }

  const datasetMatch = href.match(/\.\.\/\.\.\/data\/datasets\/(.+)\.json$/);
  if (datasetMatch) {
    return `/datasets/${datasetMatch[1]}`;
  }

  if (href === "../../" || href === "../.." || href === "/") {
    return "/";
  }

  if (href === tutorial.notebook || href.endsWith(".ipynb")) {
    return "#notebook";
  }

  if (href.startsWith("code/")) {
    return "#code-files";
  }

  if (href.startsWith("results/")) {
    return "#result-files";
  }

  if (href === "requirements.txt") {
    return "#code-files";
  }

  return "#tutorial-files";
}

function renderInline(text: string, tutorial: Tutorial): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(
        <code key={`code-${tokenIndex}`} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={`strong-${tokenIndex}`}>{token.slice(2, -2)}</strong>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = normalizeHref(linkMatch[2], tutorial);
        const external = href.startsWith("http://") || href.startsWith("https://");

        nodes.push(
          <a
            key={`link-${tokenIndex}`}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
            className="font-medium text-brand hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = match.index + token.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function isMarkdownBlockStart(line: string) {
  const trimmed = line.trim();

  return (
    trimmed === "" ||
    trimmed.startsWith("```") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith(">") ||
    trimmed.startsWith("|") ||
    trimmed.startsWith("---") ||
    trimmed.startsWith("![") ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed)
  );
}

function renderTable(lines: string[], tutorial: Tutorial, key: string) {
  const rows = lines
    .filter((line) => !/^\|\s*[-:]+/.test(line.trim()))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

  const [head, ...body] = rows;

  return (
    <div key={key} className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-2 text-left">
          <tr>
            {head.map((cell, i) => (
              <th key={i} className="px-3 py-2 font-semibold">
                {renderInline(cell, tutorial)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top text-muted">
                  {renderInline(cell, tutorial)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdown(markdown: string, tutorial: Tutorial) {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const key = `block-${i}`;

    if (trimmed === "") {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const code: string[] = [];
      i += 1;

      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }

      blocks.push(
        <pre key={key} className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
          <code data-language={language || undefined}>{code.join("\n")}</code>
        </pre>,
      );
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push(<hr key={key} className="border-border" />);
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2], tutorial);

      if (level === 2) {
        blocks.push(
          <h2 key={key} className="pt-4 text-2xl font-bold tracking-tight">
            {content}
          </h2>,
        );
      } else if (level === 3) {
        blocks.push(
          <h3 key={key} className="pt-3 text-xl font-semibold tracking-tight">
            {content}
          </h3>,
        );
      } else {
        blocks.push(
          <h4 key={key} className="pt-2 text-lg font-semibold tracking-tight">
            {content}
          </h4>,
        );
      }

      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];

      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }

      blocks.push(
        <blockquote key={key} className="rounded-lg border-l-4 border-brand bg-surface-2 px-4 py-3 text-sm text-muted">
          {renderInline(quote.join(" "), tutorial)}
        </blockquote>,
      );
      continue;
    }

    if (trimmed.startsWith("![")) {
      const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);

      if (imageMatch) {
        blocks.push(
          <div key={key} id="result-files" className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
            <span className="font-medium text-fg">Figure file:</span> {imageMatch[1] || imageMatch[2]}
            <div className="mt-1 font-mono text-xs">{imageMatch[2]}</div>
          </div>,
        );
        i += 1;
        continue;
      }
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];

      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }

      blocks.push(renderTable(tableLines, tutorial, key));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }

      blocks.push(
        <ul key={key} className="space-y-2 pl-5 text-sm text-muted">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="list-disc">
              {renderInline(item, tutorial)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }

      blocks.push(
        <ol key={key} className="space-y-2 pl-5 text-sm text-muted">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="list-decimal">
              {renderInline(item, tutorial)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [trimmed];
    i += 1;

    while (i < lines.length && !isMarkdownBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p key={key} className="text-sm leading-7 text-fg/90">
        {renderInline(paragraph.join(" "), tutorial)}
      </p>,
    );
  }

  return blocks;
}

export default async function TutorialPage({ params }: PageProps) {
  const tutorial = getTutorial(params.slug);

  if (!tutorial) {
    notFound();
  }

  const markdown = await readTutorialMarkdown(tutorial);

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <Link href="/learn" className="text-sm font-medium text-muted hover:text-fg">
        ← Back to Learn
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
              {tutorial.level}
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
              {tutorial.time}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{tutorial.title}</h1>
          <p className="mt-3 max-w-2xl text-muted">{tutorial.blurb}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {tutorial.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#tutorial"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Start reading
            </a>
            <a
              href="#notebook"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              Notebook file
            </a>
            <a
              href="#code-files"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              Code files
            </a>
          </div>
        </div>

        <figure className="rounded-xl border border-border bg-surface p-4">
          <Image
            src={tutorial.image}
            alt={tutorial.imageAlt}
            width={1200}
            height={480}
            className="h-auto w-full rounded-lg border border-border bg-white"
          />
          <figcaption className="mt-3 text-xs text-muted">{tutorial.caption}</figcaption>
        </figure>
      </header>

      <section id="tutorial-files" className="mt-10 grid gap-5 md:grid-cols-2">
        <div id="notebook" className="scroll-mt-20 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold tracking-tight">Notebook</h2>
          <p className="mt-2 text-sm text-muted">
            The runnable notebook is included in the repository. From the project root, open:
          </p>
          <code className="mt-3 block overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs">
            tutorials/{tutorial.dir}/{tutorial.notebook}
          </code>
        </div>

        <div id="code-files" className="scroll-mt-20 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold tracking-tight">Code Files</h2>
          <div className="mt-3 space-y-2">
            {tutorial.files.map((file) => (
              <div key={file.path} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{file.label}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {file.kind}
                  </span>
                </div>
                <code className="mt-1 block overflow-x-auto font-mono text-xs text-muted">
                  tutorials/{tutorial.dir}/{file.path}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold tracking-tight">Datasets Used</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {tutorial.datasets.map((dataset) => (
            <Link
              key={dataset.id}
              href={`/datasets/${dataset.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-brand/50 hover:text-brand"
            >
              {dataset.name} →
            </Link>
          ))}
        </div>
      </section>

      <article id="tutorial" className="mt-8 scroll-mt-20 rounded-xl border border-border bg-surface p-5 sm:p-7">
        <div className="space-y-5">{renderMarkdown(markdown, tutorial)}</div>
      </article>
    </div>
  );
}
