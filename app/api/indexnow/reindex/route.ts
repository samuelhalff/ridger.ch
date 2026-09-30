import { NextResponse } from 'next/server';
import { locales } from '@/src/lib/i18n';
import { submitToIndexNow } from '@/src/lib/indexnow';
import { buildInternalUrl } from '@/src/lib/paths';
import locationCities from '@/src/lib/locations.json';

export async function POST() {
  // No auth: this only ever resubmits our own fixed set of ridger.ch URLs,
  // which anyone can already submit via the public IndexNow key.

  const base = 'https://ridger.ch';
  const corePaths = ['/', '/approach', '/platform', '/services', '/ressources', '/contact', '/advisers'];
  const servicePaths = [
    '/services/consolidated-reporting',
    '/services/investment-oversight',
    '/services/family-office-coordination',
    '/services/governance-succession',
    '/services/tax-administration',
    '/services/digital-vault',
    '/services/real-estate-transactions',
    '/services/property-management',
    '/services/household-staff',
    '/services/relocation-residence',
    '/services/domiciliation-mail',
  ];
  const locationPaths = locationCities.map((city) => `/family-office/${city}`);
  const paths = [...corePaths, ...servicePaths, ...locationPaths];
  // Localized slugs (e.g. /fr/services/reporting-consolide/) are the canonical URLs.
  const urls = locales.flatMap((loc) => paths.map((p) => `${base}${buildInternalUrl(p, loc)}`));

  try {
    await submitToIndexNow(urls);
    return NextResponse.json({ ok: true, count: urls.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Search indexing error' }, { status: 500 });
  }
}
