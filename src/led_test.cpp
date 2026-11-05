
#include <Arduino.h>

const int LED_PIN = D5;

void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("StudyPulse LED test started!");
}

void loop() {
  // Turn LED on
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(1000);

  // Turn LED off
  /*digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(1000);*/
}
