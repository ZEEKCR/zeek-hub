import Link from "next/link";

const TABS = [
  { href: "/admin/usuarios", id: "usuarios", label: "Usuarios" },
  { href: "/admin/reportes", id: "reportes", label: "Reportes" },
  { href: "/admin/seguridad", id: "seguridad", label: "Seguridad" },
] as const;

export function AdminTabs({
  active,
  openReports = 0,
}: {
  active: (typeof TABS)[number]["id"];
  openReports?: number;
}) {
  return (
    <nav aria-label="Administración" className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
            tab.id === active
              ? "bg-inverse text-bg"
              : "border-line text-muted hover:text-fg hover:bg-surface-2 border"
          }`}
        >
          {tab.label}
          {tab.id === "reportes" && openReports > 0 ? (
            <span className="bg-danger ml-2 rounded-full px-1.5 py-0.5 text-[0.6875rem] text-white">
              {openReports}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
