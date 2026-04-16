const steps = [
  {
    phase: "Plan",
    title: "Shape the message",
    description:
      "Update the hero, feature cards, proof point, and call to action around the product you are launching.",
  },
  {
    phase: "Polish",
    title: "Tune the details",
    description:
      "Adjust the palette, typography, image, metadata, and structured data without changing the app architecture.",
  },
  {
    phase: "Publish",
    title: "Export and ship",
    description:
      "Run a static build and deploy the `out/` directory wherever your site should live.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-secondary">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm uppercase text-muted-foreground mb-4">
            Simple path
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
            From scaffold to launch
          </h2>
        </div>

        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <div key={step.phase} className="relative">
              <div className="text-sm font-medium text-accent mb-3">
                {step.phase}
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
