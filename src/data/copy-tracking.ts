import { type CopySnapshot, type CopyChange } from "./apps";

export const copyDataBySlug: Record<string, { snapshots: CopySnapshot[]; changes: CopyChange[] }> = {};
