import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

export default async function AccountingAccordion() {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "accounting");
  const generalList = [
    { key: "Presentation.General.List.0", fallbackText: "Tailored chart of accounts" },
    { key: "Presentation.General.List.1", fallbackText: "Accounts payable and receivable" },
    { key: "Presentation.General.List.2", fallbackText: "Payment management" },
    { key: "Presentation.General.List.3", fallbackText: "Treasury management" },
  ];
  const periodicList = [
    { key: "Presentation.Periodic.List.0", fallbackText: "Interim and/or annual closing" },
    { key: "Presentation.Periodic.List.1", fallbackText: "VAT semi-annual or quarterly" },
    { key: "Presentation.Periodic.List.2", fallbackText: "Social insurances" },
    { key: "Presentation.Periodic.List.3", fallbackText: "Tax return" },
    { key: "Presentation.Periodic.List.4", fallbackText: "Ordinary and extraordinary general meetings" },
    { key: "Presentation.Periodic.List.5", fallbackText: "Board of directors" },
  ];
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-left text-lg font-semibold">
          {(t("Presentation.General.Title") as string) || "General accounting"}
        </h3>
        <p className="mb-4 text-muted-foreground">
          {(t("Presentation.General.Desc") as string) ||
            "We master all aspects of general accounting, from ledger to financial statements, ensuring accuracy and compliance."}
        </p>
        <div className="grid gap-3">
          {generalList.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground">{(t(item.key) as string) || item.fallbackText}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-left text-lg font-semibold">
          {(t("Presentation.Analytic.Title") as string) || "Analytical accounting"}
        </h3>
        <p className="text-muted-foreground">
          {(t("Presentation.Analytic.Desc") as string) ||
            "We help you set up and analyze an effective analytical accounting system to support better decisions."}
        </p>
      </section>

      <section>
        <h3 className="text-left text-lg font-semibold">
          {(t("Presentation.Periodic.Title") as string) || "Periodic tasks"}
        </h3>
        <p className="mb-4 text-muted-foreground">
          {(t("Presentation.Periodic.Desc") as string) ||
            "We prepare your periodic returns and obligations with rigor and timeliness."}
        </p>
        <div className="grid gap-3">
          {periodicList.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground">{(t(item.key) as string) || item.fallbackText}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-muted-foreground">
          {(t("Presentation.Periodic.Followup") as string) ||
            "Our dedicated team supports you at every step, ensuring transparent and optimized management."}
        </p>
      </section>

      <section>
        <h3 className="text-left text-lg font-semibold">
          {(t("Presentation.Dashboards.Title") as string) || "Dashboards"}
        </h3>
        <p className="text-muted-foreground">
          {(t("Presentation.Dashboards.Desc") as string) ||
            "Optimize visibility and control with intuitive accounting dashboards tailored to your needs."}
        </p>
      </section>
    </div>
  );
}
