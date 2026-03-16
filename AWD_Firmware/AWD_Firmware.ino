#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

// ==========================================================
// CONFIGURATION (Update these!)
// ==========================================================
const char* ssid = "CITAR";
const char* password = "CITAR@123";

// Vision Threshold (0-255). Dry soil is usually brighter in Grayscale.
// Calibrate this based on your specific soil and lighting!
uint8_t DRY_BRIGHTNESS_THRESHOLD = 150; 

// Moisture Sensor Threshold (0-4095 for ESP32 ADC)
// Calibrate depending on your specific analog sensor.
const int DRY_SENSOR_THRESHOLD = 2500; 
// ==========================================================

// Pin Definitions for standard AI-Thinker ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define RELAY_PIN         12 // Actuator to Water Pump
#define MOISTURE_PIN      33 // ADC pin for Soil Moisture Sensor

// Global Application State
int avgS1 = 0, avgS2 = 0, avgS3 = 0, avgS4 = 0;
int currentDryCount = 0;
bool visionIsDry = false;
int currentSensorVal = 0;
bool sensorIsDry = false;
bool pumpIsOn = false;

// Manual Override Flags
bool manualOverride = false;
bool manualPumpState = false;
bool isAutoMode = true; // Governs if the background loop runs

unsigned long lastCheckTime = 0;
const unsigned long CHECK_INTERVAL = 10000; // Check and analyze every 10 seconds

// HTTP Server Handle
httpd_handle_t camera_httpd = NULL;

