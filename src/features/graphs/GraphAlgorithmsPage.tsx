import { useCallback, useMemo, useState } from 'react';
import { Network, Shuffle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CodePanel } from '@/components/code-panel/CodePanel';
import { ComplexityPanel } from '@/components/complexity-panel/ComplexityPanel';
import { PlaybackControls } from '@/components/playback-controls/PlaybackControls';
import { ExplanationBar } from '@/components/visualization/ExplanationBar';
import { Legend } from '@/components/visualization/Legend';
import { OperationHistory } from '@/components/visualization/OperationHistory';
import { StatsPanel } from '@/components/visualization/StatsPanel';
import { VisualizerShell } from '@/components/visualization/VisualizerShell';
import { LearnSection } from '@/components/learning/LearnSection';
import { Callout, Panel, Select } from '@/components/ui';
import { useAlgorithmTrace } from '@/hooks/useAlgorithmTrace';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { usePlayback } from '@/hooks/usePlayback';
import {
  GRAPH_ALGORITHMS,
  graphAlgorithmById,
  SAMPLE_DAG,
  SAMPLE_GRAPH,
  buildGraph,
  createGraphState,
  type Graph,
  type GraphRunOptions,
} from '@/algorithms/graphs';
import { GraphCanvas } from './GraphCanvas';

const LEGEND = [
  { label: 'Unvisited', color: 'var(--color-surface-3)' },
  { label: 'In frontier', color: 'var(--color-viz-compare)' },
  { label: 'Current', color: 'var(--color-viz-active)' },
  { label: 'Settled / visited', color: 'var(--color-viz-sorted)' },
  { label: 'On the path', color: 'var(--color-viz-pivot)' },
  { label: 'Rejected edge', color: 'var(--color-viz-swap)' },
];

type PresetId = 'weighted' | 'dag' | 'grid';

const PRESETS: { id: PresetId; label: string; build: () => Graph }[] = [
  { id: 'weighted', label: 'Weighted undirected', build: SAMPLE_GRAPH },
  { id: 'dag', label: 'Directed acyclic', build: SAMPLE_DAG },
  {
    id: 'grid',
    label: 'Ring with shortcut',
    build: () =>
      buildGraph(
        ['A', 'B', 'C', 'D', 'E', 'F'],
        [
          ['A', 'B', 2],
          ['B', 'C', 2],
          ['C', 'D', 2],
          ['D', 'E', 2],
          ['E', 'F', 2],
          ['F', 'A', 2],
          ['A', 'D', 9],
        ],
      ),
  },
];

interface RunInput {
  graph: Graph;
  options: GraphRunOptions;
}

