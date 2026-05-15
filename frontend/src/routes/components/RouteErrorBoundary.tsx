import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '@/shared/components/ui/ErrorState';

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState
          title={`${error.status} ${error.statusText}`}
          description={
            typeof error.data === 'string'
              ? error.data
              : 'The page could not be loaded.'
          }
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const description =
    error instanceof Error ? error.message : 'An unexpected routing error occurred.';

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ErrorState
        title="Something went wrong"
        description={description}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
