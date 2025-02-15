import React, { useEffect, useState } from 'react'
import "./random.css";
import { useLocation } from 'react-router-dom';
import TicTacToe from '../Components/TicTacToe';

const Random = ({ socket }) => {

  const [roomId, setRoomId] = useState(null)
  const location = useLocation();
  const playerName = location.state?.name || "Anonymous";

  useEffect(() => {

    socket.emit("random_game", { playerName });
    socket.on("random_game", ({ roomId }) => {
      console.log(roomId);
      setRoomId(roomId)
    })

    return () => {
      socket.off("random_game");
    };

  }, [socket])
  return (
    <div className="random-container">
      <div className="game-box">
        <h2 className="title">Tic Tac Toe</h2>
        <TicTacToe socket={socket} roomId={roomId} playerName={playerName} />
      </div>
    </div>
  )
}

export default Random