import { countryFlag, type CountryId } from "@/server/domain/countries";

/** Words for the share badge and the text that goes with it. Pure, so it can be tested. */

export type BadgeMessageId = "empezando" | "red";

export const BADGE_MESSAGES: {
  id: BadgeMessageId;
  label: string;
  headline: string;
}[] = [
  {
    id: "empezando",
    label: "Estoy empezando un rol",
    headline: "Estoy empezando un rol dentro de ZEEK",
  },
  {
    id: "red",
    label: "Soy parte de la red",
    headline: "Soy parte de la red de ZEEK",
  },
];

export function badgeHeadline(id: BadgeMessageId) {
  return (
    BADGE_MESSAGES.find((message) => message.id === id)?.headline ??
    BADGE_MESSAGES[0]!.headline
  );
}

/** Text to paste next to the image on any network. */
export function badgeCaption(
  id: BadgeMessageId,
  details: { team?: string; role?: string; country?: CountryId },
) {
  const where = details.team ? `, en el equipo de ${details.team}` : "";
  const what = details.role ? ` como ${details.role}` : "";
  const first =
    id === "red"
      ? `Soy parte de la red de ZEEK${where}.`
      : `Estoy empezando un rol${what} dentro de ZEEK${where}.`;
  const flag = details.country ? ` ${countryFlag(details.country)}` : "";
  return `${first}${flag} The Future Is Built Together. #ZEEK #Voluntariado`;
}

export type BadgeFormat = "jpg" | "gif";

export function badgeFilename(name: string, format: BadgeFormat = "jpg") {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `zeek-gafete-${slug || "voluntario"}.${format}`;
}
