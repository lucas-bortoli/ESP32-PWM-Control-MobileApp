import AppFooter from "../../Components/AppFooter";
import Button from "../../Components/Button";
import useBluetoothConnection from "../../Lib/bluetooth";
import { manifest, useWindowing } from "../../Lib/compass_navigator";
import { ConnectionWindow } from "../connection/_windows";
import { ControlWindow } from "../pwm_control/_windows";

export default function HomePage() {
  const windowing = useWindowing();
  const ble = useBluetoothConnection();

  function openPage(page: "Connection" | "Control") {
    switch (page) {
      case "Connection":
        windowing.createWindow(ConnectionWindow, {});
        break;
      case "Control":
        windowing.createWindow(ControlWindow, {});
        break;
    }
  }

  return (
    <main className="bg-grey-100 relative flex h-full w-full flex-col gap-4 overflow-y-scroll pb-8 font-serif">
      <nav className="border-grey-800 bg-grey-1 bg-grey-100 sticky top-0 z-10 mt-8 flex items-center gap-2 border-b p-4">
        <h1 className="text-xl">Home Page</h1>
      </nav>
      <section className="flex flex-col items-stretch gap-2 px-4">
        <Button
          className="h-36 justify-center p-24 text-2xl"
          onClick={openPage.bind(null, "Connection")}>
          Conexão
        </Button>
        <Button
          className="h-36 justify-center p-24 text-2xl"
          onClick={openPage.bind(null, "Control")}
          disabled={ble.state !== "Connected"}>
          Controle
        </Button>
      </section>
      <AppFooter />
    </main>
  );
}

export const HomePageWindow = manifest(HomePage, {
  initialTitle: () => "Home Page",
  hasAnimation: false,
});
