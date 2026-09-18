// Service navigation items for the NavMenu
import {
  ChartLineUp,
  Eye,
  UsersThree,
  Scales,
  Receipt,
  Vault,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";

const iconProps = {
  className: "text-primary",
  size: 20,
  weight: "regular" as const,
};
const ReportingIcon = () => <ChartLineUp {...iconProps} />;
const OversightIcon = () => <Eye {...iconProps} />;
const CoordinationIcon = () => <UsersThree {...iconProps} />;
const GovernanceIcon = () => <Scales {...iconProps} />;
const TaxAdminIcon = () => <Receipt {...iconProps} />;
const VaultIcon = () => <Vault {...iconProps} />;
const RealEstateIcon = () => <Buildings {...iconProps} />;

const ServicesElements = [
  {
    titleKey: "ConsolidatedReporting.Title",
    descriptionKey: "ConsolidatedReporting.Description",
    href: "/services/consolidated-reporting/",
    icon: <ReportingIcon />,
  },
  {
    titleKey: "InvestmentOversight.Title",
    descriptionKey: "InvestmentOversight.Description",
    href: "/services/investment-oversight/",
    icon: <OversightIcon />,
  },
  {
    titleKey: "FamilyOfficeCoordination.Title",
    descriptionKey: "FamilyOfficeCoordination.Description",
    href: "/services/family-office-coordination/",
    icon: <CoordinationIcon />,
  },
  {
    titleKey: "GovernanceSuccession.Title",
    descriptionKey: "GovernanceSuccession.Description",
    href: "/services/governance-succession/",
    icon: <GovernanceIcon />,
  },
  {
    titleKey: "TaxAdministration.Title",
    descriptionKey: "TaxAdministration.Description",
    href: "/services/tax-administration/",
    icon: <TaxAdminIcon />,
  },
  {
    titleKey: "DigitalVault.Title",
    descriptionKey: "DigitalVault.Description",
    href: "/services/digital-vault/",
    icon: <VaultIcon />,
  },
  {
    titleKey: "RealEstateTransactions.Title",
    descriptionKey: "RealEstateTransactions.Description",
    href: "/services/real-estate-transactions/",
    icon: <RealEstateIcon />,
  },
];

export default ServicesElements;
