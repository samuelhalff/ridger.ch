"use client";
import React, { useState } from "react";
import { RIDGER_MAP_ADDRESS, GoogleMapProps } from "./GoogleMap";

interface ClientProps extends GoogleMapProps {}

const GoogleMapClient: React.FC<ClientProps> = ({
  title = "Ridger",
  address = RIDGER_MAP_ADDRESS,
  className = "",
  height,
  privacyMode = true,
  labels = {},
}) => {
  const [consented, setConsented] = useState(!privacyMode);
  const query = encodeURIComponent(address);
  const mapSrc = `https://www.google.com/maps?q=${query}&hl=fr&z=16&output=embed`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const {
    loadMap = "Afficher la carte interactive",
    openInGoogle = "Ouvrir dans Google Maps",
    placeholderNotice = "Pour des raisons de confidentialité, la carte n'est pas chargée automatiquement.",
  } = labels;
  return (
    <figure
      className={`group overflow-hidden rounded-xl bg-card shadow-sm ${className}`}
    >
      <div
        className="relative w-full"
        style={height ? { height } : { aspectRatio: "16/7" }}
      >
        {consented ? (
          <iframe
            title={title}
            aria-label={title}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
            src={mapSrc}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-warm p-6 text-center dark:bg-card">
            <p className="max-w-md text-sm text-muted-foreground">
              {placeholderNotice}
            </p>
            <button
              type="button"
              onClick={() => setConsented(true)}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 dark:bg-brand dark:text-foreground"
            >
              {loadMap}
            </button>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-hover underline dark:text-brand"
            >
              {openInGoogle}
            </a>
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-4 bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium text-foreground">
          {title}
        </span>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-hover hover:underline dark:text-brand"
        >
          {openInGoogle}
        </a>
      </figcaption>
    </figure>
  );
};

export default GoogleMapClient;
