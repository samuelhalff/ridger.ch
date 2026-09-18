export type NavData = {
  labels: {
    home: string;
    services: string;
    approach: string;
    ressources: string;
    contact: string;
    mobileNavigation: string;
  };
  services: Array<{
    href: string;
    title: string;
    description: string;
  }>;
};
