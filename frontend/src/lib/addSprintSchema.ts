import { z } from "zod";

export const MAX_REPOS_PER_SPRINT = 3;

const branchListSchema = z
  .array(z.string().trim().min(1))
  .min(1, "Select at least one branch.");

export const addSprintDraftSchema = z
  .object({
    repoIds: z
      .array(z.number().int().positive())
      .min(1, "Select at least one repository.")
      .max(
        MAX_REPOS_PER_SPRINT,
        `You can select at most ${MAX_REPOS_PER_SPRINT} repositories.`,
      ),
    branchesByRepoId: z.record(z.string(), branchListSchema),
    rangeStart: z.string().trim().min(1, "Enter a start date."),
    rangeEnd: z.string().trim().min(1, "Enter an end date."),
  })
  .refine((data) => data.rangeEnd >= data.rangeStart, {
    message: "End date must be on or after the start date.",
    path: ["rangeEnd"],
  })
  .refine(
    (data) =>
      data.repoIds.every((id) => {
        const branches = data.branchesByRepoId[String(id)];
        return Array.isArray(branches) && branches.length > 0;
      }),
    {
      message: "Select at least one branch for each repository.",
      path: ["branchesByRepoId"],
    },
  );

export type AddSprintDraft = z.infer<typeof addSprintDraftSchema>;
