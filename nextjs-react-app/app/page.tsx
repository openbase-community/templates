import HomePage from "@/components/HomePage";
import { defaultDescription, defaultTitle, siteName, siteUrl } from "@/lib/seo";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteName,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: defaultDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...structuredData,
            headline: defaultTitle,
          }),
        }}
      />
      <HomePage />
    </>
  );
}
