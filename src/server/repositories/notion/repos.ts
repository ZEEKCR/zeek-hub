import { collectPaginatedAPI } from "@notionhq/client";
import type { Team, Volunteer } from "@/server/domain/types";
import { createNotionClient } from "@/server/repositories/notion/client";
import {
  mapTeamPage,
  mapVolunteerPage,
  volunteerToProperties,
} from "@/server/repositories/notion/mappers";
import { dataSourceId } from "@/server/repositories/notion/schema";
import type {
  TeamRepository,
  VolunteerRepository,
} from "@/server/repositories/interfaces";

type Page = {
  id: string;
  last_edited_time?: string;
  properties: Record<string, { type?: string }>;
};

async function queryAll(dataSourceIdValue: string) {
  const { client, call } = createNotionClient();
  const pages = await call(() =>
    collectPaginatedAPI(client.dataSources.query, {
      data_source_id: dataSourceIdValue,
      page_size: 100,
    }),
  );
  return pages as unknown as Page[];
}

export function notionVolunteers(): VolunteerRepository {
  return {
    async list() {
      const pages = await queryAll(dataSourceId("volunteers"));
      return pages.flatMap((page) => {
        const mapped = mapVolunteerPage(page);
        return mapped ? [mapped] : [];
      });
    },
    async get(id) {
      const { client, call } = createNotionClient();
      const page = (await call(() =>
        client.pages.retrieve({ page_id: id }),
      )) as Page;
      return mapVolunteerPage(page);
    },
    async findByUserId(userId) {
      const all = await this.list();
      return all.find((volunteer) => volunteer.userId === userId) ?? null;
    },
    async upsert(volunteer: Volunteer) {
      const { client, call } = createNotionClient();
      const properties = volunteerToProperties(volunteer);
      if (
        volunteer.id &&
        !volunteer.id.startsWith("team-") &&
        volunteer.id.includes("-") &&
        volunteer.updatedAt
      ) {
        try {
          await call(() =>
            client.pages.update({
              page_id: volunteer.id,
              properties: properties as never,
            }),
          );
          return volunteer;
        } catch {
          // A new volunteer id is local until Notion assigns one.
        }
      }
      const created = await call(() =>
        client.pages.create({
          parent: {
            type: "data_source_id",
            data_source_id: dataSourceId("volunteers"),
          },
          properties: properties as never,
        }),
      );
      return { ...volunteer, id: created.id };
    },
  };
}

export function notionTeams(): TeamRepository {
  return {
    async list() {
      const pages = await queryAll(dataSourceId("teams"));
      return pages.flatMap((page) => {
        const mapped = mapTeamPage(page);
        return mapped ? [mapped] : [];
      });
    },
    async get(id) {
      const all = await this.list();
      return all.find((team) => team.id === id) ?? null;
    },
    async upsert(team: Team) {
      return team;
    },
  };
}
