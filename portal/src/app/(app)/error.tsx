'use client';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card stack" role="alert">
      <h2>Something went wrong</h2>
      <p className="muted">{error.message || 'An unexpected error occurred while loading this page.'}</p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
