"use client"

import { WalletProvider as RazorWalletProvider } from "@razorlabs/razorkit"
import "@razorlabs/razorkit/style.css"
import { PropsWithChildren, useState, useEffect } from "react"

export function WalletProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <RazorWalletProvider>
      {children}
    </RazorWalletProvider>
  )
}
