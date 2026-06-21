export type CellSaveStatus = "idle" | "saving" | "saved" | "error";

export function focusSpreadsheetCell(row: number, col: number) {
  const el = document.querySelector<HTMLElement>(
    `[data-grid-row="${row}"][data-grid-col="${col}"]`,
  );
  el?.focus();
  if (el instanceof HTMLInputElement) {
    el.select();
  }
}

export function handleSpreadsheetKeyDown(
  e: React.KeyboardEvent,
  row: number,
  col: number,
  maxRow: number,
  maxCol: number,
) {
  switch (e.key) {
    case "Enter":
    case "ArrowDown":
      e.preventDefault();
      if (row < maxRow) focusSpreadsheetCell(row + 1, col);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (row > 0) focusSpreadsheetCell(row - 1, col);
      break;
    case "Tab":
    case "ArrowRight":
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        if (col > 0) focusSpreadsheetCell(row, col - 1);
      } else {
        e.preventDefault();
        if (col < maxCol) focusSpreadsheetCell(row, col + 1);
      }
      break;
    case "ArrowLeft":
      e.preventDefault();
      if (col > 0) focusSpreadsheetCell(row, col - 1);
      break;
    default:
      break;
  }
}
