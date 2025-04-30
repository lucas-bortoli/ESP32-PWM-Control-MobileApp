import AppFooter from "../../Components/AppFooter";
import Button from "../../Components/Button";
import useBluetoothConnection from "../../Lib/bluetooth";
import useKeepAwake from "../../Lib/use_keep_awake";

export default function Control(_props: {}) {
  const bluetooth = useBluetoothConnection();

  useKeepAwake();

  return (
    <main className="bg-grey-100 relative flex h-full w-full flex-col gap-4 font-serif">
      <nav className="border-grey-800 bg-grey-1 bg-grey-100 sticky top-0 z-10 mt-8 flex items-center gap-2 border-b p-4">
        <h1 className="text-xl">Controle</h1>
      </nav>
      <div className="flex shrink grow flex-col justify-center overflow-y-scroll text-center">
        <h1 className="text-6xl">{((bluetooth.pwm / 255) * 100).toFixed(0)}%</h1>
        <p className="mt-2">{bluetooth.pwm}</p>
        <section className="mt-8 flex justify-center gap-2 px-4">
          <Button className="p-24 font-serif text-2xl" onClick={() => bluetooth.decreasePWM(5)}>
            —
          </Button>
          <Button className="p-24 font-serif text-2xl" onClick={() => bluetooth.increasePWM(5)}>
            +
          </Button>
        </section>
      </div>
      <AppFooter />
    </main>
  );
}
