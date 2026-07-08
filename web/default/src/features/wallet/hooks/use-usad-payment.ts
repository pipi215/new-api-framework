/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import i18next from 'i18next'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import {
  requestUsadAddress,
  verifyUsadDeposit,
  isApiSuccess,
} from '../api'
import type { UsadAddressData } from '../types'

function getErrorMessage(message: string | undefined, data: unknown): string {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return message || i18next.t('Payment request failed')
}

/**
 * Hook for the USAD on-chain deposit flow.
 *
 * Unlike hosted-checkout gateways, USAD is a two-step flow:
 *   1. requestAddress() — query the deposit address (and create a pending order)
 *   2. verify(txid)     — submit the on-chain txid; the backend verifies arrival
 *                         and credits quota.
 */
export function useUsadPayment() {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [address, setAddress] = useState<UsadAddressData | null>(null)

  const requestAddress = useCallback(async () => {
    setLoading(true)
    try {
      const response = await requestUsadAddress()
      if (isApiSuccess(response) && response.data) {
        setAddress(response.data)
        return response.data
      }
      toast.error(getErrorMessage(response.message, response.data))
      return null
    } catch (_error) {
      toast.error(i18next.t('Failed to get deposit address'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const verify = useCallback(
    async (txid: string) => {
      if (!address) {
        toast.error(i18next.t('Please get the deposit address first'))
        return false
      }
      const trimmedTxid = txid.trim()
      if (!trimmedTxid) {
        toast.error(i18next.t('Please enter the on-chain txid'))
        return false
      }

      setVerifying(true)
      try {
        const response = await verifyUsadDeposit({
          trade_no: address.order_id,
          txid: trimmedTxid,
        })

        if (isApiSuccess(response) && response.data) {
          toast.success(
            i18next.t('USAD deposit successful: {{amount}} USAD', {
              amount: response.data.amount,
            })
          )
          setAddress(null)
          return true
        }

        toast.error(getErrorMessage(response.message, response.data))
        return false
      } catch (_error) {
        toast.error(i18next.t('Verification failed, please try again later'))
        return false
      } finally {
        setVerifying(false)
      }
    },
    [address]
  )

  const reset = useCallback(() => {
    setAddress(null)
  }, [])

  return { loading, verifying, address, requestAddress, verify, reset }
}
