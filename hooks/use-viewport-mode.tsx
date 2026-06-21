import * as React from "react";

export type ViewportMode = "office" | "mobile";

const MOBILE_BREAKPOINT = 768;

const ViewportContext = React.createContext<ViewportMode>("office");

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ViewportMode>("office");

  React.useEffect(() => {
    const update = () => {
      setMode(
        window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "office",
      );
    };
    update();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", update);
    window.addEventListener("orientationchange", update);
    return () => {
      mql.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    <ViewportContext.Provider value={mode}>{children}</ViewportContext.Provider>
  );
}

export function useViewportMode() {
  return React.useContext(ViewportContext);
}

export function useIsOfficeMode() {
  return useViewportMode() === "office";
}
