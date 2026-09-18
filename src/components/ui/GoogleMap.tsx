import React from "react";
import GoogleMapClient from "./GoogleMapClient";

/**
 * GoogleMap component
 * - Responsive container with aspect ratio
 * - Dark mode border treatment
 * - Accepts coordinates & placeId for future extensibility
 */
export interface GoogleMapProps {
  title?: string;
  latitude?: number;
  longitude?: number;
  /** Google Place CID or place_id if you later want to deep link */
  cid?: string;
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

const DEFAULT_LAT = 46.2021556;
const DEFAULT_LNG = 6.1399595;
// Ridger Google CID (place ID 0x478c65f758b086cb:0xcf6d1463ecc713d9)
export const ARK_GOOGLE_CID = "14946625157719331801";

// Server component wrapper (no hooks here)
export const GoogleMap = async ({
  title = "Ridger",
  latitude = DEFAULT_LAT,
  longitude = DEFAULT_LNG,
  cid = ARK_GOOGLE_CID,
  className = "",
  height,
  privacyMode = false,
  labels = {},
}: GoogleMapProps) => {
  // Pass props to client component (interactive toggle only)
  return (
    <GoogleMapClient
      title={title}
      latitude={latitude}
      longitude={longitude}
      cid={cid}
      className={className}
      height={height}
      privacyMode={privacyMode}
      labels={labels}
    />
  );
};

export default GoogleMap;
