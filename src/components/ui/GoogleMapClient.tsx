"use client";
import React, { useState } from "react";
import { ARK_GOOGLE_CID, GoogleMapProps } from "./GoogleMap";

interface ClientProps extends GoogleMapProps {}

const GoogleMapClient: React.FC<ClientProps> = ({
  title = "Ridger",
  latitude = 46.2021556,
  longitude = 6.1399595,
  cid = ARK_GOOGLE_CID,
  className = "",
  height,
  privacyMode = true,
  labels = {},
}) => {
  const [consented, setConsented] = useState(!privacyMode);
  const cidHex = BigInt(cid).toString(16);
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2760.410640687776!2d${longitude}!3d${latitude}!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c65f758b086cb%3A0x${cidHex}!2sRidger!5e0!3m2!1sfr!2sch!4v${Date.now()}`;
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
              href={`https://maps.google.com/?cid=${cid}`}
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
          href={`https://maps.google.com/?cid=${cid}`}
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
