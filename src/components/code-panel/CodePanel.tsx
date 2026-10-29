import { useEffect, useRef, useState } from 'react';
import { Code2 } from 'lucide-react';
import { Panel, Tabs } from '@/components/ui';
import { linesOf, mapHighlight, type CodeLanguage, type CodeSource } from '@/engine/code';
import { cn } from '@/lib/cn';

interface CodePanelProps {
  code: CodeSource;
  /** Pseudocode lines (1-based) for the current step. */
  highlightedLines?: number[];
  className?: string;
}

const LANGUAGE_OPTIONS: { value: CodeLanguage; label: string }[] = [
  { value: 'pseudocode', label: 'Pseudocode' },
  { value: 'typescript', label: 'TypeScript' },
];

export function CodePanel({ code, highlightedLines, className }: CodePanelProps) {
  const [language, setLanguage] = useState<CodeLanguage>('pseudocode');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const source = language === 'pseudocode' ? code.pseudocode : code.typescript;
  const lines = linesOf(source);
  const active = new Set(mapHighlight(code, language, highlightedLines));
  const canMap = language === 'pseudocode' || Boolean(code.lineMap);

  // Keep the executing line in view without yanking the whole page around.
  useEffect(() => {
    const container = scrollRef.current;
    const target = activeRef.current;
    if (!container || !target) return;
    const top = target.offsetTop;
    const bottom = top + target.offsetHeight;
    if (top < container.scrollTop || bottom > container.scrollTop + container.clientHeight) {
      container.scrollTo({
        top: top - container.clientHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [highlightedLines, language]);

  let firstActiveSeen = false;

  return (
    <Panel
      title="Code"
      icon={<Code2 size={13} aria-hidden />}
      className={className}
      bodyClassName="p-0"
      actions={
        <Tabs
          label="Code language"
          size="sm"
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={setLanguage}
        />
      }
    >
      <div
        ref={scrollRef}
        className="max-h-[22rem] overflow-auto py-2 font-mono text-[11.5px] leading-[1.7] lg:max-h-[30rem]"
      >
        {lines.map((line, i) => {
          const lineNumber = i + 1;
          const isActive = active.has(lineNumber);
          const isFirstActive = isActive && !firstActiveSeen;
          if (isFirstActive) firstActiveSeen = true;
          return (
            <div
              key={lineNumber}
              ref={isFirstActive ? activeRef : undefined}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex gap-3 border-l-2 px-3 transition-colors',
                isActive
                  ? 'border-accent bg-accent/12 text-ink'
                  : 'border-transparent text-ink-soft',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'w-5 shrink-0 select-none text-right tabular-nums',
                  isActive ? 'text-accent' : 'text-ink-dim/60',
                )}
              >
                {lineNumber}
              </span>
              <code className="whitespace-pre">{line === '' ? ' ' : line}</code>
            </div>
          );
        })}
      </div>
      {!canMap && (
        <p className="border-t border-line px-3 py-2 text-[11px] text-ink-dim">
          This implementation has no line mapping, so the executing line is shown
          on the Pseudocode tab only.
        </p>
      )}
    </Panel>
  );
}
