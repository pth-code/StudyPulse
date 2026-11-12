
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

// Reminder types
enum Reminder : int {
  NONE = 0,
  BREAK_START = 1,
  BREAK_END = 2,
  SESSION_DONE = 3,
  GENERIC = 4
};

std::atomic<int> pendingReminder(NONE);

// Durations alternate between ON and OFF.
// All values are in milliseconds.

// Break starts: two medium pulses
const uint16_t breakStartPattern[] = {
  250, 170, 250
};

// Break ends: three short pulses
const uint16_t breakEndPattern[] = {
  140, 140, 140, 140, 140
};

// Scheduled session completes: one long pulse
const uint16_t donePattern[] = {
  650
};

// Compatibility with old VIBRATE command
const uint16_t genericPattern[] = {
  400
};

const uint16_t* currentPattern = nullptr;
size_t currentLength = 0;
size_t segment = 0;

unsigned long segmentStarted = 0;
bool patternPlaying = false;

// Begin the selected vibration pattern.
void beginPattern(int reminder) {
  switch (reminder) {
    case BREAK_START:
      currentPattern = breakStartPattern;
      currentLength =
        sizeof(breakStartPattern) /
        sizeof(breakStartPattern[0]);

      Serial.println(
        "BREAK_START: double vibration"
      );
      break;

    case BREAK_END:
      currentPattern = breakEndPattern;
      currentLength =
        sizeof(breakEndPattern) /
        sizeof(breakEndPattern[0]);

      Serial.println(
        "BREAK_END: triple vibration"
      );
      break;

    case SESSION_DONE:
      currentPattern = donePattern;
      currentLength =
        sizeof(donePattern) /
        sizeof(donePattern[0]);

      Serial.println(
        "SESSION_DONE: long vibration"
      );
      break;

    default:
      currentPattern = genericPattern;
      currentLength =
        sizeof(genericPattern) /
        sizeof(genericPattern[0]);

      Serial.println(
        "VIBRATE: single vibration"
      );
      break;
  }

  segment = 0;
  segmentStarted = millis();
  patternPlaying = true;

  digitalWrite(MOTOR_PIN, HIGH);
}

// Handle Bluetooth commands.
class CommandCallbacks
  : public NimBLECharacteristicCallbacks {

  void onWrite(
    NimBLECharacteristic* characteristic,
    NimBLEConnInfo& connInfo
  ) override {

    const std::string command =
      characteristic->getValue();

    if (command == "BREAK_START") {
      pendingReminder.store(BREAK_START);
    }
    else if (command == "BREAK_END") {
      pendingReminder.store(BREAK_END);
    }
    else if (command == "SESSION_DONE") {
      pendingReminder.store(SESSION_DONE);
    }
    else if (command == "VIBRATE") {
      pendingReminder.store(GENERIC);
    }
    else if (command == "START") {
      Serial.println("Study session started");
    }
    else if (command == "PAUSE") {
      Serial.println("Study session paused");
    }
    else if (command == "STOP") {
      Serial.println("Timer stopped");
    }
    else {
      Serial.print("Unknown command: ");
      Serial.println(command.c_str());
    }
  }
};

void setup() {
  // Motor off initially
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  Serial.begin(115200);
  delay(500);

  // Initialize Bluetooth
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

  characteristic->setCallbacks(
    new CommandCallbacks()
  );

  service->start();

  NimBLEAdvertising* advertising =
    NimBLEDevice::getAdvertising();

  advertising->setName("StudyBand");
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();

  Serial.println(
    "StudyBand advertising: ready for reminders"
  );
}

void loop() {
  // Check for a new Bluetooth reminder.
  const int newReminder =
    pendingReminder.exchange(NONE);

  if (newReminder != NONE) {
    beginPattern(newReminder);
  }

  // Run the pattern without blocking Bluetooth.
  if (
    patternPlaying &&
    millis() - segmentStarted >=
      currentPattern[segment]
  ) {
    segment++;

    if (segment >= currentLength) {
      patternPlaying = false;
      digitalWrite(MOTOR_PIN, LOW);

      Serial.println("Pattern finished");
    } else {
      segmentStarted = millis();

      digitalWrite(
        MOTOR_PIN,
        segment % 2 == 0 ? HIGH : LOW
      );
    }
  }

  delay(5);
}
