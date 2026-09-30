// Service navigation items for the NavMenu
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
const HouseholdIcon = () => <HouseLine {...iconProps} />;
const RelocationIcon = () => <AirplaneTilt {...iconProps} />;
const MailIcon = () => <Mailbox {...iconProps} />;
const PropertyIcon = () => <Key {...iconProps} />;

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
  {
    titleKey: "PropertyManagement.Title",
    descriptionKey: "PropertyManagement.Description",
    href: "/services/property-management/",
    icon: <PropertyIcon />,
  },
  {
    titleKey: "HouseholdStaff.Title",
    descriptionKey: "HouseholdStaff.Description",
    href: "/services/household-staff/",
    icon: <HouseholdIcon />,
  },
  {
    titleKey: "RelocationResidence.Title",
    descriptionKey: "RelocationResidence.Description",
    href: "/services/relocation-residence/",
    icon: <RelocationIcon />,
  },
  {
    titleKey: "DomiciliationMail.Title",
    descriptionKey: "DomiciliationMail.Description",
    href: "/services/domiciliation-mail/",
    icon: <MailIcon />,
  },
];

export default ServicesElements;
