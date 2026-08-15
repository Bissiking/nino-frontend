"use client";

import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  if (!children.trim()) return null;
  return (
    <div className="ninoMarkdown">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}