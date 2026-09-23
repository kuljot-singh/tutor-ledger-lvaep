// Presentation-only alias for older demo rows. Stored data and CSV stay unchanged.
export function displaySite(site: string) {
  return site === "Bloomfield Library" ? "Bloomfield Public Library" : site;
}
