import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ReactNode } from "react";

const BARS = [
  { flex: 1, height: "38%" },
  { flex: 1.5, height: "62%" },
  { flex: 1, height: "46%" },
  { flex: 2, height: "86%" },
  { flex: 1, height: "56%" },
  { flex: 1.3, height: "72%" },
  { flex: 1, height: "40%" },
];

/** Split layout for the public screens: brand art on the left, form on the right. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center p-3 sm:p-6">
      <div className="border-line bg-surface-1/60 grid w-full max-w-5xl gap-3 rounded-[36px] border p-3 shadow-[var(--shadow-float)] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:p-4">
        <aside className="relative isolate flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#0a0a0a] p-6 lg:min-h-[620px] lg:p-10">
          <div
            aria-hidden
            className="drift pointer-events-none absolute -top-24 -right-20 -z-10 size-72 rounded-full bg-[radial-gradient(circle,rgb(99_53_237/0.75),transparent_68%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex h-[62%] items-end gap-px opacity-95 blur-[14px]"
          >
            {BARS.map((bar, index) => (
              <span
                key={index}
                className="breathe rounded-t-xl"
                style={{
                  flex: bar.flex,
                  height: bar.height,
                  animationDelay: `${index * -1.1}s`,
                  background:
                    "linear-gradient(to top, #d6ffe9 0%, #01e576 22%, #2fa7a0 48%, #4b5fe0 76%, #6335ed 100%)",
                }}
              />
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background-image:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_6px)] opacity-[0.07]"
          />
          <div>
            <Image
              src="/brand/zeek-logo.png"
              alt="ZEEK"
              width={960}
              height={349}
              priority
              className="glint h-9 w-auto lg:h-11"
            />
            <p className="mt-6 max-w-sm text-2xl leading-tight font-semibold tracking-tight text-balance text-white lg:mt-10 lg:text-[2.5rem]">
              The Future Is Built Together
            </p>
          </div>
        </aside>
        <section className="relative flex flex-col justify-center px-3 py-6 sm:px-8 lg:px-6">
          <div className="absolute top-2 right-2 lg:top-0 lg:right-0">
            <ThemeToggle variant="icon" />
          </div>
          <div className="mx-auto w-full max-w-sm">
            <Image
              src="/brand/zeek-mark.png"
              alt=""
              width={182}
              height={240}
              className="hidden h-12 w-auto lg:block"
            />
            <h1 className="mt-6 text-4xl leading-none font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted mt-3 text-sm">{subtitle}</p>
            <hr className="border-line my-6" />
            {children}
            {footer ? (
              <p className="text-muted mt-6 text-center text-xs">{footer}</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
