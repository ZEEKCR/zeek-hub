import { and, eq, inArray } from "drizzle-orm";
import { ensureMigrated, getDb } from "@/server/db/client";
import {
  eventRsvps,
  eventShifts,
  shiftSignups,
  user,
} from "@/server/db/schema";
import { actorAssigneeKeys } from "@/server/domain/assignee";
import type { Actor, Task } from "@/server/domain/types";
import { attendedEvents, completedShiftHours } from "@/server/attendance/rules";

export type Impact = {
  tasksDone: number;
  eventsAttended: number;
  shiftHours: number;
  shiftsDone: number;
  since: Date | null;
};

/** Numbers for the profile: what the person has done in ZEEK so far. */
export async function loadImpact(
  actor: Actor,
  tasks: Pick<Task, "status" | "assigneeIds">[],
  eventDay: Map<string, string>,
  today: string,
  now = new Date(),
): Promise<Impact> {
  await ensureMigrated();
  const db = getDb();
  const keys = actorAssigneeKeys(actor);
  const tasksDone = tasks.filter(
    (task) =>
      task.status === "done" &&
      task.assigneeIds.some((id) => keys.includes(id)),
  ).length;

  const going = await db
    .select({ activityId: eventRsvps.activityId })
    .from(eventRsvps)
    .where(
      and(eq(eventRsvps.userId, actor.userId), eq(eventRsvps.status, "going")),
    );
  const signups = await db
    .select({ shiftId: shiftSignups.shiftId })
    .from(shiftSignups)
    .where(eq(shiftSignups.userId, actor.userId));
  const shifts = signups.length
    ? await db
        .select({ startsAt: eventShifts.startsAt, endsAt: eventShifts.endsAt })
        .from(eventShifts)
        .where(
          inArray(
            eventShifts.id,
            signups.map((row) => row.shiftId),
          ),
        )
    : [];
  const finished = shifts.filter(
    (shift) => shift.endsAt.getTime() <= now.getTime(),
  );
  const [account] = await db
    .select({ createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, actor.userId));
  return {
    tasksDone,
    eventsAttended: attendedEvents(
      going.map((row) => row.activityId),
      eventDay,
      today,
    ),
    shiftHours: completedShiftHours(shifts, now),
    shiftsDone: finished.length,
    since: account?.createdAt ?? null,
  };
}
