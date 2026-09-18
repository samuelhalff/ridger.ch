// Global 404 page that delegates to the localized 404 implementation.
// This ensures unmatched routes (e.g., /fr/unknown) render our rich 404 with
// localized suggestions and services rather than the Next.js default.
import LocaleNotFound from "@/app/[locale]/not-found";

export default function NotFound() {
  return <LocaleNotFound />;
}
