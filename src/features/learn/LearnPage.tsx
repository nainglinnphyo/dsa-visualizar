import { Link } from 'react-router-dom';
import { ArrowRight, Keyboard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui';
import {
  formatGrowth,
  GLOSSARY,
  GROWTH_LABELS,
  GROWTH_TABLE,
  SORT_COMPLEXITY,
  STRUCTURE_COMPLEXITY,
} from './data';

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['Space'], action: 'Play or pause' },
  { keys: ['←', '→'], action: 'Step backward / forward' },
  { keys: ['Home', 'End'], action: 'Jump to the first or last step' },
  { keys: ['R'], action: 'Reset to the initial state' },
];

export function LearnPage() {
  return (
    <>
      <PageHeader
        eyebrow="Learn"
        title="Learning Resources"
        description="Reference tables for the structures and algorithms in this tool, a glossary of the terms that keep coming up, and how to drive the visualizers."
      />

      <section className="mb-7" aria-labelledby="using">
        <h2 id="using" className="panel-title mb-2.5">
          Using the visualizers
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="card p-4">
            <h3 className="mb-1.5 text-[13px] font-semibold">
              Steps are snapshots
            </h3>
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Every algorithm runs once, up front, recording an immutable copy
              of its state at each operation. That is why stepping backward is
              exact rather than approximate — nothing is replayed or undone.
            </p>
          </div>
          <div className="card p-4">
            <h3 className="mb-1.5 text-[13px] font-semibold">
              The code panel is not decoration
            </h3>
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Each step names the pseudocode lines responsible for it, so the
              highlighted line, the explanation and the counters always describe
              the same moment.
            </p>
          </div>
          <div className="card p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Keyboard size={14} className="text-accent" aria-hidden />
              <h3 className="text-[13px] font-semibold">Keyboard</h3>
            </div>
            <ul className="space-y-1">
              {SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.action}
                  className="flex items-center gap-2 text-[12px] text-ink-soft"
                >
                  <span className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className="chip">
                        {key}
                      </kbd>
                    ))}
                  </span>
                  {shortcut.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-7" aria-labelledby="growth">
        <h2 id="growth" className="panel-title mb-2.5">
          Why complexity classes matter
        </h2>
        <Panel title="Operations as n grows" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-3 py-2 font-medium text-ink-dim">n</th>
                  {GROWTH_LABELS.map((label) => (
                    <th
                      key={label}
                      className="px-3 py-2 text-right font-mono font-medium text-ink-dim"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROWTH_TABLE.map((row) => (
                  <tr key={row.n} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5 font-mono text-ink">{row.n}</td>
                    {row.values.map((cell) => (
                      <td
                        key={cell.label}
                        className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-soft"
                      >
                        {formatGrowth(cell.value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-3 py-2 text-[11.5px] text-ink-dim">
            At n = 128, log n is 7 and n² is 16,384 — a factor of 2,300. 2ⁿ is
            already a 39-digit number. This is the entire reason an algorithm’s
            class matters more than its constant factor.
          </p>
        </Panel>
      </section>

      <section className="mb-7" aria-labelledby="structures">
        <h2 id="structures" className="panel-title mb-2.5">
          Data structure complexity
        </h2>
        <Panel title="Average case unless noted" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-3 py-2 font-medium text-ink-dim">Structure</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Access</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Search</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Insert</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Delete</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Space</th>
                </tr>
              </thead>
              <tbody>
                {STRUCTURE_COMPLEXITY.map((row) => (
                  <tr key={row.name} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5">
                      <span className="block text-ink">{row.name}</span>
                      <span className="block text-[11px] text-ink-dim">
                        {row.note}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.access}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.search}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.insert}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.remove}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.space}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mb-7" aria-labelledby="sorting">
        <h2 id="sorting" className="panel-title mb-2.5">
          Sorting algorithm complexity
        </h2>
        <Panel title="Comparison and non-comparison sorts" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-3 py-2 font-medium text-ink-dim">Algorithm</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Best</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Average</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Worst</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Space</th>
                  <th className="px-3 py-2 font-medium text-ink-dim">Stable</th>
                </tr>
              </thead>
              <tbody>
                {SORT_COMPLEXITY.map((row) => (
                  <tr key={row.name} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5">
                      <span className="block text-ink">{row.name}</span>
                      <span className="block text-[11px] text-ink-dim">
                        {row.note}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.best}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.average}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.worst}</td>
                    <td className="px-3 py-1.5 font-mono text-ink-soft">{row.space}</td>
                    <td
                      className={`px-3 py-1.5 font-mono ${row.stable ? 'text-emerald' : 'text-ink-dim'}`}
                    >
                      {row.stable ? 'yes' : 'no'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-3 py-2 text-[11.5px] text-ink-dim">
            No comparison sort can beat Ω(n log n) in the worst case — there are
            n! possible orderings and each comparison splits the possibilities
            at best in half. Counting sort escapes that bound only because it
            never compares two values.
          </p>
        </Panel>
      </section>

      <section className="mb-7" aria-labelledby="glossary">
        <h2 id="glossary" className="panel-title mb-2.5">
          Glossary
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {GLOSSARY.map((entry) => (
            <div key={entry.term} className="card p-3.5">
              <dt className="mb-1 text-[13px] font-semibold">{entry.term}</dt>
              <dd className="text-[12.5px] leading-relaxed text-ink-soft">
                {entry.definition}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="next">
        <h2 id="next" className="panel-title mb-2.5">
          Suggested order
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/data-structures/arrays', label: '1. Arrays', why: 'Where O(1) access and O(n) insertion come from.' },
            { to: '/algorithms/sorting', label: '2. Sorting', why: 'Comparisons, swaps and the n log n barrier.' },
            { to: '/algorithms/searching', label: '3. Searching', why: 'Why order makes search exponentially cheaper.' },
            { to: '/data-structures/linked-lists', label: '4. Linked lists', why: 'Pointers instead of contiguity.' },
            { to: '/data-structures/trees', label: '5. Trees', why: 'Binary search generalised, and kept balanced.' },
            { to: '/algorithms/graphs', label: '6. Graphs', why: 'Traversal, shortest paths and spanning trees.' },
          ].map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="card group flex h-full flex-col p-3.5 transition-colors hover:border-accent/60"
              >
                <span className="flex items-center justify-between gap-2 text-[13px] font-medium">
                  {item.label}
                  <ArrowRight
                    size={13}
                    aria-hidden
                    className="text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </span>
                <span className="mt-1 text-[12px] leading-relaxed text-ink-dim">
                  {item.why}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
