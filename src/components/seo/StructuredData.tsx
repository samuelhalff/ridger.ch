import React from "react";

interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[]; // Already shaped via builders
  nonce?: string;
}

/**
 * Renders one <script type="application/ld+json"/> per data object provided.
 * Accepts a single object or an array. Ensures deterministic ordering.
 */
const StructuredData: React.FC<StructuredDataProps> = ({ data, nonce }) => {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          // We intentionally stringify here (object is plain JSON)
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
};

export default StructuredData;
