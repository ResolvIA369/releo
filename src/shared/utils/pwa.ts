// La app ya esta corriendo instalada (PWA)? Cubre el display-mode
// standalone estandar y el navigator.standalone propietario de iOS
// Safari, que no implementa matchMedia para display-mode en versiones
// viejas. En ese caso no tiene sentido ofrecer "instalar la app".
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}
