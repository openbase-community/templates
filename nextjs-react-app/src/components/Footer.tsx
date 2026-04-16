const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="/" className="font-serif text-xl text-foreground">
          $${name_pretty}
        </a>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} $${name_pretty}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
