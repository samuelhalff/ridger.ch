import ServicesListServer from "@/src/components/ui/services-list-server";
import { getCurrentLocale, type Locale } from "@/src/lib/i18n";

export default async function ServicesListSection() {
  const locale: Locale = await getCurrentLocale();
  return (
    <div>
      <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
        Services
      </h3>
      <ServicesListServer
        ns="accounting"
        translationKey="Presentation.Services"
        fallbackText={[
          "Service 1: Description",
          "Service 2: Description",
          "Service 3: Description",
          "Service 4: Description",
        ]}
        className="space-y-6"
        locale={locale}
      />
    </div>
  );
}
