/**
 * Feed readers. A supplier endpoint may hand back a JSON array, a JSON object
 * wrapping an array, or CSV with a header row — all three land here as
 * `Record<string, unknown>[]` before `normalizeProduct` maps them.
 */

type Raw = Record<string, unknown>;

const ARRAY_KEYS = ["products", "items", "data", "results", "records", "rows"];

export function extractRecords(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload as Raw[];

  if (payload && typeof payload === "object") {
    const record = payload as Raw;
    for (const key of ARRAY_KEYS) {
      if (Array.isArray(record[key])) return record[key] as Raw[];
    }
  }

  return [];
}

/** Minimal RFC-4180 CSV reader: quoted fields, escaped quotes, embedded newlines. */
export function parseCsv(text: string): Raw[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Swallow the \n of a \r\n pair.
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
  if (!header) return [];

  const keys = header.map((cell) => cell.trim());
  return body.map((cells) => {
    const record: Raw = {};
    keys.forEach((key, index) => {
      record[key] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

export function isCsv(url: string, contentType: string | null) {
  if (contentType?.includes("csv")) return true;
  return /\.csv(\?|$)/i.test(url);
}
