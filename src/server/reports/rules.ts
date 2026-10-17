export const REPORT_KINDS = [
  { id: "bug", label: "Algo no funciona" },
  { id: "ayuda", label: "Necesito ayuda" },
  { id: "sugerencia", label: "Tengo una sugerencia" },
] as const;

export const REPORT_SCREENS = [
  "Inicio",
  "Tareas",
  "Calendario",
  "Eventos",
  "Equipos",
  "Recursos",
  "Perfil",
  "Admin",
  "Inicio de sesión",
  "Otra",
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number]["id"];

export type ReportInput = {
  kind: ReportKind;
  subject: string;
  message: string;
  screen: string;
  userAgent: string;
};

export function kindLabel(kind: string) {
  return REPORT_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

export function validateReport(raw: {
  kind: string;
  subject: string;
  message: string;
  screen: string;
  userAgent: string;
}): { ok: true; data: ReportInput } | { ok: false; message: string } {
  const kind = REPORT_KINDS.find((item) => item.id === raw.kind)?.id;
  if (!kind) return { ok: false, message: "Elige el tipo de reporte." };
  const subject = raw.subject.trim().replace(/\s+/g, " ");
  if (subject.length < 3 || subject.length > 120) {
    return {
      ok: false,
      message: "El asunto debe tener entre 3 y 120 caracteres.",
    };
  }
  const message = raw.message.trim();
  if (message.length < 10 || message.length > 2000) {
    return {
      ok: false,
      message: "Cuéntanos con al menos 10 caracteres (hasta 2000).",
    };
  }
  const screen = REPORT_SCREENS.find((item) => item === raw.screen) ?? "Otra";
  return {
    ok: true,
    data: {
      kind,
      subject,
      message,
      screen,
      userAgent: raw.userAgent.slice(0, 300),
    },
  };
}
