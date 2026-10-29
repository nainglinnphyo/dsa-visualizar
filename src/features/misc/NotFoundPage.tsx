import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="Nothing here"
        description="That route does not exist. Pick a visualizer from the sidebar, or head back to the dashboard."
      />
      <Link to="/dashboard" className="btn btn-primary w-fit">
        Back to dashboard
      </Link>
    </>
  );
}
