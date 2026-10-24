#include <Arduino.h>

// put function declarations here:
int myFunction(int, int);

void setup() {
  // put your setup code here, to run once:
  //int result = myFunction(2, 3);
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 connected!");
}

void loop() {
  // put your main code here, to run repeatedly:
  delay(1000);
  Serial.println("Working!");
}

// put function definitions here:
int myFunction(int x, int y) {
  return x + y;
}

//hello
//zita
//hello Sanjana
