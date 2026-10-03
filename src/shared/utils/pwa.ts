// La app ya esta corriendo instalada (PWA)? Cubre el display-mode
// standalone estandar, el fullscreen del manifest (display: "fullscreen")
// y el navigator.standalone propietario de iOS Safari, que no implementa
// matchMedia para display-mode en versiones viejas. En ese caso no tiene
// sentido ofrecer "instalar la app" ni pedir pantalla completa.
//
// Ojo con fullscreen: en una pestaña comun, requestFullscreen() tambien hace
// matchear "(display-mode: fullscreen)". Por eso solo cuenta como instalada
// si no hay un elemento en pantalla completa puesto por la API.
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.bind(window);
  if (mm?.("(display-mode: standalone)").matches) return true;
  if (mm?.("(display-mode: fullscreen)").matches && !document.fullscreenElement) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

type LockableOrientation = ScreenOrientation & {
  lock?: (o: string) => Promise<void>;
  unlock?: () => void;
};

function orientation(): LockableOrientation | undefined {
  return (typeof screen !== "undefined" ? screen.orientation : undefined) as LockableOrientation | undefined;
}

export function canLockOrientation(): boolean {
  return typeof orientation()?.lock === "function";
}

// Acuesta la pantalla. Instalada (PWA) no hace falta pantalla completa: el
// lock anda directo y Chrome no muestra el aviso "Para salir de la pantalla
// completa...". En una pestaña comun Android exige pantalla completa antes
// del lock, y eso SOLO se pide desde un toque del usuario (el que llama a
// esta funcion con userGesture=true), nunca al girar ni al montar.
export async function lockLandscape({ userGesture }: { userGesture: boolean }): Promise<boolean> {
  const o = orientation();
  if (typeof o?.lock !== "function") return false;
  try {
    if (!isStandaloneDisplay()) {
      if (!userGesture) return false;
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    }
    await o.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

export function unlockOrientation(): void {
  try {
    orientation()?.unlock?.();
  } catch {
    // sin soporte
  }
}
