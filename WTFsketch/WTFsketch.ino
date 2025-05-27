#include <Wire.h>
#include <MPU6050.h>

#define TDS_PIN 34
#define IR_SENSOR_PIN 19  // IR speed sensor output to GPIO19

#define HOLES_PER_REV 20   // Set this to actual number of reflective slots or holes on the wheel

MPU6050 mpu;

volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseTime = 0;
unsigned long lastRPMCalcTime = 0;
float rpm = 0;

void IRAM_ATTR count() {
  unsigned long now = micros();
  if (now - lastPulseTime > 1000) {  // Debounce ~1ms
    pulseCount++;
    lastPulseTime = now;
  }
}

void setup() {
  Serial.begin(115200);
 
  // --- TDS Probe ---
  pinMode(TDS_PIN, INPUT);

  // --- IR Sensor ---
  pinMode(IR_SENSOR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), count, FALLING);

  // --- MPU6050 Setup ---
  Wire.begin();
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed!");
  } else {
    Serial.println("MPU6050 ready.");
  }

  delay(1000);  // Startup delay
}

void loop() {
  // --- TDS Sensor Reading ---
  int tdsValue = analogRead(TDS_PIN);
  Serial.print("TDS Raw Value: ");
  Serial.println(tdsValue);

  // --- MPU6050 Reading ---
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  Serial.print("Accel (X,Y,Z): ");
  Serial.print(ax); Serial.print(", ");
  Serial.print(ay); Serial.print(", ");
  Serial.println(az);

  Serial.print("Gyro (X,Y,Z): ");
  Serial.print(gx); Serial.print(", ");
  Serial.print(gy); Serial.print(", ");
  Serial.println(gz);

  // --- RPM Calculation ---
  unsigned long now = millis();
  if (now - lastRPMCalcTime >= 1000) {
    float revolutions = pulseCount / (float)HOLES_PER_REV;
    rpm = revolutions * 60.0;  // Revolutions per minute
    Serial.print("RPM: ");
    Serial.println(rpm);
    Serial.println();
    pulseCount = 0;
    lastRPMCalcTime = now;
  }

  delay(1000); // Smaller delay for more responsiveness
}
