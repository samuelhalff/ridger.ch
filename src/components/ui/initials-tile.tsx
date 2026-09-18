import React from "react";

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0]?.[0] || "";
  const last =
    parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
  return (first + last).toUpperCase();
}

export default function InitialsTile({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initials = getInitials(name);
  return (
    <div
      aria-label={`Avatar placeholder for ${name}`}
      className={`h-full w-full overflow-hidden rounded-[0.85rem] bg-muted/0.18 shadow-sm dark:bg-muted/0.26 ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-[-1rem] rotate-[-15deg] origin-bottom-left bg-[#fff4e7] dark:bg-muted/30 rounded-[3rem]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-semibold tracking-[0.05em] text-[clamp(2.2rem,6vw,3.25rem)] text-foreground/0.82">
          {initials}
        </span>
      </div>
    </div>
  );
}
