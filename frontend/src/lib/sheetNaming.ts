import type { Client } from "../types/sheet";

export const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString("en-US", { month: "long" }),
);

export function suggestedSheetName(client: Client, date = new Date()): string {
  if (client.sheet_naming_pattern === "month") {
    return monthNames[(date.getMonth() + 11) % 12];
  }
  if (client.sheet_naming_pattern === "client_date") {
    const clientName = client.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return `${clientName}_${date.getMonth() + 1}_${date.getDate()}`;
  }
  return "";
}
