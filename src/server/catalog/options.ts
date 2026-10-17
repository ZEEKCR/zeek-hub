/** Options of the Area column in Notion. */
export const TASK_AREAS = [
  "Growth",
  "Logistics",
  "Volunteers",
  "Communications",
  "Ops",
  "Technical",
] as const;

/** Values older tasks may still carry; they are read and saved as they are. */
export const LEGACY_AREAS = [
  "Community",
  "Content",
  "Events",
  "Services",
  "Partners",
  "Platform",
  "Blockchain",
] as const;

export const ACTIVITY_TYPES = [
  { id: "Event", label: "Evento" },
  { id: "Meeting", label: "Reunión" },
  { id: "Deadline", label: "Fecha límite" },
  { id: "Workshop", label: "Taller" },
  { id: "Hackathon", label: "Hackathon" },
  { id: "Meetup", label: "Encuentro" },
  { id: "Talk", label: "Charla" },
  { id: "Bootcamp", label: "Bootcamp" },
  { id: "Volunteer", label: "Voluntariado" },
  { id: "Campus", label: "Campus" },
  { id: "Partner", label: "Aliado" },
  { id: "Other", label: "Otra" },
] as const;
