// WARNING: Performance Issue - All translation files are imported at build time
// This creates a large bundle (~880KB across 115 files) that must be parsed on every page load
// causing significant TBT (Total Blocking Time) on mobile devices, especially EN locale.
// 
// Current impact: EN mobile TBT = 990ms vs PT mobile TBT = 130ms
// 
// TODO: Refactor to use i18next-http-backend for lazy-loading translations
// This would load only the required locale/namespace on demand, reducing initial bundle size
// and TBT by ~80-90%. See: https://github.com/i18next/i18next-http-backend
//
// For now, we've added webpack chunking to separate translations from main bundle.

import incorporation from "@/src/translations/en/incorporation.json";
import incorporationFr from "@/src/translations/fr/incorporation.json";
import incorporationDe from "@/src/translations/de/incorporation.json";
import incorporationEs from "@/src/translations/es/incorporation.json";
import incorporationPt from "@/src/translations/pt/incorporation.json";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import aboutUs from "@/src/translations/en/about-us.json";
import accounting from "@/src/translations/en/accounting.json";
import contact from "@/src/translations/en/contact.json";
import corporate from "@/src/translations/en/corporate.json";
import domiciliation from "@/src/translations/en/domiciliation.json";
import faq from "@/src/translations/en/faq.json";
import footer from "@/src/translations/en/footer.json";
import home from "@/src/translations/en/home.json";
import legal from "@/src/translations/en/legal.json";
import navbar from "@/src/translations/en/navbar.json";
import odoo from "@/src/translations/en/odoo.json";
import outsourcing from "@/src/translations/en/outsourcing.json";
import partners from "@/src/translations/en/partners.json";
import payroll from "@/src/translations/en/payroll.json";
import ressources from "@/src/translations/en/ressources.json";
import cookie from "@/src/translations/en/cookie.json";
import services from "@/src/translations/en/services.json";
import servicesItems from "@/src/translations/en/servicesItems.json";
import taxes from "@/src/translations/en/taxes.json";
import team from "@/src/translations/en/team.json";
import testimonials from "@/src/translations/en/testimonials.json";
import familyOffice from "@/src/translations/en/family-office.json";
import aboutUsFr from "@/src/translations/fr/about-us.json";
import accountingFr from "@/src/translations/fr/accounting.json";
import contactFr from "@/src/translations/fr/contact.json";
import corporateFr from "@/src/translations/fr/corporate.json";
import domiciliationFr from "@/src/translations/fr/domiciliation.json";
import faqFr from "@/src/translations/fr/faq.json";
import footerFr from "@/src/translations/fr/footer.json";
import homeFr from "@/src/translations/fr/home.json";
import legalFr from "@/src/translations/fr/legal.json";
import navbarFr from "@/src/translations/fr/navbar.json";
import odooFr from "@/src/translations/fr/odoo.json";
import outsourcingFr from "@/src/translations/fr/outsourcing.json";
import partnersFr from "@/src/translations/fr/partners.json";
import payrollFr from "@/src/translations/fr/payroll.json";
import ressourcesFr from "@/src/translations/fr/ressources.json";
import cookieFr from "@/src/translations/fr/cookie.json";
import servicesFr from "@/src/translations/fr/services.json";
import servicesItemsFr from "@/src/translations/fr/servicesItems.json";
import taxesFr from "@/src/translations/fr/taxes.json";
import teamFr from "@/src/translations/fr/team.json";
import testimonialsFr from "@/src/translations/fr/testimonials.json";
import familyOfficeFr from "@/src/translations/fr/family-office.json";

