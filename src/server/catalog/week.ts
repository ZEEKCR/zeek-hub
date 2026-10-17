export type WeekItem = {
  id: string;
  kind: "tarea" | "turno";
  title: string;
  detail: string;
  /** ISO moment used to sort; tasks without a time sort at the end of their day. */
  at: string;
  /** yyyy-MM-dd in Costa Rica time. */
  day: string;
  timed: boolean;
  href: string;
};

/** My week in one list: what is due and which shifts I signed up for. */
export function weekAgenda(items: WeekItem[]) {
  return [...items].sort(
    (left, right) =>
      left.day.localeCompare(right.day) ||
      Number(right.timed) - Number(left.timed) ||
      left.at.localeCompare(right.at) ||
      left.title.localeCompare(right.title, "es"),
  );
}
