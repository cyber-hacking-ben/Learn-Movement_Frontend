"use client"

import { Button } from "@/components/ui/button"
import { Play, Upload, Trash2, Loader2 } from "lucide-react"

interface ToolbarProps {
  onCompile: () => void
  onDeploy: () => void
  onClearConsole: () => void
  isCompiling: boolean
  isDeploying: boolean
  isConnected: boolean
  isCompiled?: boolean
}

export function Toolbar({ onCompile, onDeploy, onClearConsole, isCompiling, isDeploying, isConnected, isCompiled }: ToolbarProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-2 px-6 py-2">
        <Button onClick={onCompile} disabled={isCompiling} variant="default" size="sm" className="gap-2">
          {isCompiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Compile
        </Button>

        <Button
          onClick={onDeploy}
          disabled={isDeploying || !isConnected || !isCompiled}
          title={!isCompiled ? 'Compile the project before deploying' : undefined}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Deploy
        </Button>

        <div className="flex-1" />

        <Button onClick={onClearConsole} variant="ghost" size="sm" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
