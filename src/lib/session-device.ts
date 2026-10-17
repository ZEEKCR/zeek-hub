export function sessionDevice(userAgent: string | null | undefined) {
  const ua = userAgent ?? "";
  const os = ua.includes("Windows NT")
    ? "Windows"
    : ua.includes("Mac OS X") || ua.includes("Macintosh")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Linux")
            ? "Linux"
            : "Sistema";
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("HeadlessChrome")
      ? "Chrome"
      : ua.includes("Cursor")
        ? "Cursor"
        : ua.includes("Chrome/")
          ? "Chrome"
          : ua.includes("Firefox/")
            ? "Firefox"
            : ua.includes("Safari/")
              ? "Safari"
              : "Navegador";
  return `${browser} · ${os}`;
}
