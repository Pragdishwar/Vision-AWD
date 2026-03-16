import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container-narrow flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          AgriVision AWD
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="/#problem" className="hover:text-foreground transition-colors">Problem</a>
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
