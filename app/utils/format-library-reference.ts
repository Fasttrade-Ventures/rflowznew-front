import type { LibraryEntry } from "#app/services/library.server";

type CiteShape = {
  authors: Array<{ first_name?: string | null; last_name: string }>;
  year: number | null;
  title: string;
  source: string | null;
  doi?: string | null;
  url?: string | null;
};

function buildCite(entry: LibraryEntry): CiteShape | null {
  if (entry.kind === "academic" && entry.cite) {
    return {
      authors: entry.cite.authors ?? [{ last_name: "Unknown" }],
      year: entry.cite.year ?? entry.year,
      title: entry.cite.title,
      source: entry.cite.source ?? entry.source,
      doi: entry.cite.doi,
    };
  }

  if (entry.kind === "web") {
    let host: string | null = null;
    if (entry.url) {
      try {
        host = new URL(entry.url).hostname;
      } catch {
        host = null;
      }
    }

    return {
      authors: [{ last_name: entry.source || host || "Web" }],
      year: entry.year ?? new Date().getFullYear(),
      title: entry.title,
      source: entry.source || host,
      url: entry.url,
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

/** APA 7 reference line for a library entry (academic, policy, media, web). */
export function formatApaReference(entry: LibraryEntry): string {
  const cite = buildCite(entry);
  if (!cite) {
    return entry.title + (entry.year ? ` (${entry.year})` : "");
  }

  const authors = formatAuthors(cite.authors);
  const year = cite.year ?? "n.d.";
  let reference = `${authors} (${year}). ${cite.title}.`;
  if (cite.source) {
    reference += ` ${cite.source}.`;
  }
  if (cite.doi) {
    reference += ` https://doi.org/${cite.doi}`;
  } else if (cite.url) {
    reference += ` ${cite.url}`;
  }

  return reference.trim();
}

export function getCitedLibraryEntries(entries: LibraryEntry[]) {
  return entries.filter((entry) => entry.is_cited);
}
