const InsightSection = () => {
  return (
    <section id="insight" className="py-24 md:py-32 px-6 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm uppercase text-primary-foreground/70 mb-6">
          Why this template works
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-primary-foreground mb-8">
          Static sites still need product judgment
        </h2>
        <p className="text-lg text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed mb-8">
          The template is intentionally opinionated: clear hierarchy, real metadata, one primary action, visual texture, and stable responsive sections.
        </p>
        <div className="max-w-xl mx-auto space-y-4 text-left">
          {[
            "The first screen says what the product does",
            "Every section has one clear job",
            "Search and social previews are handled in code",
            "The output is static, portable, and easy to host",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm flex items-center justify-center font-medium mt-0.5">
                {i + 1}
              </span>
              <p className="text-primary-foreground/90">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InsightSection;
