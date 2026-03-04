import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const weeklyData = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  waterUsage: Math.round(800 + Math.random() * 600),
  avgMoisture: Math.round(40 + Math.random() * 30),
}));

const DashboardAnalytics = () => {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto bg-muted/50 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Weekly performance overview</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="metric-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Water Usage (L/day)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 89%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20%, 46%)" />
                <YAxis stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Bar dataKey="waterUsage" fill="hsl(152, 55%, 38%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="metric-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Avg Moisture (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 100%, 52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 89%)" />
                <XAxis dataKey="day" stroke="hsl(215, 20%, 46%)" />
                <YAxis stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Area type="monotone" dataKey="avgMoisture" stroke="hsl(210, 100%, 52%)" fill="url(#moistGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
