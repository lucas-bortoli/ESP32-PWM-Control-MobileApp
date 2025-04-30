import AppFooter from "../../Components/AppFooter";
import Button from "../../Components/Button";

export default function Control(_props: {}) {
  return (
    <main className="bg-grey-100 relative flex h-full w-full flex-col gap-4 font-serif">
      <nav className="border-grey-800 bg-grey-1 bg-grey-100 sticky top-0 z-10 mt-8 flex items-center gap-2 border-b p-4">
        <h1 className="text-xl">Controle de PWM</h1>
      </nav>
      <div className="flex shrink grow flex-col justify-center overflow-y-scroll text-center">
        <h1 className="text-6xl">70%</h1>
        <p className="mt-2">180</p>
        <section className="mt-8 flex justify-center gap-2 px-4">
          <Button className="p-24 font-serif text-2xl" onClick={() => {}}>
            -
          </Button>
          <Button className="p-24 font-serif text-2xl" onClick={() => {}}>
            +
          </Button>
        </section>
      </div>
      <AppFooter />
    </main>
  );
}
