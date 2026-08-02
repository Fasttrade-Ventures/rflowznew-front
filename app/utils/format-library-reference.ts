import type { LibraryEntry } from "#app/services/library.server";

type CiteShape = {
  authors: Array<{ first_name?: string | null; last_name: string }>;
  year: number | null;
  month?: number | null;
  day?: number | null;
  title: string;
  source: string | null;
  doi?: string | null;
  url?: string | null;
  volume?: string | null;
  issue?: string | null;
  first_page?: string | null;
  last_page?: string | null;
  reference_type?: string | null;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function hostOf(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function domainToOrgName(host: string | null): string | null {
  if (!host) return null;
  const stripped = host.replace(/^www\./i, "");
  let name = stripped.replace(
    /(\.(com|org|net|edu|gov|io|co|my|sg|id|uk|au|nz|us|info|biz|daily))+$/i,
    ""
  );
  if (!name) return host;
  name = name.replace(/[-_]/g, " ");
  const aliases: Record<string, string> = {
    malaymail: "Malay Mail",
    businesstoday: "Business Today",
    sinardaily: "Sinar Daily",
    thestar: "The Star",
    bernama: "Bernama",
  };
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (aliases[key]) return aliases[key];
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCite(entry: LibraryEntry): CiteShape | null {
  if (entry.kind === "academic" && entry.cite) {
    return {
      authors: entry.cite.authors ?? [{ last_name: "Unknown" }],
      year: entry.cite.year ?? entry.year,
      title: entry.cite.title,
      source: entry.cite.source ?? entry.source,
      doi: entry.cite.doi,
      volume: entry.cite.volume ?? null,
      issue: entry.cite.issue ?? null,
      first_page: entry.cite.first_page ?? null,
      last_page: entry.cite.last_page ?? null,
      reference_type: entry.cite.reference_type ?? "openalex",
    };
  }

  if (entry.kind === "web") {
    if (entry.cite) {
      return {
        authors: entry.cite.authors ?? [{ last_name: entry.source || "Web" }],
        year: entry.cite.year ?? entry.year,
        month: entry.cite.month ?? null,
        day: entry.cite.day ?? null,
        title: entry.cite.title ?? entry.title,
        source: entry.cite.source ?? entry.source,
        url: entry.cite.url ?? entry.url,
        reference_type: "web",
      };
    }

    const host = hostOf(entry.url);
    const org = entry.source && !entry.source.includes(".")
      ? entry.source
      : domainToOrgName(host) || entry.source || "Web";

    return {
      authors: [{ last_name: org }],
      year: entry.year,
      title: entry.title,
      source: org,
      url: entry.url,
      reference_type: "web",
    };
  }

  return null;
}

function formatAuthors(
  authors: CiteShape["authors"],
  conjunction: "&" | "and" = "&"
): string {
  const format = (author: CiteShape["authors"][number]) => {
    const last = author.last_name ?? "";
    const initial = author.first_name
      ? `${author.first_name.charAt(0)}.`
      : "";
    return initial ? `${last}, ${initial}` : last;
  };

  if (authors.length === 0) return "";
  if (authors.length === 1) return format(authors[0]);
  if (authors.length > 20) {
    const first = authors
      .slice(0, 19)
      .map(format)
      .join(", ");
    return `${first}, ... ${format(authors[authors.length - 1])}`;
  }

  const allButLast = authors.slice(0, -1).map(format).join(", ");
  const last = format(authors[authors.length - 1]);
  return conjunction === "&"
    ? `${allButLast}, & ${last}`
    : `${allButLast} and ${last}`;
}

function formatApaDate(cite: CiteShape): string {
  const year = cite.year;
  const month = cite.month ?? null;
  const day = cite.day ?? null;

  if (!year) return "(n.d.)";
  if (month && month >= 1 && month <= 12) {
    const monthName = MONTH_NAMES[month - 1];
    if (day && day >= 1 && day <= 31) {
      return `(${year}, ${monthName} ${day})`;
    }
    return `(${year}, ${monthName})`;
  }
  return `(${year})`;
}

function buildJournalLocator(cite: CiteShape): string {
  const volume = cite.volume?.trim() ?? "";
  const issue = cite.issue?.trim() ?? "";
  const firstPage = cite.first_page?.trim() ?? "";
  const lastPage = cite.last_page?.trim() ?? "";

  if (!volume && !issue && !firstPage) return "";

  let locator = "";
  if (volume) {
    locator += `, ${volume}`;
    if (issue) locator += `(${issue})`;
  }
  if (firstPage) {
    locator += `, ${firstPage}${lastPage ? `–${lastPage}` : ""}`;
  }
  return locator;
}

/** APA 7 reference line for a library entry (academic, policy, media, web). */
export function formatApaReference(entry: LibraryEntry): string {
  const cite = buildCite(entry);
  if (!cite) {
    return entry.title + (entry.year ? ` (${entry.year})` : "");
  }

  if (cite.reference_type === "web") {
    const author = formatAuthors(cite.authors);
    const date = formatApaDate(cite);
    const title = cite.title;
    const source = cite.source ?? "";
    const sameAsSrc =
      source !== "" &&
      author.toLowerCase() === source.toLowerCase();

    const parts = [`${author}.`, date, `${title}.`];
    if (source && !sameAsSrc) parts.push(`${source}.`);
    if (cite.url) parts.push(cite.url);
    return parts.join(" ");
  }

  const authors = formatAuthors(cite.authors);
  const year = cite.year ?? "n.d.";
  const locator = buildJournalLocator(cite);
  const sourceStr = cite.source
    ? `${cite.source}${locator}.`
    : "";

  let reference = `${authors} (${year}). ${cite.title}.`;
  if (sourceStr) reference += ` ${sourceStr}`;
  if (cite.doi) reference += ` https://doi.org/${cite.doi}`;
  else if (cite.url) reference += ` ${cite.url}`;

  return reference.trim();
}

export function getWebAuthorLabel(entry: LibraryEntry): string {
  const cite = buildCite(entry);
  if (!cite || cite.authors.length === 0) return entry.source ?? "Web";
  return cite.authors[0]?.last_name ?? entry.source ?? "Web";
}

export function getCitedLibraryEntries(entries: LibraryEntry[]) {
  return entries.filter((entry) => entry.is_cited);
}
