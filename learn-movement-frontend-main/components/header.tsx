"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"


interface HeaderProps {
  isConnected: boolean
  onConnectWallet: () => void
  walletAddress?: string | null
}

export function Header({ isConnected, onConnectWallet, walletAddress }: HeaderProps) {
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

        <Button onClick={onConnectWallet} variant={isConnected ? "secondary" : "default"} className="gap-2">
          <Wallet className="w-4 h-4" />
          {isConnected ? (
            // display short address if provided
            walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}` : "Connected"
          ) : (
            "Connect Wallet"
          )}
        </Button>
      </div>
    </header>
  )
}
