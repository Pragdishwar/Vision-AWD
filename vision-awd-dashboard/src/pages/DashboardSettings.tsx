import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { ESP32_IP } from "@/components/dashboard/HardwareDashboard";

const DashboardSettings = () => {
  const [autoMode, setAutoMode] = useState(true);
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem("agrivision_notifications") === "true";
  });
  const [calibration, setCalibration] = useState([150]); // Changed to match default C++ absolute value (0-255)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Fetch initial auto mode state and threshold from ESP32
  useEffect(() => {
    fetch(`${ESP32_IP}/status`)
      .then(res => res.json())
      .then(data => {
        if (data.isAutoMode !== undefined) {
          setAutoMode(data.isAutoMode);
        }
        if (data.thresh !== undefined) {
          setCalibration([data.thresh]);
        }
      })
      .catch(err => console.error("Could not fetch initial status:", err));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Called only when drag ends (onValueCommit) to avoid flooding ESP32 server
  const handleThresholdCommit = async (val: number[]) => {
    try {
      await fetch(`${ESP32_IP}/config?threshold=${val[0]}`);
    } catch (err) {
      console.error("Failed to update threshold", err);
    }
  };

  const handleAutoModeChange = async (checked: boolean) => {
    setAutoMode(checked);
    try {
      await fetch(`${ESP32_IP}/mode?auto=${checked}`);
    } catch (err) {
      console.error("Failed to update auto mode", err);
    }
  };

  const handleNotificationsChange = (checked: boolean) => {
    if (checked) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
      }
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotifications(true);
          localStorage.setItem("agrivision_notifications", "true");
          new Notification("AgriVision Alerts Enabled", { body: "You will now receive alerts for critical events." });
        }
      });
    } else {
      setNotifications(false);
      localStorage.setItem("agrivision_notifications", "false");
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
              <Switch checked={autoMode} onCheckedChange={handleAutoModeChange} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts for pump events and threshold breaches.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={handleNotificationsChange} />
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
            <Slider value={calibration} onValueChange={setCalibration} onValueCommit={handleThresholdCommit} min={0} max={255} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
