import Image from "next/image";

const HeroSection = () => {
  return (
    <section className="relative min-h-[78vh] md:min-h-[88vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="$${name_pretty} website hero image"
          className="w-full h-full object-cover"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-24 pb-16 md:pb-24">
        <p className="animate-fade-up text-sm uppercase text-muted-foreground mb-6">
          $${hero_eyebrow}
        </p>
        <h1 className="animate-fade-up delay-100 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-foreground text-balance mb-8">
          $${hero_headline}
        </h1>
        <p className="animate-fade-up delay-200 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
          $${hero_description}
        </p>
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#get-started"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg text-base font-medium hover:opacity-90 transition-opacity"
          >
            $${primary_cta_label}
          </a>
          <a
            href="#how-it-works"
            className="border border-border text-foreground px-8 py-3.5 rounded-lg text-base font-medium hover:bg-secondary transition-colors"
          >
            $${secondary_cta_label}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
