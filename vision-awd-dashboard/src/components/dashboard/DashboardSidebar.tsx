import { useState } from "react";
import { Leaf, LayoutDashboard, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col dark-gradient text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"
        }`}
    >
      <Link to="/" className="flex items-center gap-2 h-16 px-4 border-b border-sidebar-border hover:opacity-80 transition-opacity">
        <Leaf className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
        {!collapsed && <span className="font-display font-bold text-base">AgriVision</span>}
      </Link>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-primary"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
