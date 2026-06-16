
import { db, huntsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function validateHuntScheduling(huntId: string): Promise<{ valid: true } | { valid: false; error: string; status: number }> {
  const hunt = await db.query.huntsTable.findFirst({
    where: eq(huntsTable.id, huntId),
  });

  if (!hunt) {
    return { valid: false, error: "Hunt not found", status: 404 };
  }

  const now = new Date();
  const huntAny = hunt as any;

  if (huntAny.scheduledStart && now < new Date(huntAny.scheduledStart)) {
    return { valid: false, error: "This hunt hasn't started yet! Check back when the countdown ends.", status: 403 };
  }

  if (huntAny.scheduledEnd && now > new Date(huntAny.scheduledEnd)) {
    return { valid: false, error: "This hunt has already concluded.", status: 403 };
  }

  return { valid: true };
}
