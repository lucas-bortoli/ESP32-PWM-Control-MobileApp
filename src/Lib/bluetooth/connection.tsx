import { BleClient, ScanResult } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import { ImperativeObject, notifyUpdate } from "../imperative_object";
import generateUUID from "../uuid";

const SERVICE_UUID = "686ae9e3-0b45-485c-90bb-9442f3571af7";
const CONTROL_CHARACTERISTIC_UUID = "e750171f-7796-4d77-bdfb-5b16dff6dc59";
const STATUS_CHARACTERISTIC_UUID = "13e827f5-ecde-4927-b5f4-fd3f27ac89ee";

enum ControlAction {
  Increase = 0,
  Decrease = 1,
  SetPWM = 2,
  Stop = 3,
}

export default class BluetoothOps implements ImperativeObject {
  public uuid: string = generateUUID();
  public state: "NotConnected" | "Connecting" | "Connected" = "NotConnected";

  public pwm: number = 0;

  private deviceId: string | null = null;
  private onStatusUpdateCallback: ((value: number) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  public async setupConnection(): Promise<void> {
    try {
      // first, check for Android location permission
      if (Capacitor.getPlatform() === "android") {
        const isLocationEnabled = await BleClient.isLocationEnabled();
        if (!isLocationEnabled) {
          await BleClient.openLocationSettings();
        }
      }

      this.state = "Connecting";
      notifyUpdate(this);

      await BleClient.initialize({ androidNeverForLocation: true });

      // platform-specific device selection
      if (Capacitor.getPlatform() === "web") {
        // on web: use requestDevice with dialog. the browser will show a popup
        const device = await BleClient.requestDevice({
          services: [SERVICE_UUID],
        });

        if (!device) {
          this.state = "NotConnected";
          notifyUpdate(this);
          throw new Error("Device selection canceled.");
        }

        this.deviceId = device.deviceId;
      } else {
        // on Android: use requestLEScan and connect to first matching device (this prevents showing the library's native scan UI)
        const scanResult = await this.scanForDevice();
        if (!scanResult) {
          throw new Error("No device found during scan.");
        }

        this.deviceId = scanResult.device.deviceId;
      }

      this.state = "Connecting";
      notifyUpdate(this);

      // connect to the device
      await BleClient.connect(this.deviceId!, (deviceId) => this.handleDisconnect(deviceId));

      // then discover services and characteristics
      await this.discoverServices();
      await this.subscribeToStatusCharacteristic();

      this.state = "Connected";
      console.log("Connection established.");
      notifyUpdate(this);
    } catch (error) {
      console.error("Connection failed:", error);
      this.state = "NotConnected";
      this.onErrorCallback?.(error as Error);
      notifyUpdate(this);
    }
  }

  private async scanForDevice(timeout: number = 15000): Promise<{ device: any } | null> {
    return new Promise((resolve) => {
      const scanCallback = (result: ScanResult) => {
        console.log(result);
        if (result.uuids?.includes(SERVICE_UUID)) {
          BleClient.stopLEScan();
          resolve({ device: result.device });
        }
      };

      BleClient.requestLEScan({ services: [SERVICE_UUID] }, scanCallback);

      // Stop scanning after timeout
      setTimeout(() => {
        BleClient.stopLEScan();
        resolve(null);
      }, timeout);
    });
  }

  public async increasePWM(delta: number): Promise<void> {
    if (this.state !== "Connected") {
      throw new Error("Cannot increase PWM: not connected.");
    }
    if (delta <= 0) {
      throw new Error("Delta must be greater than 0.");
    }

    const value = new Uint8Array([ControlAction.Increase, delta]);
    try {
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        new DataView(value.buffer),
        { timeout: 5000 }
      );
      console.log(`Increased PWM by ${delta}`);
    } catch (error) {
      console.error("Failed to increase PWM:", error);
      this.onErrorCallback?.(error as Error);
    }
  }

