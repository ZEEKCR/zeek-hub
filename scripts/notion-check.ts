import { getEnv } from "../src/env";
import { notionSchema } from "../src/server/repositories/notion/schema";

const env = getEnv();
if (env.NOTION_MODE !== "live") {
  console.log("NOTION_MODE=mock: no se consulta Notion.");
  console.log(Object.keys(notionSchema).join(", "));
  process.exit(0);
}

console.log(
  "Revisión de solo lectura pendiente de los ids de data source en el entorno.",
);