export function GraphAlgorithmsPage() {
  const [algorithmId, setAlgorithmId] = useState(GRAPH_ALGORITHMS[0].id);
  const algorithm = graphAlgorithmById(algorithmId) ?? GRAPH_ALGORITHMS[0];
  const [presetId, setPresetId] = useState<PresetId>('weighted');
  const [graph, setGraph] = useState<Graph>(() => SAMPLE_GRAPH());
  const [start, setStart] = useState('A');
  const [goal, setGoal] = useState('G');

  const mismatch =
    (algorithm.requires === 'directed-acyclic' && !graph.directed) ||
    (algorithm.requires === 'undirected' && graph.directed);

  const run = useCallback(
    (input: RunInput) => algorithm.run(input.graph, input.options),
    [algorithm],
  );

  const input = useMemo<RunInput>(
    () => ({
      graph,
      options: {
        start: algorithm.needsStart ? start : undefined,
        goal: algorithm.needsGoal ? goal : undefined,
      },
    }),
    [graph, start, goal, algorithm.needsStart, algorithm.needsGoal],
  );

  const { result, error } = useAlgorithmTrace(run, input);
  const steps = result?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, {
    traceKey: `${algorithmId}:${start}:${goal}:${graph.edges.length}:${graph.nodes.length}:${graph.directed}`,
  });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index];
  const view = step?.state ?? createGraphState(graph);

  const vertexOptions = graph.nodes.map((node) => ({
    value: node.id,
    label: node.label,
  }));

  const loadPreset = (id: PresetId): void => {
    const preset = PRESETS.find((candidate) => candidate.id === id) ?? PRESETS[0];
    const next = preset.build();
    setPresetId(id);
    setGraph(next);
    setStart(next.nodes[0]?.id ?? 'A');
    setGoal(next.nodes[next.nodes.length - 1]?.id ?? 'A');
  };

  const toggleDirection = (): void => {
    setGraph((previous) => ({ ...previous, directed: !previous.directed }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Algorithms · Graphs"
        title="Graph Algorithms"
        description="Six algorithms over the same picture. Watch which vertices each one touches, in what order, and why — the frontier panel shows the queue, stack or priority queue driving the whole thing."
        actions={
          <Select
            label="Algorithm"
            hideLabel
            value={algorithmId}
            options={GRAPH_ALGORITHMS.map((spec) => ({
              value: spec.id,
              label: spec.name,
            }))}
            onChange={setAlgorithmId}
            className="w-56"
          />
        }
      />

      {(mismatch || error) && (
        <Callout tone="warning" className="mb-4">
          <p className="mb-2">
            {mismatch
              ? algorithm.requires === 'directed-acyclic'
                ? `${algorithm.name} is only defined on directed graphs.`
                : `${algorithm.name} is only defined on undirected graphs.`
              : error}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={toggleDirection}>
              Make the graph {graph.directed ? 'undirected' : 'directed'}
            </button>
            {algorithm.requires === 'directed-acyclic' && (
              <button
                type="button"
                className="btn"
                onClick={() => loadPreset('dag')}
              >
                Load the sample DAG
              </button>
            )}
          </div>
        </Callout>
      )}

      <VisualizerShell
        canvas={
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                {graph.directed ? 'directed' : 'undirected'}
              </span>
              <span className="chip">V = {graph.nodes.length}</span>
              <span className="chip">E = {graph.edges.length}</span>
              {algorithm.needsStart && <span className="chip">start = {start}</span>}
              {algorithm.needsGoal && <span className="chip">goal = {goal}</span>}
            </div>
            <GraphCanvas state={view} />
            <dl className="grid gap-2 border-t border-line pt-3 text-[12px] sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="panel-title mb-0.5">Frontier</dt>
                <dd className="font-mono text-ink-soft">
                  {view.frontier.length ? view.frontier.join(', ') : '—'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="panel-title mb-0.5">Order</dt>
                <dd className="font-mono text-ink-soft">
                  {view.order.length ? view.order.join(' → ') : '—'}
                </dd>
              </div>
              {view.path.length > 0 && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="panel-title mb-0.5">Path</dt>
                  <dd className="font-mono text-violet">
                    {view.path.join(' → ')}
                  </dd>
                </div>
              )}
              {result?.summary && playback.atEnd && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="panel-title mb-0.5">Result</dt>
                  <dd className="font-mono text-emerald">{result.summary}</dd>
                </div>
              )}
            </dl>
          </div>
        }
        canvasFooter={<Legend items={LEGEND} />}
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
          <Panel
            title="Graph"
            icon={<Network size={13} aria-hidden />}
            collapsible
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-3">
                <div>
                  <p className="panel-title mb-1.5">Preset</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`btn ${preset.id === presetId ? 'border-accent bg-accent-soft text-accent' : ''}`}
                        onClick={() => loadPreset(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn" onClick={toggleDirection}>
                  <Shuffle size={13} aria-hidden />
                  Switch to {graph.directed ? 'undirected' : 'directed'}
                </button>
              </div>
              <div className="min-w-0 space-y-3">
                {algorithm.needsStart && (
                  <Select
                    label="Start vertex"
                    value={start}
                    options={vertexOptions}
                    onChange={setStart}
                  />
                )}
                {algorithm.needsGoal && (
                  <Select
                    label="Goal vertex"
                    value={goal}
                    options={vertexOptions}
                    onChange={setGoal}
                    hint={
                      algorithmId === 'dijkstra'
                        ? 'Dijkstra stops as soon as the goal settles.'
                        : undefined
                    }
                  />
                )}
                {!algorithm.needsStart && !algorithm.needsGoal && (
                  <p className="text-[11px] text-ink-dim">
                    {algorithm.name} processes the whole graph, so it needs no
                    start or goal.
                  </p>
                )}
              </div>
            </div>
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
