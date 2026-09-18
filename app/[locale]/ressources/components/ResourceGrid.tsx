import React from "react";
import ResourceCard from "./ResourceCard";
import type {
  ResourceCategoryId,
  ResourceCategoryLabels,
} from "@/src/lib/resourceCategories";

interface ArticleResource {
  slug: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
}

interface ResourceGridProps {
  articles: ArticleResource[];
  locale?: string;
  visibleCount?: number;
  categoryBySlug?: Record<string, ResourceCategoryId>;
  categoryLabels?: ResourceCategoryLabels;
  labels?: {
    ReadArticle?: string;
    By?: string;
    Published?: string;
  };
}

const ResourceGrid: React.FC<ResourceGridProps> = ({
  articles,
  locale,
  visibleCount = articles.length,
  categoryBySlug,
  categoryLabels,
  labels,
}) => {
  const prefix = locale ? `/${locale}` : "";

  return (
    <div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className={index < visibleCount ? undefined : "hidden"}
          >
            <ResourceCard
              title={article.title}
              description={article.description}
              href={`${prefix}/ressources/articles/${article.slug}/`}
              author={article.author}
              date={article.date}
              category={
                categoryBySlug?.[article.slug] && categoryLabels
                  ? categoryLabels[categoryBySlug[article.slug]]
                  : undefined
              }
              categoryId={categoryBySlug?.[article.slug]}
              locale={locale}
              labels={labels}
              colorIndex={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceGrid;
