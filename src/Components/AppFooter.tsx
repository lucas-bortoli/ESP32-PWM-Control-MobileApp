export default function AppFooter() {
  return (
    <footer className="text-extra-sm px-4 pb-4 text-end">
      <h1>Controle de PWM</h1>
      <p>github.com/lucas-bortoli</p>
      <p>
        Versão {import.meta.env.VITE_GIT_COMMIT_HASH.slice(0, 8)} (
        {import.meta.env.VITE_GIT_BRANCH_NAME})
      </p>
    </footer>
  );
}