import aboutUsDe from "@/src/translations/de/about-us.json";
import accountingDe from "@/src/translations/de/accounting.json";
import contactDe from "@/src/translations/de/contact.json";
import corporateDe from "@/src/translations/de/corporate.json";
import domiciliationDe from "@/src/translations/de/domiciliation.json";
import faqDe from "@/src/translations/de/faq.json";
import footerDe from "@/src/translations/de/footer.json";
import homeDe from "@/src/translations/de/home.json";
import legalDe from "@/src/translations/de/legal.json";
import navbarDe from "@/src/translations/de/navbar.json";
import odooDe from "@/src/translations/de/odoo.json";
import outsourcingDe from "@/src/translations/de/outsourcing.json";
import partnersDe from "@/src/translations/de/partners.json";
import payrollDe from "@/src/translations/de/payroll.json";
import ressourcesDe from "@/src/translations/de/ressources.json";
import cookieDe from "@/src/translations/de/cookie.json";
import servicesDe from "@/src/translations/de/services.json";
import servicesItemsDe from "@/src/translations/de/servicesItems.json";
import taxesDe from "@/src/translations/de/taxes.json";
import teamDe from "@/src/translations/de/team.json";
import testimonialsDe from "@/src/translations/de/testimonials.json";
import familyOfficeDe from "@/src/translations/de/family-office.json";

import aboutUsEs from "@/src/translations/es/about-us.json";
import accountingEs from "@/src/translations/es/accounting.json";
import contactEs from "@/src/translations/es/contact.json";
import corporateEs from "@/src/translations/es/corporate.json";
import domiciliationEs from "@/src/translations/es/domiciliation.json";
import faqEs from "@/src/translations/es/faq.json";
import footerEs from "@/src/translations/es/footer.json";
import homeEs from "@/src/translations/es/home.json";
import legalEs from "@/src/translations/es/legal.json";
import navbarEs from "@/src/translations/es/navbar.json";
import odooEs from "@/src/translations/es/odoo.json";
import outsourcingEs from "@/src/translations/es/outsourcing.json";
import partnersEs from "@/src/translations/es/partners.json";
import payrollEs from "@/src/translations/es/payroll.json";
import ressourcesEs from "@/src/translations/es/ressources.json";
import cookieEs from "@/src/translations/es/cookie.json";
import servicesEs from "@/src/translations/es/services.json";
import servicesItemsEs from "@/src/translations/es/servicesItems.json";
import taxesEs from "@/src/translations/es/taxes.json";
import teamEs from "@/src/translations/es/team.json";
import testimonialsEs from "@/src/translations/es/testimonials.json";
import familyOfficeEs from "@/src/translations/es/family-office.json";

import aboutUsPt from "@/src/translations/pt/about-us.json";
import accountingPt from "@/src/translations/pt/accounting.json";
import contactPt from "@/src/translations/pt/contact.json";
import corporatePt from "@/src/translations/pt/corporate.json";
import domiciliationPt from "@/src/translations/pt/domiciliation.json";
import faqPt from "@/src/translations/pt/faq.json";
import footerPt from "@/src/translations/pt/footer.json";
import homePt from "@/src/translations/pt/home.json";
import legalPt from "@/src/translations/pt/legal.json";
import navbarPt from "@/src/translations/pt/navbar.json";
import odooPt from "@/src/translations/pt/odoo.json";
import outsourcingPt from "@/src/translations/pt/outsourcing.json";
import partnersPt from "@/src/translations/pt/partners.json";
import payrollPt from "@/src/translations/pt/payroll.json";
import ressourcesPt from "@/src/translations/pt/ressources.json";
import cookiePt from "@/src/translations/pt/cookie.json";
import servicesPt from "@/src/translations/pt/services.json";
import servicesItemsPt from "@/src/translations/pt/servicesItems.json";
import taxesPt from "@/src/translations/pt/taxes.json";
import teamPt from "@/src/translations/pt/team.json";
import testimonialsPt from "@/src/translations/pt/testimonials.json";
import familyOfficePt from "@/src/translations/pt/family-office.json";

