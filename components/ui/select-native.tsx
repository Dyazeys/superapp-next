"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type SelectNativeProps = React.ComponentProps<"select">

function SelectNative({ className, children, ...props }: SelectNativeProps) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select-native"
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 pr-11 text-sm text-slate-800 shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

export { SelectNative }
