import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CodePanel } from '@/components/code-panel/CodePanel';
import { ComplexityPanel } from '@/components/complexity-panel/ComplexityPanel';
import { PlaybackControls } from '@/components/playback-controls/PlaybackControls';
import { ExplanationBar } from '@/components/visualization/ExplanationBar';
import { OperationHistory } from '@/components/visualization/OperationHistory';
import { OperationPanel } from '@/components/visualization/OperationPanel';
import { StatsPanel } from '@/components/visualization/StatsPanel';
import { VisualizerShell } from '@/components/visualization/VisualizerShell';
import { LearnSection } from '@/components/learning/LearnSection';
import { Slider } from '@/components/ui';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import {
  createStack,
  stackPeek,
  stackPop,
  stackPush,
  STACK_OPERATIONS,
  type StackState,
} from '@/algorithms/structures/stack';
import { StackCanvas } from './StackCanvas';
import { STACK_LEARNING } from './learning';

export function StacksPage() {
  const [operationId, setOperationId] = useState(STACK_OPERATIONS[0].id);
  const operation =
    STACK_OPERATIONS.find((spec) => spec.id === operationId) ??
    STACK_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({ value: '7' });
  const [capacity, setCapacity] = useState(6);

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<StackState>(createStack(6, [3, 8]));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const runOperation = (): void => {
    run((current) => {
      switch (operation.id) {
        case 'push':
          return stackPush(current, Number(args.value));
        case 'pop':
          return stackPop(current);
        default:
          return stackPeek(current);
      }
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Stacks"
        title="Stacks"
        description="A stack only ever touches one end. Push and pop both move a single index, which is why they are O(1) — and why the last value in is always the first one out."
      />

      <VisualizerShell
        canvas={<StackCanvas state={view} step={step} />}
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Push a few values, then pop them back off to see LIFO ordering.
            </div>
          )
        }
        controls={
          <PlaybackControls
            controller={controller}
            playback={playback}
            disabled={steps.length === 0}
            trailing={
              <button
                type="button"
                className="btn"
                onClick={() => resetTo(createStack(capacity))}
              >
                <Trash2 size={13} aria-hidden />
                Clear
              </button>
            }
          />
        }
        config={
          <OperationPanel
            operations={STACK_OPERATIONS.map((spec) => ({
              id: spec.id,
              label: spec.label,
              description: spec.description,
              fields: spec.needsValue
                ? [{ name: 'value', label: 'Value', numeric: true }]
                : [],
            }))}
            selected={operationId}
            onSelect={setOperationId}
            values={args}
            onChange={(name, value) =>
              setArgs((previous) => ({ ...previous, [name]: value }))
            }
            onRun={runOperation}
            error={error}
            extra={
              <div className="max-w-xs">
                <Slider
                  label="Capacity"
                  value={capacity}
                  min={1}
                  max={10}
                  onChange={(next) => {
                    setCapacity(next);
                    resetTo(createStack(next, view.items.slice(0, next)));
                  }}
                  format={(value) => `${value} slots`}
                />
                <p className="mt-1.5 text-[11px] text-ink-dim">
                  Lower the capacity below the current size to force an overflow
                  on the next push.
                </p>
              </div>
            }
          />
        }
        rail={
          <>
            <CodePanel
              code={operation.code}
              highlightedLines={step?.highlightedLines}
            />
            <ComplexityPanel
              timeComplexity={trace?.timeComplexity ?? 'O(1)'}
              spaceComplexity={trace?.spaceComplexity ?? 'O(1)'}
              info={operation.complexity}
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

      <LearnSection title="stacks" content={STACK_LEARNING} />
    </>
  );
}
