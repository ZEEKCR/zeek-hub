import Image from "next/image";

/** The horizontal logo with the wordmark that reads on the current theme. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/zeek-logo-dark.png"
        alt="ZEEK"
        width={960}
        height={349}
        priority
        className={`dark:hidden ${className ?? ""}`}
      />
      <Image
        src="/brand/zeek-logo.png"
        alt="ZEEK"
        width={960}
        height={349}
        priority
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
