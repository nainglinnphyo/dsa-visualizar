import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Braces,
  Code2,
  Gauge,
  GitBranch,
  History,
  Keyboard,
  LayoutDashboard,
  Rewind,
  Search,
  SquareStack,
  Table,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { useSystemThemeSync } from '@/theme/useSystemThemeSync';
import { HeroPreview } from './HeroPreview';
import {
  ALGORITHM_GROUPS,
  CATALOG,
  DATA_STRUCTURE_GROUPS,
  TOTAL_ALGORITHMS,
  type CatalogGroup,
} from './catalog';

interface Offer {
  icon: LucideIcon;
  title: string;
  body: string;
}

const OFFERS: Offer[] = [
  {
    icon: Rewind,
    title: 'Step backward, exactly',
    body: 'Each operation is recorded as an immutable snapshot, so going back is a plain array index — not an attempt to undo. The picture you see at step 12 is byte-for-byte the state at step 12.',
  },
  {
    icon: Code2,
    title: 'Code that follows along',
    body: 'Every step names the lines responsible for it, in pseudocode and in TypeScript. The highlighted line, the explanation and the counters always describe the same instant.',
  },
  {
    icon: Gauge,
    title: 'Numbers, not vibes',
    body: 'Live comparison, swap, read, write and recursion-depth counters next to best, average and worst case complexity — so you can check the theory against the run in front of you.',
  },
  {
    icon: History,
    title: 'Real implementations',
    body: 'No hardcoded sequences. Every visualizer calls the same pure function the unit tests call, which is why edge cases like duplicates, empty input and negative numbers behave properly.',
  },
];

interface PanelFeature {
  title: string;
  body: string;
}

const PANELS: PanelFeature[] = [
  {
    title: 'Playback controls',
    body: 'Play, pause, step either way, jump to the ends, scrub to any step, and six speeds from 0.5× to 16×.',
  },
  {
    title: 'Code panel',
    body: 'Pseudocode and TypeScript side by side, with the executing line highlighted and scrolled into view.',
  },
  {
    title: 'Complexity panel',
    body: 'Time and space for the run, plus best/average/worst, stability and whether the algorithm is in place.',
  },
  {
    title: 'Statistics',
    body: 'Counters that only show up when the algorithm actually uses them, snapshotted per step.',
  },
  {
    title: 'Operation history',
    body: 'A clickable log of what happened; jump straight back to any earlier operation.',
  },
  {
    title: 'Learning section',
    body: 'What it does, how it works, use cases, trade-offs and a practice challenge — on every page.',
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: 'The algorithm runs once',
    body: 'A pure function — no React, no DOM, no timers — walks the input and records a snapshot at every meaningful operation, along with the counters and the source lines responsible.',
  },
  {
    title: 'The trace is handed to the engine',
    body: 'A playback controller owns exactly one timer and treats the recording as a filmstrip, so playing, pausing, scrubbing and stepping are all the same operation on an index.',
  },
  {
    title: 'The view reads the current frame',
    body: 'Canvas, code panel, explanation and statistics all render from that one frame. They cannot disagree, because there is only one source of truth.',
  },
];

function CatalogCard({ group }: { group: CatalogGroup }) {
  return (
    <Link
      to={group.to}
      className="card group flex flex-col p-4 transition-colors hover:border-accent/60"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">{group.title}</span>
        <ArrowRight
          size={14}
          aria-hidden
          className="text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </span>
      <ul className="mt-2 space-y-1">
        {group.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-dim"
          >
            <span
              aria-hidden
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-dim/60"
            />
            {item}
          </li>
        ))}
      </ul>
    </Link>
  );
}

