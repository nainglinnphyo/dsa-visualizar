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
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import { randomArray } from '@/lib/numbers';
import {
  createTree,
  inorderValues,
  treeDelete,
  treeHeight,
  treeInsert,
  treeSearch,
  treeSize,
  treeTraverse,
  TREE_OPERATIONS,
  type TraversalKind,
  type TreeMode,
  type TreeState,
} from '@/algorithms/structures/tree';
import { TreeCanvas } from './TreeCanvas';
import { AVL_LEARNING, BST_LEARNING } from './learning';

const LEGEND = [
  { label: 'Node', color: 'var(--color-surface-3)' },
  { label: 'Cursor', color: 'var(--color-viz-active)' },
  { label: 'Compared', color: 'var(--color-viz-compare)' },
  { label: 'Rotated', color: 'var(--color-viz-swap)' },
  { label: 'Visited', color: 'var(--color-viz-visited)' },
  { label: 'Found', color: 'var(--color-viz-sorted)' },
];

const TRAVERSALS: TraversalKind[] = [
  'inorder',
  'preorder',
  'postorder',
  'level-order',
];

const SEED = [50, 30, 70, 20, 40, 60, 80];

export function TreesPage() {
  const [operationId, setOperationId] = useState(TREE_OPERATIONS[0].id);
  const operation =
    TREE_OPERATIONS.find((spec) => spec.id === operationId) ??
    TREE_OPERATIONS[0];
  const [args, setArgs] = useState<Record<string, string>>({ value: '45' });
  const [mode, setMode] = useState<TreeMode>('bst');

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<TreeState>(createTree(SEED, 'bst'));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? base;

  const runOperation = (): void => {
    const value = Number(args.value);
    run((current) => {
      switch (operation.id) {
        case 'insert':
          return treeInsert(current, value);
        case 'search':
          return treeSearch(current, value);
        case 'delete':
          return treeDelete(current, value);
        default:
          return treeTraverse(current, operation.id as TraversalKind);
      }
    });
  };

  const switchMode = (next: TreeMode): void => {
    setMode(next);
    resetTo(createTree(inorderValues(view), next));
  };

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Trees"
        title="Binary Search Trees & AVL"
        description="Build a tree, then watch each operation walk down from the root. Switch to AVL and the same inserts trigger rotations that keep the height logarithmic — insert 1…7 in order to see the difference."
        actions={
          <Tabs
            label="Tree kind"
            value={mode}
            options={[
              { value: 'bst', label: 'BST' },
              { value: 'avl', label: 'AVL' },
            ]}
            onChange={switchMode}
          />
        }
      />

      <VisualizerShell
        canvas={
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{mode === 'avl' ? 'AVL' : 'plain BST'}</span>
              <span className="chip">nodes = {treeSize(view)}</span>
              <span className="chip">height = {treeHeight(view)}</span>
              {treeSize(view) > 0 && (
                <span className="chip">
                  perfectly balanced height ={' '}
                  {Math.ceil(Math.log2(treeSize(view) + 1))}
                </span>
              )}
            </div>
            <TreeCanvas state={view} showHeights={mode === 'avl'} />
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
              Insert, search, delete, or run one of the four traversals.
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
                  onClick={() =>
                    resetTo(
                      createTree(
                        randomArray(7, { min: 1, max: 99, unique: true }),
                        mode,
                      ),
                    )
                  }
                >
                  <Shuffle size={13} aria-hidden />
                  Random tree
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => resetTo(createTree([], mode))}
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
            operations={TREE_OPERATIONS.map((spec) => ({
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
            runLabel={
              TRAVERSALS.includes(operationId as TraversalKind)
                ? 'Run traversal'
                : 'Run operation'
            }
            error={error}
            extra={
              <p className="text-[11px] text-ink-dim">
                In-order values:{' '}
                <span className="font-mono text-ink-soft">
                  {inorderValues(view).join(', ') || '—'}
                </span>
              </p>
            }
          />
        }
        rail={
          <>
            <CodePanel
              code={operation.code(mode)}
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

      <LearnSection
        title={mode === 'avl' ? 'AVL trees' : 'binary search trees'}
        content={mode === 'avl' ? AVL_LEARNING : BST_LEARNING}
      />
    </>
  );
}
