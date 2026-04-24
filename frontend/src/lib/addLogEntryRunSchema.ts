import { z } from "zod";

export const MAX_REPOS_PER_LOG_ENTRY_RUN = 3;

export const addLogEntryRunDraftSchema = z
  .object({
    repoIds: z
      .array(z.number().int().positive())
      .min(1, "Select at least one repository.")
      .max(
        MAX_REPOS_PER_LOG_ENTRY_RUN,
        `You can select at most ${MAX_REPOS_PER_LOG_ENTRY_RUN} repositories.`,
      ),
    rangeStart: z.string().trim().min(1, "Enter a start date."),
    rangeEnd: z.string().trim().min(1, "Enter an end date."),
  })
  .refine((data) => data.rangeEnd >= data.rangeStart, {
    message: "End date must be on or after the start date.",
    path: ["rangeEnd"],
  });

export type AddLogEntryRunDraft = z.infer<typeof addLogEntryRunDraftSchema>;
