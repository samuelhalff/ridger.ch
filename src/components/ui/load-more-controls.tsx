"use client";

interface LoadMoreControlsProps {
  hasMore: boolean;
  loadMoreLabel: string;
  showAllLabel: string;
  onLoadMore: () => void;
  onShowAll: () => void;
}

export default function LoadMoreControls({
  hasMore,
  loadMoreLabel,
  showAllLabel,
  onLoadMore,
  onShowAll,
}: LoadMoreControlsProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 justify-center mt-6">
      <button
        type="button"
        className="rounded-md bg-surface-warm px-4 py-2 text-sm shadow-sm hover:bg-muted"
        onClick={onLoadMore}
      >
        {loadMoreLabel}
      </button>
      <button
        type="button"
        className="px-3 py-2 text-xs text-muted-foreground hover:underline"
        onClick={onShowAll}
      >
        {showAllLabel}
      </button>
    </div>
  );
}
