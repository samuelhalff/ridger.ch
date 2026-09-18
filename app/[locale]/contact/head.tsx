export default function Head() {
  return (
    <>
      {/* Preconnect only on the contact page where Google Maps is expected */}
      <link
        rel="preconnect"
        href="https://maps.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://maps.googleapis.com"
        crossOrigin="anonymous"
      />
    </>
  );
}