// Determine initial language from URL pathname in the browser to keep
// the client language synced with our URL-based routing.
const getInitialLang = () => {
  if (typeof window === "undefined") return undefined;
  try {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const potential = segments[0];
    const valid = ["en", "fr", "de", "es", "pt"];
    return valid.includes(potential) ? potential : undefined;
  } catch (e) {
    return undefined;
  }
};

const initialLng = getInitialLang();

const translations = {
  en: {
    aboutUs,
    accounting,
    contact,
    corporate,
    domiciliation,
    faq,
    footer,
    home,
    legal,
    navbar,
    odoo,
    outsourcing,
    partners,
    payroll,
    ressources,
    services,
    servicesItems,
    taxes,
    team,
    testimonials,
    incorporation,
    cookie,
    "family-office": familyOffice,
  },
  fr: {
    aboutUs: aboutUsFr,
    accounting: accountingFr,
    contact: contactFr,
    corporate: corporateFr,
    domiciliation: domiciliationFr,
    faq: faqFr,
    footer: footerFr,
    home: homeFr,
    legal: legalFr,
    navbar: navbarFr,
    odoo: odooFr,
    outsourcing: outsourcingFr,
    partners: partnersFr,
    payroll: payrollFr,
    ressources: ressourcesFr,
    services: servicesFr,
    servicesItems: servicesItemsFr,
    taxes: taxesFr,
    team: teamFr,
    testimonials: testimonialsFr,
    incorporation: incorporationFr,
    cookie: cookieFr,
    "family-office": familyOfficeFr,
  },
  de: {
    aboutUs: aboutUsDe,
    accounting: accountingDe,
    contact: contactDe,
    corporate: corporateDe,
    domiciliation: domiciliationDe,
    faq: faqDe,
    footer: footerDe,
    home: homeDe,
    legal: legalDe,
    navbar: navbarDe,
    odoo: odooDe,
    outsourcing: outsourcingDe,
    partners: partnersDe,
    payroll: payrollDe,
    ressources: ressourcesDe,
    services: servicesDe,
    servicesItems: servicesItemsDe,
    taxes: taxesDe,
    team: teamDe,
    testimonials: testimonialsDe,
    incorporation: incorporationDe,
    cookie: cookieDe,
    "family-office": familyOfficeDe,
  },
  es: {
    aboutUs: aboutUsEs,
    accounting: accountingEs,
    contact: contactEs,
    corporate: corporateEs,
    domiciliation: domiciliationEs,
    faq: faqEs,
    footer: footerEs,
    home: homeEs,
    legal: legalEs,
    navbar: navbarEs,
    odoo: odooEs,
    outsourcing: outsourcingEs,
    partners: partnersEs,
    payroll: payrollEs,
    ressources: ressourcesEs,
    services: servicesEs,
    servicesItems: servicesItemsEs,
    taxes: taxesEs,
    team: teamEs,
    testimonials: testimonialsEs,
    incorporation: incorporationEs,
    cookie: cookieEs,
    "family-office": familyOfficeEs,
  },
  pt: {
    aboutUs: aboutUsPt,
    accounting: accountingPt,
    contact: contactPt,
    corporate: corporatePt,
    domiciliation: domiciliationPt,
    faq: faqPt,
    footer: footerPt,
    home: homePt,
    legal: legalPt,
    navbar: navbarPt,
    odoo: odooPt,
    outsourcing: outsourcingPt,
    partners: partnersPt,
    payroll: payrollPt,
    ressources: ressourcesPt,
    services: servicesPt,
    servicesItems: servicesItemsPt,
    taxes: taxesPt,
    team: teamPt,
    testimonials: testimonialsPt,
    incorporation: incorporationPt,
    cookie: cookiePt,
    "family-office": familyOfficePt,
  },
};

i18n.use(initReactI18next).init({
  supportedLngs: ["de", "en", "fr", "es", "pt"],
  fallbackLng: "fr",
  lng: initialLng,
  interpolation: { escapeValue: false },
  resources: translations,
});

export default i18n;
