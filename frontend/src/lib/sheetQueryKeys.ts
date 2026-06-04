export const sheetKeys = {
  all: ["sheets"] as const,
  list: () => [...sheetKeys.all, "list"] as const,
  detail: (id: number) => [...sheetKeys.all, "detail", id] as const,
  conversation: (sprintId: number) => [...sheetKeys.all, "conversation", sprintId] as const,
};
