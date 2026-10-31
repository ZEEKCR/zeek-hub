import { ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { SuggestionForm } from "@/app/(app)/eventos/sugerir/suggestion-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ScopeBadge } from "@/components/ui/country-flag";
import { formatCostaRica } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { DEFAULT_COUNTRY, parseScope } from "@/server/domain/countries";
import {
  suggestionKindLabel,
  suggestionStatusLabel,
} from "@/server/suggestions/rules";
import { listOwnSuggestions } from "@/server/services/suggestions";

export default async function SuggestEventPage() {
  const actor = await requireActor();
  const mine = await listOwnSuggestions(actor);
  return (
    <div className="grid max-w-3xl gap-6">
      <Link
        href="/eventos"
        className="text-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft size={16} aria-hidden />
        Eventos
      </Link>
      <PageHeader
        title="Sugerir un evento"
        subtitle="Cuéntanos una idea de evento o a quién conoces que quiere colaborar con ZEEK. Un Head la revisa."
      />
      <SuggestionForm country={actor.country ?? DEFAULT_COUNTRY} />
      <Panel title="Tus sugerencias" description="Aquí ves en qué va cada una.">
        {mine.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={20} aria-hidden />}
            title="Todavía no has enviado sugerencias."
          />
        ) : (
          <ul className="grid gap-2.5">
            {mine.map((item) => (
              <li
                key={item.id}
                className="bg-surface-2 grid gap-1.5 rounded-[16px] p-3.5"
              >
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`badge ${item.status === "accepted" ? "badge-accent" : item.status === "declined" ? "" : "badge-violet"}`}
                  >
                    {suggestionStatusLabel(item.status)}
                  </span>
                  <ScopeBadge scope={parseScope(item.country) ?? "global"} />
                </p>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted text-xs">
                  {suggestionKindLabel(item.kind)} ·{" "}
                  {formatCostaRica(item.createdAt, "d MMM yyyy")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
