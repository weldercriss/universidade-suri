import { Joyride, STATUS, EVENTS, ACTIONS, type EventData } from "react-joyride";
import { useTour } from "@/lib/tour";
import { useTheme } from "@/lib/theme";

export function GuidedTour() {
  const { tourActive, activeSteps, stopTour } = useTour();
  const { theme } = useTheme();
  const isDark = theme !== "snow-blue";

  function handleEvent(data: EventData) {
    const isEnd = data.type === EVENTS.TOUR_END || data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    const isClosed = data.action === ACTIONS.CLOSE;
    if (isEnd || isClosed) {
      stopTour();
    }
  }

  return (
    <Joyride
      steps={activeSteps}
      run={tourActive}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        nextWithProgress: "Próximo ({current} de {total})",
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
      styles={{
        tooltip: {
          borderRadius: 20,
        },
        buttonPrimary: {
          borderRadius: 12,
        },
        buttonBack: {
          borderRadius: 12,
        },
        buttonSkip: {
          borderRadius: 12,
        },
      }}
    />
  );
}
