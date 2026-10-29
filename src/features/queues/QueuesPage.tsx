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
import { Slider, Tabs } from '@/components/ui';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import {
  createQueue,
  queueDequeue,
  queueEnqueue,
  queuePeek,
  QUEUE_OPERATIONS,
  type QueueState,
} from '@/algorithms/structures/queue';
import { QueueCanvas } from './QueueCanvas';
import { QUEUE_LEARNING } from './learning';

type QueueKind = 'linear' | 'circular';

export function QueuesPage() {
  const [operationId, setOperationId] = useState(QUEUE_OPERATIONS[0].id);
  const operation =
    QUEUE_OPERATIONS.find((spec) => spec.id === operationId) ??
    QUEUE_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({ value: '5' });
  const [kind, setKind] = useState<QueueKind>('linear');
  const [capacity, setCapacity] = useState(6);

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<QueueState>(createQueue(6, false));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const runOperation = (): void => {
    run((current) => {
      switch (operation.id) {
        case 'enqueue':
          return queueEnqueue(current, Number(args.value));
        case 'dequeue':
          return queueDequeue(current);
        default:
          return queuePeek(current);
      }
    });
  };

  const rebuild = (nextKind: QueueKind, nextCapacity: number): void => {
    setKind(nextKind);
    setCapacity(nextCapacity);
    resetTo(createQueue(nextCapacity, nextKind === 'circular'));
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Queues"
        title="Queues"
        description="A queue adds at one end and removes from the other, so the first value in is the first out. Fill a linear queue, drain it, then try to enqueue again — the wasted slots are exactly why circular queues exist."
        actions={
          <Tabs
            label="Queue kind"
            value={kind}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'circular', label: 'Circular' },
            ]}
            onChange={(next) => rebuild(next, capacity)}
          />
        }
      />

      <VisualizerShell
        canvas={<QueueCanvas state={view} step={step} />}
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Enqueue a few values, then dequeue to watch the front pointer
              advance.
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
                onClick={() => rebuild(kind, capacity)}
              >
                <Trash2 size={13} aria-hidden />
                Clear
              </button>
            }
          />
        }
        config={
          <OperationPanel
            operations={QUEUE_OPERATIONS.map((spec) => ({
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
                  min={2}
                  max={10}
                  onChange={(next) => rebuild(kind, next)}
                  format={(value) => `${value} slots`}
                />
                <p className="mt-1.5 text-[11px] text-ink-dim">
                  Changing the capacity or kind rebuilds an empty queue.
                </p>
              </div>
            }
          />
        }
        rail={
          <>
            <CodePanel
              code={operation.code(view.circular)}
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

      <LearnSection title="queues" content={QUEUE_LEARNING} />
    </>
  );
}
