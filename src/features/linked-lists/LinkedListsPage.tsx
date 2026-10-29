import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
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
import { Tabs } from '@/components/ui';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import {
  createLinkedList,
  deleteAtPosition,
  insertAtHead,
  insertAtPosition,
  insertAtTail,
  listValues,
  searchList,
  LIST_OPERATIONS,
  type LinkedListState,
} from '@/algorithms/structures/linked-list';
import { LinkedListCanvas } from './LinkedListCanvas';
import { LIST_LEARNING } from './learning';

type ListKind = 'singly' | 'doubly';

export function LinkedListsPage() {
  const [operationId, setOperationId] = useState(LIST_OPERATIONS[0].id);
  const operation =
    LIST_OPERATIONS.find((spec) => spec.id === operationId) ??
    LIST_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({
    value: '9',
    position: '1',
  });
  const [kind, setKind] = useState<ListKind>('singly');

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<LinkedListState>(createLinkedList([4, 7, 2], false));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const runOperation = (): void => {
    const value = Number(args.value);
    const position = Number(args.position);
    run((current) => {
      switch (operation.id) {
        case 'insert-head':
          return insertAtHead(current, value);
        case 'insert-tail':
          return insertAtTail(current, value);
        case 'insert-at':
          return insertAtPosition(current, position, value);
        case 'delete-at':
          return deleteAtPosition(current, position);
        default:
          return searchList(current, value);
      }
    });
  };

  const switchKind = (next: ListKind): void => {
    setKind(next);
    resetTo(createLinkedList(listValues(view), next === 'doubly'));
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Linked Lists"
        title="Linked Lists"
        description="Nodes scattered across memory, held together by pointers. Watch the traversal cost of reaching a position, then watch how little work the actual insertion or deletion is once you are there."
        actions={
          <Tabs
            label="List kind"
            value={kind}
            options={[
              { value: 'singly', label: 'Singly' },
              { value: 'doubly', label: 'Doubly' },
            ]}
            onChange={switchKind}
          />
        }
      />

      <VisualizerShell
        canvas={<LinkedListCanvas state={view} />}
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Run an operation to record a trace. Try inserting at position 2
              and watch the walk from the head.
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
                onClick={() =>
                  resetTo(createLinkedList([4, 7, 2], kind === 'doubly'))
                }
              >
                <RotateCcw size={13} aria-hidden />
                Reset list
              </button>
            }
          />
        }
        config={
          <OperationPanel
            operations={LIST_OPERATIONS.map((spec) => ({
              id: spec.id,
              label: spec.label,
              description: spec.description,
              fields: spec.fields.map((field) =>
                field === 'position'
                  ? { name: 'position', label: 'Position', numeric: true }
                  : { name: 'value', label: 'Value', numeric: true },
              ),
            }))}
            selected={operationId}
            onSelect={setOperationId}
            values={args}
            onChange={(name, value) =>
              setArgs((previous) => ({ ...previous, [name]: value }))
            }
            onRun={runOperation}
            error={error}
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

      <LearnSection title="linked lists" content={LIST_LEARNING} />
    </>
  );
}
