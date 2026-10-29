import { useCallback, useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
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
import { Callout, Select } from '@/components/ui';
import { useAlgorithmTrace } from '@/hooks/useAlgorithmTrace';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';
import { usePlayback } from '@/hooks/usePlayback';
import { randomArray } from '@/lib/numbers';
import { SORT_ALGORITHMS, sortAlgorithmById } from '@/algorithms/sorting';
import { MAX_KEY_RANGE } from '@/algorithms/sorting/counting-sort';
import { ArrayInputPanel, type Preset } from './ArrayInputPanel';
import { SortCanvas } from './SortCanvas';
import { SORT_LEGEND } from '@/components/visualization/roles';

const MIN_SIZE = 2;
const MAX_SIZE = 40;
const DEFAULT_SIZE = 14;

/** Counting sort allocates one bucket per key, so its values stay small. */
const valueCeiling = (algorithmId: string): number =>
  algorithmId === 'counting-sort' ? MAX_KEY_RANGE - 1 : 99;

function generate(preset: Preset, size: number, max: number): number[] {
  switch (preset) {
    case 'sorted':
      return randomArray(size, { min: 1, max, sorted: true });
    case 'reversed':
      return randomArray(size, { min: 1, max, sorted: true }).reverse();
    case 'few-unique': {
      const pool = randomArray(Math.max(2, Math.ceil(size / 4)), {
        min: 1,
        max,
        unique: true,
      });
      return Array.from(
        { length: size },
        () => pool[Math.floor(Math.random() * pool.length)],
      );
    }
    case 'nearly-sorted': {
      const values = randomArray(size, { min: 1, max, sorted: true });
      const swaps = Math.max(1, Math.floor(size / 8));
      for (let i = 0; i < swaps; i += 1) {
        const at = Math.floor(Math.random() * Math.max(1, values.length - 1));
        const tmp = values[at];
        values[at] = values[at + 1];
        values[at + 1] = tmp;
      }
      return values;
    }
    case 'random':
    default:
      return randomArray(size, { min: 1, max });
  }
}

export function SortingPage() {
  const [algorithmId, setAlgorithmId] = useState(SORT_ALGORITHMS[0].id);
  const algorithm = sortAlgorithmById(algorithmId) ?? SORT_ALGORITHMS[0];
  const ceiling = valueCeiling(algorithmId);

  const [size, setSize] = useState(DEFAULT_SIZE);
  const [values, setValues] = useState<number[]>(() =>
    generate('random', DEFAULT_SIZE, 99),
  );

  const regenerate = useCallback(
    (preset: Preset, nextSize = size) => {
      setValues(generate(preset, nextSize, valueCeiling(algorithmId)));
    },
    [algorithmId, size],
  );

  const { result, error } = useAlgorithmTrace(algorithm.run, values);
  const steps = result?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length);
  useKeyboardPlayback(controller, steps.length > 0);

  const step = steps[playback.index] ?? steps[0];

  const algorithmOptions = useMemo(
    () =>
      SORT_ALGORITHMS.map((spec) => ({
        value: spec.id,
        label: spec.name,
      })),
    [],
  );

  const handleSizeChange = (nextSize: number): void => {
    setSize(nextSize);
    regenerate('random', nextSize);
  };

  return (
    <>
      <PageHeader
        eyebrow="Algorithms · Sorting"
        title="Sorting Visualizer"
        description="Watch a sorting algorithm run against real data. Every bar, counter and highlighted line comes from the same recorded execution, so stepping backward shows exactly what was true at that moment."
        actions={
          <Select
            label="Algorithm"
            hideLabel
            value={algorithmId}
            options={algorithmOptions}
            onChange={setAlgorithmId}
            className="w-52"
          />
        }
      />

      {error && (
        <Callout tone="warning" className="mb-4">
          <p className="mb-2">{error}</p>
          <button
            type="button"
            className="btn"
            onClick={() => regenerate('random')}
          >
            <Shuffle size={13} aria-hidden />
            Generate values in range
          </button>
        </Callout>
      )}

      <VisualizerShell
        canvas={
          step ? (
            <SortCanvas step={step} />
          ) : (
            <p className="flex h-56 items-center justify-center text-sm text-ink-dim">
              No trace to show — fix the input above.
            </p>
          )
        }
        canvasFooter={<Legend items={SORT_LEGEND} />}
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
                onClick={() => regenerate('random')}
              >
                <Shuffle size={13} aria-hidden />
                Randomize
              </button>
            }
          />
        }
        config={
          <ArrayInputPanel
            values={values}
            size={size}
            minSize={MIN_SIZE}
            maxSize={MAX_SIZE}
            maxValue={ceiling}
            onSizeChange={handleSizeChange}
            onPreset={(preset) => regenerate(preset)}
            onApplyValues={(next) => {
              setValues(next);
              setSize(Math.max(MIN_SIZE, next.length));
            }}
            note={
              algorithmId === 'counting-sort'
                ? `Counting sort allocates one bucket per key, so values here stay within 1…${ceiling}.`
                : undefined
            }
          />
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
