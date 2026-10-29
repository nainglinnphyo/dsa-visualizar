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
  createHashTable,
  hashDelete,
  hashInsert,
  hashSearch,
  HASH_OPERATIONS,
  type HashTableState,
  type Strategy,
} from '@/algorithms/structures/hash-table';
import { HashTableCanvas } from './HashTableCanvas';
import { HASH_LEARNING } from './learning';

export function HashTablesPage() {
  const [operationId, setOperationId] = useState(HASH_OPERATIONS[0].id);
  const operation =
    HASH_OPERATIONS.find((spec) => spec.id === operationId) ??
    HASH_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({
    key: 'cat',
    value: '1',
  });
  const [strategy, setStrategy] = useState<Strategy>('chaining');
  const [capacity, setCapacity] = useState(8);

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<HashTableState>(createHashTable(8, 'chaining'));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const rebuild = (nextStrategy: Strategy, nextCapacity: number): void => {
    setStrategy(nextStrategy);
    setCapacity(nextCapacity);
    resetTo(createHashTable(nextCapacity, nextStrategy));
  };

  const runOperation = (): void => {
    run((current) => {
      switch (operation.id) {
        case 'insert':
          return hashInsert(current, args.key ?? '', Number(args.value));
        case 'search':
          return hashSearch(current, args.key ?? '');
        default:
          return hashDelete(current, args.key ?? '');
      }
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Hash Tables"
        title="Hash Tables"
        description="Every lookup starts by turning a key into a bucket index. Watch the hash being computed character by character, then force a collision and compare how chaining and linear probing deal with it."
        actions={
          <Tabs
            label="Collision strategy"
            value={strategy}
            options={[
              { value: 'chaining', label: 'Chaining' },
              { value: 'linear-probing', label: 'Linear probing' },
            ]}
            onChange={(next) => rebuild(next as Strategy, capacity)}
          />
        }
      />

      <VisualizerShell
        canvas={<HashTableCanvas state={view} />}
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Insert a few keys. With capacity 8, short words collide quickly.
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
                onClick={() => rebuild(strategy, capacity)}
              >
                <Trash2 size={13} aria-hidden />
                Clear table
              </button>
            }
          />
        }
        config={
          <OperationPanel
            operations={HASH_OPERATIONS.map((spec) => ({
              id: spec.id,
              label: spec.label,
              description: spec.description,
              fields: spec.needsValue
                ? [
                    { name: 'key', label: 'Key', placeholder: 'cat' },
                    { name: 'value', label: 'Value', numeric: true },
                  ]
                : [{ name: 'key', label: 'Key', placeholder: 'cat' }],
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
                  min={4}
                  max={16}
                  onChange={(next) => rebuild(strategy, next)}
                  format={(value) => `${value} buckets`}
                />
                <p className="mt-1.5 text-[11px] text-ink-dim">
                  Fewer buckets means more collisions. Changing capacity or
                  strategy rebuilds an empty table.
                </p>
              </div>
            }
          />
        }
        rail={
          <>
            <CodePanel
              code={operation.code(view.strategy)}
              highlightedLines={step?.highlightedLines}
            />
            <ComplexityPanel
              timeComplexity={trace?.timeComplexity ?? 'O(1) average'}
              spaceComplexity={trace?.spaceComplexity ?? 'O(n)'}
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

      <LearnSection title="hash tables" content={HASH_LEARNING} />
    </>
  );
}
