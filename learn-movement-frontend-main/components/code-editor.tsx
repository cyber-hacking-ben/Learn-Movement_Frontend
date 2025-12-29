"use client"

import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  code: string
  onChange: (value: string) => void
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="px-4 py-2 border-b border-border bg-card">
        <span className="text-sm font-semibold">editor.move</span>
      </div>
      <Editor
        height="100%"
        defaultLanguage="rust"
        value={code}
        onChange={(value) => onChange(value || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          lineNumbers: "on",
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          tabSize: 2,
          wordWrap: "off",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
