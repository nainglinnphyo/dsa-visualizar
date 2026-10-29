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
import { Panel, Tabs } from '@/components/ui';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { useOperationTrace } from '@/hooks/useOperationTrace';
import { usePlayback } from '@/hooks/usePlayback';
import {
  adjacencyList,
  adjacencyMatrix,
  createGraphState,
  degreeOf,
  SAMPLE_GRAPH,
  type GraphState,
} from '@/algorithms/graphs';
import {
  addEdgeOperation,
  addVertexOperation,
  inspectNeighbours,
  removeEdgeOperation,
  removeVertexOperation,
  GRAPH_EDITS,
  GRAPH_EDIT_CODE,
} from '@/algorithms/graphs/edits';
import { GraphCanvas } from './GraphCanvas';
import { GRAPH_LEARNING } from './learning';

type View = 'list' | 'matrix';

export function GraphsPage() {
  const [operationId, setOperationId] = useState(GRAPH_EDITS[0].id);
  const operation =
    GRAPH_EDITS.find((spec) => spec.id === operationId) ?? GRAPH_EDITS[0];
  const [args, setArgs] = useState<Record<string, string>>({
    vertex: 'A',
    from: 'A',
    to: 'D',
    weight: '3',
  });
  const [view, setView] = useState<View>('list');

  const { trace, traceKey, base, error, run, resetTo } =
    useOperationTrace<GraphState>(createGraphState(SAMPLE_GRAPH()));

  const steps = trace?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, { traceKey });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const state = step?.state ?? base;
  const graph = state.graph;

  const runOperation = (): void => {
    run((current) => {
      const g = current.graph;
      switch (operation.id) {
        case 'add-vertex':
          return addVertexOperation(g);
        case 'remove-vertex':
          return removeVertexOperation(g, args.vertex ?? '');
        case 'add-edge':
          return addEdgeOperation(g, args.from ?? '', args.to ?? '', Number(args.weight));
        case 'remove-edge':
          return removeEdgeOperation(g, args.from ?? '', args.to ?? '');
        default:
          return inspectNeighbours(g, args.vertex ?? '');
      }
    });
  };

  const matrix = adjacencyMatrix(graph);

  return (
    <>
      <PageHeader
        eyebrow="Data Structures · Graphs"
        title="Graphs"
        description="Build a graph by hand and watch both representations change with it. The same five edits cost wildly different amounts depending on whether you store an adjacency list or a matrix."
        actions={
          <Tabs
            label="Representation"
            value={view}
            options={[
              { value: 'list', label: 'Adjacency list' },
              { value: 'matrix', label: 'Matrix' },
            ]}
            onChange={setView}
          />
        }
      />

      <VisualizerShell
        canvas={
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                {graph.directed ? 'directed' : 'undirected'}
              </span>
              <span className="chip">V = {graph.nodes.length}</span>
              <span className="chip">E = {graph.edges.length}</span>
            </div>
            <GraphCanvas state={state} />
          </div>
        }
        canvasFooter={
          view === 'list' ? (
            <div className="min-w-0">
              <p className="panel-title mb-1.5">
                Adjacency list — O(V + E) space
              </p>
              <ul className="space-y-0.5 font-mono text-[11.5px]">
                {adjacencyList(graph).map((row) => (
                  <li
                    key={row.id}
                    className={
                      state.current === row.id ? 'text-accent' : 'text-ink-soft'
                    }
                  >
                    <span className="inline-block w-5">{row.id}</span>
                    <span className="text-ink-dim">→ </span>
                    {row.to.length ? row.to.join(', ') : <span className="text-ink-dim">∅</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <p className="panel-title mb-1.5">
                Adjacency matrix — O(V²) space, {graph.nodes.length}² ={' '}
                {graph.nodes.length ** 2} cells for {graph.edges.length} edges
              </p>
              <table className="font-mono text-[11px]">
                <thead>
                  <tr>
                    <th className="w-6" />
                    {graph.nodes.map((node) => (
                      <th key={node.id} className="w-6 text-ink-dim">
                        {node.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graph.nodes.map((node, i) => (
                    <tr key={node.id}>
                      <th className="text-ink-dim">{node.label}</th>
                      {matrix[i].map((cell, j) => (
                        <td
                          key={j}
                          className={`text-center ${cell ? 'text-accent' : 'text-ink-dim/40'}`}
                        >
                          {cell || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        explanation={
          step ? (
            <ExplanationBar
              description={step.description}
              operation={step.operation}
              stepKey={playback.index}
            />
          ) : (
            <div className="card px-3 py-2.5 text-[13px] text-ink-dim">
              Add or remove vertices and edges, or list one vertex’s neighbours.
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
                      createGraphState({
                        ...graph,
                        directed: !graph.directed,
                      }),
                    )
                  }
                >
                  Make {graph.directed ? 'undirected' : 'directed'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => resetTo(createGraphState(SAMPLE_GRAPH()))}
                >
                  <RotateCcw size={13} aria-hidden />
                  Reset
                </button>
              </>
            }
          />
        }
        config={
          <OperationPanel
            operations={GRAPH_EDITS.map((spec) => ({
              id: spec.id,
              label: spec.label,
              description: spec.description,
              fields: spec.fields.map((field) => {
                if (field === 'weight') {
                  return { name: 'weight', label: 'Weight', numeric: true };
                }
                if (field === 'vertex') {
                  return { name: 'vertex', label: 'Vertex', placeholder: 'A' };
                }
                return {
                  name: field,
                  label: field === 'from' ? 'From' : 'To',
                  placeholder: field === 'from' ? 'A' : 'B',
                };
              }),
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
                Vertices:{' '}
                <span className="font-mono text-ink-soft">
                  {graph.nodes.map((n) => `${n.id}(${degreeOf(graph, n.id)})`).join(', ') ||
                    'none'}
                </span>{' '}
                — label and degree.
              </p>
            }
          />
        }
        rail={
          <>
            <CodePanel
              code={GRAPH_EDIT_CODE}
              highlightedLines={step?.highlightedLines}
            />
            <ComplexityPanel
              timeComplexity={trace?.timeComplexity ?? operation.complexity.average ?? '—'}
              spaceComplexity={trace?.spaceComplexity ?? 'O(1)'}
              info={operation.complexity}
            />
            <Panel title="Representation cost">
              <dl className="space-y-1.5 text-[11.5px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-dim">Adjacency list space</dt>
                  <dd className="font-mono">
                    O(V + E) = {graph.nodes.length + graph.edges.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-dim">Matrix space</dt>
                  <dd className="font-mono">
                    O(V²) = {graph.nodes.length ** 2}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-dim">Edge lookup (list)</dt>
                  <dd className="font-mono">O(degree)</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-dim">Edge lookup (matrix)</dt>
                  <dd className="font-mono">O(1)</dd>
                </div>
              </dl>
            </Panel>
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

      <LearnSection title="graphs" content={GRAPH_LEARNING} />
    </>
  );
}
