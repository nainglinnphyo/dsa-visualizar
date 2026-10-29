import { BookOpen, Check, Lightbulb, X } from 'lucide-react';
import type { LearningContent } from '@/types/learning';

interface LearnSectionProps {
  title: string;
  content: LearningContent;
}

function List({
  items,
  tone,
}: {
  items: string[];
  tone: 'pro' | 'con' | 'plain';
}) {
  const Icon = tone === 'pro' ? Check : tone === 'con' ? X : undefined;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft"
        >
          {Icon ? (
            <Icon
              size={13}
              aria-hidden
              className={cnTone(tone)}
            />
          ) : (
            <span
              aria-hidden
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-dim"
            />
          )}
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const cnTone = (tone: 'pro' | 'con' | 'plain') =>
  tone === 'pro'
    ? 'mt-1 shrink-0 text-emerald'
    : tone === 'con'
      ? 'mt-1 shrink-0 text-rose'
      : 'mt-1 shrink-0 text-ink-dim';

/** The "learning experience" block shared by every algorithm page. */
export function LearnSection({ title, content }: LearnSectionProps) {
  return (
    <section className="mt-6" aria-labelledby="learn-heading">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen size={15} className="text-accent" aria-hidden />
        <h2 id="learn-heading" className="text-sm font-semibold">
          Understanding {title}
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="panel-title mb-2">What it does</h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {content.what}
          </p>
        </div>

        <div className="card p-4">
          <h3 className="panel-title mb-2">How it works, step by step</h3>
          <ol className="space-y-1.5">
            {content.how.map((item, i) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft"
              >
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line bg-canvas font-mono text-[10px] text-ink-dim">
                  {i + 1}
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-4">
          <h3 className="panel-title mb-2">Common use cases</h3>
          <List items={content.useCases} tone="plain" />
        </div>

        <div className="card grid gap-4 p-4 sm:grid-cols-2">
          <div className="min-w-0">
            <h3 className="panel-title mb-2">Advantages</h3>
            <List items={content.pros} tone="pro" />
          </div>
          <div className="min-w-0">
            <h3 className="panel-title mb-2">Disadvantages</h3>
            <List items={content.cons} tone="con" />
          </div>
        </div>
      </div>

      <div className="card mt-4 flex items-start gap-3 border-amber/30 bg-amber/5 p-4">
        <Lightbulb size={16} className="mt-px shrink-0 text-amber" aria-hidden />
        <div className="min-w-0">
          <h3 className="mb-1 text-[13px] font-semibold text-amber">
            Practice challenge
          </h3>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {content.challenge}
          </p>
        </div>
      </div>
    </section>
  );
}
