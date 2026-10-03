"use client";

import { useMemo } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { contentToMarkdownWithSeekLinks } from "@/lib/ai/citations";
import { sanitizeMarkdownHref } from "@/lib/security/markdown-link";
import { StreamingCursor } from "@/components/chat/streaming-cursor";

function parseSeekHref(href: string | undefined): number | null {
  if (!href?.startsWith("#seek-")) return null;
  const seconds = Number(href.slice("#seek-".length));
  return Number.isFinite(seconds) ? seconds : null;
}

function createMarkdownComponents(onSeek?: (seconds: number) => void): Components {
  return {
    h1: ({ children }) => (
      <h3 className="mt-3 mb-2 text-base font-semibold first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
      <h4 className="mt-3 mb-2 text-sm font-semibold first:mt-0">{children}</h4>
    ),
    h3: ({ children }) => (
      <h5 className="mt-2 mb-1.5 text-sm font-semibold first:mt-0">{children}</h5>
    ),
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="leading-6">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mb-2 border-l-2 border-brand/50 pl-3 text-muted-foreground italic last:mb-0">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    a: ({ href, children }) => {
      const safeHref = sanitizeMarkdownHref(href);
      if (!safeHref) {
        return <span className="text-muted-foreground">{children}</span>;
      }
      const seekSeconds = parseSeekHref(safeHref);
      if (seekSeconds !== null) {
        if (!onSeek) {
          return <span className="font-medium text-brand">[{children}]</span>;
        }
        return (
          <button
            type="button"
            onClick={() => onSeek(seekSeconds)}
            className="mx-0.5 inline rounded bg-brand/15 px-1 font-medium text-brand hover:bg-brand/25"
            title={`Ir para ${String(children)}`}
            aria-label={`Ir para ${String(children)}`}
          >
            [{children}]
          </button>
        );
      }
      return (
        <a
          href={safeHref}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:text-brand/90"
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ className, children }) => {
      const isBlock = Boolean(className?.includes("language-"));
      if (isBlock) {
        return <code className={className}>{children}</code>;
      }
      return (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-5 last:mb-0">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto last:mb-0">
        <table className="w-full min-w-[16rem] border-collapse text-left text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
    th: ({ children }) => <th className="px-2 py-1.5 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-t border-border px-2 py-1.5">{children}</td>,
  };
}

type ChatMarkdownProps = {
  content: string;
  onSeek?: (seconds: number) => void;
  isStreaming?: boolean;
};

export function ChatMarkdown({ content, onSeek, isStreaming = false }: ChatMarkdownProps) {
  const markdown = useMemo(() => contentToMarkdownWithSeekLinks(content), [content]);
  const components = useMemo(() => createMarkdownComponents(onSeek), [onSeek]);

  if (!content.trim()) {
    return isStreaming ? <StreamingCursor /> : null;
  }

  return (
    <div className="chat-markdown [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={(url) => sanitizeMarkdownHref(url) ?? ""}
      >
        {markdown}
      </ReactMarkdown>
      {isStreaming && <StreamingCursor />}
    </div>
  );
}
