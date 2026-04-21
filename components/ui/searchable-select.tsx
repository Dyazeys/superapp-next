"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type SearchableOption = {
  label: string
  value: string
}

type SearchableSelectProps = {
  options: SearchableOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  inputClassName?: string
  emptyText?: string
  maxResults?: number
  portal?: boolean
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function isSubsequence(query: string, target: string) {
  if (!query) return true
  let qi = 0
  for (let ti = 0; ti < target.length && qi < query.length; ti += 1) {
    if (target[ti] === query[qi]) {
      qi += 1
    }
  }
  return qi === query.length
}

function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  className,
  inputClassName,
  emptyText = "No matches found.",
  maxResults = 80,
  portal = true,
}: SearchableSelectProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const selected = React.useMemo(() => options.find((option) => option.value === value) ?? null, [options, value])
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
    left: 0,
    top: 0,
    width: 0,
  })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "")
    }
  }, [open, selected])

  const updateMenuPosition = React.useCallback(() => {
    const element = inputRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const menuHeight = 260
    const openAbove = rect.bottom + menuHeight > viewportHeight && rect.top > menuHeight
    const top = openAbove ? rect.top - 4 : rect.bottom + 4

    setMenuStyle({
      left: rect.left,
      top,
      width: rect.width,
      transform: openAbove ? "translateY(-100%)" : undefined,
    })
  }, [])

  React.useEffect(() => {
    if (!open) return

    updateMenuPosition()

    function onViewportChange() {
      updateMenuPosition()
    }

    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [open, updateMenuPosition])

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedInsideInput = containerRef.current?.contains(target)
      const clickedInsideMenu = menuRef.current?.contains(target)
      if (!clickedInsideInput && !clickedInsideMenu) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const filteredOptions = React.useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) {
      return options.slice(0, maxResults)
    }

    return options
      .filter((option) => {
        const label = normalize(option.label)
        const itemValue = normalize(option.value)
        return (
          label.includes(normalized) ||
          itemValue.includes(normalized) ||
          isSubsequence(normalized.replace(/\s+/g, ""), label.replace(/\s+/g, "")) ||
          isSubsequence(normalized.replace(/\s+/g, ""), itemValue.replace(/\s+/g, ""))
        )
      })
      .slice(0, maxResults)
  }, [maxResults, options, query])

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        portal
          ? "fixed z-[200] max-h-64 overflow-auto rounded-xl border border-input bg-white p-1 shadow-lg"
          : "absolute top-full left-0 z-[200] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-input bg-white p-1 shadow-lg"
      )}
      style={portal ? menuStyle : undefined}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "block w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-800 hover:bg-slate-100",
              option.value === value ? "bg-slate-100" : undefined
            )}
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onValueChange(option.value)
              setQuery(option.label)
              setOpen(false)
            }}
          >
            {option.label}
          </button>
        ))
      ) : (
        <p className="px-2 py-2 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <input
        ref={inputRef}
        id={id}
        value={open ? query : (selected?.label ?? "")}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-1 text-base text-slate-800 shadow-sm transition-colors outline-none placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm",
          inputClassName
        )}
        onFocus={() => {
          setOpen(true)
          setQuery(selected?.label ?? "")
          updateMenuPosition()
        }}
        onChange={(event) => {
          const nextValue = event.target.value
          setQuery(nextValue)
          setOpen(true)
          if (!nextValue.trim()) {
            onValueChange("")
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false)
          }
        }}
      />

      {mounted && open ? (portal ? createPortal(menuContent, document.body) : menuContent) : null}
    </div>
  )
}

export { SearchableSelect, type SearchableOption }
