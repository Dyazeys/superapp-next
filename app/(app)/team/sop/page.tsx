import fs from "fs";
import path from "path";
import { PageShell } from "@/components/foundation/page-shell";
import { requireTeamAccess } from "@/lib/team-access";
import { SopViewer } from "@/features/team/sop-viewer";

const SOP_DIR = path.join(process.cwd(), "docs/team/SOP");

interface SopFile {
  name: string;
  title: string;
  description: string;
  content: string;
}

function parseSopTitle(filename: string, content: string): string {
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (titleMatch) return titleMatch[1].trim();
  return filename
    .replace(/\.md$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseSopDescription(content: string): string {
  const lines = content.split("\n");
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith("#")) {
      return line.trim().replace(/^[\*\-\s]+/, "");
    }
  }
  return "";
}

function getSopFiles(): SopFile[] {
  if (!fs.existsSync(SOP_DIR)) return [];

  const files = fs.readdirSync(SOP_DIR).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const content = fs.readFileSync(path.join(SOP_DIR, file), "utf-8");
    return {
      name: file,
      title: parseSopTitle(file, content),
      description: parseSopDescription(content),
      content,
    };
  });
}

export default async function TeamSopPage() {
  await requireTeamAccess();
  const sopFiles = getSopFiles();

  return (
    <PageShell
      eyebrow="Team"
      title="SOP"
      description="Standar operasional, guideline kerja, dan dokumentasi proses yang dipakai bersama."
    >
      <SopViewer sopFiles={sopFiles} />
    </PageShell>
  );
}