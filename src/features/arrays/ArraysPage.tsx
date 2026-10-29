import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Shuffle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CodePanel } from '@/components/code-panel/CodePanel';
import { ComplexityPanel } from '@/components/complexity-panel/ComplexityPanel';
import { PlaybackControls } from '@/components/playback-controls/PlaybackControls';
import { ArrayCells, type CellPointer } from '@/components/visualization/ArrayCells';
import { ExplanationBar } from '@/components/visualization/ExplanationBar';
import { Legend } from '@/components/visualization/Legend';
import { OperationHistory } from '@/components/visualization/OperationHistory';
import { OperationPanel } from '@/components/visualization/OperationPanel';
import { StatsPanel } from '@/components/visualization/StatsPanel';
import { VisualizerShell } from '@/components/visualization/VisualizerShell';
import { LearnSection } from '@/components/learning/LearnSection';
import { roleColor } from '@/components/visualization/roles';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import { randomArray } from '@/lib/numbers';
import {
  ARRAY_OPERATIONS,
  arrayOperationById,
  type ArrayState,
} from '@/algorithms/arrays/operations';
import { ARRAY_LEARNING } from './learning';

const LEGEND = [
  { label: 'Stored value', color: roleColor('idle') },
  { label: 'Being read / compared', color: roleColor('compared') },
  { label: 'Written', color: roleColor('swapped') },
  { label: 'Result', color: roleColor('sorted') },
];

const initialArray = (): ArrayState => ({
  values: randomArray(8, { min: 1, max: 99, sorted: true, unique: true }),
});

export function ArraysPage() {
  const [operationId, setOperationId] = useState(ARRAY_OPERATIONS[0].id);
  const operation = arrayOperationById(operationId) ?? ARRAY_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({
    index: '0',
    value: '42',
  });

  const [seed, setSeed] = useState(initialArray);
  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<ArrayState>(seed);

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);

  const step = steps[playback.index];
  const view: ArrayState = step?.state ?? base;

  const choices = useMemo(
    () =>
      ARRAY_OPERATIONS.map((spec) => ({
        id: spec.id,
        label: spec.label,
        description: spec.description,
        fields: spec.fields.map((field) =>
          field === 'index'
            ? { name: 'index', label: 'Index', numeric: true, placeholder: '0' }
            : { name: 'value', label: 'Value', numeric: true, placeholder: '42' },
        ),
      })),
    [],
  );

  const pointers: CellPointer[] = [];
  if (view.range) {
    pointers.push({ index: view.range.low, label: 'low' });
    pointers.push({ index: view.range.high, label: 'high' });
  }
  const cursor = step?.activeIndices?.[0];
  if (cursor !== undefined && cursor < view.values.length && !view.range) {
    pointers.push({ index: cursor, label: 'i' });
  }

  const regenerate = (sorted: boolean): void => {
    const next: ArrayState = {
      values: randomArray(8, { min: 1, max: 99, sorted, unique: true }),
    };
    setSeed(next);
    resetTo(next);
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Arrays"
        title="Arrays"
        description="An array is one contiguous block of memory, so reading a[i] is a single address calculation while inserting or deleting has to move everything after the hole. Run each operation and watch where the cost comes from."
      />

      <VisualizerShell
        canvas={
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">length = {view.values.length}</span>
              {view.target !== undefined && (
                <span className="chip border-accent/40 bg-accent-soft text-accent">
                  target = {view.target}
                </span>
              )}
            </div>
            <ArrayCells
              values={view.values}
              roles={{
                compared: step?.comparedIndices,
                active: step?.activeIndices,
                swapped: step?.swappedIndices,
                sorted: step?.sortedIndices,
              }}
              pointers={pointers}
              activeRange={view.range ?? null}
              emptyLabel="The array is empty — insert a value to begin."
            />
            {view.foundIndex != null && (
              <p className="flex items-center gap-2 text-[13px] text-emerald">
                <CheckCircle2 size={15} aria-hidden />
                Found {view.target} at index {view.foundIndex}.
              </p>
            )}
            {view.exhausted && (
              <p className="flex items-center gap-2 text-[13px] text-rose">
                <XCircle size={15} aria-hidden />
                {view.target} is not in the array.
              </p>
            )}
          </div>
        }
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
              Pick an operation below and run it to record a trace.
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
                  onClick={() => regenerate(true)}
                >
                  <Shuffle size={13} aria-hidden />
                  New sorted array
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => regenerate(false)}
                >
                  <RotateCcw size={13} aria-hidden />
                  New unsorted
                </button>
              </>
            }
          />
        }
        config={
          <OperationPanel
            operations={choices}
            selected={operationId}
            onSelect={setOperationId}
            values={args}
            onChange={(name, value) =>
              setArgs((previous) => ({ ...previous, [name]: value }))
            }
            error={error}
            onRun={() =>
              run((current) =>
                operation.run(current, {
                  index:
                    args.index === '' || args.index === undefined
                      ? undefined
                      : Number(args.index),
                  value:
                    args.value === '' || args.value === undefined
                      ? undefined
                      : Number(args.value),
                }),
              )
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
              spaceComplexity={trace?.spaceComplexity ?? operation.complexity.space}
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

      <LearnSection title="arrays" content={ARRAY_LEARNING} />
    </>
  );
}
