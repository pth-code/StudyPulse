#include <Arduino.h>
#include <NimBLEDevice.h>

#define SERVICE_UUID \
    "12345678-1234-1234-1234-123456789000"

#define CHARACTERISTIC_UUID \
    "12345678-1234-1234-1234-123456789001"

NimBLECharacteristic* commandCharacteristic;

// put function declarations here:
int myFunction(int, int);

void setup() {
  // put your setup code here, to run once:
  //int result = myFunction(2, 3);
  // Serial.begin(115200);
  // delay(1000);
  // Serial.println("ESP32 connected!");

  Serial.begin(115200);
  delay(1000);

  NimBLEDevice::init("StudyBand");

  NimBLEServer* server = NimBLEDevice::createServer();

  NimBLEService* service =
      server->createService(SERVICE_UUID);

  commandCharacteristic = service->createCharacteristic(
      CHARACTERISTIC_UUID,
      NIMBLE_PROPERTY::READ |
      NIMBLE_PROPERTY::WRITE
  );

  commandCharacteristic->setValue("Ready");

  service->start();

  NimBLEAdvertising* advertising =
    NimBLEDevice::getAdvertising();

  advertising->setName("StudyBand");
  advertising->start();

  Serial.println("StudyBand is advertising!");
  Serial.println("Waiting for Bluetooth commands...");

}

void loop() {
  // put your main code here, to run repeatedly:
  // delay(1000);
  // Serial.println("Working!");

  static std::string lastCommand = "Ready";

  std::string command = commandCharacteristic->getValue();

  if (command != lastCommand) {
      lastCommand = command;

      if (command == "START") {
            Serial.println("Study session started!");
        }
        else if (command == "PAUSE") {
            Serial.println("Study session paused.");
        }
        else if (command == "STOP") {
            Serial.println("Study session stopped.");
        }
        else if (command == "VIBRATE") {
            Serial.println("Vibration test requested.");
        }
        else if (command != "Ready") {
            Serial.print("Unknown command: ");
            Serial.println(command.c_str());
        }
    }
  delay(100);
}

// put function definitions here:
int myFunction(int x, int y) {
  return x + y;
}

//hello
//zita
//hello Sanjana
