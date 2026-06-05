import { Joyride, STATUS, EVENTS, type EventData } from "react-joyride";
import { useTour } from "@/lib/tour";
import { tourSteps } from "@/lib/tour-steps";
import { useTheme } from "@/lib/theme";

export function GuidedTour() {
  const { tourActive, stopTour } = useTour();
  const { theme } = useTheme();
  const isDark = theme !== "snow-blue";

  function handleEvent(data: EventData) {
    if (data.type === EVENTS.TOUR_END || data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      stopTour();
    }
  }

  return (
    <Joyride
      steps={tourSteps}
      run={tourActive}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular tour",
        open: "Abrir",
      }}
      options={{
        primaryColor: "hsl(237, 90%, 65%)",
        backgroundColor: isDark ? "hsl(222, 22%, 12%)" : "hsl(218, 42%, 97%)",
        textColor: isDark ? "hsl(210, 40%, 90%)" : "hsl(222, 22%, 15%)",
        arrowColor: isDark ? "hsl(222, 22%, 12%)" : "hsl(218, 42%, 97%)",
        overlayColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 9999,
        showProgress: true,
        skipBeacon: true,
        buttons: ["back", "close", "primary", "skip"],
      }}
    />
  );
}