  public async decreasePWM(delta: number): Promise<void> {
    if (this.state !== "Connected") {
      throw new Error("Cannot decrease PWM: not connected.");
    }
    if (delta <= 0) {
      throw new Error("Delta must be greater than 0.");
    }

    const value = new Uint8Array([ControlAction.Decrease, delta]);
    try {
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        new DataView(value.buffer),
        { timeout: 5000 }
      );
      console.log(`Decreased PWM by ${delta}`);
    } catch (error) {
      console.error("Failed to decrease PWM:", error);
      this.onErrorCallback?.(error as Error);
    }
  }

  public async setPWM(value: number): Promise<void> {
    if (this.state !== "Connected") {
      throw new Error("Cannot set PWM: not connected.");
    }
    if (value < 0 || value > 255) {
      throw new Error("PWM value must be between 0 and 255.");
    }

    const valueArray = new Uint8Array([ControlAction.SetPWM, value]);
    try {
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        new DataView(valueArray.buffer),
        { timeout: 5000 }
      );
      console.log(`Set PWM to ${value}`);
    } catch (error) {
      console.error("Failed to set PWM:", error);
      this.onErrorCallback?.(error as Error);
    }
  }

  public async stopMotor(): Promise<void> {
    if (this.state !== "Connected") {
      throw new Error("Cannot stop motor: not connected.");
    }

    const value = new Uint8Array([ControlAction.Stop, 0]);
    try {
      await BleClient.write(
        this.deviceId!,
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        new DataView(value.buffer),
        { timeout: 5000 }
      );
      console.log("Motor stop initiated.");
    } catch (error) {
      console.error("Failed to stop motor:", error);
      this.onErrorCallback?.(error as Error);
    }
  }

  public async getCurrentPWM(): Promise<number> {
    if (this.state !== "Connected") {
      throw new Error("Cannot get PWM: not connected.");
    }

    try {
      const result = await BleClient.read(
        this.deviceId!,
        SERVICE_UUID,
        STATUS_CHARACTERISTIC_UUID,
        { timeout: 5000 }
      );
      return result.getUint8(0);
    } catch (error) {
      console.error("Failed to read current PWM:", error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  public onStatusUpdate(callback: (value: number) => void): void {
    this.onStatusUpdateCallback = callback;
  }

  public onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  public isConnected(): boolean {
    return this.state === "Connected";
  }

  private async discoverServices(): Promise<void> {
    try {
      const services = await BleClient.getServices(this.deviceId!);
      console.info({ services });
      const serviceFound = services.some((service) => service.uuid === SERVICE_UUID);
      if (!serviceFound) {
        throw new Error("Required service not found.");
      }
    } catch (error) {
      console.error("Failed to discover services:", error);
      this.state = "NotConnected";
      this.onErrorCallback?.(error as Error);
    }
  }

  private async subscribeToStatusCharacteristic(): Promise<void> {
    try {
      await BleClient.startNotifications(
        this.deviceId!,
        SERVICE_UUID,
        STATUS_CHARACTERISTIC_UUID,
        (value) => {
          const status = value.getUint8(0);
          console.log("Status update received:", status);
          this.pwm = status;
          notifyUpdate(this);
          this.onStatusUpdateCallback?.(status);
        }
      );
    } catch (error) {
      console.error("Failed to subscribe to status characteristic:", error);
      this.onErrorCallback?.(error as Error);
    }
  }

  private handleDisconnect(deviceId: string): void {
    console.log(`Device ${deviceId} disconnected`);
    this.state = "NotConnected";
    this.onErrorCallback?.(new Error(`Device ${deviceId} disconnected`));
  }

  public async disconnect() {
    if (this.state === "Connected" && this.deviceId) {
      try {
        await BleClient.disconnect(this.deviceId);
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }
    this.state = "NotConnected";
    notifyUpdate(this);
  }
}

//@ts-expect-error
window.BluetoothOps = BluetoothOps;

//@ts-expect-error
window.BleClient = BleClient;
