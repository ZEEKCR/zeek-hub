import { parseScope, type Scope } from "@/server/domain/countries";

export const SUGGESTION_KINDS = [
  { id: "idea", label: "Tengo una idea de evento" },
  { id: "contacto", label: "Conozco a alguien que quiere colaborar" },
] as const;

export const SUGGESTION_STATUSES = [
  { id: "new", label: "Nueva" },
  { id: "reviewing", label: "En revisión" },
  { id: "accepted", label: "Aceptada" },
  { id: "declined", label: "No por ahora" },
] as const;

export type SuggestionKind = (typeof SUGGESTION_KINDS)[number]["id"];
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]["id"];

export type SuggestionInput = {
  kind: SuggestionKind;
  title: string;
  description: string;
  contactName: string | null;
  contactInfo: string | null;
  country: Scope;
};

export function suggestionKindLabel(kind: string) {
  return SUGGESTION_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

export function suggestionStatusLabel(status: string) {
  return (
    SUGGESTION_STATUSES.find((item) => item.id === status)?.label ?? status
  );
}

export function parseSuggestionStatus(raw: string): SuggestionStatus | null {
  return SUGGESTION_STATUSES.find((item) => item.id === raw)?.id ?? null;
}

export function validateSuggestion(raw: {
  kind: string;
  title: string;
  description: string;
  contactName: string;
  contactInfo: string;
  country: string;
}): { ok: true; data: SuggestionInput } | { ok: false; message: string } {
  const kind = SUGGESTION_KINDS.find((item) => item.id === raw.kind)?.id;
  if (!kind) return { ok: false, message: "Elige qué quieres sugerir." };
  const title = raw.title.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 120) {
    return {
      ok: false,
      message: "El título debe tener entre 3 y 120 caracteres.",
    };
  }
  const description = raw.description.trim();
  if (description.length < 10 || description.length > 2000) {
    return {
      ok: false,
      message: "Cuéntanos la idea con al menos 10 caracteres (hasta 2000).",
    };
  }
  const contactName = raw.contactName.trim().replace(/\s+/g, " ");
  const contactInfo = raw.contactInfo.trim();
  if (kind === "contacto" && contactName.length < 2) {
    return { ok: false, message: "Escribe el nombre de la persona." };
  }
  if (contactName.length > 80) {
    return { ok: false, message: "El nombre es demasiado largo." };
  }
  if (contactInfo.length > 160) {
    return { ok: false, message: "El dato de contacto es demasiado largo." };
  }
  const country = parseScope(raw.country);
  if (!country) return { ok: false, message: "El país no es válido." };
  return {
    ok: true,
    data: {
      kind,
      title,
      description,
      contactName: contactName || null,
      contactInfo: contactInfo || null,
      country,
    },
  };
}
