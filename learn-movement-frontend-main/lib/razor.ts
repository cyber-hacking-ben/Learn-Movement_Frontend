import { decodeBase64ToUint8Array } from './encoding';

type WalletLike = any;

export async function signAndSendPublish(wallet: WalletLike, base64Module: string) {
  if (!wallet) return { success: false, error: 'Wallet provider not available' };
  if (wallet.status !== 'connected') return { success: false, error: 'Wallet not connected' };

  const moduleBytes = decodeBase64ToUint8Array(base64Module);
  // Generic publish payload — razorkit SDKs often accept a tx object or bytes.
  const publishPayload = {
    type: 'publish_module',
    modules: [Array.from(moduleBytes)],
  };

  try {
    // 1) Preferred: unified API that signs and submits in one call
    if (typeof wallet.signAndSendTransaction === 'function') {
      const res = await wallet.signAndSendTransaction(publishPayload);
      return { success: true, txHash: res?.txHash ?? res?.hash ?? JSON.stringify(res) };
    }

    // 2) Some wallets provide signTransaction + provider.sendRawTransaction
    if (typeof wallet.signTransaction === 'function') {
      const signed = await wallet.signTransaction(publishPayload);

      // sendRawTransaction common pattern
      if (wallet.provider && typeof wallet.provider.sendRawTransaction === 'function') {
        const rpcRes = await wallet.provider.sendRawTransaction(signed);
        return { success: true, txHash: rpcRes?.txHash ?? rpcRes?.hash ?? JSON.stringify(rpcRes) };
      }

      // provider.request fallback with common RPC method names
      if (wallet.provider && typeof wallet.provider.request === 'function') {
        const rpcMethods = [
          'movement_sendRawTransaction',
          'movement_submitTransaction',
          'submitTransaction',
          'sendRawTransaction',
        ];
        for (const method of rpcMethods) {
          try {
            const rpcRes = await wallet.provider.request({ method, params: [signed] });
            if (rpcRes) return { success: true, txHash: rpcRes?.txHash ?? rpcRes ?? JSON.stringify(rpcRes) };
          } catch {
            // try next method
          }
        }
      }
    }

    // 3) As last resort: ask provider to publish directly (some providers handle signing)
    if (wallet.provider && typeof wallet.provider.request === 'function') {
      const publishMethods = [
        'movement_publishModule',
        'publishModule',
        'movement_publish',
      ];
      for (const method of publishMethods) {
        try {
          const rpcRes = await wallet.provider.request({ method, params: [publishPayload] });
          if (rpcRes) return { success: true, txHash: rpcRes?.txHash ?? rpcRes ?? JSON.stringify(rpcRes) };
        } catch {
          // try next
        }
      }
    }

    return { success: false, error: 'Connected wallet does not expose a compatible signing/sending API.' };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}