import { db } from "./index";
import { cluesTable, teamsTable, teamProgressTable } from "./schema";
import { eq, and, gt } from "drizzle-orm";

export async function advanceTeamToNextClue(teamId: string, currentClueId: string) {
  const currentClue = await db.query.cluesTable.findFirst({
    where: eq(cluesTable.id, currentClueId),
  });

  if (!currentClue) throw new Error("Current clue not found");

  const nextClue = await db.query.cluesTable.findFirst({
    where: and(
      eq(cluesTable.huntId, currentClue.huntId),
      gt(cluesTable.defaultOrder, currentClue.defaultOrder)
    ),
    orderBy: (clues, { asc }) => [asc(clues.defaultOrder)],
  });

  if (nextClue) {
    await db.update(teamProgressTable)
      .set({ currentStep: nextClue.defaultOrder })
      .where(eq(teamProgressTable.teamId, teamId));
  } else {
    await db.update(teamProgressTable)
      .set({
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(teamProgressTable.teamId, teamId));
  }

  return nextClue;
}
