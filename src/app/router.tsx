import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NotFoundPage } from '@/features/misc/NotFoundPage';

/**
 * Every visualizer is loaded on demand. The landing page and the dashboard
 * ship in the entry bundle because they are the two entry points; everything
 * else is its own chunk.
 */
const ArraysPage = lazy(() =>
  import('@/features/arrays/ArraysPage').then((m) => ({ default: m.ArraysPage })),
);
const LinkedListsPage = lazy(() =>
  import('@/features/linked-lists/LinkedListsPage').then((m) => ({
    default: m.LinkedListsPage,
  })),
);
const StacksPage = lazy(() =>
  import('@/features/stacks/StacksPage').then((m) => ({ default: m.StacksPage })),
);
const QueuesPage = lazy(() =>
  import('@/features/queues/QueuesPage').then((m) => ({ default: m.QueuesPage })),
);
const HashTablesPage = lazy(() =>
  import('@/features/hash-tables/HashTablesPage').then((m) => ({
    default: m.HashTablesPage,
  })),
);
const TreesPage = lazy(() =>
  import('@/features/trees/TreesPage').then((m) => ({ default: m.TreesPage })),
);
const HeapsPage = lazy(() =>
  import('@/features/heaps/HeapsPage').then((m) => ({ default: m.HeapsPage })),
);
const GraphsPage = lazy(() =>
  import('@/features/graphs/GraphsPage').then((m) => ({ default: m.GraphsPage })),
);
const SortingPage = lazy(() =>
  import('@/features/sorting/SortingPage').then((m) => ({ default: m.SortingPage })),
);
const SearchingPage = lazy(() =>
  import('@/features/searching/SearchingPage').then((m) => ({
    default: m.SearchingPage,
  })),
);
const GraphAlgorithmsPage = lazy(() =>
  import('@/features/graphs/GraphAlgorithmsPage').then((m) => ({
    default: m.GraphAlgorithmsPage,
  })),
);
const RecursionPage = lazy(() =>
  import('@/features/recursion/RecursionPage').then((m) => ({
    default: m.RecursionPage,
  })),
);
const LearnPage = lazy(() =>
  import('@/features/learn/LearnPage').then((m) => ({ default: m.LearnPage })),
);

function PageFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center text-sm text-ink-dim"
      role="status"
    >
      Loading visualizer…
    </div>
  );
}

const page = (element: ReactNode): ReactNode => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'data-structures/arrays', element: page(<ArraysPage />) },
      { path: 'data-structures/linked-lists', element: page(<LinkedListsPage />) },
      { path: 'data-structures/stacks', element: page(<StacksPage />) },
      { path: 'data-structures/queues', element: page(<QueuesPage />) },
      { path: 'data-structures/hash-tables', element: page(<HashTablesPage />) },
      { path: 'data-structures/trees', element: page(<TreesPage />) },
      { path: 'data-structures/heaps', element: page(<HeapsPage />) },
      { path: 'data-structures/graphs', element: page(<GraphsPage />) },
      { path: 'algorithms/sorting', element: page(<SortingPage />) },
      { path: 'algorithms/searching', element: page(<SearchingPage />) },
      { path: 'algorithms/graphs', element: page(<GraphAlgorithmsPage />) },
      { path: 'algorithms/recursion', element: page(<RecursionPage />) },
      { path: 'learn', element: page(<LearnPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
