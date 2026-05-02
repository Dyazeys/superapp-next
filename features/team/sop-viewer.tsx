"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { Button } from "@/components/ui/button";
import type { Components } from "react-markdown";

interface SopFile {
  name: string;
  title: string;
  description: string;
  content: string;
}

interface SopViewerProps {
  sopFiles: SopFile[];
}

const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-4 mt-8 text-2xl font-bold text-slate-900 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold text-slate-800" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-slate-700" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-slate-700" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-3 leading-relaxed text-slate-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 list-disc pl-6 text-slate-700 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-3 list-decimal pl-6 text-slate-700 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-900" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-slate-600" {...props}>
      {children}
    </em>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-mono text-slate-800"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-mono leading-relaxed text-slate-700"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table
        className="min-w-full divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 whitespace-nowrap text-slate-700" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-slate-50 hover:bg-slate-100" {...props}>
      {children}
    </tr>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-slate-300 bg-slate-50 py-2 pl-4 pr-4 italic text-slate-600"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-6 border-slate-200" {...props} />,
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
};

export function SopViewer({ sopFiles }: SopViewerProps) {
  const [selected, setSelected] = useState(sopFiles[0]?.name ?? "");

  if (sopFiles.length === 0) {
    return (
      <WorkspacePanel
        title="Belum ada SOP"
        description="Folder docs/team/SOP/ masih kosong."
      >
        <p className="text-sm text-slate-600">
          Tambahkan file markdown ke folder{" "}
          <code className="bg-slate-100 px-1 rounded">docs/team/SOP/</code>{" "}
          untuk menampilkan SOP di halaman ini.
        </p>
      </WorkspacePanel>
    );
  }

  const currentSop = sopFiles.find((s) => s.name === selected) ?? sopFiles[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {sopFiles.map((sop) => (
          <Button
            key={sop.name}
            variant={selected === sop.name ? "default" : "outline"}
            size="sm"
            onClick={() => setSelected(sop.name)}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            {sop.title}
          </Button>
        ))}
      </div>

      <WorkspacePanel
        title={currentSop.title}
        description={`File: ${currentSop.name}`}
      >
        <div className="max-h-[70vh] overflow-y-auto rounded-md border border-slate-200 bg-white p-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {currentSop.content}
          </ReactMarkdown>
        </div>
      </WorkspacePanel>
    </div>
  );
}