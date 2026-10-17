import { Client } from "@notionhq/client";
import { notionSchema } from "../src/server/repositories/notion/schema";

const teams = [
  "Growth",
  "Operations",
  "Communications",
  "Technical",
  "Logistics",
];

type Step = { action: string; target: string; detail: string };

function plan(): Step[] {
  const steps: Step[] = [
    {
      action: "create-database",
      target: "Voluntarios",
      detail:
        "Nombre, Usuario, ID usuario, Email, Rol, Estado, equipos, teléfono, foto, consentimiento",
    },
    { action: "create-database", target: "Equipos", detail: teams.join(", ") },
    {
      action: "create-database",
      target: "Recursos",
      detail: "Título, URL, Tipo, Equipo, Evento, Etiquetas, Visibilidad",
    },
    {
      action: "add-properties",
      target: "Tasks",
      detail: Object.values(notionSchema.tasks.properties).join(", "),
    },
    {
      action: "add-properties",
      target: "Activities",
      detail: Object.values(notionSchema.activities.properties).join(", "),
    },
  ];
  return steps;
}

const apply = process.argv.includes("--apply");
const confirm = process.env.CONFIRM === "yes";

console.log("ZEEK Hub notion-setup");
console.log(apply ? "Modo: apply" : "Modo: dry-run (por defecto)");
for (const step of plan()) {
  console.log(`- ${step.action} ${step.target}: ${step.detail}`);
}

if (!apply) {
  console.log(
    "Nada se escribió. Para ejecutar: CONFIRM=yes pnpm notion:setup -- --apply",
  );
  process.exit(0);
}

if (!confirm) {
  console.error("Falta CONFIRM=yes. No se aplicó ningún cambio.");
  process.exit(1);
}

const token = process.env.NOTION_ZEEK_TOKEN;
const parent = process.env.NOTION_PARENT_PAGE_ID;
if (!token || !parent) {
  console.error("Faltan NOTION_ZEEK_TOKEN o NOTION_PARENT_PAGE_ID.");
  process.exit(1);
}

const client = new Client({ auth: token, notionVersion: "2025-09-03" });
await client.databases.create({
  parent: { type: "page_id", page_id: parent },
  title: [{ type: "text", text: { content: "Voluntarios" } }],
});
await client.databases.create({
  parent: { type: "page_id", page_id: parent },
  title: [{ type: "text", text: { content: "Equipos" } }],
});
await client.databases.create({
  parent: { type: "page_id", page_id: parent },
  title: [{ type: "text", text: { content: "Recursos" } }],
});
console.log(
  "Bases creadas. Las relaciones y las propiedades de Tasks/Activities se completan en una segunda pasada con los ids devueltos.",
);
