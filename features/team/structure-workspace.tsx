"use client";

import { ChevronRight } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";

type Member = { name: string; role?: string };
type Department = { dept: string; members: Member[] };

type OrgEntry =
  | { name: string; role: string; children?: OrgEntry[] }
  | { isDept: true; departments: Department[] };

const ORG_DATA: OrgEntry = {
  name: "Hendra",
  role: "Brand Owner",
  children: [
    {
      name: "Ivan",
      role: "Direktur",
      children: [
        {
          name: "Ivan",
          role: "Manager",
          children: [
            {
              name: "Ade",
              role: "Leader",
              children: [
                {
                  isDept: true,
                  departments: [
                    {
                      dept: "Marketing",
                      members: [
                        { name: "Imam", role: "Advertiser" },
                        { name: "Hilam", role: "Sales" },
                        { name: "Sandy", role: "Sales" },
                        { name: "Windi", role: "Live Streaming" },
                      ],
                    },
                    {
                      dept: "Konten Kreator",
                      members: [
                        { name: "Irawan" },
                      ],
                    },
                    {
                      dept: "FAC",
                      members: [
                        { name: "Tia", role: "Accounting" },
                      ],
                    },
                    {
                      dept: "Warehouse",
                      members: [
                        { name: "Erick" },
                        { name: "Yayang" },
                        { name: "Rohmen", role: "Office Boy" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function PersonCard({ name, role }: { name: string; role?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm min-w-[120px] text-center">
      <p className="text-sm font-semibold text-slate-900">{name}</p>
      {role && <p className="text-xs text-slate-500 mt-0.5">{role}</p>}
    </div>
  );
}

function ConnectorRight() {
  return (
    <div className="flex items-center shrink-0">
      <div className="w-4 h-px bg-slate-300" />
      <ChevronRight className="size-3 text-slate-400 -ml-1" />
    </div>
  );
}

function OrgNode({ entry }: { entry: OrgEntry }) {
  if ("isDept" in entry && entry.isDept) {
    return (
      <div className="grid grid-cols-2 gap-3 min-w-[500px]">
        {entry.departments.map((dept) => (
          <div key={dept.dept} className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="bg-slate-200 px-3 py-1.5">
              <p className="text-xs font-semibold text-slate-700 text-center">{dept.dept}</p>
            </div>
            <div className="p-2 space-y-1">
              {dept.members.map((m) => (
                <div key={m.name} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center">
                  <p className="text-sm font-medium text-slate-800">{m.name}</p>
                  {m.role && <p className="text-xs text-slate-500">{m.role}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entry2 = entry as { name: string; role: string; children?: OrgEntry[] };
  const hasChildren = entry2.children && entry2.children.length > 0;

  return (
    <div className="flex items-center">
      <PersonCard name={entry2.name} role={entry2.role} />
      {hasChildren && (
        <>
          <ConnectorRight />
          <div className="flex items-center">
            {entry2.children!.map((child, idx) => (
              <OrgNode key={idx} entry={child} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TeamStructureWorkspace() {
  return (
    <PageShell
      eyebrow="Team"
      title="Struktur Tim"
      description="Organigram tim — data statis."
    >
      <div className="flex justify-start py-6 overflow-x-auto">
        <div className="inline-flex items-center">
          <OrgNode entry={ORG_DATA} />
        </div>
      </div>
    </PageShell>
  );
}
