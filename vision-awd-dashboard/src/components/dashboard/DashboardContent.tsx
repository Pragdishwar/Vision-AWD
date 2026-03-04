import { useState, useEffect } from "react";
import { Droplets, Sun, Power, Gauge, RefreshCw, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { HardwareDashboard } from "./HardwareDashboard";

// Mock data
const generateMoistureData = () =>
  Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    moisture: Math.round(35 + Math.random() * 40),
    brightness: Math.round(120 + Math.random() * 80),
  }));

const initialLogs = [
  { time: "14:32:01", event: "Image captured", type: "info" as const },
  { time: "14:32:03", event: "Dryness detected — Zone A (72%)", type: "warning" as const },
  { time: "14:32:05", event: "Pump activated", type: "success" as const },
  { time: "14:38:22", event: "Moisture threshold reached (65%)", type: "info" as const },
  { time: "14:38:24", event: "Pump deactivated", type: "success" as const },
  { time: "14:45:01", event: "Image captured", type: "info" as const },
];

const DashboardContent = () => {
  const [pumpOn, setPumpOn] = useState(false);
  const [threshold, setThreshold] = useState([45]);
  const [moistureData, setMoistureData] = useState(generateMoistureData);
  const [logs, setLogs] = useState(initialLogs);

  const handleRefresh = () => {
    setMoistureData(generateMoistureData());
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString("en-US", { hour12: false }), event: "Data refreshed", type: "info" as const },
      ...prev,
    ]);
  };

  const currentMoisture = moistureData[moistureData.length - 1]?.moisture ?? 0;
  const soilStatus = currentMoisture < threshold[0] ? "Dry" : "Wet";

  const metrics = [
    { label: "Soil Status", value: soilStatus, icon: Sun, color: soilStatus === "Dry" ? "text-warning" : "text-primary" },
    { label: "Moisture Level", value: `${currentMoisture}%`, icon: Droplets, color: "text-info" },
    { label: "Pump Status", value: pumpOn ? "ON" : "OFF", icon: Power, color: pumpOn ? "text-primary" : "text-muted-foreground" },
    { label: "Water Usage", value: "1,247 L", icon: Gauge, color: "text-accent-foreground" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-muted/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Irrigation Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time monitoring and control</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
              <p className="text-xl font-bold font-display text-foreground">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6 align-stretch h-full items-stretch">
        <HardwareDashboard />

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="metric-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Moisture Level (24h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={moistureData}>
                <defs>
                  <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 89%)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(215, 20%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Area type="monotone" dataKey="moisture" stroke="hsl(152, 55%, 38%)" fill="url(#moistureGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="metric-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Brightness Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={moistureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 15%, 89%)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(215, 20%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Line type="monotone" dataKey="brightness" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Control + Logs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <div className="metric-card space-y-6">
          <h3 className="font-display font-semibold text-foreground">Control Panel</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Pump Override</p>
              <p className="text-xs text-muted-foreground">Manually toggle pump ON/OFF</p>
            </div>
            <Switch checked={pumpOn} onCheckedChange={setPumpOn} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-foreground text-sm">Moisture Threshold</p>
              <span className="text-xs font-semibold text-primary">{threshold[0]}%</span>
            </div>
            <Slider value={threshold} onValueChange={setThreshold} min={20} max={80} step={1} className="w-full" />
          </div>
        </div>

        {/* System Logs */}
        <div className="metric-card">
          <h3 className="font-display font-semibold text-foreground mb-4">System Logs</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{log.time}</span>
                <span className={`flex-1 ${log.type === "warning" ? "text-warning" : log.type === "success" ? "text-primary" : "text-foreground"}`}>
                  {log.event}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
