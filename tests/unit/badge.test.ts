import { describe, expect, it } from "vitest";
import {
  BADGE_MESSAGES,
  badgeCaption,
  badgeFilename,
  badgeHeadline,
} from "@/lib/badge";

describe("badge words", () => {
  it("offers both ways of saying it", () => {
    expect(BADGE_MESSAGES.map((message) => message.headline)).toEqual([
      "Estoy empezando un rol dentro de ZEEK",
      "Soy parte de la red de ZEEK",
    ]);
    expect(badgeHeadline("red")).toBe("Soy parte de la red de ZEEK");
  });

  it("writes a caption with the team and role when known", () => {
    expect(
      badgeCaption("empezando", { team: "Growth", role: "Voluntario" }),
    ).toBe(
      "Estoy empezando un rol como Voluntario dentro de ZEEK, en el equipo de Growth. The Future Is Built Together. #ZEEK #Voluntariado",
    );
    expect(badgeCaption("red", { team: "Growth" })).toBe(
      "Soy parte de la red de ZEEK, en el equipo de Growth. The Future Is Built Together. #ZEEK #Voluntariado",
    );
  });

  it("still reads well without team or role", () => {
    expect(badgeCaption("empezando", {})).toBe(
      "Estoy empezando un rol dentro de ZEEK. The Future Is Built Together. #ZEEK #Voluntariado",
    );
  });

  it("makes a safe file name", () => {
    expect(badgeFilename("Josué Núñez Á.")).toBe(
      "zeek-gafete-josue-nunez-a.jpg",
    );
    expect(badgeFilename("Ana", "gif")).toBe("zeek-gafete-ana.gif");
    expect(badgeFilename("???")).toBe("zeek-gafete-voluntario.jpg");
  });
});
