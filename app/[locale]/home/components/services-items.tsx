import {
  ChartLineUp,
  Eye,
  UsersThree,
  Scales,
  Receipt,
  Vault,
  Buildings,
  HouseLine,
  AirplaneTilt,
  Mailbox,
  Key,
} from "@phosphor-icons/react/dist/ssr";

const calcClass = "h-6 w-6 sm:h-7 sm:w-7";
const iconProps = { className: calcClass, weight: "regular" as const };

type ServiceItem = {
  icon: React.ReactNode;
  titleKey: string;
  href: string;
  descriptionKey: string;
  image: string;
  /** Extended services are listed on the services hub, nav and contact form,
   * but not in the home-page bento (which stays on the seven core services). */
  extended?: boolean;
};

const services: ServiceItem[] = [
  {
    icon: <ChartLineUp {...iconProps} />,
    titleKey: "ConsolidatedReporting.Title",
    href: "/services/consolidated-reporting",
    descriptionKey: "ConsolidatedReporting.Description",
    image: "/assets/hero/services/family-office-hero.optimized.webp",
  },
  {
    icon: <Eye {...iconProps} />,
    titleKey: "InvestmentOversight.Title",
    href: "/services/investment-oversight",
    descriptionKey: "InvestmentOversight.Description",
    image: "/assets/hero/services/taxes-hero.optimized.webp",
  },
  {
    icon: <UsersThree {...iconProps} />,
    titleKey: "FamilyOfficeCoordination.Title",
    href: "/services/family-office-coordination",
    descriptionKey: "FamilyOfficeCoordination.Description",
    image: "/assets/hero/services/corporate-hero.optimized.webp",
  },
  {
    icon: <Scales {...iconProps} />,
    titleKey: "GovernanceSuccession.Title",
    href: "/services/governance-succession",
    descriptionKey: "GovernanceSuccession.Description",
    image: "/assets/hero/services/mna-hero.optimized.webp",
  },
  {
    icon: <Receipt {...iconProps} />,
    titleKey: "TaxAdministration.Title",
    href: "/services/tax-administration",
    descriptionKey: "TaxAdministration.Description",
    image: "/assets/hero/services/outsourcing-hero.optimized.webp",
  },
  {
    icon: <Vault {...iconProps} />,
    titleKey: "DigitalVault.Title",
    href: "/services/digital-vault",
    descriptionKey: "DigitalVault.Description",
    image: "/assets/hero/services/domiciliation-hero.optimized.webp",
  },
  {
    icon: <Buildings {...iconProps} />,
    titleKey: "RealEstateTransactions.Title",
    href: "/services/real-estate-transactions",
    descriptionKey: "RealEstateTransactions.Description",
    image: "/assets/hero/services/mna-hero.optimized.webp",
  },
  {
    icon: <Key {...iconProps} />,
    titleKey: "PropertyManagement.Title",
    href: "/services/property-management",
    descriptionKey: "PropertyManagement.Description",
    image: "/assets/hero/services/samuel-ferrara-XQZRB1IU4Dc-unsplash.optimized.webp",
    extended: true,
  },
  {
    icon: <HouseLine {...iconProps} />,
    titleKey: "HouseholdStaff.Title",
    href: "/services/household-staff",
    descriptionKey: "HouseholdStaff.Description",
    image: "/assets/hero/services/household-home-kitchen.optimized.webp",
    extended: true,
  },
  {
    icon: <AirplaneTilt {...iconProps} />,
    titleKey: "RelocationResidence.Title",
    href: "/services/relocation-residence",
    descriptionKey: "RelocationResidence.Description",
    image: "/assets/hero/services/relocation-lavaux-lake-geneva.optimized.webp",
    extended: true,
  },
  {
    icon: <Mailbox {...iconProps} />,
    titleKey: "DomiciliationMail.Title",
    href: "/services/domiciliation-mail",
    descriptionKey: "DomiciliationMail.Description",
    image: "/assets/hero/services/domiciliation-hero.optimized.webp",
    extended: true,
  },
];

export default services;
