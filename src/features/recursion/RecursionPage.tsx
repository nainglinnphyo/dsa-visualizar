import { useCallback, useMemo, useState } from 'react';
import { Braces } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CodePanel } from '@/components/code-panel/CodePanel';
import { ComplexityPanel } from '@/components/complexity-panel/ComplexityPanel';
import { PlaybackControls } from '@/components/playback-controls/PlaybackControls';
import { ExplanationBar } from '@/components/visualization/ExplanationBar';
import { OperationHistory } from '@/components/visualization/OperationHistory';
import { StatsPanel } from '@/components/visualization/StatsPanel';
import { VisualizerShell } from '@/components/visualization/VisualizerShell';
import { LearnSection } from '@/components/learning/LearnSection';
import { Callout, Panel, Select, Slider } from '@/components/ui';
import { useAlgorithmTrace } from '@/hooks/useAlgorithmTrace';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { usePlayback } from '@/hooks/usePlayback';
import {
  RECURSION_ALGORITHMS,
  recursionAlgorithmById,
  emptyRecursionState,
  type RecursionState,
} from '@/algorithms/recursion';
import { CallStackView } from './CallStackView';
import {
  ArrayWindowView,
  HanoiView,
  MazeView,
  QueensView,
} from './ExtraViews';

function ExtraView({ state }: { state: RecursionState }) {
  switch (state.extra.kind) {
    case 'hanoi':
      return <HanoiView extra={state.extra} />;
    case 'maze':
      return <MazeView extra={state.extra} />;
    case 'queens':
      return <QueensView extra={state.extra} />;
    case 'array':
      return <ArrayWindowView extra={state.extra} />;
    default:
      return null;
  }
}

export function RecursionPage() {
  const [algorithmId, setAlgorithmId] = useState(RECURSION_ALGORITHMS[0].id);
  const algorithm =
    recursionAlgorithmById(algorithmId) ?? RECURSION_ALGORITHMS[0];
  const [argsById, setArgsById] = useState<Record<string, Record<string, number>>>(
    () =>
      Object.fromEntries(
        RECURSION_ALGORITHMS.map((spec) => [spec.id, { ...spec.defaults }]),
      ),
  );

  const args = argsById[algorithmId] ?? algorithm.defaults;
  const run = useCallback(
    (input: Record<string, number>) => algorithm.run(input),
    [algorithm],
  );
  const { result, error } = useAlgorithmTrace(run, args);
  const steps = result?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, {
    traceKey: `${algorithmId}:${Object.values(args).join(',')}`,
    initialSpeed: 4,
  });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const state = step?.state ?? emptyRecursionState();

  const hasExtra = state.extra.kind !== 'none';

  const fieldHint = useMemo(() => {
    if (algorithmId === 'maze') return 'Two hand-built layouts.';
    if (algorithmId === 'binary-search-recursive') {
      return 'The array holds the even numbers 2, 4, 6, … so odd targets are guaranteed misses.';
    }
    return undefined;
  }, [algorithmId]);

  return (
    <>
      <PageHeader
        eyebrow="Algorithms · Recursion & Backtracking"
        title="Recursion & Backtracking"
        description="Every frame on the stack is a paused copy of the function with its own arguments. Watch frames pile up on the way down, and values flow back as they unwind — and in the backtracking problems, watch choices get undone."
        actions={
          <Select
            label="Algorithm"
            hideLabel
            value={algorithmId}
            options={RECURSION_ALGORITHMS.map((spec) => ({
              value: spec.id,
              label: spec.name,
            }))}
            onChange={setAlgorithmId}
            className="w-56"
          />
        }
      />

      {error && (
        <Callout tone="warning" className="mb-4">
          {error}
        </Callout>
      )}

      <VisualizerShell
        canvas={
          <div className="min-w-0 space-y-4">
            {hasExtra && (
              <>
                <ExtraView state={state} />
                <div className="border-t border-line pt-3" />
              </>
            )}
            <CallStackView state={state} />
          </div>
        }
        explanation={
          step && (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          )
        }
        controls={
          <PlaybackControls
            controller={controller}
            playback={playback}
            disabled={steps.length === 0}
          />
        }
        config={
          <Panel title="Input" icon={<Braces size={13} aria-hidden />} collapsible>
            <div className="grid max-w-lg gap-4 sm:grid-cols-2">
              {algorithm.fields.map((field) => (
                <Slider
                  key={field.name}
                  label={field.label}
                  value={args[field.name] ?? algorithm.defaults[field.name] ?? field.min}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  onChange={(value) =>
                    setArgsById((previous) => ({
                      ...previous,
                      [algorithmId]: {
                        ...(previous[algorithmId] ?? algorithm.defaults),
                        [field.name]: value,
                      },
                    }))
                  }
                  format={(value) =>
                    algorithmId === 'maze' ? `layout ${value + 1}` : String(value)
                  }
                />
              ))}
            </div>
            {fieldHint && (
              <p className="mt-2 text-[11px] text-ink-dim">{fieldHint}</p>
            )}
          </Panel>
        }
        rail={
          <>
            <CodePanel
              code={algorithm.code}
              highlightedLines={step?.highlightedLines}
            />
            <ComplexityPanel
              timeComplexity={result?.timeComplexity ?? algorithm.complexity.average ?? '—'}
              spaceComplexity={result?.spaceComplexity ?? algorithm.complexity.space}
              info={algorithm.complexity}
            />
            <StatsPanel steps={steps} index={playback.index} />
            <OperationHistory
              steps={steps}
              index={playback.index}
              onSelect={(index) => {
                controller.pause();
                controller.seek(index);
              }}
            />
          </>
        }
      />

      <LearnSection title={algorithm.name} content={algorithm.learn} />
    </>
  );
}
