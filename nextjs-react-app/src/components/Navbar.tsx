"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl text-foreground">
          $${name_pretty}
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#insight" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why it works</a>
          <a href="#get-started" className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
            $${primary_cta_label}
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          <a href="#features" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">How it works</a>
          <a href="#insight" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">Why it works</a>
          <a href="#get-started" onClick={() => setOpen(false)} className="block text-sm font-medium bg-primary text-primary-foreground px-5 py-2 rounded-lg text-center">
            $${primary_cta_label}
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