// Frontend HTML Dashboard
const char PROGMEM INDEX_HTML[] = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AWD Smart Irrigation</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; background-color: #f0f2f5; margin: 0; padding: 20px; color: #333; }
    h2 { margin-bottom: 5px; }
    p.subtitle { color: #666; margin-top: 0; margin-bottom: 25px; }
    .container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: 100%; max-width: 400px; box-sizing: border-box; }
    
    .canvas-container { position: relative; margin: 0 auto; display: inline-block; border-radius: 8px; overflow: hidden; border: 2px solid #ddd; background: #000; width: 320px; height: 240px; }
    canvas { width: 320px; height: 240px; display: block; image-rendering: pixelated; }
    .quad { position: absolute; width: 50%; height: 50%; box-sizing: border-box; border: 2px dashed rgba(255, 60, 60, 0.7); display: flex; justify-content: center; align-items: center; color: #ff3c3c; font-weight: bold; font-size: 16px; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; }
    .q1 { top: 0; left: 0; } .q2 { top: 0; left: 50%; }
    .q3 { top: 50%; left: 0; } .q4 { top: 50%; left: 50%; }

    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { font-weight: bold; color: #555; }
    .stat-val { font-weight: bold; }
    .status-wet { color: #28a745; }
    .status-dry { color: #dc3545; }
    .status-pump-on { color: #007bff; }
    .status-pump-off { color: #6c757d; }
  </style>
</head>
<body>
  <h2>Vision-Based AWD Irrigation</h2>
  <p class="subtitle">ESP32-CAM Control Dashboard</p>
  
  <div class="container">
    <div class="card" style="padding: 10px; padding-bottom: 0;">
      <div class="canvas-container">
        <!-- We use an HTML5 canvas to decode and draw the raw Grayscale array from the ESP32! -->
        <canvas id="canvas" width="160" height="120"></canvas>
        <div class="quad q1" id="q1">S1</div>
        <div class="quad q2" id="q2">S2</div>
        <div class="quad q3" id="q3">S3</div>
        <div class="quad q4" id="q4">S4</div>
      </div>
    </div>

    <div class="card">
      <div class="stat-row">
        <span class="stat-label">Vision Analysis (Camera):</span>
        <span class="stat-val" id="visionStatus">Loading...</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Moisture Sensor (Analog):</span>
        <span class="stat-val" id="sensorStatus">Loading...</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Relay / Water Pump:</span>
        <span class="stat-val" id="pumpStatus">Loading...</span>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    function updateSystem() {
      // 1. Fetch Raw Grayscale Array Header and plot directly to canvas (saves ESP32 compute!)
      fetch('/image')
        .then(res => res.arrayBuffer())
        .then(buf => {
          let imgData = ctx.createImageData(160, 120);
          let bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i++) {
            let offset = i * 4;
            imgData.data[offset] = bytes[i];       // Red
            imgData.data[offset+1] = bytes[i];     // Green
            imgData.data[offset+2] = bytes[i];     // Blue
            imgData.data[offset+3] = 255;          // Alpha completely opaque
          }
          ctx.putImageData(imgData, 0, 0);
        })
        .catch(err => console.error(err));

      // 2. Fetch Logic/Analysis Data
      fetch('/status')
        .then(res => res.json())
        .then(data => {
          document.getElementById('q1').innerText = "S1: " + data.s1;
          document.getElementById('q1').style.color = (data.s1 > data.thresh) ? '#ff3c3c' : '#32cd32';
          
          document.getElementById('q2').innerText = "S2: " + data.s2;
          document.getElementById('q2').style.color = (data.s2 > data.thresh) ? '#ff3c3c' : '#32cd32';
          
          document.getElementById('q3').innerText = "S3: " + data.s3;
          document.getElementById('q3').style.color = (data.s3 > data.thresh) ? '#ff3c3c' : '#32cd32';
          
          document.getElementById('q4').innerText = "S4: " + data.s4;
          document.getElementById('q4').style.color = (data.s4 > data.thresh) ? '#ff3c3c' : '#32cd32';

          let vStat = document.getElementById('visionStatus');
          vStat.innerText = data.visionDry ? "DRY (" + data.dryCount + "/4)" : "WET (" + data.dryCount + "/4)";
          vStat.className = "stat-val " + (data.visionDry ? "status-dry" : "status-wet");

          let sStat = document.getElementById('sensorStatus');
          sStat.innerText = data.sensorDry ? "DRY (" + data.sensorVal + ")" : "WET (" + data.sensorVal + ")";
          sStat.className = "stat-val " + (data.sensorDry ? "status-dry" : "status-wet");

          let pStat = document.getElementById('pumpStatus');
          pStat.innerText = data.pumpOn ? "ON (Irrigating)" : "OFF";
          pStat.className = "stat-val " + (data.pumpOn ? "status-pump-on" : "status-pump-off");
        })
        .catch(err => console.error(err));
    }

    // Refresh immediately, then ping every 2.5 seconds
    updateSystem();
    setInterval(updateSystem, 2500);
  </script>
</body>
</html>
)rawliteral";

// ===========================================
// Web Server Request Handlers
// ===========================================

// Serves the HTML frontend interface
static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, INDEX_HTML, strlen(INDEX_HTML));
}

// Serves the raw Grayscale array directly from the Camera Framebuffer
static esp_err_t image_handler(httpd_req_t *req) {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  
  // CORS Headers for React Integration
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  
  // Set binary content type (not a JPEG, just raw bytes)
  httpd_resp_set_type(req, "application/octet-stream");
  esp_err_t res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
  return res;
}

// Serves the analysis logic as JSON for the dashboard to parse
static esp_err_t status_handler(httpd_req_t *req) {
  char json[256];
  snprintf(json, sizeof(json), 
    "{\"s1\":%d,\"s2\":%d,\"s3\":%d,\"s4\":%d,\"thresh\":%d,\"dryCount\":%d,\"visionDry\":%s,\"sensorVal\":%d,\"sensorDry\":%s,\"pumpOn\":%s,\"manualOverride\":%s,\"isAutoMode\":%s}",
    avgS1, avgS2, avgS3, avgS4, DRY_BRIGHTNESS_THRESHOLD, currentDryCount,
    visionIsDry ? "true" : "false",
    currentSensorVal,
    sensorIsDry ? "true" : "false",
    pumpIsOn ? "true" : "false",
    manualOverride ? "true" : "false",
    isAutoMode ? "true" : "false"
  );
  
  // CORS Headers for React Integration
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_type(req, "application/json");
  return httpd_resp_send(req, json, strlen(json));
}

// Handles manual pump overrides
static esp_err_t pump_handler(httpd_req_t *req) {
  char* buf;
  size_t buf_len;
  char state[32] = {0};

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char*)malloc(buf_len);
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      if (httpd_query_key_value(buf, "state", state, sizeof(state)) == ESP_OK) {
        if (strcmp(state, "on") == 0) {
          manualOverride = true;
          manualPumpState = true;
        } else if (strcmp(state, "off") == 0) {
          manualOverride = true;
          manualPumpState = false;
        } else if (strcmp(state, "auto") == 0) {
          manualOverride = false;
        }
      }
    }
    free(buf);
  }
  
  // Update pump state immediately
  if (manualOverride) {
      pumpIsOn = manualPumpState;
  } else {
      pumpIsOn = (visionIsDry && sensorIsDry);
  }
  digitalWrite(RELAY_PIN, pumpIsOn ? HIGH : LOW);

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_type(req, "application/json");
  return httpd_resp_send(req, "{\"success\":true}", 16);
}

