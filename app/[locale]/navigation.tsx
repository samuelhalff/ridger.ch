// Service navigation items for the NavMenu
import {
  AirplaneTilt,
  Bank,
  Briefcase,
  Buildings,
  CrownSimple,
  FileText,
  Gear,
  Handshake,
  MapPin,
  Users,
} from "@phosphor-icons/react/dist/ssr";

const iconProps = {
  className: "text-primary",
  size: 20,
  weight: "regular" as const,
};
const FileTextIcon = () => <FileText {...iconProps} />;
const LandmarkIcon = () => <Bank {...iconProps} />;
const UsersIcon = () => <Users {...iconProps} />;
const BriefcaseIcon = () => <Briefcase {...iconProps} />;
const Building2Icon = () => <Buildings {...iconProps} />;
const PinIcon = () => <MapPin {...iconProps} />;
const PlaneIcon = () => <AirplaneTilt {...iconProps} />;
const SettingsIcon = () => <Gear {...iconProps} />;
const CrownIcon = () => <CrownSimple {...iconProps} />;
const HandshakeIcon = () => <Handshake {...iconProps} />;

const ServicesElements = [
  {
    titleKey: "Accounting.Title",
    descriptionKey: "Accounting.Description",
    href: "/services/accounting/",
    icon: <FileTextIcon />,
  },
  {
    titleKey: "TaxesCompanyPersonal.Title",
    descriptionKey: "TaxesCompanyPersonal.Description",
    href: "/services/taxes/",
    icon: <LandmarkIcon />,
  },
  {
    titleKey: "PayrollHR.Title",
    descriptionKey: "PayrollHR.Description",
    href: "/services/payroll/",
    icon: <UsersIcon />,
  },
  {
    titleKey: "OutsourcingServices.Title",
    descriptionKey: "OutsourcingServices.Description",
    href: "/services/outsourcing/",
    icon: <BriefcaseIcon />,
  },
  {
    titleKey: "MAServices.Title",
    descriptionKey: "MAServices.Description",
    href: "/services/mergers-acquisitions/",
    icon: <HandshakeIcon />,
  },
  {
    titleKey: "CorporateServices.Title",
    descriptionKey: "CorporateServices.Description",
    href: "/services/corporate/",
    icon: <Building2Icon />,
  },
  {
    titleKey: "Incorporation.Title",
    descriptionKey: "Incorporation.Description",
    href: "/services/incorporation/",
    icon: <Building2Icon />,
  },
  {
    titleKey: "ImmigrationServices.Title",
    descriptionKey: "ImmigrationServices.Description",
    href: "/services/immigration/",
    icon: <PlaneIcon />,
  },
  {
    titleKey: "OdooImplementation.Title",
    descriptionKey: "OdooImplementation.Description",
    href: "/services/odoo/",
    icon: <SettingsIcon />,
  },
  {
    titleKey: "DomiciliationServices.Title",
    descriptionKey: "DomiciliationServices.Description",
    href: "/services/domiciliation/",
    icon: <PinIcon />,
  },
  {
    titleKey: "FamilyOffice.Title",
    descriptionKey: "FamilyOffice.Description",
    href: "/services/family-office/",
    icon: <CrownIcon />,
  },
];

export default ServicesElements;
