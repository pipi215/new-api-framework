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
import { Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { copyToClipboard } from '@/lib/copy-to-clipboard'

import type { UsadAddressData } from '../../types'

interface UsadDepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: UsadAddressData | null
  loading: boolean
  verifying: boolean
  onVerify: (txid: string) => Promise<boolean>
}

export function UsadDepositDialog({
  open,
  onOpenChange,
  address,
  loading,
  verifying,
  onVerify,
}: UsadDepositDialogProps) {
  const { t } = useTranslation()
  const [txid, setTxid] = useState('')

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      toast.success(t('{{label}} copied', { label }))
    } else {
      toast.error(t('Copy failed'))
    }
  }

  const handleVerify = async () => {
    const success = await onVerify(txid)
    if (success) {
      setTxid('')
      onOpenChange(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTxid('')
    }
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className='max-w-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('USAD Deposit')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'Transfer USAD on-chain to the address below, then submit the txid to verify arrival.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : address ? (
          <div className='space-y-3'>
            <div className='bg-muted/50 rounded-md p-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>
                  {t('Currency')}
                </span>
                <span className='font-medium'>
                  {address.symbol || 'USAD'}
                  {address.mainnet ? ` (${address.mainnet})` : ''}
                </span>
              </div>
            </div>

            <div className='bg-muted/50 rounded-md p-3'>
              <div className='text-muted-foreground mb-1 text-xs'>
                {t('Deposit Address')}
              </div>
              <div className='flex items-center justify-between gap-2'>
                <code className='break-all text-sm font-medium'>
                  {address.address}
                </code>
                <button
                  type='button'
                  onClick={() => handleCopy(address.address, t('Address'))}
                  className='text-muted-foreground hover:text-foreground shrink-0'
                  aria-label={t('Copy address')}
                >
                  <Copy className='h-4 w-4' />
                </button>
              </div>
            </div>

            {address.memo ? (
              <div className='rounded-md bg-amber-50 p-3 dark:bg-amber-950/40'>
                <div className='mb-1 text-xs text-amber-700 dark:text-amber-300'>
                  {t('Memo / Tag (required)')}
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <code className='text-sm font-medium text-red-600 dark:text-red-400'>
                    {address.memo}
                  </code>
                  <button
                    type='button'
                    onClick={() => handleCopy(address.memo, t('Memo'))}
                    className='text-muted-foreground hover:text-foreground shrink-0'
                    aria-label={t('Copy memo')}
                  >
                    <Copy className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ) : null}

            {address.address_qr_code ? (
              <div className='flex justify-center'>
                <img
                  src={address.address_qr_code}
                  alt={t('Address QR code')}
                  className='h-44 w-44 object-contain'
                />
              </div>
            ) : null}

            {address.deposit_confirm ? (
              <p className='text-muted-foreground text-xs'>
                {t('Confirmations required')}: {address.deposit_confirm}
              </p>
            ) : null}

            <div>
              <label
                htmlFor='usad-txid'
                className='text-muted-foreground mb-1 block text-xs'
              >
                {t('On-chain Transaction ID (txid)')}
              </label>
              <Input
                id='usad-txid'
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                placeholder={t('Enter the on-chain txid after transfer')}
                autoComplete='off'
              />
            </div>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            {t('Failed to load deposit address')}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={verifying}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleVerify()
            }}
            disabled={verifying || !address || !txid.trim()}
          >
            {verifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('Verifying...')}
              </>
            ) : (
              t('Verify')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
