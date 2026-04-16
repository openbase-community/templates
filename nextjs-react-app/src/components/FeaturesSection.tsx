import { Gauge, Image, Search, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "SEO foundations",
    description:
      "Metadata, Open Graph tags, Twitter cards, robots, sitemap, and structured data are already wired into the App Router.",
  },
  {
    icon: Gauge,
    title: "Static export",
    description:
      "Build to plain files in `out/` for simple hosting on a CDN, object store, or static web host.",
  },
  {
    icon: Image,
    title: "Image-backed hero",
    description:
      "A full-bleed visual first screen gives the site immediate texture while keeping the next section within reach.",
  },
  {
    icon: ShieldCheck,
    title: "Polished defaults",
    description:
      "Tailwind tokens, responsive sections, accessible primitives, and lint/test scripts are ready from the first commit.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-32 px-6 bg-sage-light">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm uppercase text-muted-foreground mb-4">
            Built-in essentials
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
            The pieces every launch needs
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-background rounded-lg p-8 border border-border/50"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
