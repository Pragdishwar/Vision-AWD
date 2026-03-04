import { Leaf } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container-narrow flex items-center justify-between h-16 px-6">
        <a href="/" className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          AgriVision AWD
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#problem" className="hover:text-foreground transition-colors">Problem</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
