import { useEffect, useState, useRef } from "react";
import { Camera, Droplets, Sun, Power, AlertTriangle } from "lucide-react";

// The local IP of the ESP32 on the network
export const ESP32_IP = "http://10.79.244.177";

export const HardwareDashboard = ({ onStatusUpdate }: { onStatusUpdate?: (status: any) => void }) => {
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const statusRef = useRef<any>(null);

    useEffect(() => {
        const fetchData = () => {
            // 1. Fetch the logic and sensor data
            fetch(`${ESP32_IP}/status`)
                .then((res) => {
                    if (!res.ok) throw new Error("Network response was not ok");
                    return res.json();
                })
                .then((data) => {
                    setStatus(data);
                    statusRef.current = data;
                    if (onStatusUpdate) onStatusUpdate(data);
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

                    const currentStatus = statusRef.current;
                    if (currentStatus) {
                        const { s1, s2, s3, s4, thresh } = currentStatus;

                        const drawQuad = (x: number, y: number, val: number, label: string) => {
                            const isDry = val > thresh;
                            ctx.fillStyle = isDry ? "rgba(255, 60, 60, 0.25)" : "rgba(50, 205, 50, 0.25)";
                            ctx.fillRect(x, y, 80, 60);

                            ctx.strokeStyle = isDry ? "rgba(255, 60, 60, 0.8)" : "rgba(50, 205, 50, 0.8)";
                            ctx.lineWidth = 1;
                            ctx.setLineDash([2, 2]);
                            ctx.strokeRect(x, y, 80, 60);

                            ctx.fillStyle = isDry ? "#ff3c3c" : "#32cd32";
                            ctx.font = "bold 10px sans-serif";
                            ctx.fillText(`${label}: ${val}`, x + 5, y + 15);
                        };

                        drawQuad(0, 0, s1, "S1");
                        drawQuad(80, 0, s2, "S2");
                        drawQuad(0, 60, s3, "S3");
                        drawQuad(80, 60, s4, "S4");
                    }

                    setError(null);
                })
                .catch((err) => {
                    console.error("Camera feed error:", err);
                    setError("Failed to stream camera feed");
                });
        };

        // Fetch immediately on mount
        fetchData();

        // Then set up the interval to fetch every 2 seconds
        const interval = setInterval(fetchData, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="metric-card lg:col-span-1 flex flex-col">
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
                        <span className={`font-semibold ${status.visionDry ? "text-amber-500" : "text-green-500"}`}>
                            {status.visionDry ? "DRY" : "WET"} ({status.dryCount}/4)
                        </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Droplets className="w-3 h-3" /> Sensor:</span>
                        <span className={`font-semibold ${status.sensorDry ? "text-amber-500" : "text-green-500"}`}>
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