export function LandingPage() {
  useSystemThemeSync();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="flex items-end gap-[2px]" aria-hidden>
              <span className="h-2.5 w-1 rounded-sm bg-accent" />
              <span className="h-4 w-1 rounded-sm bg-cyan" />
              <span className="h-5.5 w-1 rounded-sm bg-violet" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              DSA Visualizer
            </span>
          </span>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/learn" className="btn hidden sm:inline-flex">
              Learning resources
            </Link>
            <Link to="/dashboard" className="btn btn-primary">
              Open the app
              <ArrowRight size={13} aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="min-w-0">
              <p className="panel-title mb-3">
                Interactive · {CATALOG.dataStructures} data structures ·{' '}
                {TOTAL_ALGORITHMS} algorithms
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                See the algorithm actually run.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                Most visualizers animate a script. This one executes the real
                implementation, records every operation, and lets you walk the
                recording in either direction — with the source line, the
                explanation and the counters all moving together.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to="/algorithms/sorting" className="btn btn-primary">
                  Start with sorting
                  <ArrowRight size={14} aria-hidden />
                </Link>
                <Link to="/dashboard" className="btn">
                  <LayoutDashboard size={14} aria-hidden />
                  Browse everything
                </Link>
              </div>

              <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-dim">
                <Keyboard size={13} aria-hidden />
                <kbd className="chip">Space</kbd> play ·{' '}
                <kbd className="chip">←</kbd>
                <kbd className="chip">→</kbd> step ·{' '}
                <kbd className="chip">R</kbd> reset
              </p>
            </div>

            <div className="min-w-0">
              <HeroPreview />
              <p className="mt-2 text-center text-[11px] text-ink-dim">
                Not a loop of canned frames — this is the sorting page’s engine,
                running bubble sort.
              </p>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section
          className="border-y border-line bg-surface/40"
          aria-labelledby="offers"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 id="offers" className="text-xl font-semibold tracking-tight">
              What you get
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              Four things that separate a learning tool from a pretty animation.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {OFFERS.map((offer) => (
                <div key={offer.title} className="card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-canvas text-accent">
                      <offer.icon size={14} aria-hidden />
                    </span>
                    <h3 className="text-[13.5px] font-semibold">
                      {offer.title}
                    </h3>
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-soft">
                    {offer.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="covered">
          <h2 id="covered" className="text-xl font-semibold tracking-tight">
            What’s covered
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            Every topic below is a working visualizer with its own operations,
            code panel and learning section.
          </p>

          <h3 className="panel-title mb-3 mt-7 flex items-center gap-1.5">
            <SquareStack size={12} aria-hidden />
            Data structures · {CATALOG.dataStructures}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DATA_STRUCTURE_GROUPS.map((group) => (
              <CatalogCard key={group.to} group={group} />
            ))}
          </div>

          <h3 className="panel-title mb-3 mt-8 flex items-center gap-1.5">
            <Table size={12} aria-hidden />
            Algorithms · {TOTAL_ALGORITHMS}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ALGORITHM_GROUPS.map((group) => (
              <CatalogCard key={group.to} group={group} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          className="border-y border-line bg-surface/40"
          aria-labelledby="how"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 id="how" className="text-xl font-semibold tracking-tight">
              How it works
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              One engine drives every page, which is why the behaviour is
              identical whether you are watching a sort or an AVL rotation.
            </p>
            <ol className="mt-6 grid gap-4 lg:grid-cols-3">
              {STEPS.map((item, index) => (
                <li key={item.title} className="card p-4">
                  <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-md border border-line bg-canvas font-mono text-[11px] text-accent">
                    {index + 1}
                  </span>
                  <h3 className="mb-1 text-[13.5px] font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Every page gives you */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="panels">
          <h2 id="panels" className="text-xl font-semibold tracking-tight">
            On every page
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            The same workspace everywhere, so you learn the tool once.
          </p>
          <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {PANELS.map((panel) => (
              <div key={panel.title} className="min-w-0 border-l-2 border-line pl-3">
                <dt className="text-[13px] font-semibold">{panel.title}</dt>
                <dd className="mt-0.5 text-[12.5px] leading-relaxed text-ink-dim">
                  {panel.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Suggested path */}
        <section
          className="border-t border-line bg-surface/40"
          aria-labelledby="path"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 id="path" className="text-xl font-semibold tracking-tight">
              Not sure where to start?
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  to: '/algorithms/sorting',
                  icon: Table,
                  title: 'New to this',
                  body: 'Bubble sort on 8 values. Step backward through a single swap and watch the counters go with you.',
                },
                {
                  to: '/data-structures/trees',
                  icon: GitBranch,
                  title: 'Revising',
                  body: 'Insert 1…7 into a BST, then do it again in AVL mode and count the rotations.',
                },
                {
                  to: '/algorithms/recursion',
                  icon: Braces,
                  title: 'Interview prep',
                  body: 'N-Queens and the maze solver, with the call stack and every backtrack visible.',
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="card group flex flex-col p-4 transition-colors hover:border-accent/60"
                >
                  <span className="mb-2 flex items-center gap-2">
                    <item.icon size={14} className="text-accent" aria-hidden />
                    <span className="text-[13px] font-semibold">{item.title}</span>
                    <ArrowRight
                      size={13}
                      aria-hidden
                      className="ml-auto text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-ink-soft">
                    {item.body}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">
                  Everything is one click away.
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                  No account, no setup — pick a topic and press play.
                </p>
              </div>
              <Link to="/dashboard" className="btn btn-primary">
                Open the app
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link to="/learn" className="btn">
                <Search size={13} aria-hidden />
                Complexity cheat sheet
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[11.5px] text-ink-dim sm:px-6">
          <p>
            Built with React, TypeScript and a step-recording visualization
            engine.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/dashboard" className="hover:text-ink-soft">
              Dashboard
            </Link>
            <Link to="/algorithms/sorting" className="hover:text-ink-soft">
              Sorting
            </Link>
            <Link to="/data-structures/trees" className="hover:text-ink-soft">
              Trees
            </Link>
            <Link to="/algorithms/graphs" className="hover:text-ink-soft">
              Graphs
            </Link>
            <Link to="/learn" className="hover:text-ink-soft">
              Learn
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
