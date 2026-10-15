export const TASK_AREAS = [
  "Community",
  "Platform",
  "Content",
  "Ops",
  "Events",
  "Services",
  "Growth",
  "Logistics",
  "Blockchain",
  "Volunteers",
  "Partners",
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
