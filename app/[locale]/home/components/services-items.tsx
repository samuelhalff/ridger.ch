import {
  AirplaneTilt,
  Briefcase,
  Buildings,
  Calculator,
  ChatsCircle,
  CrownSimple,
  Gear,
  Handshake,
  MapPin,
  Stack,
  Users,
} from "@phosphor-icons/react/dist/ssr";

const calcClass = "h-6 w-6 sm:h-7 sm:w-7";
const iconProps = { className: calcClass, weight: "regular" as const };

const services = [
  {
    icon: <Calculator {...iconProps} />,
    titleKey: "Accounting.Title",
    href: "/services/accounting",
    descriptionKey: "Accounting.Description",
    image: "/assets/hero/services/accounting-hero.optimized.webp",
  },
  {
    icon: <ChatsCircle {...iconProps} />,
    titleKey: "TaxesCompanyPersonal.Title",
    href: "/services/taxes",
    descriptionKey: "TaxesCompanyPersonal.Description",
    image: "/assets/hero/services/taxes-hero.optimized.webp",
  },
  {
    icon: <Users {...iconProps} />,
    titleKey: "PayrollHR.Title",
    href: "/services/payroll",
    descriptionKey: "PayrollHR.Description",
    image: "/assets/hero/services/payroll-hero.optimized.webp",
  },
  {
    icon: <Buildings {...iconProps} />,
    titleKey: "Incorporation.Title",
    href: "/services/incorporation",
    descriptionKey: "Incorporation.Description",
    image: "/assets/hero/services/home-hero.avif",
  },
  {
    icon: <AirplaneTilt {...iconProps} />,
    titleKey: "ImmigrationServices.Title",
    href: "/services/immigration",
    descriptionKey: "ImmigrationServices.Description",
    image: "/assets/hero/services/immigration-hero.optimized.webp",
  },
  {
    icon: <Stack {...iconProps} />,
    titleKey: "OutsourcingServices.Title",
    href: "/services/outsourcing",
    descriptionKey: "OutsourcingServices.Description",
    image: "/assets/hero/services/outsourcing-hero.optimized.webp",
  },
  {
    icon: <Handshake {...iconProps} />,
    titleKey: "MAServices.Title",
    href: "/services/mergers-acquisitions",
    descriptionKey: "MAServices.Description",
    image: "/assets/hero/services/mna-hero.optimized.webp",
  },
  {
    icon: <Briefcase {...iconProps} />,
    titleKey: "CorporateServices.Title",
    href: "/services/corporate",
    descriptionKey: "CorporateServices.Description",
    image: "/assets/hero/services/corporate-hero.optimized.webp",
  },
  {
    icon: <MapPin {...iconProps} />,
    titleKey: "DomiciliationServices.Title",
    href: "/services/domiciliation",
    descriptionKey: "DomiciliationServices.Description",
    image: "/assets/hero/services/domiciliation-hero.optimized.webp",
  },
  {
    icon: <Gear {...iconProps} />,
    titleKey: "OdooImplementation.Title",
    href: "/services/odoo",
    descriptionKey: "OdooImplementation.Description",
    image: "/assets/hero/services/odoo-hero.optimized.webp",
  },
  {
    icon: <CrownSimple {...iconProps} />,
    titleKey: "FamilyOffice.Title",
    href: "/services/family-office",
    descriptionKey: "FamilyOffice.Description",
    image: "/assets/hero/services/family-office-hero.optimized.webp",
  },
];

export default services;
