"use client"

import { Button } from "@/components/ui/button"
import { ConnectButton } from "@razorlabs/razorkit"
import { CheckCircle2, Copy, XCircle } from "lucide-react"


interface HeaderProps {
  isConnected: boolean
  onDisconnect: () => void | Promise<void>
  walletAddress?: string | null
}

export function Header({ isConnected, onDisconnect, walletAddress }: HeaderProps) {
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}` : null

  const handleCopyAddress = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
    } catch {
      // ignore
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MV</span>
            </div>
            <h1 className="text-lg font-semibold">
              <span className="text-foreground">LEARN</span>
              <span className="text-yellow-400">MOVEMENT</span>
            </h1>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">Movement Testnet</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
              isConnected
                ? "bg-secondary text-white border-border"
                : "bg-card text-white border-border"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
            {isConnected && shortAddress && (
              <span className="font-mono text-xs text-muted-foreground">{shortAddress}</span>
            )}
            {isConnected && walletAddress && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7"
                onClick={handleCopyAddress}
                aria-label="Copy wallet address"
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isConnected ? (
            <Button onClick={onDisconnect} variant="secondary" className="gap-2">
              Disconnect
            </Button>
          ) : (
            <div className="flex items-center justify-center bg-yellow-400 rounded-full w-50 h-8">
              <ConnectButton>Connect Wallet</ConnectButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
