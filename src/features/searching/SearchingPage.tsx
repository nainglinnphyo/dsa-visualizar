import { useCallback, useMemo, useState } from 'react';
import { Shuffle, Target } from 'lucide-react';
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
import { Callout, Panel, Select, Slider } from '@/components/ui';
import { roleColor } from '@/components/visualization/roles';
import { useAlgorithmTrace } from '@/hooks/useAlgorithmTrace';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { usePlayback } from '@/hooks/usePlayback';
import { InputError } from '@/engine/types';
import { parseNumberList, parseSingleNumber, randomArray, formatList } from '@/lib/numbers';
import { SEARCH_ALGORITHMS, searchAlgorithmById } from '@/algorithms/searching';
import { SearchCanvas } from './SearchCanvas';

const LEGEND = [
  { label: 'Candidate', color: roleColor('idle') },
  { label: 'Being compared', color: roleColor('compared') },
  { label: 'Match', color: roleColor('sorted') },
];

const DEFAULT_SIZE = 15;

export function SearchingPage() {
  const [algorithmId, setAlgorithmId] = useState(SEARCH_ALGORITHMS[0].id);
  const algorithm =
    searchAlgorithmById(algorithmId) ?? SEARCH_ALGORITHMS[0];

  const [size, setSize] = useState(DEFAULT_SIZE);
  const [values, setValues] = useState<number[]>(() =>
    randomArray(DEFAULT_SIZE, { min: 1, max: 99, sorted: true, unique: true }),
  );
  const [target, setTarget] = useState<number>(() => 42);
  const [draftValues, setDraftValues] = useState(() => '');
  const [draftTarget, setDraftTarget] = useState('42');
  const [inputError, setInputError] = useState<string | null>(null);

  const regenerate = useCallback(
    (nextSize = size, sorted = algorithm.requiresSorted) => {
      const next = randomArray(nextSize, {
        min: 1,
        max: 99,
        sorted,
        unique: true,
      });
      setValues(next);
      setDraftValues(formatList(next));
      // Half the time pick a value that is actually present, so both the hit
      // and the miss path are easy to demonstrate.
      const pick =
        Math.random() < 0.6
          ? next[Math.floor(Math.random() * next.length)]
          : Math.floor(Math.random() * 99) + 1;
      setTarget(pick);
      setDraftTarget(String(pick));
    },
    [algorithm.requiresSorted, size],
  );

  const input = useMemo(() => ({ values, target }), [values, target]);
  const { result, error } = useAlgorithmTrace(algorithm.run, input);
  const steps = result?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, {
    traceKey: `${algorithmId}:${values.join(',')}:${target}`,
  });
  useKeyboardPlayback(controller, steps.length > 0);
  const step = steps[playback.index] ?? steps[0];

  const applyCustom = (): void => {
    try {
      const parsedValues = parseNumberList(
        draftValues === '' ? formatList(values) : draftValues,
        { min: -999, max: 999, maxLength: 40, allowEmpty: true },
      );
      const parsedTarget = parseSingleNumber(draftTarget, 'Target');
      setValues(parsedValues);
      setTarget(parsedTarget);
      setSize(Math.max(1, parsedValues.length));
      setInputError(null);
    } catch (cause) {
      setInputError(
        cause instanceof InputError ? cause.message : 'Invalid input.',
      );
    }
  };

  const sortValues = (): void => {
    const next = [...values].sort((a, b) => a - b);
    setValues(next);
    setDraftValues(formatList(next));
  };

  return (
    <>
      <PageHeader
        eyebrow="Algorithms · Searching"
        title="Searching Visualizer"
        description="Compare a scan that checks everything with one that throws away half the data per comparison. The candidate window and comparison counter make the difference concrete."
        actions={
          <Select
            label="Algorithm"
            hideLabel
            value={algorithmId}
            options={SEARCH_ALGORITHMS.map((spec) => ({
              value: spec.id,
              label: spec.name,
            }))}
            onChange={(next) => {
              setAlgorithmId(next);
              const spec = searchAlgorithmById(next);
              if (spec?.requiresSorted) sortValues();
            }}
            className="w-48"
          />
        }
      />

      {error && (
        <Callout tone="warning" className="mb-4">
          <p className="mb-2">{error}</p>
          <button type="button" className="btn" onClick={sortValues}>
            Sort the array
          </button>
        </Callout>
      )}

      <VisualizerShell
        canvas={
          step ? (
            <SearchCanvas
              step={step}
              showWindow={algorithm.requiresSorted}
            />
          ) : (
            <p className="py-10 text-center text-sm text-ink-dim">
              No trace — fix the input above.
            </p>
          )
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
            trailing={
              <button
                type="button"
                className="btn"
                onClick={() => regenerate()}
              >
                <Shuffle size={13} aria-hidden />
                Randomize
              </button>
            }
          />
        }
        config={
          <Panel title="Input" icon={<Target size={13} aria-hidden />} collapsible>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-3">
                <Slider
                  label="Array size"
                  value={size}
                  min={1}
                  max={30}
                  onChange={(next) => {
                    setSize(next);
                    regenerate(next);
                  }}
                  format={(value) => `${value} values`}
                />
                <div>
                  <label htmlFor="target-input" className="panel-title mb-1 block">
                    Target value
                  </label>
                  <input
                    id="target-input"
                    className="field font-mono"
                    value={draftTarget}
                    inputMode="numeric"
                    onChange={(event) => setDraftTarget(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') applyCustom();
                    }}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor="search-values" className="panel-title mb-1 block">
                  Array values
                </label>
                <textarea
                  id="search-values"
                  rows={3}
                  spellCheck={false}
                  className="field resize-y font-mono text-[12px]"
                  value={draftValues === '' ? formatList(values) : draftValues}
                  onChange={(event) => setDraftValues(event.target.value)}
                />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-ink-dim">
                    {algorithm.requiresSorted
                      ? 'Binary search requires ascending order.'
                      : 'Any order works for a linear scan.'}
                  </p>
                  <div className="flex gap-1.5">
                    <button type="button" className="btn" onClick={sortValues}>
                      Sort
                    </button>
                    <button type="button" className="btn" onClick={applyCustom}>
                      Apply
                    </button>
                  </div>
                </div>
                {inputError && (
                  <Callout tone="warning" className="mt-2">
                    {inputError}
                  </Callout>
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
              timeComplexity={result?.timeComplexity ?? '—'}
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
