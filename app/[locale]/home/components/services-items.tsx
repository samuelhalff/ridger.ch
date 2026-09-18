import {
  ChartLineUp,
  Eye,
  UsersThree,
  Scales,
  Receipt,
  Vault,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";

const calcClass = "h-6 w-6 sm:h-7 sm:w-7";
const iconProps = { className: calcClass, weight: "regular" as const };

const services = [
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
];

export default services;
