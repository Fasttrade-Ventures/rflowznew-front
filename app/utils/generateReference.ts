export function generateReference(cite: {
  year: string;
  authors: { first_name?: string; last_name?: string }[];
}): string {
  const formatAuthors = (
    authors: { first_name?: string; last_name?: string }[]
  ): string => {
    if (authors.length === 0) return "";
    if (authors.length === 1) {
      return `${authors[0].last_name}, ${authors[0].first_name?.[0] || ""}.`;
    }
    if (authors.length === 2) {
      return `${authors[0].last_name}, ${
        authors[0].first_name?.[0] || ""
      }. and ${authors[1].last_name}, ${authors[1].first_name?.[0] || ""}.`;
    }
    return `${authors[0].last_name}, ${
      authors[0].first_name?.[0] || ""
    }. et al.`;
  };

  const authors = formatAuthors(cite.authors);
  return authors ? `${authors} (${cite.year}).` : `(${cite.year}).`;
}
