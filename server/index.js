import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuid } from 'uuid';

const app = express();
const httpServer = createServer(app); // Correct HTTP server

app.use(cors());

const io = new Server(httpServer, {  // Use httpServer here
  cors: {
    origin: "https://multiplayer-tic-tac-toe-xi.vercel.app", // Allow requests from Vite
    methods: ["GET", "POST"]
  }
});

let waitingPlayer = null; // Store a waiting player
let waitingPlayerName = "";
let games = {}; // Track active games

let createdRooms = {};

const calculateWinner = (board) => {
  const winningPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6],            // Diagonals
  ];

  for (let pattern of winningPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return the winner ('X' or 'O')
    }
  }
  let cnt = 0;
  for(let i = 0; i<9; i++){
    if(board[i]){
      cnt++;
    }
  }
  if(cnt == 9) return "draw";
  return null;
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("random_game", ({ playerName }) => {
    console.log(waitingPlayerName);
    

    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      // Found a waiting player, pair them
      const playerX = waitingPlayer;
      const playerO = socket;
      const roomId = playerX.id + "_" + playerO.id; // Unique room ID

      games[roomId] = {
        playerX: playerX.id, playerO: playerO.id,
        playerXName: waitingPlayerName, playerOName: playerName,
        board: Array(9).fill(null), turn: "X"
      };

      playerX.join(roomId);
      playerO.join(roomId);

      io.to(roomId).emit("random_game", { roomId });

      // Clear waiting player after pairing
      waitingPlayer = null;
      waitingPlayerName = "";
    } else {
      // No waiting player, so this player must wait
      waitingPlayer = socket;
      waitingPlayerName = playerName;
      socket.emit("waiting_for_opponent", { waiting: true });
    }










    // if (!waitingPlayer || waitingPlayer.id === socket.id) {
    //   // If no one is waiting, this player waits for an opponent
    //   waitingPlayer = socket;
    //   waitingPlayerName = playerName;
    //   socket.emit("waiting_for_opponent", { waiting: true });
    // } else {
    //   // Pair the waiting player with the new one
    //   const playerX = waitingPlayer;
    //   const playerO = socket;
    //   const roomId = playerX.id + "_" + playerO.id; // Unique room ID
    //   games[roomId] = {
    //     playerX: playerX.id, playerO: playerO.id,
    //     playerXName: waitingPlayerName, playerOName: playerName,
    //     board: Array(9).fill(null), turn: "X"
    //   };

    //   // console.log(games[roomId]);
    //   playerX.join(roomId);
    //   playerO.join(roomId);

    //   io.to(roomId).emit("random_game", { roomId });

    //   waitingPlayer = null;
    //   waitingPlayerName = "";
    // }
  })

  socket.on("game_start", ({ roomId }) => {
    if (!games[roomId]) return;
    const playerX = games[roomId]?.playerX;
    const playerXName = games[roomId]?.playerXName;
    const playerO = games[roomId]?.playerO;
    const playerOName = games[roomId]?.playerOName;
    io.to(playerX).emit("game_start", { symbol: "X", opponent: playerOName, roomId, turn: "X" });
    io.to(playerO).emit("game_start", { symbol: "O", opponent: playerXName, roomId, turn: "X" });
  })

  socket.on("move_made", (data) => {
    const { roomId, playerId, move } = data;
    if (!games[roomId]) return;
    const game = games[roomId];
    if (game.board[move] || (playerId === game.playerX && game.turn !== "X") || (playerId === game.playerO && game.turn !== "O")) {
      return; // Invalid move
    }
    game.board[move] = game.turn;
    game.turn = game.turn === "X" ? "O" : "X";
    const winner = calculateWinner(game.board);
    // server should give details of board, whoose turn, to both the players in room
    //to playerX
    games[roomId] = game;

    io.to(roomId).emit("move_made", { board: game.board, turn: game.turn });

    // io.to(game.playerX).emit("move_made", { board: game.board, turn })
    // io.to(game.playerO).emit("move_made", { board: game.board, turn })

    if (winner) {
      if(winner == "draw"){
        io.to(roomId).emit("win_calc", { winner: "draw" });
      }else{
        console.log(winner);
        const winnerName = winner == "X" ? games[roomId].playerXName : games[roomId].playerOName
        io.to(roomId).emit("win_calc", { winner: winnerName });
      }
    }
  })

  socket.on("reset_game", ({ roomId }) => {
    if (!games[roomId]) return;
    let game = games[roomId];

    [game.playerX, game.playerO] = [game.playerO, game.playerX];

    game.board = Array(9).fill(null);
    game.turn = "X"; // Reset turn

    io.to(game.playerX).emit("game_reset", {
      board: game.board, turn: "X", symbol: "X"
    });

    io.to(game.playerO).emit("game_reset", {
      board: game.board, turn: "X", symbol: "O"
    });
  });

  socket.on("create_room", ({ playerName }) => {
    const roomId = uuid()
    const playerX = socket;
    createdRooms[roomId] = {
      playerX: playerX,
      playerXName: playerName,
    }
    playerX.emit("create_room", { roomId })
    playerX.emit("waiting_for_opponent", { waiting: true });
  })

  socket.on("join_room", ({ roomId, playerName }) => {
    if (!createdRooms[roomId]){
      io.to(socket.id).emit("no_room_found");
      return;
    }

    if(createdRooms[roomId].playerX.id == socket.id){
      io.to(socket.id).emit("you_already_joined_the_room");
      return;
    }
    const playerO = socket;
    const playerX = createdRooms[roomId].playerX;
    const playerXName = createdRooms[roomId].playerXName;

    delete createdRooms[roomId];

    games[roomId] = {
      playerX: playerX.id, playerO: playerO.id,
      playerXName: playerXName, playerOName: playerName,
      board: Array(9).fill(null), turn: "X"
    };
    playerX.join(roomId);
    playerO.join(roomId);

    io.to(roomId).emit("join_room", { roomId });
  })

  socket.on("disconnect", () => {
    // Remove from waiting queue
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    // Remove from games
    for (const roomId in games) {
      const game = games[roomId];
      if (game.playerX === socket.id || game.playerO === socket.id) {
        console.log("played Disconnected: ", socket.id);

        const opponentId = game.playerX === socket.id ? game.playerO : game.playerX;
        io.to(opponentId).emit("opponent_disconnected", { msg: "Your opponent disconnected!" });
        delete games[roomId];

      }
    }
  });

  socket.on("manual_disconnect", ({ roomId, playerId }) => {
    if (!games[roomId]) return;
  
    const game = games[roomId];
    const opponentId = game.playerX === playerId ? game.playerO : game.playerX;
    
    io.to(opponentId).emit("opponent_disconnected", { msg: "Your opponent left!" });
  
    delete games[roomId]; // Remove game session
  });

});

httpServer.listen(8080, () => {
  console.log("Server running on port 3000");
});
