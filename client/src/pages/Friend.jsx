import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import TicTacToe from '../Components/TicTacToe';
import "./friend.css"


const Friend = ({ socket }) => {
  const [enteredID, setEnteredId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gameStart, setGameStart] = useState(false);
  const [roomCreated, setRoomCreated] = useState(null);

  const location = useLocation();
  const playerName = location.state?.name || "Anonymous";

  useEffect(() => {

    const handleCreateRoom = (data) => {
      console.log(data.roomId);
      setRoomCreated(data.roomId);
    };

    socket.on("no_room_found",()=>{
      setEnteredId("");
      alert("No room found");
    })

    socket.on("you_already_joined_the_room",()=>{
      setEnteredId("");
      alert("you have already joined the room, Game Resumes once your friend joins");
    })

    socket.on("create_room", handleCreateRoom);
    socket.on("join_room", ({ roomId }) => {
      setGameStart(true);
      setRoomId(roomId)
    })

    return () => {
      socket.off("create_room", handleCreateRoom);
      socket.off("join_room");
      socket.off("no_room_found");
    };

  }, [socket])

  const createRoom = () => {
    socket.emit("create_room", { playerName })
  }

  const joinRoom = () => {
    console.log(enteredID)
    socket.emit("join_room", { roomId: enteredID, playerName });
  }

  return (
    <div className="friend-container">
      <div className="game-box">
        <h2 className="title">Tic Tac Toe</h2>
        {
          !gameStart ?
            <div className="room-controls">
              <button className="create-room" onClick={createRoom}>Create a Room</button>
              {roomCreated && <p className="room-id">Room ID: <span>{roomCreated}</span></p>}
              <div className="join-section">
                <input
                  type="text"
                  className="join-input"
                  placeholder="Enter Room ID"
                  value={enteredID}
                  onChange={(e) => setEnteredId(e.target.value)}
                />
                <button className="join-room" onClick={joinRoom}>Join Room</button>
              </div>
            </div>
            :
            <TicTacToe socket={socket} roomId={roomId} playerName={playerName} />
        }
      </div>
    </div>
    // <>
    //   <h2 className="title">Tic Tac Toe</h2>
    //   <button className="create-room" onClick={createRoom}>create a room</button><br />
    //   {/* <input type="text" className="join" value={enteredID} onChange={(e) => { setEnteredId(e.target.value) }} /><br /> */}
    //   <button className="join-room" onClick={joinRoom}>join a room</button>
    //   {/* <TicTacToe socket={socket} roomId={roomId} playerName={playerName} /> */}
    // </>
  )
}

export default Friend