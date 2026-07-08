import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Server, ArrowRight, CheckCircle, AlertCircle, Activity } from 'lucide-react'
import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

interface ChannelNode {
  id: string
  name: string
  status: 'active' | 'idle' | 'warning'
  latency: number
  requests: number
}

interface Connection {
  from: string
  to: string
  active: boolean
}

export function GatewayVisualization() {
  const { t } = useTranslation()
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const channels: ChannelNode[] = [
    { id: 'openai', name: 'OpenAI', status: 'active', latency: 142, requests: 12580 },
    { id: 'claude', name: 'Claude', status: 'active', latency: 168, requests: 8930 },
    { id: 'gemini', name: 'Gemini', status: 'active', latency: 93, requests: 6720 },
    { id: 'deepseek', name: 'DeepSeek', status: 'active', latency: 156, requests: 15420 },
    { id: 'azure', name: 'Azure', status: 'idle', latency: 210, requests: 3450 },
    { id: 'bedrock', name: 'Bedrock', status: 'warning', latency: 320, requests: 1890 },
  ]

  const connections: Connection[] = [
    { from: 'gateway', to: 'openai', active: true },
    { from: 'gateway', to: 'claude', active: true },
    { from: 'gateway', to: 'gemini', active: true },
    { from: 'gateway', to: 'deepseek', active: true },
    { from: 'gateway', to: 'azure', active: false },
    { from: 'gateway', to: 'bedrock', active: false },
  ]

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveConnections((prev) => {
        const next = new Set<string>()
        connections.forEach((conn) => {
          if (Math.random() > 0.3) {
            next.add(`${conn.from}-${conn.to}`)
          }
        })
        return next
      })
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="size-3.5 text-emerald-500" />
      case 'warning':
        return <AlertCircle className="size-3.5 text-amber-500" />
      default:
        return <Activity className="size-3.5 dark:text-white/40 text-foreground/40" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-emerald-500/30 bg-emerald-500/5'
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5'
      default:
        return 'border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5'
    }
  }

  return (
    <section className="relative z-10 overflow-hidden border-t border-white/5 dark:border-white/5 bg-muted/50 dark:bg-[#0a0f1e]/20 px-6 py-24 backdrop-blur-sm md:py-32">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.12]"
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 50% 30%, oklch(0.65 0.15 250 / 60%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 30% 70%, oklch(0.6 0.12 280 / 50%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <AnimateInView className="mb-16 text-center md:mb-20">
          <p className="mb-3 text-xs font-medium tracking-widest dark:text-white/50 text-foreground/50 uppercase">
            {t('Smart Routing')}
          </p>
          <h2 className="text-2xl font-bold tracking-tight dark:text-white text-foreground md:text-3xl">
            {t('Intelligent ')}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              {t('Channel Gateway')}
            </span>
          </h2>
          <p className="dark:text-white/60 text-foreground/60 mx-auto mt-4 max-w-lg text-sm leading-relaxed">
            {t('Automatic load balancing, failover, and rate limiting across multiple upstream channels. Real-time health monitoring ensures 99.9% uptime.')}
          </p>
        </AnimateInView>

        {/* Gateway visualization */}
        <AnimateInView delay={200} animation="fade-up">
          <div className="relative">
            {/* Central Gateway Node */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="border-border/40 bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex size-20 items-center justify-center rounded-2xl border shadow-lg shadow-blue-500/20 backdrop-blur-sm">
                  <Server className="size-8 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="absolute inset-0 -z-10 size-20 animate-pulse rounded-2xl bg-blue-500/20 blur-xl" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold dark:text-white/80 text-foreground/80">
                  {t('New API Gateway')}
                </div>
              </div>
            </div>

            {/* Connection lines */}
            <div className="mb-8 flex justify-center gap-1">
              {connections.map((conn, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-8 w-px transition-all duration-500',
                    activeConnections.has(`${conn.from}-${conn.to}`)
                      ? 'bg-gradient-to-b from-blue-500 to-transparent opacity-100'
                      : 'bg-border/30 opacity-40'
                  )}
                />
              ))}
            </div>

            {/* Channel nodes */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {channels.map((channel, i) => (
                <AnimateInView key={channel.id} delay={i * 100} animation="fade-up">
                  <div
                    className={cn(
                      'group relative overflow-hidden rounded-xl border border-border/50 dark:border-white/10 p-4 transition-all duration-300',
                      'hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/10',
                      getStatusColor(channel.status)
                    )}
                  >
                    {/* Glow effect */}
                    <div
                      className={cn(
                        'absolute -right-4 -top-4 size-16 rounded-full blur-2xl transition-opacity duration-500',
                        channel.status === 'active' ? 'opacity-40' : 'opacity-10'
                      )}
                      style={{
                        background:
                          channel.status === 'active'
                            ? 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(148,163,184,0.2) 0%, transparent 70%)',
                      }}
                    />

                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold dark:text-white text-foreground">{channel.name}</span>
                        {getStatusIcon(channel.status)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="dark:text-white/40 text-muted-foreground/60">{t('Latency')}</span>
                          <span className="font-mono tabular-nums dark:text-white/70 text-muted-foreground">{channel.latency}ms</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="dark:text-white/40 text-muted-foreground/60">{t('Requests')}</span>
                          <span className="font-mono tabular-nums dark:text-white/70 text-muted-foreground">
                            {channel.requests.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {/* Animated status bar */}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border/50 dark:bg-white/10">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            channel.status === 'active'
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                              : channel.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-white/20'
                          )}
                          style={{
                            width: `${Math.min((channel.requests / 20000) * 100, 100)}%`,
                            animation:
                              channel.status === 'active'
                                ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                : undefined,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </AnimateInView>
              ))}
            </div>

            {/* Feature badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { label: t('Load Balancing'), color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                { label: t('Auto Failover'), color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { label: t('Rate Limiting'), color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                { label: t('Health Check'), color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
              ].map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium',
                    badge.color
                  )}
                >
                  <ArrowRight className="size-3" />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
