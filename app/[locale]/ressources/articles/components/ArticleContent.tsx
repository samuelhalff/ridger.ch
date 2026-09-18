"use client";
import { notFound } from "next/navigation";
import { estimateReadingTime } from "@/src/lib/readingTime";
import { useTranslation } from "react-i18next";
import "@/src/i18n";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import ContactSection from "./ContactSection";

interface ArticleContentProps {
  slug: string;
  locale?: string;
}

const markdownComponents: Components = {
  table({ node: _node, className, ...props }) {
    return (
      <div className="my-6 overflow-x-auto">
        <table className={["w-full", className].filter(Boolean).join(" ")} {...props} />
      </div>
    );
  },
};

export default function ArticleContent({ slug, locale }: ArticleContentProps) {
  const { t } = useTranslation("ressources");
  const articles = t("Articles", { returnObjects: true }) as Array<{
    slug: string;
    title: string;
    description: string;
    author: string;
    date: string;
    content: string;
    references?: Array<{ labelKey: string; url: string }>;
  }>;

  const article = articles.find((a) => a.slug === slug);
  if (!article) return notFound();

  const readingStats = estimateReadingTime(article.content || "");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12 sm:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
        {article.title}
      </h1>
      <p className="text-lg mb-8 text-center">{article.description}</p>

      {/* Author and Date */}
      <div className="text-center text-sm mb-8 space-y-1">
        <p>
          {(t("By") as string) || "By"} {article.author}
        </p>
        <p>
          {(t("Published") as string) || "Published on"} {formatDateDeterministic(article.date)}
        </p>
        {readingStats && (
          <p>
            {((t("ReadingTime") as string) || "Reading time") + ": "}
            {readingStats.minutes}
            {" " + ((t("Minutes") as string) || "min") + " "}
            ({readingStats.words} words)
          </p>
        )}
      </div>

      <article className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {article.content ?? ""}
        </ReactMarkdown>
      </article>

      {/* Pass locale to ContactSection so the contact link uses the correct
          locale prefix. Without this, ContactSection receives undefined,
          which resolves to /fr in the localePrefix calculation. */}
      <ContactSection
        locale={locale}
        eyebrow={(t("Contact.Eyebrow") as string) || "Let's talk"}
        title={(t("Contact.Title") as string) || "Questions about this article?"}
        description={
          (t("Contact.Description") as string) ||
          "Our experts are here to help you understand the details and implications for your business. Get personalized advice tailored to your situation."
        }
        buttonText={(t("Contact.ButtonText") as string) || "Contact Our Team"}
      />
    </main>
  );
}

function formatDateDeterministic(date?: string) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch (e) {
    return new Date(date).toISOString().split("T")[0];
  }
}

// Backward compatibility: named export if other modules previously imported it
export const computeReadingTime = estimateReadingTime;
