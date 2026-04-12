import { useEffect, useState, useRef } from "react";
import { Camera, Droplets, Sun, Power, AlertTriangle, Zap } from "lucide-react";

export const ESP32_IP = "http://10.187.13.177";

export const HardwareDashboard = ({ onStatusUpdate }: { onStatusUpdate?: (status: any) => void }) => {
    const [esp32Ip, setEsp32Ip] = useState(() => localStorage.getItem("esp32_ip") || ESP32_IP);
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [pumpLoading, setPumpLoading] = useState(false);
    const [isEditingIp, setIsEditingIp] = useState(false);
    const [tempIp, setTempIp] = useState(esp32Ip);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const statusRef = useRef<any>(null);

    useEffect(() => {
        const fetchStatus = () => {
            fetch(`${esp32Ip}/status`)
                .then((res) => {
                    if (!res.ok) throw new Error("Hardware returned an error");
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
                    setError(err.message === "Failed to fetch" ? "Hardware Unreachable (Timeout)" : err.message);
                });
        };

        const fetchImage = () => {
            fetch(`${esp32Ip}/image`)
                .then((res) => {
                    if (!res.ok) throw new Error("Image buffer failed");
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
                })
                .catch((err) => {
                    console.error("Camera feed error:", err);
                });
        };

        // Fetch immediately on mount or when IP changes
        fetchStatus();
        fetchImage();

        const statusInterval = setInterval(fetchStatus, 2000);
        const imageInterval = setInterval(fetchImage, 10000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(imageInterval);
        };
    }, [esp32Ip]);

    const handleSaveIp = () => {
        let formattedIp = tempIp.trim();
        if (!formattedIp.startsWith("http")) formattedIp = `http://${formattedIp}`;
        setEsp32Ip(formattedIp);
        localStorage.setItem("esp32_ip", formattedIp);
        setIsEditingIp(false);
        setError(null);
    };

    const sendPumpCommand = (state: "on" | "off" | "auto") => {
        setPumpLoading(true);
        fetch(`${esp32Ip}/pump?state=${state}`)
            .then((res) => {
                if (!res.ok) throw new Error("Pump command failed");
                return res.json();
            })
            .then(() => {
                // Optimistically update local status so UI reflects instantly
                setStatus((prev: any) => prev ? {
                    ...prev,
                    manualOverride: state !== "auto",
                    pumpOn: state === "on" ? true : state === "off" ? false : prev.pumpOn,
                } : prev);
            })
            .catch((err) => console.error("Pump command error:", err))
            .finally(() => setPumpLoading(false));
    };

    return (
        <div className="metric-card lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Hardware Link (ESP32-CAM)</h3>
                <button 
                  onClick={() => {
                    setTempIp(esp32Ip);
                    setIsEditingIp(!isEditingIp);
                  }}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                   <Power className={`h-3 w-3 ${isEditingIp ? 'text-primary' : ''}`} />
                </button>
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

            {isEditingIp && (
              <div className="mb-4 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input 
                  type="text"
                  value={tempIp}
                  onChange={(e) => setTempIp(e.target.value)}
                  placeholder="http://10.187.13.177"
                  className="flex-grow bg-black/40 border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                />
                <button 
                  onClick={handleSaveIp}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground text-[10px] font-bold px-3 py-1 rounded"
                >
                  SAVE
                </button>
              </div>
            )}

            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-border mb-4 flex-shrink-0">
                <canvas
                    ref={canvasRef}
                    width="160"
                    height="120"
                    className="w-full h-full object-contain pixelated"
                    style={{ imageRendering: "pixelated" }}
                />
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-xs text-center p-4">
                        <AlertTriangle className="h-8 w-8 text-warning mb-2" />
                        <p className="font-semibold mb-1">{error}</p>
                        <p className="text-[10px] opacity-80 mb-2">Target: {esp32Ip}</p>
                        <div className="flex gap-2 mb-3">
                          <button 
                            onClick={() => window.open(esp32Ip, '_blank')}
                            className="text-[9px] underline text-primary"
                          >
                            Open URL
                          </button>
                          <button 
                            onClick={() => setIsEditingIp(true)}
                            className="text-[9px] underline text-primary"
                          >
                            Change IP
                          </button>
                        </div>
                        {window.location.protocol === "https:" && (
                            <div className="bg-warning/20 border border-warning/30 p-2 rounded text-[9px] leading-tight">
                                <span className="font-bold text-warning">HTTPS DETECTED:</span><br/>
                                1. Open the [Lock] icon in browser bar.<br/>
                                2. Go to [Site Settings].<br/>
                                3. Set [Insecure content] to [Allow].
                            </div>
                        )}
                    </div>
                )}
            </div>

            {status && (
                <div className="space-y-3 mt-auto flex-grow justify-end flex flex-col text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3" /> Vision:</span>
                        <span className={`font-semibold ${status.visionDry ? "text-amber-500" : "text-green-500"}`}>
                            {status.visionDry ? `DRY (${status.dryCount}/4)` : `WET (${4 - status.dryCount}/4)`}
                        </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Droplets className="w-3 h-3" /> Sensor:</span>
                        <span className={`font-semibold ${status.sensorDry ? "text-amber-500" : "text-green-500"}`}>
                            {status.sensorDry ? "DRY" : "WET"}
                        </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Power className="w-3 h-3" /> Relay:</span>
                        <span className={`font-semibold ${status.pumpOn ? "text-primary" : "text-muted-foreground"}`}>
                            {status.pumpOn ? "ON (IRRIGATING)" : "OFF"}
                            {status.manualOverride && <span className="ml-1 text-xs text-amber-400">[Manual]</span>}
                        </span>
                    </div>

                    {/* Manual Pump Controls */}
                    <div className="pt-1">
                        <div className="flex items-center gap-1 text-muted-foreground mb-2">
                            <Zap className="w-3 h-3" />
                            <span className="text-xs font-medium uppercase tracking-wide">Pump Control</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                onClick={() => sendPumpCommand("on")}
                                disabled={pumpLoading}
                                className={`py-1.5 px-2 rounded text-xs font-semibold transition-all border
                                    ${status.manualOverride && status.pumpOn
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
                                    } disabled:opacity-50`}
                            >
                                Force ON
                            </button>
                            <button
                                onClick={() => sendPumpCommand("off")}
                                disabled={pumpLoading}
                                className={`py-1.5 px-2 rounded text-xs font-semibold transition-all border
                                    ${status.manualOverride && !status.pumpOn
                                        ? "bg-destructive text-destructive-foreground border-destructive"
                                        : "bg-transparent text-muted-foreground border-border hover:border-destructive hover:text-destructive"
                                    } disabled:opacity-50`}
                            >
                                Force OFF
                            </button>
                            <button
                                onClick={() => sendPumpCommand("auto")}
                                disabled={pumpLoading}
                                className={`py-1.5 px-2 rounded text-xs font-semibold transition-all border
                                    ${!status.manualOverride
                                        ? "bg-green-600 text-white border-green-600"
                                        : "bg-transparent text-muted-foreground border-border hover:border-green-500 hover:text-green-500"
                                    } disabled:opacity-50`}
                            >
                                Auto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
