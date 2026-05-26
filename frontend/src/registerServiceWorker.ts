export function register() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registrado com sucesso: ", reg.scope);
        })
        .catch((err) => {
          console.log("Falha ao registrar o Service Worker: ", err);
        });
    });
  }
}
