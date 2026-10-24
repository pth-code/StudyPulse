
import { BleManager, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

export const DEVICE_NAME = 'Study band';

export const SERVICE_UUID =
  '12345678-1234-1234-1234-123456789000';

export const CHARACTERISTIC_UUID =
  '12345678-1234-1234-1234-123456789001';

const manager = new BleManager();

let connectedDevice: Device | null = null;

// Scan for our Arduino
export function scanForStudyPulse(
  onFound: (device: Device) => void,
  onError: (message: string) => void
) {
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      manager.stopDeviceScan();
      onError(error.message);
      return;
    }

    if (
      device &&
      (device.name === DEVICE_NAME ||
        device.localName === DEVICE_NAME)
    ) {
      manager.stopDeviceScan();
      onFound(device);
    }
  });
}

export function stopScanning() {
  manager.stopDeviceScan();
}

// Connect to the Arduino
export async function connectToStudyPulse(device: Device) {
  stopScanning();

  connectedDevice = await device.connect();
  connectedDevice =
    await connectedDevice.discoverAllServicesAndCharacteristics();

  return connectedDevice;
}

// Send a command such as START or PAUSE
export async function sendCommand(command: string) {
  if (!connectedDevice) {
    throw new Error('Bracelet is not connected');
  }

  const encoded = Buffer.from(command, 'utf8').toString('base64');

  await connectedDevice.writeCharacteristicWithResponseForService(
    SERVICE_UUID,
    CHARACTERISTIC_UUID,
    encoded
  );
}

// Disconnect
export async function disconnectStudyPulse() {
  if (connectedDevice) {
    await connectedDevice.cancelConnection();
    connectedDevice = null;
  }
}
