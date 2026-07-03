// portfolio/src/lib/surveyGrid.ts
//
// Toggles a cartographic "survey grid" graticule over the whole page by adding
// `.survey-grid` to <html>. All visuals live in index.css. Esc clears it
// (handled by the global key listener in CommandPalette). Returns the new
// on/off state so the caller can toast the right message.

export function toggleSurveyGrid(): boolean {
  return document.documentElement.classList.toggle('survey-grid')
}

export function isSurveyGridOn(): boolean {
  return document.documentElement.classList.contains('survey-grid')
}
