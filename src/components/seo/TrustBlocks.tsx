import Link from "next/link";
import { buildInternalUrl } from "@/src/lib/paths";
import type { Locale } from "@/src/lib/i18n-locales";

export type TrustSignal = {
  title: string;
  description?: string;
};

export function TrustSignals({ items }: { items: TrustSignal[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-5 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title}>
          <p className="font-semibold text-foreground">{item.title}</p>
          {item.description ? <p className="mt-1">{item.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function ServiceProofBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CredentialsList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function RelatedTeamMembers({
  title,
  members,
  locale,
}: {
  title: string;
  members: Array<{ name: string; href: string; role?: string }>;
  locale: Locale;
}) {
  if (!members.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {members.map((member) => (
          <li key={member.href}>
            <Link
              href={buildInternalUrl(member.href, locale)}
              className="block rounded-lg border border-border/60 p-4 hover:bg-surface-warm"
            >
              <span className="font-semibold text-foreground">{member.name}</span>
              {member.role ? (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {member.role}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedServices({
  title,
  services,
  locale,
}: {
  title: string;
  services: Array<{ label: string; href: string }>;
  locale: Locale;
}) {
  if (!services.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {services.map((service) => (
          <li key={service.href}>
            <Link
              href={buildInternalUrl(service.href, locale)}
              className="inline-flex rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-warm hover:text-foreground"
            >
              {service.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CanonicalFactBox({
  title,
  facts,
}: {
  title: string;
  facts: Array<{ label: string; value: string }>;
}) {
  return (
    <aside className="rounded-lg border border-border/60 bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="font-medium text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
