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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import {
  formatQuota,
  formatTimestampToDate,
  formatTokens,
  formatUseTime,
  formatLogQuota,
} from '@/lib/format'

import { getTokenLogs, getTokenUsage } from './api'
import type { TokenUsage, TokenUsageLog } from './types'

function getQuotaProgressColor(percentage: number): string {
  if (percentage <= 10) return '[&_[data-slot=progress-indicator]]:bg-rose-500'
  if (percentage <= 30) return '[&_[data-slot=progress-indicator]]:bg-amber-500'
  return '[&_[data-slot=progress-indicator]]:bg-emerald-500'
}

export function UsageToken() {
  const { t } = useTranslation()
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<TokenUsage | null>(null)
  const [logs, setLogs] = useState<TokenUsageLog[]>([])

  async function handleQuery() {
    const trimmed = key.trim()
    if (!trimmed) {
      setError(t('Please enter your API key'))
      setUsage(null)
      setLogs([])
      return
    }
    setLoading(true)
    setError('')
    setUsage(null)
    setLogs([])

    const [usageRes, logsRes] = await Promise.all([
      getTokenUsage(trimmed),
      getTokenLogs(trimmed),
    ])

    if (!usageRes.ok) {
      setError(usageRes.message || t('Invalid token'))
      setLoading(false)
      return
    }
    setUsage(usageRes.data ?? null)
    if (logsRes.ok) {
      setLogs(logsRes.data ?? [])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleQuery()
    }
  }

  // Quota display values
  const total = usage?.total_granted ?? 0
  const used = usage?.total_used ?? 0
  const remaining = usage?.total_available ?? 0
  const usedPercent =
    total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <div className='mb-6 flex items-center gap-2'>
        <KeyRound className='size-7 text-primary' />
        <h1 className='text-2xl font-bold'>{t('Token Usage Query')}</h1>
      </div>

      {/* Input form */}
      <Card className='mb-6'>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={t('Enter your API key (sk-...)')}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete='off'
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full'
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? t('Hide') : t('Show')}
              >
                {showKey ? (
                  <EyeOff className='size-4' />
                ) : (
                  <Eye className='size-4' />
                )}
              </Button>
            </div>
            <Button onClick={handleQuery} disabled={loading}>
              {loading ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Search className='size-4' />
              )}
              {t('Query')}
            </Button>
          </div>
          {error && (
            <p className='mt-3 text-sm text-rose-500' role='alert'>
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage summary */}
      {usage && (
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between gap-2'>
              <span>{usage.name || t('Token')}</span>
              {usage.unlimited_quota && (
                <StatusBadge variant='success'>
                  {t('Unlimited')}
                </StatusBadge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {!usage.unlimited_quota && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>
                    {t('Used')} / {t('Total')}
                  </span>
                  <span className='font-medium'>
                    {formatQuota(used)} / {formatQuota(total)}
                  </span>
                </div>
                <Progress
                  value={usedPercent}
                  className={getQuotaProgressColor(100 - usedPercent)}
                />
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>
                    {t('Used')}: {formatQuota(used)} ({usedPercent}%)
                  </span>
                  <span>
                    {t('Remaining')}: {formatQuota(remaining)} (
                    {100 - usedPercent}%)
                  </span>
                </div>
              </div>
            )}
            <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
              <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                <span className='text-muted-foreground'>{t('Expires At')}</span>
                <span className='font-medium'>
                  {usage.expires_at
                    ? formatTimestampToDate(usage.expires_at)
                    : t('Never')}
                </span>
              </div>
              {usage.model_limits_enabled && (
                <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                  <span className='text-muted-foreground'>
                    {t('Model Limits')}
                  </span>
                  <span className='font-medium'>
                    {Object.keys(usage.model_limits ?? {}).length}{' '}
                    {t('models')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage logs */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Recent Usage')}</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {t('No logs found')}
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Time')}</TableHead>
                      <TableHead>{t('Model')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Tokens')}
                      </TableHead>
                      <TableHead className='text-right'>
                        {t('Quota')}
                      </TableHead>
                      <TableHead className='text-right'>
                        {t('Duration')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const totalTokens =
                        log.prompt_tokens + log.completion_tokens
                      return (
                        <TableRow key={log.id}>
                          <TableCell className='whitespace-nowrap text-sm'>
                            {formatTimestampToDate(log.created_at)}
                          </TableCell>
                          <TableCell className='text-sm'>
                            {log.model_name || '-'}
                          </TableCell>
                          <TableCell className='text-right text-sm'>
                            {formatTokens(totalTokens)}
                          </TableCell>
                          <TableCell className='text-right text-sm'>
                            {formatLogQuota(log.quota)}
                          </TableCell>
                          <TableCell className='text-right text-sm'>
                            {formatUseTime(log.use_time)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
