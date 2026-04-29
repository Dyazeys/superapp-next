"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, LogOut, PanelLeftClose, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileEditorModalContent } from "@/features/profile/profile-workspace";
import { ModuleNavItem } from "@/lib/navigation";
import { hasAnyPermission, hasPermission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type ModuleSidebarProps = {
  collapsed: boolean;
  modules: ModuleNavItem[];
  moduleTitle: string;
  userInitials: string;
  permissions: string[];
  onToggle: () => void;
};

function filterModuleItems(items: ModuleNavItem[], permissions: string[]): ModuleNavItem[] {
  return items.reduce<ModuleNavItem[]>((visibleItems, item) => {
      const filteredChildren = item.children?.length ? filterModuleItems(item.children, permissions) : undefined;
      const canView =
        (item.permission ? hasPermission(permissions, item.permission) : false) ||
        (item.permissionAny ? hasAnyPermission(permissions, item.permissionAny) : false) ||
        (!item.permission && !item.permissionAny);
      if (!canView && !filteredChildren?.length) {
        return visibleItems;
      }

      visibleItems.push({
        ...item,
        children: filteredChildren,
      });

      return visibleItems;
    }, []);
}

const renderLink = (item: ModuleNavItem, pathname: string, level = 0) => {
  const Icon = item.icon;
  const exactActive = pathname === item.href;
  const descendantActive = pathname.startsWith(`${item.href}/`);
  const active = exactActive || descendantActive;
  const hasChildren = Boolean(item.children?.length);

  return (
    <div key={item.href} className="flex flex-col gap-1">
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
          level === 0 ? "font-medium" : "font-normal",
          active
            ? level === 0
              ? exactActive
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "bg-white text-slate-900 ring-1 ring-slate-200"
              : "bg-slate-100 text-slate-900 ring-1 ring-slate-200"
            : level === 0
              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600")} />
        <span className="flex-1">{item.label}</span>
        {item.badge ? (
          <Badge
            variant="outline"
            className={cn(
              active
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-300/80 bg-slate-100 text-slate-600"
            )}
          >
            {item.badge}
          </Badge>
        ) : null}
      </Link>
      {hasChildren ? (
        <div
          className={cn(
            "space-y-1",
            level === 0 ? "ml-3 pl-3" : "ml-2 pl-2"
          )}
        >
          {item.children?.map((child) => renderLink(child, pathname, level + 1))}
        </div>
      ) : null}
    </div>
  );
};

export function ModuleSidebar({
  collapsed,
  modules,
  moduleTitle,
  userInitials,
  permissions,
  onToggle,
}: ModuleSidebarProps) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (collapsed) return null;
  const visibleModules = filterModuleItems(modules, permissions);

  return (
    <aside className="flex h-screen flex-col border-r border-slate-200/70 bg-slate-100/60">
      <div className="flex h-screen w-[280px] flex-col px-4 py-4">
        <div className="mb-3 flex items-center justify-between rounded-2xl px-2 py-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Workspace</p>
            <p className="truncate text-base font-medium text-slate-800">{moduleTitle}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            onClick={onToggle}
            aria-label="Collapse modules"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1 rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200/70">
            {visibleModules.map((item) => renderLink(item, pathname))}
          </div>
        </div>

        <div className="relative mt-4 rounded-2xl bg-slate-50/80 p-2 ring-1 ring-slate-200/70" ref={profileMenuRef}>
          {profileMenuOpen ? (
            <div className="absolute inset-x-0 bottom-[calc(100%+10px)] z-20 rounded-[26px] border border-slate-200/90 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/90">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setProfileEditorOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <UserPen className="size-4 text-slate-500" />
                <span>Edit profile</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4 text-slate-500" />
                <span>Log out</span>
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:text-slate-900"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
                {userInitials || "OP"}
              </span>
              <span>Profile</span>
            </button>
            <button
              type="button"
              aria-label="Open profile menu"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
            >
              <Ellipsis className="size-4" />
            </button>
          </div>
        </div>

        <Dialog
          open={profileEditorOpen}
          onOpenChange={(open) => {
            setProfileEditorOpen(open);
          }}
        >
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Update identitas akun, kontak internal, dan password tanpa meninggalkan halaman kerja yang sedang aktif.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[72vh] overflow-y-auto bg-white py-5 pr-1 text-slate-900">
              <ProfileEditorModalContent onSaved={() => setProfileEditorOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
