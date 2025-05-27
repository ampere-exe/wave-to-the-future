#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <MPU6050.h>

#define TDS_PIN 34
#define IR_SENSOR_PIN 19
#define HOLES_PER_REV 20

MPU6050 mpu;

volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseTime = 0;
unsigned long lastRPMCalcTime = 0;
float rpm = 0;

WebServer server(80);

void IRAM_ATTR count() {
  unsigned long now = micros();
  if (now - lastPulseTime > 1000) {
    pulseCount++;
    lastPulseTime = now;
  }
}

const char* ssid = "WIFI-C2A0";
const char* password = "fancy8459bright";

void setup() {
  Serial.begin(115200);

  pinMode(TDS_PIN, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), count, FALLING);

  Wire.begin();
  mpu.initialize();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/api/data", HTTP_GET, []() {
    // Read TDS
    int tdsValue = analogRead(TDS_PIN);

    // Read MPU6050
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    // Calculate RPM every second
    unsigned long now = millis();
    if (now - lastRPMCalcTime >= 1000) {
      float revolutions = pulseCount / (float)HOLES_PER_REV;
      rpm = revolutions * 60.0;
      pulseCount = 0;
      lastRPMCalcTime = now;
    }

    // Create JSON response
    String json = "{";
    json += "\"tds\":" + String(tdsValue) + ",";
    json += "\"accel\":{\"x\":" + String(ax) + ",\"y\":" + String(ay) + ",\"z\":" + String(az) + "},";
    json += "\"gyro\":{\"x\":" + String(gx) + ",\"y\":" + String(gy) + ",\"z\":" + String(gz) + "},";
    json += "\"rpm\":" + String(rpm);
    json += "}";

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", json);
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
