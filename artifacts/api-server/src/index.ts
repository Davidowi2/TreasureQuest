import { httpServer, io } from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { teamMembersTable, teamsTable } from "@workspace/db/schema";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Socket.io handlers
const userSocketMap = new Map<string, string>(); // userId -> socketId
const socketUserMap = new Map<string, { userId: string; teamId?: string }>(); // socketId -> { userId, teamId }

io.on("connection", async (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on("join_team", async (data: { userId: string; teamId: string }) => {
    const { userId, teamId } = data;
    logger.info(`User ${userId} joining team ${teamId}`);
    
    // Join the team room
    socket.join(`team:${teamId}`);
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, { userId, teamId });
    
    // Update user is_active to true
    await db.update(teamMembersTable)
      .set({ isActive: true })
      .where(eq(teamMembersTable.userId, userId))
      .where(eq(teamMembersTable.teamId, teamId));
    
    // Emit member_joined to room
    io.to(`team:${teamId}`).emit("member_joined", { userId });
  });

  socket.on("disconnect", async () => {
    logger.info(`Socket disconnected: ${socket.id}`);
    const userData = socketUserMap.get(socket.id);
    if (!userData) return;
    
    const { userId, teamId } = userData;
    if (!teamId) return;
    
    // Update user is_active to false
    await db.update(teamMembersTable)
      .set({ isActive: false })
      .where(eq(teamMembersTable.userId, userId))
      .where(eq(teamMembersTable.teamId, teamId));
    
    // Emit member_disconnected
    io.to(`team:${teamId}`).emit("member_disconnected", { userId });
    
    // Check if leader disconnected, promote new leader
    const teamMembers = await db.query.teamMembersTable.findMany({
      where: eq(teamMembersTable.teamId, teamId),
      orderBy: (teamMembers, { asc }) => [asc(teamMembers.joinedAt)],
    });
    
    const leader = teamMembers.find(m => m.teamRole === "leader");
    if (leader && !leader.isActive) {
      const newLeader = teamMembers.find(m => m.isActive);
      if (newLeader) {
        await db.update(teamMembersTable)
          .set({ teamRole: "leader" })
          .where(eq(teamMembersTable.id, newLeader.id));
        
        await db.update(teamsTable)
          .set({ leaderId: newLeader.userId })
          .where(eq(teamsTable.id, teamId));
      }
    }
    
    // Cleanup
    userSocketMap.delete(userId);
    socketUserMap.delete(socket.id);
  });
});

httpServer.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

