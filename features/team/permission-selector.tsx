"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS, getPermissionActionLabel, type Permission } from "@/lib/rbac";

type PermissionSelectorProps = {
  value: string[];
  onChange: (permissions: string[]) => void;
};

export function PermissionSelector({ value, onChange }: PermissionSelectorProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(PERMISSION_GROUPS.map((g) => g.domain))
  );

  function toggleDomain(domain: string) {
    const next = new Set(expandedDomains);
    if (next.has(domain)) {
      next.delete(domain);
    } else {
      next.add(domain);
    }
    setExpandedDomains(next);
  }

  function togglePermission(permission: string) {
    const isSelected = value.includes(permission);
    const next = isSelected
      ? value.filter((p) => p !== permission)
      : [...value, permission];
    onChange(next);
  }

  function toggleEntityGroup(permissions: Permission[]) {
    const allSelected = permissions.every((p) => value.includes(p));
    const permStrings = permissions as unknown as string[];
    const next = allSelected
      ? value.filter((p) => !permStrings.includes(p))
      : [...new Set([...value, ...permStrings])];
    onChange(next);
  }

  function getDomainSelectedCount(domain: string): { selected: number; total: number } {
    const group = PERMISSION_GROUPS.find((g) => g.domain === domain);
    if (!group) return { selected: 0, total: 0 };
    const total = group.entities.reduce((sum, e) => sum + e.permissions.length, 0);
    const selected = group.entities
      .flatMap((e) => e.permissions)
      .filter((p) => value.includes(p)).length;
    return { selected, total };
  }

  function getEntitySelectedCount(permissions: Permission[]): number {
    return permissions.filter((p) => value.includes(p)).length;
  }

  return (
    <div className="space-y-2">
      {PERMISSION_GROUPS.map((group) => {
        const isExpanded = expandedDomains.has(group.domain);
        const { selected, total } = getDomainSelectedCount(group.domain);
        const isAllSelected = selected === total;

        return (
          <div
            key={group.domain}
            className="overflow-hidden rounded-lg border border-slate-200"
          >
            <button
              type="button"
              onClick={() => toggleDomain(group.domain)}
              className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                <span className="font-medium text-slate-900">{group.label}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isAllSelected
                    ? "bg-emerald-100 text-emerald-700"
                    : selected > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {selected}/{total}
              </span>
            </button>

            {isExpanded && (
              <div className="space-y-4 border-t border-slate-200 bg-white p-4">
                {group.entities.map((entity) => {
                  const entitySelectedCount = getEntitySelectedCount(entity.permissions);
                  const entityAllSelected = entitySelectedCount === entity.permissions.length;

                  return (
                    <div key={entity.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {entity.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleEntityGroup(entity.permissions)}
                          className="text-xs text-sky-600 hover:text-sky-700 hover:underline"
                        >
                          {entityAllSelected
                            ? `Hapus semua (${entity.permissions.length})`
                            : `Pilih semua (${entity.permissions.length})`}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pl-1">
                        {entity.permissions.map((perm) => {
                          const isChecked = value.includes(perm);
                          const actionLabel = getPermissionActionLabel(perm);

                          return (
                            <div key={perm} className="flex items-center gap-1.5">
                              <Checkbox
                                id={`perm-${perm}`}
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                              <Label
                                htmlFor={`perm-${perm}`}
                                className="cursor-pointer text-xs font-normal text-slate-600"
                              >
                                {actionLabel}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}