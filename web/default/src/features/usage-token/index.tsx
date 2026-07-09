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
import {
  Search,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Copy,
  Download,
  Clock,
  Hash,
  Zap,
  Coins,
  FileText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { PublicLayout } from '@/components/layout'
import {
  formatQuota,
  formatTimestampToDate,
  formatTokens,
} from '@/lib/format'
import { toast } from 'sonner'

import { getTokenLogs, getTokenUsage } from './api'
import type { TokenUsage, TokenUsageLog } from './types'

// Badge color palette for model name tags (mirrors key-tool stringToColor)
const BADGE_COLORS = [
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
]

function stringToBadgeColor(str: string): string {
  let sum = 0
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i)
  }
  return BADGE_COLORS[sum % BADGE_COLORS.length]
}

function useTimeBadge(seconds: number) {
  const { t } = useTranslation()
  if (seconds < 101) {
    return (
      <Badge className='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
        {seconds}s
      </Badge>
    )
  }
  if (seconds < 301) {
    return (
      <Badge className='bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'>
        {seconds}s
      </Badge>
    )
  }
  return (
    <Badge className='bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'>
      {seconds}s
    </Badge>
  )
}

interface InfoRow {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export function UsageToken() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<TokenUsage | null>(null)
  const [logs, setLogs] = useState<TokenUsageLog[]>([])
  const [tokenValid, setTokenValid] = useState(false)
  const [openItems, setOpenItems] = useState<string[]>([])

  async function handleQuery() {
    const trimmed = key.trim()
    if (!trimmed) {
      setError(t('Please enter your API key'))
      return
    }
    if (!/^sk-[a-zA-Z0-9]{48}$/.test(trimmed)) {
      setError(t('Invalid token format'))
      return
    }
    setLoading(true)
    setError('')
    setUsage(null)
    setLogs([])
    setTokenValid(false)
    setOpenItems([])

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
    setTokenValid(true)

    if (logsRes.ok) {
      setLogs(logsRes.data ?? [])
      setOpenItems(['info', 'detail'])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleQuery()
    }
  }

  function handleCopyTokenInfo() {
    if (!usage) return
    const info = `${t('Token Name')}: ${usage.name || t('Unknown')}
${t('Total')}: ${usage.unlimited_quota ? t('Unlimited') : formatQuota(usage.total_granted)}
${t('Remaining')}: ${usage.unlimited_quota ? t('Unlimited') : formatQuota(usage.total_available)}
${t('Used')}: ${usage.unlimited_quota ? t('N/A') : formatQuota(usage.total_used)}
${t('Expires At')}: ${usage.expires_at === 0 ? t('Never') : formatTimestampToDate(usage.expires_at)}`
    copyToClipboard(info)
  }

  function handleExportCSV() {
    if (logs.length === 0) return
    const headers = [
      t('Time'),
      t('Token Name'),
      t('Model'),
      t('Duration'),
      t('Prompt'),
      t('Completion'),
      t('Quota'),
      t('Detail'),
    ]
    const rows = logs.map((log) => [
      formatTimestampToDate(log.created_at),
      log.token_name || '',
      log.model_name || '',
      String(log.use_time),
      String(log.prompt_tokens),
      String(log.completion_tokens),
      String(log.quota),
      (log.content || '').replace(/"/g, '""'),
    ])
    const csv =
      '\ufeff' +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(','))
        .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'token-usage.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success(t('Exported successfully'))
  }

  const infoRows: InfoRow[] = usage
    ? [
        {
          icon: <KeyRound className='size-3.5' />,
          label: t('Token Name'),
          value: usage.name || t('Unknown'),
        },
        {
          icon: <Coins className='size-3.5' />,
          label: t('Total'),
          value: usage.unlimited_quota
            ? t('Unlimited')
            : formatQuota(usage.total_granted),
        },
        {
          icon: <Coins className='size-3.5' />,
          label: t('Remaining'),
          value: usage.unlimited_quota
            ? t('Unlimited')
            : formatQuota(usage.total_available),
        },
        {
          icon: <Coins className='size-3.5' />,
          label: t('Used'),
          value: usage.unlimited_quota
            ? t('N/A')
            : formatQuota(usage.total_used),
        },
        {
          icon: <Clock className='size-3.5' />,
          label: t('Expires At'),
          value:
            usage.expires_at === 0
              ? t('Never')
              : formatTimestampToDate(usage.expires_at),
        },
      ]
    : []

