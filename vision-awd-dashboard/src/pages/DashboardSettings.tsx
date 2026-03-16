import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { ESP32_IP } from "@/components/dashboard/HardwareDashboard";

const DashboardSettings = () => {
  const [autoMode, setAutoMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [calibration, setCalibration] = useState([150]); // Changed to match default C++ absolute value (0-255)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleThresholdChange = async (val: number[]) => {
    setCalibration(val);
    try {
      await fetch(`${ESP32_IP}/config?threshold=${val[0]}`);
    } catch (err) {
      console.error("Failed to update threshold", err);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto bg-muted/50 p-6">
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Configure your irrigation system preferences.</p>

        <div className="max-w-xl space-y-6">
          <div className="metric-card space-y-6">
            <h3 className="font-display font-semibold text-foreground">System Mode</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Auto / Manual Mode</p>
                <p className="text-xs text-muted-foreground">When enabled, pump runs automatically based on sensor data.</p>
              </div>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts for pump events and threshold breaches.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark visual themes.</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>
          </div>

          <div className="metric-card space-y-4">
            <h3 className="font-display font-semibold text-foreground">Threshold Calibration</h3>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Dryness detection sensitivity (0-255 grayscale)</p>
              <span className="text-sm font-semibold text-primary">{calibration[0]}</span>
            </div>
            <Slider value={calibration} onValueChange={handleThresholdChange} min={0} max={255} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
