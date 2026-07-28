import { z } from "zod";

export const citeSchema = z.object({
  cites: z
    .array(
      z.object({
        year: z.string().min(1),
        title: z.string().min(1),
        source: z.string().min(1).optional(),
        doi: z.string().min(1).optional(),
        mendeley_id: z.string().min(1).optional(),
        openalex_id: z.string().min(1).optional(),
        reference_type: z.string().min(1).optional(),
        authors: z.array(
          z.object({
            first_name: z.string().min(1).optional(),
            last_name: z.string().min(1),
          })
        ),
      })
    )
    .min(1, "Cites is empty"),
});

export type Cite = z.infer<typeof citeSchema>["cites"][number];