  return (
    <PublicLayout>
      <div className='mx-auto max-w-4xl py-4'>
        {/* Page title */}
        <div className='mb-6 flex items-center gap-2'>
          <KeyRound className='size-6 text-primary' />
          <h1 className='text-xl font-bold tracking-tight'>
            {t('Token Usage Query')}
          </h1>
        </div>

        {/* Input card */}
        <Card className='mb-4'>
          <CardContent className='pt-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2' />
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={t('Enter your API key (sk-...)')}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete='off'
                  className='pr-10 pl-9'
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

        {/* Results accordion */}
        {tokenValid && (
          <Card>
            <CardContent className='pt-6'>
              <Accordion
                value={openItems}
                onValueChange={setOpenItems}
                className='w-full'
              >
                {/* Token info panel */}
                <AccordionItem value='info'>
                  <div className='flex items-center justify-between'>
                    <AccordionTrigger>{t('Token Information')}</AccordionTrigger>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='mr-2 shrink-0'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyTokenInfo()
                      }}
                    >
                      <Copy className='size-3.5' />
                      {t('Copy')}
                    </Button>
                  </div>
                  <AccordionContent>
                    <div className='grid grid-cols-1 gap-3 py-2 sm:grid-cols-2'>
                      {infoRows.map((row) => (
                        <div
                          key={row.label}
                          className='flex items-center justify-between rounded-md border px-3 py-2'
                        >
                          <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                            {row.icon}
                            {row.label}
                          </span>
                          <span className='text-sm font-medium'>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Usage detail panel */}
                <AccordionItem value='detail'>
                  <div className='flex items-center justify-between'>
                    <AccordionTrigger>{t('Usage Details')}</AccordionTrigger>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='mr-2 shrink-0'
                      disabled={logs.length === 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportCSV()
                      }}
                    >
                      <Download className='size-3.5' />
                      {t('Export CSV')}
                    </Button>
                  </div>
                  <AccordionContent>
                    {logs.length === 0 ? (
                      <p className='text-muted-foreground py-6 text-center text-sm'>
                        {t('No logs found')}
                      </p>
                    ) : (
                      <div className='overflow-x-auto'>
                        <TooltipProvider delay={300}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('Time')}</TableHead>
                                <TableHead>{t('Model')}</TableHead>
                                <TableHead className='text-right'>
                                  {t('Duration')}
                                </TableHead>
                                <TableHead className='text-right'>
                                  {t('Prompt')}
                                </TableHead>
                                <TableHead className='text-right'>
                                  {t('Completion')}
                                </TableHead>
                                <TableHead className='text-right'>
                                  {t('Quota')}
                                </TableHead>
                                <TableHead>{t('Detail')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs.map((log) => {
                                const isConsume =
                                  log.type === 0 || log.type === 2
                                return (
                                  <TableRow key={log.id}>
                                    <TableCell className='whitespace-nowrap text-xs'>
                                      {formatTimestampToDate(log.created_at)}
                                    </TableCell>
                                    <TableCell>
                                      {isConsume && log.model_name ? (
                                        <Badge
                                          className={`cursor-pointer font-mono text-xs ${stringToBadgeColor(log.model_name)}`}
                                          onClick={() =>
                                            copyToClipboard(log.model_name)
                                          }
                                        >
                                          {log.model_name}
                                        </Badge>
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                      {isConsume
                                        ? useTimeBadge(log.use_time)
                                        : '-'}
                                    </TableCell>
                                    <TableCell className='text-right text-xs'>
                                      {isConsume ? log.prompt_tokens : '-'}
                                    </TableCell>
                                    <TableCell className='text-right text-xs'>
                                      {isConsume && log.completion_tokens > 0
                                        ? log.completion_tokens
                                        : '-'}
                                    </TableCell>
                                    <TableCell className='text-right text-xs'>
                                      {isConsume
                                        ? formatQuota(log.quota)
                                        : '-'}
                                    </TableCell>
                                    <TableCell className='max-w-[200px]'>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className='text-muted-foreground line-clamp-2 cursor-help text-xs'>
                                            {log.content || '-'}
                                          </span>
                                        </TooltipTrigger>
                                        {log.content && (
                                          <TooltipContent className='max-w-sm'>
                                            {log.content}
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TooltipProvider>
                        <p className='text-muted-foreground mt-3 text-xs'>
                          {t('Total')}: {logs.length} {t('records')}
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  )
}