// Handles dynamic threshold configuration
static esp_err_t config_handler(httpd_req_t *req) {
  char* buf;
  size_t buf_len;
  char thresh[16] = {0};

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char*)malloc(buf_len);
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      if (httpd_query_key_value(buf, "threshold", thresh, sizeof(thresh)) == ESP_OK) {
        DRY_BRIGHTNESS_THRESHOLD = (uint8_t)atoi(thresh);
        Serial.printf("Dashboard updated threshold to: %d\n", DRY_BRIGHTNESS_THRESHOLD);
      }
    }
    free(buf);
  }
  
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_type(req, "application/json");
  return httpd_resp_send(req, "{\"success\":true}", 16);
}

// Handles switching between Auto and Manual system modes
static esp_err_t mode_handler(httpd_req_t *req) {
  char* buf;
  size_t buf_len;
  char state[32] = {0};

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char*)malloc(buf_len);
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      if (httpd_query_key_value(buf, "auto", state, sizeof(state)) == ESP_OK) {
        if (strcmp(state, "true") == 0) {
          isAutoMode = true;
          manualOverride = false; // Reset temporary overrides when switching back to auto
        } else if (strcmp(state, "false") == 0) {
          isAutoMode = false;
        }
      }
    }
    free(buf);
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_send(req, "Mode Updated", HTTPD_RESP_USE_STRLEN);
  return ESP_OK;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t index_uri = { .uri = "/", .method = HTTP_GET, .handler = index_handler, .user_ctx = NULL };
  httpd_uri_t image_uri = { .uri = "/image", .method = HTTP_GET, .handler = image_handler, .user_ctx = NULL };
  httpd_uri_t status_uri = { .uri = "/status", .method = HTTP_GET, .handler = status_handler, .user_ctx = NULL };
  httpd_uri_t pump_uri = { .uri = "/pump", .method = HTTP_GET, .handler = pump_handler, .user_ctx = NULL };
  httpd_uri_t config_uri = { .uri = "/config", .method = HTTP_GET, .handler = config_handler, .user_ctx = NULL };
  httpd_uri_t mode_uri = { .uri = "/mode", .method = HTTP_GET, .handler = mode_handler, .user_ctx = NULL };

  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &image_uri);
    httpd_register_uri_handler(camera_httpd, &status_uri);
    httpd_register_uri_handler(camera_httpd, &pump_uri);
    httpd_register_uri_handler(camera_httpd, &config_uri);
    httpd_register_uri_handler(camera_httpd, &mode_uri);
    Serial.println("Web Server started successfully!");
  } else {
    Serial.println("Failed to start Web Server");
  }
}

