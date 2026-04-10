export type CsvParseResult = {
  headers: string[];
  rows: Array<Record<string, string>>;
  rowNumbers: number[];
};

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const nonEmpty = lines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter((entry) => entry.line.trim().length > 0);

  if (nonEmpty.length === 0) {
    return { headers: [], rows: [], rowNumbers: [] };
  }

  const headers = splitCsvLine(nonEmpty[0].line).map((header) => header.trim());
  const rows: Array<Record<string, string>> = [];
  const rowNumbers: number[] = [];

  for (let i = 1; i < nonEmpty.length; i += 1) {
    const { line, lineNumber } = nonEmpty[i];
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};

    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = values[headerIndex]?.trim() ?? "";
    }

    rows.push(row);
    rowNumbers.push(lineNumber);
  }

  return { headers, rows, rowNumbers };
}
