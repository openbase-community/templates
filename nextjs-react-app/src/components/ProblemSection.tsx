const tools = [
  "Metadata",
  "Sitemap",
  "Robots",
  "Open Graph",
  "Responsive UI",
  "Static export",
];

const ProblemSection = () => {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground mb-6">
          Start with the structure,<br className="hidden sm:block" /> not the blank page
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
          A strong landing page needs more than a hero. This template gives you the SEO, sections, visual rhythm, and static deployment path that every product site needs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {tools.map((tool) => (
            <span
              key={tool}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm border border-border"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
