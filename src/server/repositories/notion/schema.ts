import { getEnv } from "@/env";

/**
 * Notion property names and data source ids live here so a rename does not
 * spread through the app. Existing English properties stay as they are.
 * Full data source ids come from the environment; the known prefixes from the
 * plan are documented beside them.
 */
export const notionSchema = {
  volunteers: {
    dataSourceEnv: "NOTION_DS_VOLUNTEERS",
    properties: {
      name: "Nombre",
      username: "Usuario",
      userId: "ID usuario",
      email: "Email",
      role: "Rol",
      status: "Estado",
      primaryTeam: "Equipo principal",
      secondaryTeams: "Equipos secundarios",
      phone: "Teléfono",
      photo: "Foto",
      notionUser: "Usuario Notion",
      consent: "Consentimiento datos",
      consentDate: "Fecha consentimiento",
    },
    roleMap: {
      volunteer: "Voluntario",
      head: "Líder de equipo",
      admin: "Admin",
    },
    statusMap: {
      active: "Activo",
      onboarding: "Onboarding",
      inactive: "Inactivo",
    },
  },
  teams: {
    dataSourceEnv: "NOTION_DS_TEAMS",
    properties: {
      name: "Nombre",
      description: "Descripción",
      head: "Head",
      members: "Miembros",
      channel: "Canal",
      active: "Activo",
      legacyAreas: "Áreas legado",
    },
  },
  resources: {
    dataSourceEnv: "NOTION_DS_RESOURCES",
    properties: {
      title: "Título",
      url: "URL",
      type: "Tipo",
      team: "Equipo",
      event: "Evento",
      tags: "Etiquetas",
      visibility: "Visibilidad",
    },
  },
  tasks: {
    /** Database prefix f9e27214 / data source prefix 1cceb8bf */
    dataSourceEnv: "NOTION_DS_TASKS",
    properties: {
      title: "Task",
      status: "Status",
      priority: "Priority",
      notes: "Notes",
      activity: "Activity",
      assigneeLegacy: "Assignee",
      areaLegacy: "Area",
      due: "Due Date",
      responsible: "Responsable",
      team: "Equipo",
      start: "Fecha inicio",
      updatedByApp: "Actualizado por app",
    },
    statusMap: {
      "Not started": "not_started",
      Blocked: "blocked",
      "In progress": "in_progress",
      Done: "done",
    },
  },
  activities: {
    /** Database prefix 2755c194 / data source prefix 14ca8dbc */
    dataSourceEnv: "NOTION_DS_ACTIVITIES",
    properties: {
      title: "Activity",
      date: "Date",
      type: "Type",
      status: "Status",
      owner: "Owner",
      info: "Info",
      media: "Media",
      board: "Board",
      notes: "Notes",
      tasks: "Tasks",
      place: "Lugar",
      format: "Formato",
      registrationLink: "Link registro",
      teams: "Equipos",
      volunteers: "Voluntarios",
      coordinator: "Coordinador",
      publish: "Publicar en app",
    },
  },
} as const;

export function dataSourceId(key: keyof typeof notionSchema) {
  const env = getEnv();
  const name = notionSchema[key].dataSourceEnv;
  const value = env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
