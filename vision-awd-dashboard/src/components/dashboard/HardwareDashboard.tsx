import { useEffect, useState, useRef } from "react";
import { Camera, Droplets, Sun, Power, AlertTriangle } from "lucide-react";

// The local IP of the ESP32 on the network
const ESP32_IP = "http://10.79.244.177";

export const HardwareDashboard = () => {
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // 1. Fetch the logic and sensor data every 2 seconds
        const interval = setInterval(() => {
            fetch(`${ESP32_IP}/status`)
                .then((res) => {
                    if (!res.ok) throw new Error("Network response was not ok");
                    return res.json();
                })
                .then((data) => {
                    setStatus(data);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Hardware disconnected:", err);
                    setError("Failed to connect to ESP32 Hardware");
                });

            // 2. Fetch the raw camera Grayscale array and draw it to Canvas
            fetch(`${ESP32_IP}/image`)
                .then((res) => {
                    if (!res.ok) throw new Error("Network response was not ok");
                    return res.arrayBuffer();
                })
                .then((buf) => {
                    if (!canvasRef.current) return;
                    const ctx = canvasRef.current.getContext("2d");
                    if (!ctx) return;

                    let imgData = ctx.createImageData(160, 120);
                    let bytes = new Uint8Array(buf);
                    for (let i = 0; i < bytes.length; i++) {
                        let offset = i * 4;
                        imgData.data[offset] = bytes[i]; // R
                        imgData.data[offset + 1] = bytes[i]; // G
                        imgData.data[offset + 2] = bytes[i]; // B
                        imgData.data[offset + 3] = 255; // Alpha
                    }
                    ctx.putImageData(imgData, 0, 0);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Camera feed error:", err);
                    setError("Failed to stream camera feed");
                });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="metric-card lg:col-span-1 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Hardware Link (ESP32-CAM)</h3>
                {status && !error ? (
                    <span className="ml-auto flex items-center gap-1 text-xs text-primary font-medium">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Live
                    </span>
                ) : (
                    <span className="ml-auto flex items-center gap-1 text-xs text-warning font-medium">
                        <AlertTriangle className="h-3 w-3" /> Offline
                    </span>
                )}
            </div>

            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-border mb-4 flex-shrink-0">
                <canvas
                    ref={canvasRef}
                    width="160"
                    height="120"
                    className="w-full h-full object-contain pixelated"
                    style={{ imageRendering: "pixelated" }}
                />
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs text-center p-4">
                        {error}. Make sure ESP32 is on the network ({ESP32_IP}).
                    </div>
                )}
            </div>

            {status && (
                <div className="space-y-3 mt-auto flex-grow justify-end flex flex-col text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3" /> Vision:</span>
                        <span className={`font-semibold ${status.visionDry ? "text-warning" : "text-primary"}`}>
                            {status.visionDry ? "DRY" : "WET"} ({status.dryCount}/4)
                        </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Droplets className="w-3 h-3" /> Sensor:</span>
                        <span className={`font-semibold ${status.sensorDry ? "text-warning" : "text-primary"}`}>
                            {status.sensorDry ? "DRY" : "WET"} ({status.sensorVal})
                        </span>
                    </div>

                    <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground flex items-center gap-1"><Power className="w-3 h-3" /> Relay:</span>
                        <span className={`font-semibold ${status.pumpOn ? "text-primary" : "text-muted-foreground"}`}>
                            {status.pumpOn ? "ON (IRRIGATING)" : "OFF"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
