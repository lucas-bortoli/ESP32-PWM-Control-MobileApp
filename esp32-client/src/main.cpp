#include <ArduinoBLE.h>
#include <string.h>
#include <vector>

const char *TAG = "Main";

const int motorPin = 18;
const int freq = 2000;
const int ledChannel = 0;
const int resolution = 8;

enum class ControlAction : uint8_t
{
  Increase = 0,
  Decrease = 1,
  SetPWM = 2,
  Stop = 3
};

const char *serviceUUID = "686ae9e3-0b45-485c-90bb-9442f3571af7";
const char *pwmUUID = "13e827f5-ecde-4927-b5f4-fd3f27ac89ee";
const char *controlUUID = "e750171f-7796-4d77-bdfb-5b16dff6dc59";

BLEService service(serviceUUID);
BLEUnsignedCharCharacteristic pwmCharacteristic(pwmUUID, BLERead | BLENotify);
BLEUnsignedShortCharacteristic controlCharacteristic(controlUUID, BLEWrite);

// callbacks de eventos bluetooth
void handleControlWrite(BLEDevice central, BLECharacteristic characteristic);
void handleConnected(BLEDevice central);
void handleDisconnected(BLEDevice central);

int currentPWM = 0;

bool isStopping = false;
const uint8_t stopStep = 2;

void setup()
{
  ESP_LOGI(TAG, "Initializing ESP32 BLE PWM controller...");

  Serial.begin(115200);
  pinMode(motorPin, OUTPUT);

  ledcSetup(ledChannel, freq, resolution);
  ledcAttachPin(motorPin, ledChannel);

  if (!BLE.begin())
  {
    ESP_LOGE(TAG, "Failed to initialize BLE");
    while (1)
      ;
  }

  service.addCharacteristic(pwmCharacteristic);
  service.addCharacteristic(controlCharacteristic);
  BLE.setAdvertisedService(service);
  BLE.addService(service);

  controlCharacteristic.setEventHandler(BLEWritten, handleControlWrite);

  BLE.setEventHandler(BLEConnected, handleConnected);
  BLE.setEventHandler(BLEDisconnected, handleDisconnected);

  BLE.setLocalName("Controle Esteira");
  BLE.advertise();
  ESP_LOGI(TAG, "BLE device is advertising");
}

void loop()
{
  BLE.poll();

  if (isStopping)
  {

    currentPWM = max(currentPWM - stopStep, 0);
    pwmCharacteristic.writeValue(currentPWM);

    if (currentPWM == 0)
    {
      isStopping = false;
    }
  }

  ledcWrite(ledChannel, currentPWM);

  static uint8_t acc = 0;
  if (acc % 20 == 0)
    pwmCharacteristic.writeValue(currentPWM);
  acc++;

  delay(20);
}

void handleControlWrite(BLEDevice central, BLECharacteristic characteristic)
{
  ESP_LOGI(TAG, "Control write received from %s", central.address().c_str());

  uint8_t actionByte = characteristic.value()[0];
  uint8_t paramByte = characteristic.value()[1];

  if (actionByte > static_cast<uint8_t>(ControlAction::Stop))
  {
    ESP_LOGE(TAG, "Invalid control action: %d (out of range)", actionByte);
    return;
  }

  ControlAction action = static_cast<ControlAction>(actionByte);

  switch (action)
  {
  case ControlAction::Increase:

    if (paramByte == 0)
    {
      ESP_LOGE(TAG, "Increase: delta must be non-zero");
      return;
    }
    currentPWM = min(currentPWM + paramByte, 255);
    break;

  case ControlAction::Decrease:

    if (paramByte == 0)
    {
      ESP_LOGE(TAG, "Decrease: delta must be non-zero");
      return;
    }
    currentPWM = max(currentPWM - paramByte, 0);
    break;

  case ControlAction::SetPWM:

    currentPWM = paramByte;
    break;

  case ControlAction::Stop:
    if (!isStopping)
    {
      isStopping = true;
      ESP_LOGI(TAG, "Initiating stop sequence...");
    }
    break;
  }

  ledcWrite(ledChannel, currentPWM);
  pwmCharacteristic.writeValue(currentPWM);
}

void handleConnected(BLEDevice central)
{
  ESP_LOGI(TAG, "Central connected: %s", central.address().c_str());
}

void handleDisconnected(BLEDevice central)
{
  ESP_LOGI(TAG, "Central disconnected: %s", central.address().c_str());
}