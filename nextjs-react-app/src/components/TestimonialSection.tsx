const TestimonialSection = () => {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl leading-snug text-foreground italic mb-8">
          "We had a polished static site in place before the product copy was final. The structure made the launch feel much less fragile."
        </blockquote>
        <div>
          <p className="text-foreground font-medium">A product founder</p>
          <p className="text-muted-foreground text-sm">Early-stage launch</p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