// ===========================================
// Core Logic & Analysis function
// ===========================================
void performAnalysis() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed during analysis");
    return;
  }

  // Segment brightness summations
  long sumSeg1 = 0, sumSeg2 = 0, sumSeg3 = 0, sumSeg4 = 0;
  int countPerSeg = (160 / 2) * (120 / 2); // 80 * 60 = 4800 pixels per quadrant

  for (int y = 0; y < 120; y++) {
    for (int x = 0; x < 160; x++) {
      int pixelIndex = y * 160 + x;
      uint8_t brightness = fb->buf[pixelIndex];

      if (x < 80 && y < 60) sumSeg1 += brightness;
      else if (x >= 80 && y < 60) sumSeg2 += brightness;
      else if (x < 80 && y >= 60) sumSeg3 += brightness;
      else if (x >= 80 && y >= 60) sumSeg4 += brightness;
    }
  }
  
  // Return the memory buffer back to the camera driver
  esp_camera_fb_return(fb);

  // Compute Averages
  avgS1 = sumSeg1 / countPerSeg;
  avgS2 = sumSeg2 / countPerSeg;
  avgS3 = sumSeg3 / countPerSeg;
  avgS4 = sumSeg4 / countPerSeg;

  // Evaluate against Threshold
  currentDryCount = 0;
  if (avgS1 > DRY_BRIGHTNESS_THRESHOLD) currentDryCount++;
  if (avgS2 > DRY_BRIGHTNESS_THRESHOLD) currentDryCount++;
  if (avgS3 > DRY_BRIGHTNESS_THRESHOLD) currentDryCount++;
  if (avgS4 > DRY_BRIGHTNESS_THRESHOLD) currentDryCount++;

  // Minimum of 2 'Dry' quadrants required to classify total region as DRY
  visionIsDry = (currentDryCount >= 2);
  
  // Also evaluate Physical Soil Moisture Sensor
  currentSensorVal = analogRead(MOISTURE_PIN);
  sensorIsDry = (currentSensorVal > DRY_SENSOR_THRESHOLD);
  
  // Both systems must agree the soil is dry to start pumping water
  if (manualOverride) {
      pumpIsOn = manualPumpState;
  } else {
      pumpIsOn = (visionIsDry && sensorIsDry);
  }

  digitalWrite(RELAY_PIN, pumpIsOn ? HIGH : LOW);

  // Print results to Serial Monitor
  Serial.println("=== Analysis Update ===");
  Serial.printf("S1: %d, S2: %d, S3: %d, S4: %d\n", avgS1, avgS2, avgS3, avgS4);
  Serial.printf("Vision: %s (%d/4 dry quadrants)\n", visionIsDry ? "DRY" : "WET", currentDryCount);
  Serial.printf("Moisture Sensor: %s (Val: %d)\n", sensorIsDry ? "DRY" : "WET", currentSensorVal);
  Serial.printf("Pump Output: %s\n", pumpIsOn ? "ON" : "OFF");
  Serial.println("=======================");
}

// ===========================================
// Lifecycle methods
// ===========================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n--- Starting AWD Smart Irrigation ---");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump OFF initially
  pinMode(MOISTURE_PIN, INPUT);

  // Initialize ESP32-CAM (AI-Thinker model)
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM; config.pin_d1 = Y3_GPIO_NUM; config.pin_d2 = Y4_GPIO_NUM; config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM; config.pin_d5 = Y7_GPIO_NUM; config.pin_d6 = Y8_GPIO_NUM; config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM; config.pin_pclk = PCLK_GPIO_NUM; config.pin_vsync = VSYNC_GPIO_NUM; config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM; config.pin_sccb_scl = SIOC_GPIO_NUM; config.pin_pwdn = PWDN_GPIO_NUM; config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_QQVGA; // 160x120 resolution
  config.pixel_format = PIXFORMAT_GRAYSCALE; // Direct access to brightness, very fast
  config.jpeg_quality = 12; // Unused for grayscale, but driver requires a value
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("FAIL: Camera init failed! Check connections or power supply.");
    return;
  }
  Serial.println("Camera initialized at 160x120 Grayscale.");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nSUCCESS: WiFi Connected!");
    Serial.print(">>> Access Dashboard at: http://");
    Serial.println(WiFi.localIP());
    startCameraServer();
  } else {
    Serial.println("\nWARNING: WiFi connection failed. Proceeding automatically without web dashboard.");
  }

  // Force first analysis immediately
  performAnalysis();
}

void loop() {
  // WiFi Watchdog
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection lost! Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
       Serial.println("\nSUCCESS: WiFi Reconnected!");
    } else {
       Serial.println("\nFAIL: Reconnect attempt timed out.");
    }
  }

  if (isAutoMode) {
    if (millis() - lastCheckTime >= CHECK_INTERVAL) {
      lastCheckTime = millis();
      performAnalysis();
    }
  }
  // Delay slightly to yield execution to HTTP Server/WiFi Tasks
  delay(10);
}
