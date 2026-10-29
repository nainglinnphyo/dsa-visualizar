import { Link } from 'react-router-dom';
import { ArrowRight, Keyboard, Layers3, Play, SquareStack } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { NAV_SECTIONS } from '@/app/navigation';
import { SORT_ALGORITHMS } from '@/algorithms/sorting';

const QUICK_STARTS = [
  {
    to: '/algorithms/sorting',
    title: 'Sorting',
    detail: `${SORT_ALGORITHMS.length} algorithms as animated bars`,
    hint: 'Start with bubble sort on 8 values, then step backward through a swap.',
  },
  {
    to: '/data-structures/trees',
    title: 'Binary search trees',
    detail: 'Insert, delete, rotate, traverse',
    hint: 'Insert 1…7 in order and watch the AVL rotations keep it balanced.',
  },
  {
    to: '/algorithms/graphs',
    title: 'Pathfinding',
    detail: 'BFS, DFS, Dijkstra, A*, MST',
    hint: 'Run Dijkstra and compare the order it settles nodes against BFS.',
  },
];

export function DashboardPage() {
  const sections = NAV_SECTIONS.filter(
    (section) => section.heading !== 'Overview',
  );

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Interactive Data Structures & Algorithms"
        description="Every visualization here runs a real implementation and records each step, so you can play, pause, step backward and read the exact line of code responsible. Pick a topic to begin."
      />

      <section aria-labelledby="quick-start" className="mb-7">
        <h2 id="quick-start" className="panel-title mb-2.5">
          Suggested starting points
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_STARTS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card group flex flex-col p-4 transition-colors hover:border-accent/60"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-accent/90">
                {item.detail}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                {item.hint}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {sections.map((section) => (
        <section
          key={section.heading}
          aria-labelledby={`section-${section.heading}`}
          className="mb-7"
        >
          <h2
            id={`section-${section.heading}`}
            className="panel-title mb-2.5 flex items-center gap-1.5"
          >
            {section.heading === 'Data Structures' ? (
              <SquareStack size={12} aria-hidden />
            ) : section.heading === 'Algorithms' ? (
              <Layers3 size={12} aria-hidden />
            ) : null}
            {section.heading}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="card group flex items-start gap-3 p-3.5 transition-colors hover:border-accent/60"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-ink-dim transition-colors group-hover:border-accent/50 group-hover:text-accent">
                  <item.icon size={14} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-dim">
                    {item.blurb}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="card p-4" aria-labelledby="how-to">
        <h2 id="how-to" className="mb-2.5 text-sm font-semibold">
          How these visualizers work
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 text-accent">
              <Play size={13} aria-hidden />
              <h3 className="text-[12.5px] font-medium">Real execution</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Each algorithm is a pure function that records an immutable
              snapshot per operation. Nothing is scripted or faked — the same
              code is covered by the unit tests.
            </p>
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 text-accent">
              <Layers3 size={13} aria-hidden />
              <h3 className="text-[12.5px] font-medium">Synchronized code</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Every step names the pseudocode lines responsible, so the code
              panel, the explanation and the counters always agree with the
              picture.
            </p>
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 text-accent">
              <Keyboard size={13} aria-hidden />
              <h3 className="text-[12.5px] font-medium">Step either way</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Because steps are snapshots rather than mutations, backward
              navigation is exact. Use Space to play, arrows to step and R to
              reset.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
