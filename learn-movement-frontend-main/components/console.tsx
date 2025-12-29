"use client"

import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTimestampInTimezone } from "@/lib/api"
import { useEffect, useRef } from "react"

interface ConsoleOutput {
  type: "info" | "error" | "success" | "bytecode"
  message: string
  timestamp: Date
  data?: any
}

interface ConsoleProps {
  output: ConsoleOutput[]
  userTimezone?: string
}

export function Console({ output, userTimezone }: ConsoleProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)

  // Listen to scroll events to detect if user is manually scrolling
  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
    if (!viewport) return

    const handleScroll = () => {
      // Check if user is at the bottom (within 50px)
      const isAtBottom =
        Math.abs(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight) < 50
      isUserScrollingRef.current = !isAtBottom
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll only if user is at the bottom
  useEffect(() => {
    // Only auto-scroll if user hasn't scrolled up
    if (!isUserScrollingRef.current) {
      const scrollArea = scrollAreaRef.current
      if (scrollArea) {
        const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
        if (viewport) {
          // Scroll to bottom on next frame
          requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight
          })
        }
      }
    }
  }, [output])
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">Console</h3>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="p-4 space-y-3 pr-6" ref={contentRef}>
          {output.length === 0 ? (
            <div className="text-muted-foreground text-sm">No output yet. Run compile or deploy to see results.</div>
          ) : (
            output.map((item, index) => (
              <div key={index} className="flex gap-2 text-sm">
                {item.type === "bytecode" ? (
                  // Bytecode output block
                  <div className="w-full">
                    <div className="font-semibold mb-2">Compile Result: Success</div>
                    <div className="text-xs mb-1">Modules:</div>
                    {Array.isArray(item.data?.modules) && item.data.modules.length > 0 ? (
                      item.data.modules.map((m: any, midx: number) => (
                        <div key={midx} className="mb-2">
                          <div className="text-xs font-medium break-words">{m.name ?? `module_${midx}`}</div>
                          <div className="mt-1 p-2 bg-[#0b0b0b] text-xs font-mono text-muted-foreground break-all rounded">
                            {m.bytecode_base64 ?? ''}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs">No modules returned.</div>
                    )}
                  </div>
                ) : (
                  // Regular log entries
                  <>
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                      {item.type === "success" && <CheckCircle className="w-4 h-4 text-success" />}
                      {item.type === "info" && <Info className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`leading-relaxed break-words ${
                          item.type === "error"
                            ? "text-destructive"
                            : item.type === "success"
                              ? "text-success"
                              : "text-foreground"
                        }`}
                      >
                        {item.message}
                      </p>
                      {item.data?.source_line && (
                        <pre className="mt-1 p-2 bg-[#0b0b0b] text-xs font-mono text-muted-foreground overflow-x-auto break-words whitespace-pre-wrap">
                          {item.data.source_line}
                        </pre>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {userTimezone ? formatTimestampInTimezone(new Date(item.timestamp), userTimezone) : String(item.timestamp)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={scrollEndRef} className="h-0" />
        </div>
      </ScrollArea>
    </div>
  )
}
