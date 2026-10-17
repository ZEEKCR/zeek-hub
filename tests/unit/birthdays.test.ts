import { describe, expect, it } from "vitest";
import {
  birthdayLabel,
  daysUntilBirthday,
  upcomingBirthdays,
  validateBirthday,
} from "@/server/birthdays/rules";

describe("validateBirthday", () => {
  it("accepts real dates, including 29 February", () => {
    expect(validateBirthday(2, 29).ok).toBe(true);
    expect(validateBirthday(12, 31).ok).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(validateBirthday(4, 31).ok).toBe(false);
    expect(validateBirthday(2, 30).ok).toBe(false);
    expect(validateBirthday(13, 1).ok).toBe(false);
    expect(validateBirthday(1, 0).ok).toBe(false);
    expect(validateBirthday(1.5, 3).ok).toBe(false);
  });
});

describe("daysUntilBirthday", () => {
  it("is 0 on the day and counts forward", () => {
    expect(daysUntilBirthday({ month: 10, day: 17 }, "2026-10-17")).toBe(0);
    expect(daysUntilBirthday({ month: 10, day: 20 }, "2026-10-17")).toBe(3);
  });

  it("wraps to next year once the day has passed", () => {
    expect(daysUntilBirthday({ month: 10, day: 16 }, "2026-10-17")).toBe(364);
    expect(daysUntilBirthday({ month: 1, day: 2 }, "2026-12-30")).toBe(3);
  });

  it("moves 29 February to the 28th in common years", () => {
    expect(daysUntilBirthday({ month: 2, day: 29 }, "2027-02-27")).toBe(1);
    expect(daysUntilBirthday({ month: 2, day: 29 }, "2028-02-27")).toBe(2);
  });
});

describe("upcomingBirthdays", () => {
  const people = [
    { userId: "a", name: "Zoe", month: 10, day: 20 },
    { userId: "b", name: "Ana", month: 10, day: 17 },
    { userId: "c", name: "Bruno", month: 3, day: 1 },
    { userId: "d", name: "Abel", month: 10, day: 20 },
  ];

  it("keeps the window, sorts by date then name", () => {
    const result = upcomingBirthdays(people, "2026-10-17", 30);
    expect(result.map((person) => person.name)).toEqual(["Ana", "Abel", "Zoe"]);
    expect(result[0]?.daysUntil).toBe(0);
  });
});

describe("birthdayLabel", () => {
  it("spells the month in Spanish", () => {
    expect(birthdayLabel({ month: 9, day: 5 })).toBe("5 de septiembre");
  });
});
