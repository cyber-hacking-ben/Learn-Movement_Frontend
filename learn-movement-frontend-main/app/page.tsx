"use client"

import { useState, useEffect } from "react"
import React from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { useWallet, ConnectButton } from "@razorlabs/razorkit"
import { CodeEditor } from "@/components/code-editor"
import { Console } from "@/components/console"
import { Toolbar } from "@/components/toolbar"
import { Header } from "@/components/header"
import { compileCode, fetchUserTimezone } from "@/lib/api"
import { decodeBase64ToUint8Array } from "@/lib/encoding"

export default function Home() {
  const wallet = useWallet()
  const { address, connected, disconnect, signAndSubmitTransaction } = wallet

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
  const [isCompiled, setIsCompiled] = useState(false)
  const [lastCompileResult, setLastCompileResult] = useState<any | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>("")

  const walletAddress = address ?? null
  const isConnected = connected

  // Fetch timezone on mount
  useEffect(() => {
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
        setIsCompiled(true)
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
        setIsCompiled(false)
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
        setIsCompiled(false)
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
      const moduleBytecodes = modules.map((m: any) => Array.from(decodeBase64ToUint8Array(m.bytecode_base64)))

      const metadataBytes = lastCompileResult.package_metadata_bcs
        ? Array.from(decodeBase64ToUint8Array(lastCompileResult.package_metadata_bcs))
        : []

      setConsoleOutput((prev) => [
        ...prev,
        { type: 'info', message: 'Preparing transaction...', timestamp: new Date() }
      ])

      // Build and submit the transaction using the wallet adapter

      // Log wallet/provider info to aid debugging (may be undefined for some adapters)
      // eslint-disable-next-line no-console
      console.log('wallet object before deploy:', wallet)
      // eslint-disable-next-line no-console
      console.log('wallet.provider (if present):', (wallet as any)?.provider)

      const response = await signAndSubmitTransaction({
        payload: {
          function: "0x1::code::publish_package_txn" as const,
          typeArguments: [],
          functionArguments: [metadataBytes, moduleBytecodes],
        },
      })

      // DEBUG: log full response to help diagnose reject reasons
      // (This will also appear in the in-app console for easier inspection.)
      // eslint-disable-next-line no-console
      console.log('signAndSubmitTransaction response:', response)
      setConsoleOutput((prev) => [
        ...prev,
        { type: 'info', message: 'Raw deploy response:', timestamp: new Date(), data: response },
      ])

      // Extract transaction hash or status info from response
      const txHash = (response as any)?.hash || (response as any)?.args?.hash || (response as any)?.tx_hash || JSON.stringify(response)

      // If the wallet returned a rejection object, show a clearer message
      if ((response as any)?.status === 'Rejected' || (response as any)?.status === 'rejected') {
        setConsoleOutput((prev) => [
          ...prev,
          { type: 'error', message: `Transaction rejected by provider: ${JSON.stringify(response)}`, timestamp: new Date() },
        ])
      } else {
        setConsoleOutput((prev) => [
          ...prev,
          { type: 'success', message: `Module deployed successfully!`, timestamp: new Date() },
          { type: 'info', message: `Transaction hash: ${txHash}`, timestamp: new Date() },
          { type: 'info', message: `View on explorer: https://explorer.movementnetwork.xyz/txn/${txHash}?network=testnet`, timestamp: new Date() }
        ])
      }
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

  const handleDisconnectWallet = async () => {
    try {
      await disconnect()
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "info",
          message: "Wallet disconnected",
          timestamp: new Date(),
        },
      ])
    } catch (err: any) {
      setConsoleOutput((prev) => [
        ...prev,
        {
          type: "error",
          message: err?.message || String(err),
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header isConnected={isConnected} onDisconnect={handleDisconnectWallet} walletAddress={walletAddress} />


      <Toolbar
          onCompile={handleCompile}
          onDeploy={handleDeploy}
          onClearConsole={handleClearConsole}
          isCompiling={isCompiling}
          isDeploying={isDeploying}
          isConnected={isConnected}
          isCompiled={isCompiled}
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
