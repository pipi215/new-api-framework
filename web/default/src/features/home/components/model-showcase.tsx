import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cpu, Zap, Globe, Layers, Sparkles, Brain, MessageSquare, Image, Music, Code } from 'lucide-react'
import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

interface ModelCard {
  id: string
  name: string
  provider: string
  icon: React.ReactNode
  type: string
  color: string
  glowColor: string
}

export function ModelShowcase() {
  const { t } = useTranslation()
  const [activeModel, setActiveModel] = useState<string | null>(null)

  const models: ModelCard[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4o',
      provider: 'OpenAI',
      icon: <Brain className="size-5" />,
      type: t('Chat Model'),
      color: 'from-emerald-500/20 to-emerald-600/10',
      glowColor: 'shadow-emerald-500/20',
    },
    {
      id: 'claude-3',
      name: 'Claude 3.5',
      provider: 'Anthropic',
      icon: <MessageSquare className="size-5" />,
      type: t('Chat Model'),
      color: 'from-amber-500/20 to-amber-600/10',
      glowColor: 'shadow-amber-500/20',
    },
    {
      id: 'gemini',
      name: 'Gemini 2.0',
      provider: 'Google',
      icon: <Sparkles className="size-5" />,
      type: t('Multimodal'),
      color: 'from-violet-500/20 to-violet-600/10',
      glowColor: 'shadow-violet-500/20',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek-V3',
      provider: 'DeepSeek',
      icon: <Code className="size-5" />,
      type: t('Chat Model'),
      color: 'from-blue-500/20 to-blue-600/10',
      glowColor: 'shadow-blue-500/20',
    },
    {
      id: 'dall-e',
      name: 'DALL-E 3',
      provider: 'OpenAI',
      icon: <Image className="size-5" />,
      type: t('Image Generation'),
      color: 'from-pink-500/20 to-pink-600/10',
      glowColor: 'shadow-pink-500/20',
    },
    {
      id: 'suno',
      name: 'Suno',
      provider: 'Suno AI',
      icon: <Music className="size-5" />,
      type: t('Audio Generation'),
      color: 'from-cyan-500/20 to-cyan-600/10',
      glowColor: 'shadow-cyan-500/20',
    },
    {
      id: 'grok',
      name: 'Grok-2',
      provider: 'xAI',
      icon: <Zap className="size-5" />,
      type: t('Chat Model'),
      color: 'from-orange-500/20 to-orange-600/10',
      glowColor: 'shadow-orange-500/20',
    },
    {
      id: 'llama',
      name: 'Llama 3.3',
      provider: 'Meta',
      icon: <Layers className="size-5" />,
      type: t('Chat Model'),
      color: 'from-indigo-500/20 to-indigo-600/10',
      glowColor: 'shadow-indigo-500/20',
    },
  ]

  const categories = [
    { icon: <Cpu className="size-4" />, label: t('40+ AI Providers'), value: '40+' },
    { icon: <Globe className="size-4" />, label: t('Global Coverage'), value: 'Global' },
    { icon: <Layers className="size-4" />, label: t('Model Types'), value: '100+' },
    { icon: <Zap className="size-4" />, label: t('API Formats'), value: 'OpenAI/Claude/Gemini' },
  ]

  return (
    <section className="relative z-10 overflow-hidden border-t border-white/5 dark:border-white/5 bg-muted/50 dark:bg-[#0a0f1e]/20 px-6 py-24 backdrop-blur-sm md:py-32">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-[0.15]"
        style={{
          background: [
            'radial-gradient(ellipse 50% 40% at 20% 50%, oklch(0.65 0.15 280 / 60%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 80% 50%, oklch(0.6 0.12 200 / 50%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <AnimateInView className="mb-16 text-center md:mb-20">
          <p className="mb-3 text-xs font-medium tracking-widest dark:text-white/50 text-foreground/50 uppercase">
            {t('Model Ecosystem')}
          </p>
          <h2 className="text-2xl font-bold tracking-tight dark:text-white text-foreground md:text-3xl">
            {t('One Gateway, ')}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              {t('Infinite Models')}
            </span>
          </h2>
          <p className="dark:text-white/60 text-foreground/60 mx-auto mt-4 max-w-lg text-sm leading-relaxed">
            {t('Seamlessly connect to 40+ AI providers with unified OpenAI-compatible API. Switch models without changing code.')}
          </p>
        </AnimateInView>

        {/* Category stats */}
        <AnimateInView delay={100} className="mb-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 flex flex-col items-center gap-2 rounded-xl border p-4 text-center backdrop-blur-sm"
              >
                <div className="text-blue-400">{cat.icon}</div>
                <span className="text-lg font-bold tabular-nums dark:text-white text-foreground">{cat.value}</span>
                <span className="dark:text-white/50 text-foreground/50 text-xs">{cat.label}</span>
              </div>
            ))}
          </div>
        </AnimateInView>

        {/* Model cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {models.map((model, i) => (
            <AnimateInView key={model.id} delay={i * 80} animation="fade-up">
                <div
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 dark:border-white/10 bg-gradient-to-br p-5 transition-all duration-300',
                  'hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10',
                  activeModel === model.id ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : '',
                  model.color
                )}
                onMouseEnter={() => setActiveModel(model.id)}
                onMouseLeave={() => setActiveModel(null)}
              >
                {/* Glow effect */}
                <div
                  className={cn(
                    'absolute -right-8 -top-8 size-24 rounded-full blur-2xl transition-opacity duration-500',
                    activeModel === model.id ? 'opacity-60' : 'opacity-20',
                    model.glowColor
                  )}
                  style={{ background: `radial-gradient(circle, rgba(147,197,253,0.4) 0%, transparent 70%)` }}
                />

                <div className="relative">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border/50 dark:border-white/10 bg-muted/50 dark:bg-white/5 backdrop-blur-sm dark:text-white text-foreground">
                      {model.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold dark:text-white text-foreground">{model.name}</h3>
                      <p className="dark:text-white/50 text-foreground/50 text-xs">{model.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-400">
                      {model.type}
                    </span>
                    <span className="dark:text-white/40 text-foreground/40 text-[10px]">
                      {t('Unified API')}
                    </span>
                  </div>
                </div>
              </div>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
