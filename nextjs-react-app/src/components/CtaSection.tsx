const CtaSection = () => {
  return (
    <section id="get-started" className="py-24 md:py-32 px-6 bg-sage-light">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground mb-6">
          Ready to make it yours?
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10">
          Customize the sections, connect your domain, and publish a fast static site for $${name_pretty}.
        </p>
        <a
          href="#"
          className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-lg text-base font-medium hover:opacity-90 transition-opacity"
        >
          $${primary_cta_label}
        </a>
        <p className="mt-4 text-sm text-muted-foreground">Static export ready</p>
      </div>
    </section>
  );
};

export default CtaSection;
