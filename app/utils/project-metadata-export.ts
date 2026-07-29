export type PaperAuthor = {
  first_name?: string | null;
  last_name?: string | null;
};

export type PaperAffiliation = {
  name?: string | null;
  location?: string | null;
  authors?: PaperAuthor[] | null;
};

export type ProjectMetadataIssue = "authors" | "affiliations";

export function hasValidAuthors(authors?: PaperAuthor[] | null): boolean {
  return (authors ?? []).some(
    (author) => author.first_name?.trim() && author.last_name?.trim()
  );
}

export function hasValidAffiliations(
  affiliations?: PaperAffiliation[] | null
): boolean {
  return (affiliations ?? []).some(
    (affiliation) => affiliation.name?.trim() && affiliation.location?.trim()
  );
}

export function getProjectMetadataIssues(
  authors?: PaperAuthor[] | null,
  affiliations?: PaperAffiliation[] | null
): ProjectMetadataIssue[] {
  const issues: ProjectMetadataIssue[] = [];

  if (!hasValidAuthors(authors)) {
    issues.push("authors");
  }

  if (!hasValidAffiliations(affiliations)) {
    issues.push("affiliations");
  }

  return issues;
}

export function projectMetadataWarningMessage(
  issues: ProjectMetadataIssue[]
): string {
  if (issues.length === 0) return "";

  const parts: string[] = [];

  if (issues.includes("authors")) {
    parts.push("authors");
  }

  if (issues.includes("affiliations")) {
    parts.push("affiliations");
  }

  if (parts.length === 2) {
    return "Authors and affiliations are missing from Project settings. Exported DOCX and PDF title pages will not include them.";
  }

  if (issues.includes("authors")) {
    return "No authors in Project settings. Exported DOCX and PDF title pages will not list author names.";
  }

  return "No affiliations in Project settings. Exported DOCX and PDF title pages will not list institutional affiliations.";
}
