export async function fetchUserTimezone(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (err) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

export function formatTimestampInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  return formatter.format(date)
}

export async function compileCode(code: string, senderAddress?: string, timeoutMs = 60000) {
  const url = "https://movement-sqto.onrender.com/compile"

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        ...(senderAddress ? { sender_address: senderAddress } : {}),
      }),
      signal: controller.signal,
    })

    const text = await resp.text()
    if (!resp.ok) {
      try {
        const parsed = JSON.parse(text)
        throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed))
      } catch (e) {
        throw new Error(text || resp.statusText)
      }
    }

    try {
      return JSON.parse(text)
    } catch (e) {
      return text
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Request timed out')
    throw err
  } finally {
    clearTimeout(id)
  }
}
