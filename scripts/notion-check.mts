import { Client } from "@notionhq/client";
import { getEnv } from "../src/env";
import { notionSchema } from "../src/server/repositories/notion/schema";

const env = getEnv();
if (env.NOTION_MODE !== "live") {
  console.log("NOTION_MODE=mock: no se consulta Notion.");
  console.log(Object.keys(notionSchema).join(", "));
  process.exit(0);
}
if (!env.NOTION_ZEEK_TOKEN) {
  console.error("Falta NOTION_ZEEK_TOKEN.");
  process.exit(1);
}

const client = new Client({
  auth: env.NOTION_ZEEK_TOKEN,
  notionVersion: "2025-09-03",
});

const wanted = new Map(
  Object.values(notionSchema).map((entry) => [
    entry.dataSourceEnv,
    process.env[entry.dataSourceEnv] ?? "",
  ]),
);

console.log("Data sources que la integración puede ver (solo lectura):\n");
let cursor: string | undefined;
do {
  const page = await client.search({
    filter: { property: "object", value: "data_source" },
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  for (const item of page.results) {
    const source = item as unknown as {
      id: string;
      title?: { plain_text?: string }[];
    };
    const title = source.title?.map((part) => part.plain_text).join("") ?? "";
    const used = [...wanted.entries()].find(([, id]) => id === source.id);
    console.log(
      `- ${title || "(sin título)"}: ${source.id}${used ? `  ← ${used[0]}` : ""}`,
    );
  }
  cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
} while (cursor);

console.log("\nVariables esperadas:");
for (const [name, id] of wanted) {
  console.log(`- ${name}: ${id ? "definida" : "FALTA"}`);
}
