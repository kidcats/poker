import { User } from "../data/user";
import { GameInfo } from "../data/gameInfo";

export async function getCurrentGameInfo(gameID: string): Promise<GameInfo> {
  try {
    // Simulate an asynchronous operation to fetch game information from a server
    await new Promise((resolve) => setTimeout(resolve, 100)); // Delay for demo

    // Construct simulated game information
    const users: User[] = [
      { userId: "user1", chipCount: 1000 ,userIndex:0},
      { userId: "user2", chipCount: 500 ,userIndex:1},
      { userId: "user3", chipCount: 600 ,userIndex:2},
      { userId: "user4", chipCount: 700 ,userIndex:3},
      { userId: "user5", chipCount: 200 ,userIndex:4},
      { userId: "user6", chipCount: 300 ,userIndex:5},
      { userId: "user6", chipCount: 300 ,userIndex:8},
    ];
    const gameInfo: GameInfo = { gameId: gameID, users ,currentUserId: "user1"};

    return gameInfo;
  } catch (error) {
    console.error("Error fetching game information:", error);
    throw error; // Re-throw to propagate the error to the caller
  }
}
