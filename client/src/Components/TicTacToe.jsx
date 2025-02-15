import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./TicTacToe.css";

const TicTacToe = ({ socket, roomId, playerName }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [room, setRoom] = useState(null);
  const [symbol, setSymbol] = useState(null);
  const [turn, setTurn] = useState(null);
  const [winner, setWinner] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const navigate = useNavigate()


  useEffect(() => {
    if (roomId) {
      socket.emit("game_start", { roomId });
    }


    const handleWaiting = ({ waiting }) => { setWaiting(waiting) };
    const handleOpponentDisconnect = ({ msg }) => {
      alert(msg + " Returning to main menu in 3 seconds");
      setBoard(Array(9).fill(null));
      setTurn(null);
      setWinner(null);
      setSymbol(null);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    };

    socket.on("opponent_disconnected", handleOpponentDisconnect);
    socket.on("waiting_for_opponent", handleWaiting);

    socket.on("game_start", (data) => {
      console.log(data);
      setRoom(data.roomId);
      setSymbol(data.symbol);
      setTurn('X');
      setWaiting(false);
      setOpponentName(data.opponent)
    })
    socket.on("move_made", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
    });
    socket.on("win_calc", ({ winner }) => {
      setWinner(winner);
    })
    socket.on("game_reset", ({ board, turn, symbol }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(null);
      setSymbol(symbol);
    });

    const handleBeforeUnload = () => {
      socket.emit("manual_disconnect", { roomId, playerId: socket.id });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      socket.off("game_start");
      socket.off("move_made");
      socket.off("win_calc");
      socket.off("game_reset");
      socket.off("waiting_for_opponent", handleWaiting);
      socket.off("opponent_disconnected", handleOpponentDisconnect);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.emit("manual_disconnect", { roomId, playerId: socket.id });
    };
  }, [roomId, socket])

  const handleClick = (index) => {
    if (board[index] || winner) return;
    if (turn != symbol) {
      alert("Your Opponent is Playing");
      return;
    }
    socket.emit("move_made", { move: index, playerId: socket.id, roomId: room });
    if (board[index]) return;
    return;
  };

  const resetGame = () => {
    console.log("clicked");
    socket.emit("reset_game", { roomId: room });
  };


  return (
    <div className="tic-tac-toe">
      {/* <p className="curr_room">Room : {roomId}</p> */}
      {waiting ? (
        <h2 className="waiting-msg">⏳ Searching for an Opponent...</h2>
      ) : (
        <>
          {console.log(roomId)}
          <h2 className="match-title">🔥 {playerName} (You) vs {opponentName} 🔥</h2>

          {!winner ? (
            <>
              <h2 className="player-symbol">
                🎭 You are playing as: <span className="symbol">{symbol === "X" ? "❌" : "⭕"}</span>
              </h2>

              <h2 className="turn">
                {turn === symbol
                  ? `🎯 It's your turn, ${playerName}!`
                  : `⏳ Waiting for ${opponentName} to play...`}
              </h2>
            </>
          ) : (
            <h2 className="winner">
              {winner === playerName && `🎉 Congratulations, ${playerName}! You won! 🏆`}
              {winner === opponentName && `Oh no! ${opponentName} won 😢`}
              {winner === "draw" && `🤝 It's a draw! Well played, both!`}
            </h2>
          )}

          <div className="board">
            {board.map((cell, index) => (
              <button key={index} className="cell" onClick={() => handleClick(index)}>
                {cell}
              </button>
            ))}
          </div>

          {(winner || !board.includes(null)) && (
            <button className="reset" onClick={resetGame}>🔄 Play Again</button>
          )}
        </>
      )}
    </div>
  );

};

export default TicTacToe;