import React from "react";
import GoogleMapClient from "./GoogleMapClient";

/**
 * GoogleMap component
 * - Responsive container with aspect ratio
 * - Dark mode border treatment
 * - Embeds by address query: Ridger must not be tied to any Google Business
 *   Profile (the shared building address belongs to Ark's listing).
 */
export interface GoogleMapProps {
  title?: string;
  /** Address text used for the embed and the "open" link. */
  address?: string;
  className?: string;
  height?: number; // explicit px height override
  /** Delay loading the iframe until user consents */
  privacyMode?: boolean;
  /** Label texts (externalized for i18n) */
  labels?: {
    loadMap?: string;
    openInGoogle?: string;
    placeholderNotice?: string;
  };
}

export const RIDGER_MAP_ADDRESS = "26 Boulevard Georges-Favon, 1204 Genève, Suisse";

// Server component wrapper (no hooks here)
export const GoogleMap = async ({
  title = "Ridger",
  address = RIDGER_MAP_ADDRESS,
  className = "",
  height,
  privacyMode = false,
  labels = {},
}: GoogleMapProps) => {
  // Pass props to client component (interactive toggle only)
  return (
    <GoogleMapClient
      title={title}
      address={address}
      className={className}
      height={height}
      privacyMode={privacyMode}
      labels={labels}
    />
  );
};

export default GoogleMap;
