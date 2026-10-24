
const DEVICE_NAME = 'StudyBand';

const SERVICE_UUID =
  '12345678-1234-1234-1234-123456789000';

const CHARACTERISTIC_UUID =
  '12345678-1234-1234-1234-123456789001';

// Using any for experimental Web Bluetooth types.
// This keeps our Expo TypeScript setup simple.
let device: any = null;
let characteristic: any = null;

export async function connectWebBluetooth(): Promise<string> {
  const bluetooth = (navigator as any).bluetooth;

  if (!bluetooth) {
    throw new Error(
      'Web Bluetooth is unavailable. Use Chrome on your Mac.'
    );
  }

  device = await bluetooth.requestDevice({
    filters: [{ name: DEVICE_NAME }],
    optionalServices: [SERVICE_UUID],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);

  characteristic =
    await service.getCharacteristic(CHARACTERISTIC_UUID);

  return device.name || DEVICE_NAME;
}

export function isWebBluetoothConnected(): boolean {
  return Boolean(device?.gatt?.connected && characteristic);
}

export async function sendWebCommand(command: string) {
  if (!isWebBluetoothConnected()) {
    throw new Error('Connect to StudyBand first.');
  }

  const data = new TextEncoder().encode(command);

  await characteristic.writeValueWithResponse(data);
}

export function disconnectWebBluetooth() {
  if (device?.gatt?.connected) {
    device.gatt.disconnect();
  }

  characteristic = null;
  device = null;
}
