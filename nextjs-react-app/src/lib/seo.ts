export const siteName = "$${name_pretty}";
export const defaultTitle = "$${name_pretty} | $${hero_headline}";
export const defaultDescription =
  "$${marketing_description}";
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "$${site_url}").replace(/\/$/, "");
export const ogImage = "/images/hero.jpg";
