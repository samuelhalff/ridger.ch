"use client";

import { useState } from "react";
import LoadMoreControls from "@/src/components/ui/load-more-controls";

type ArticleSummary = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
};

interface ProgressiveArticlesListProps {
  articles: ArticleSummary[];
  localePrefix: string;
  pageSize?: number;
  loadMoreLabel: string;
  showAllLabel: string;
}

export default function ProgressiveArticlesList({
  articles,
  localePrefix,
  pageSize = 10,
  loadMoreLabel,
  showAllLabel,
}: ProgressiveArticlesListProps) {
  const total = articles.length;
  const [visibleCount, setVisibleCount] = useState(Math.min(pageSize, total));

  return (
    <>
      <ul className="space-y-4">
        {articles.map((article, index) => (
          <li
            key={article.slug}
            className={`rounded-2xl bg-surface-warm/45 p-4 shadow-sm ${index < visibleCount ? "" : "hidden"}`}
          >
            <h2 className="text-xl font-semibold">
              <a href={`${localePrefix}/ressources/articles/${article.slug}/`}>
                {article.title}
              </a>
            </h2>
            {article.description && (
              <p className="text-muted-foreground">{article.description}</p>
            )}
          </li>
        ))}
      </ul>
      <LoadMoreControls
        hasMore={visibleCount < total}
        loadMoreLabel={loadMoreLabel}
        showAllLabel={showAllLabel}
        onLoadMore={() =>
          setVisibleCount((current) => Math.min(current + pageSize, total))
        }
        onShowAll={() => setVisibleCount(total)}
      />
    </>
  );
}
