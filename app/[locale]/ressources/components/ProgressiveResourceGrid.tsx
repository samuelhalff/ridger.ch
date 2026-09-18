"use client";

import { useState } from "react";
import LoadMoreControls from "@/src/components/ui/load-more-controls";
import ResourceGrid from "./ResourceGrid";
import { cn } from "@/src/lib/utils";
import {
  buildResourceCategories,
  type ResourceCategoryId,
  type ResourceCategoryLabels,
} from "@/src/lib/resourceCategories";

interface ArticleResource {
  slug: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
}

interface ProgressiveResourceGridProps {
  articles: ArticleResource[];
  locale?: string;
  labels?: {
    ReadArticle?: string;
    By?: string;
    Published?: string;
  };
  categoryLabels: ResourceCategoryLabels;
  step?: number;
  loadMoreLabel: string;
  showAllLabel: string;
}

export default function ProgressiveResourceGrid({
  articles,
  locale,
  labels,
  categoryLabels,
  step = 12,
  loadMoreLabel,
  showAllLabel,
}: ProgressiveResourceGridProps) {
  const categories = buildResourceCategories(articles, categoryLabels);
  const [activeCategory, setActiveCategory] = useState("all");
  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter(
          (article) => categories.bySlug[article.slug] === activeCategory
        );
  const total = filteredArticles.length;
  const [visibleCount, setVisibleCount] = useState(Math.min(step, total));

  const setFilter = (category: ResourceCategoryId | "all") => {
    setActiveCategory(category);
    const nextTotal =
      category === "all"
        ? articles.length
        : articles.filter(
            (article) => categories.bySlug[article.slug] === category
          ).length;
    setVisibleCount(Math.min(step, nextTotal));
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm transition-colors",
            activeCategory === "all"
              ? "bg-brand text-foreground"
              : "bg-surface-warm text-muted-foreground hover:text-foreground"
          )}
        >
          {categoryLabels.all}
        </button>
        {categories.items.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setFilter(category.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-sm transition-colors",
              activeCategory === category.id
                ? "bg-brand text-foreground"
                : "bg-surface-warm text-muted-foreground hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
      <ResourceGrid
        articles={filteredArticles}
        locale={locale}
        visibleCount={visibleCount}
        categoryBySlug={categories.bySlug}
        categoryLabels={categoryLabels}
        labels={labels}
      />
      <LoadMoreControls
        hasMore={visibleCount < total}
        loadMoreLabel={loadMoreLabel}
        showAllLabel={showAllLabel}
        onLoadMore={() =>
          setVisibleCount((current) => Math.min(current + step, total))
        }
        onShowAll={() => setVisibleCount(total)}
      />
    </>
  );
}
