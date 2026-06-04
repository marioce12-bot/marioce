export function initials(name) {
  return (name || "Portfolio")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function normalizeUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed || trimmed === "#") return "";
  if (/^(mailto:|tel:|https?:\/\/)/i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

export function statusClass(status) {
  const normalized = String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("termine")) return "done";
  if (normalized.includes("cours")) return "progress";
  if (normalized.includes("prototype")) return "prototype";
  return "prototype";
}

export function LinkifiedText({ text }) {
  const value = String(text || "");
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[\w.-]+\.[a-z]{2,}(?:\/[^\s<]*)?)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(value)) !== null) {
    const rawUrl = match[0];
    const cleanUrl = rawUrl.replace(/[.,;:!?)]$/, "");
    const suffix = rawUrl.slice(cleanUrl.length);
    const href = normalizeUrl(cleanUrl);

    if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index));
    if (href) {
      parts.push(
        <a className="text-link" href={href} target="_blank" rel="noreferrer" key={`${href}-${match.index}`}>
          {cleanUrl}
        </a>
      );
    } else {
      parts.push(cleanUrl);
    }
    if (suffix) parts.push(suffix);
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < value.length) parts.push(value.slice(lastIndex));
  return <>{parts}</>;
}
