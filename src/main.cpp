
#include <Arduino.h>
#include <NimBLEDevice.h>
#include <atomic>
#include <string>

// StudyPulse Bluetooth UUIDs
#define SERVICE_UUID \
  "12345678-1234-1234-1234-123456789000"

#define CHARACTERISTIC_UUID \
  "12345678-1234-1234-1234-123456789001"

// XIAO ESP32C3: D3 = GPIO5
// Controls the S8050 transistor
const int MOTOR_PIN = 5;

// Vibrate for 400 milliseconds
const unsigned long VIBRATION_DURATION = 400;

std::atomic<bool> vibrationRequested(false);

bool motorOn = false;
unsigned long motorStartTime = 0;

// Handle commands received from StudyPulse
class CommandCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(
    NimBLECharacteristic* characteristic,
    NimBLEConnInfo& connInfo
  ) override {

    std::string command = characteristic->getValue();

    if (command == "VIBRATE") {
      vibrationRequested.store(true);
      Serial.println("VIBRATE command received!");
    }
    else if (command == "START") {
      Serial.println("Study session started!");
    }
    else if (command == "PAUSE") {
      Serial.println("Study session paused.");
    }
    else if (command == "STOP") {
      Serial.println("Study session stopped.");
    }
    else {
      Serial.print("Unknown command: ");
      Serial.println(command.c_str());
    }
  }
};

void setup() {
  // Keep motor OFF when booting
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  Serial.begin(115200);
  delay(1000);

  Serial.println("Starting StudyPulse XIAO ESP32C3");

  // Start Bluetooth
  NimBLEDevice::init("StudyBand");

  NimBLEServer* server =
    NimBLEDevice::createServer();

  NimBLEService* service =
    server->createService(SERVICE_UUID);

  NimBLECharacteristic* characteristic =
    service->createCharacteristic(
      CHARACTERISTIC_UUID,
      NIMBLE_PROPERTY::READ |
      NIMBLE_PROPERTY::WRITE
    );

  characteristic->setValue("Ready");
  characteristic->setCallbacks(new CommandCallbacks());

  service->start();

  NimBLEAdvertising* advertising =
    NimBLEDevice::getAdvertising();

  advertising->setName("StudyBand");
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();

  Serial.println("StudyBand is advertising!");
  Serial.println("Waiting for BLE commands...");
}

void loop() {
  unsigned long now = millis();

  // Activate motor when VIBRATE is received
  if (vibrationRequested.exchange(false)) {
    digitalWrite(MOTOR_PIN, HIGH);
    motorOn = true;
    motorStartTime = now;

    Serial.println("Motor ON");
  }

  // Automatically stop motor after 400 ms
  if (
    motorOn &&
    now - motorStartTime >= VIBRATION_DURATION
  ) {
    digitalWrite(MOTOR_PIN, LOW);
    motorOn = false;

    Serial.println("Motor OFF");
  }

  delay(5);
}
