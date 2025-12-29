"use client"

import { useState } from "react"
import React from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { CodeEditor } from "@/components/code-editor"
import { Console } from "@/components/console"
import { Toolbar } from "@/components/toolbar"
import { Header } from "@/components/header"
import { compileCode, fetchUserTimezone } from "@/lib/api"
import { decodeBase64ToUint8Array } from "@/lib/encoding"

export default function Home() {
  const [code, setCode] = useState(`module hello::message {
    use std::string;
    use std::signer;

    struct Message has key, drop {
        text: string::String
    }

    public entry fun init(account: &signer) {
        let msg = Message {
            text: string::utf8(b"Hello Movement!")
        };
        move_to(account, msg);
    }
}`)

  const [consoleOutput, setConsoleOutput] = useState<
    Array<{
      type: "info" | "error" | "success" | "bytecode"
      message: string
      timestamp: Date
      data?: any
    }>
  >([
    {
      type: "info",
      message: "LEARNMOVEMENT - The fastest Developer on-ramp to the Movement Blockchain",
      timestamp: new Date(),
    },
  ])

  const [isCompiling, setIsCompiling] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [lastCompileResult, setLastCompileResult] = useState<any | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>("")

  // Fetch timezone on mount
  React.useEffect(() => {
    fetchUserTimezone().then(tz => setUserTimezone(tz))
  }, [])

  const handleCompile = async () => {
    if (!walletAddress) {
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: "Please connect your wallet before compiling.",
          timestamp: new Date(),
        },
      ])
      return
    }

    setIsCompiling(true)
    setConsoleOutput((prev) => [
      ...prev,
      {
        type: "info",
        message: "Starting compilation...",
        timestamp: new Date(),
      },
    ])

    try {
      const res = await compileCode(code, walletAddress)
      // Handle structured backend responses per docs
      if (res?.type === 'compile_success' && res.success) {
        setLastCompileResult(res)
        setConsoleOutput((prev) => [
          ...prev,
          {
            type: "success",
            message: `Compilation successful: ${res.modules?.length ?? 0} module(s) compiled.`,
            timestamp: new Date(),
          },
          {
            type: "bytecode",
            message: "Bytecode Output",
            timestamp: new Date(),
            data: res,
          },
        ])
      } else if (res?.type === 'compile_failed') {
        setLastCompileResult(res)
        // Add compile failed header
        setConsoleOutput((prev) => [
          ...prev,
          {
            type: "error",
            message: `Compilation failed: ${res.error_count ?? 1} error(s)`,
            timestamp: new Date(),
          },
        ])
        // Add each error with full details
        const errorLogs = (res.errors ?? []).map((e: any) => {
          const errorMsg = `${e.message}${e.file ? ` (${e.file}` : ''}${e.line ? `:${e.line}` : ''}${e.column ? `:${e.column}` : ''}${e.file ? ')' : ''}`
          return {
            type: 'error' as const,
            message: errorMsg,
            timestamp: new Date(),
            data: e.source_line ? { source_line: e.source_line } : undefined,
          }
        })
        setConsoleOutput((prev) => [...prev, ...errorLogs])
      } else {
        setLastCompileResult(res)
        setConsoleOutput((prev) => [
          ...prev,
          {
            type: "info",
            message: `Compiler returned unexpected response: ${JSON.stringify(res)}`,
            timestamp: new Date(),
          },
        ])
      }
    } catch (err: any) {
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: err?.message || String(err),
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsCompiling(false)
    }
  }

  const handleDeploy = async () => {
    if (!isConnected) {
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: "Please connect your wallet before deploying.",
          timestamp: new Date(),
        },
      ])
      return
    }

    if (!lastCompileResult || lastCompileResult?.type !== 'compile_success') {
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: "No successful compilation available. Compile first.",
          timestamp: new Date(),
        },
      ])
      return
    }

    setIsDeploying(true)
    setConsoleOutput((prev) => [
      ...prev,
      {
        type: "info",
        message: "Deploying to Movement testnet...",
        timestamp: new Date(),
      },
    ])

    try {
      // prepare module bytecodes
      const modules = lastCompileResult.modules ?? []
      const moduleBytecodes = modules.map((m: any) => decodeBase64ToUint8Array(m.bytecode_base64))

      const metadataBytes = lastCompileResult.package_metadata_bcs
        ? decodeBase64ToUint8Array(lastCompileResult.package_metadata_bcs)
        : new Uint8Array()

      // Build payload according to docs
      const payload = {
        type: "entry_function_payload",
        function: "0x1::code::publish_package_txn",
        type_arguments: [],
        arguments: [metadataBytes, moduleBytecodes],
      }

      // TODO: integrate real Wallet Adapter signing here. For now prompt to simulate.
      setConsoleOutput((prev) => [
        ...prev,
        { type: 'info', message: 'Prepared publish payload. Prompting to simulate submission...', timestamp: new Date() }
      ])

      // Simulate signing/submission (replace this with wallet adapter logic)
      await new Promise((r) => setTimeout(r, 1500))
      setConsoleOutput((prev) => [
        ...prev,
        { type: 'success', message: 'Simulated submission successful. (Integrate Wallet Adapter to perform real submit)', timestamp: new Date() }
      ])
    } catch (err: any) {
      setConsoleOutput((prev) => [
        ...prev,
        { type: 'error', message: err?.message || String(err), timestamp: new Date() }
      ])
    } finally {
      setIsDeploying(false)
    }
  }

  const handleClearConsole = () => {
    setConsoleOutput([])
  }

  const handleConnectWallet = () => {
    if (!isConnected) {
      // prompt user for wallet address (or integrate real wallet later)
      const addr = window.prompt("Enter wallet address (0x...) or paste from wallet:")
      if (addr && addr.length > 0) {
        setWalletAddress(addr)
        setIsConnected(true)
        setConsoleOutput((prev) => [
          ...prev,
          {
            type: "success",
            message: `Wallet connected: ${addr}`,
            timestamp: new Date(),
          },
        ])
      } else {
        setConsoleOutput((prev) => [
          ...prev,
          {
            type: "error",
            message: "No wallet address provided.",
            timestamp: new Date(),
          },
        ])
      }
    } else {
      setIsConnected(false)
      setWalletAddress(null)
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "info",
          message: "Wallet disconnected",
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header isConnected={isConnected} onConnectWallet={handleConnectWallet} walletAddress={walletAddress} />


      <Toolbar
        onCompile={handleCompile}
        onDeploy={handleDeploy}
        onClearConsole={handleClearConsole}
        isCompiling={isCompiling}
        isDeploying={isDeploying}
        isConnected={isConnected}
      />

      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={65} minSize={30}>
            <CodeEditor code={code} onChange={setCode} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
          <Panel defaultSize={35} minSize={25}>
            <Console output={consoleOutput} userTimezone={userTimezone} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
