import { useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CodePanel } from '@/components/code-panel/CodePanel';
import { ComplexityPanel } from '@/components/complexity-panel/ComplexityPanel';
import { PlaybackControls } from '@/components/playback-controls/PlaybackControls';
import { ExplanationBar } from '@/components/visualization/ExplanationBar';
import { Legend } from '@/components/visualization/Legend';
import { OperationHistory } from '@/components/visualization/OperationHistory';
import { OperationPanel } from '@/components/visualization/OperationPanel';
import { StatsPanel } from '@/components/visualization/StatsPanel';
import { VisualizerShell } from '@/components/visualization/VisualizerShell';
import { LearnSection } from '@/components/learning/LearnSection';
import { Tabs } from '@/components/ui';
import { roleColor } from '@/components/visualization/roles';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import { randomArray } from '@/lib/numbers';
import {
  createHeap,
  heapBuild,
  heapExtract,
  heapInsert,
  heapPeek,
  HEAP_OPERATIONS,
  type HeapKind,
  type HeapState,
} from '@/algorithms/structures/heap';
import { HeapCanvas } from './HeapCanvas';
import { HEAP_LEARNING } from './learning';

const LEGEND = [
  { label: 'Value', color: roleColor('idle') },
  { label: 'Comparing', color: roleColor('compared') },
  { label: 'Swapped', color: roleColor('swapped') },
  { label: 'Cursor', color: roleColor('active') },
  { label: 'Root', color: roleColor('sorted') },
];

const SEED = [2, 7, 4, 9, 11, 6];

export function HeapsPage() {
  const [operationId, setOperationId] = useState(HEAP_OPERATIONS[0].id);
  const operation =
    HEAP_OPERATIONS.find((spec) => spec.id === operationId) ??
    HEAP_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({ value: '1' });
  const [kind, setKind] = useState<HeapKind>('min');

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<HeapState>(createHeap(SEED, 'min'));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const runOperation = (): void => {
    run((current) => {
      switch (operation.id) {
        case 'insert':
          return heapInsert(current, Number(args.value));
        case 'extract':
          return heapExtract(current);
        case 'peek':
          return heapPeek(current);
        default:
          return heapBuild(current);
      }
    });
  };

  const switchKind = (next: HeapKind): void => {
    setKind(next);
    // Re-heapify the same values under the new ordering rather than
    // pretending a min-heap is already a valid max-heap.
    resetTo(createHeap(view.values, next));
    setOperationId('build');
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Heaps"
        title="Binary Heaps"
        description="The same values drawn twice: as the complete tree the heap property is defined on, and as the flat array it actually lives in. Insert and extract, then watch both views move together."
        actions={
          <Tabs
            label="Heap kind"
            value={kind}
            options={[
              { value: 'min', label: 'Min-heap' },
              { value: 'max', label: 'Max-heap' },
            ]}
            onChange={switchKind}
          />
        }
      />

      <VisualizerShell
        canvas={<HeapCanvas state={view} step={step} />}
        canvasFooter={<Legend items={LEGEND} />}
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Insert a value smaller than the root and watch it sift all the way
              up.
            </div>
          )
        }
        controls={
          <PlaybackControls
            controller={controller}
            playback={playback}
            disabled={steps.length === 0}
            trailing={
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    resetTo(
                      createHeap(randomArray(8, { min: 1, max: 60 }), kind),
                    );
                    setOperationId('build');
                  }}
                >
                  <Shuffle size={13} aria-hidden />
                  Random array
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => resetTo(createHeap([], kind))}
                >
                  <RotateCcw size={13} aria-hidden />
                  Clear
                </button>
              </>
            }
          />
        }
        config={
          <OperationPanel
            operations={HEAP_OPERATIONS.map((spec) => ({
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
              <p className="text-[11px] text-ink-dim">
                “Random array” loads unordered values, so the array is not a
                valid heap until you run Heapify — which is the point of that
                operation.
              </p>
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
              timeComplexity={trace?.timeComplexity ?? operation.complexity.average ?? '—'}
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

      <LearnSection title="binary heaps" content={HEAP_LEARNING} />
    </>
  );
}
