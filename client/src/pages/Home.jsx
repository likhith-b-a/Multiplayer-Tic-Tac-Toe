import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import "./home.css"

const Home = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  return (

    <div className="home-container">
      <h2>Welcome to Tic-Tac-Toe</h2>
      <input
        type="text"
        placeholder="Enter Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="name-input"
      />
      <div className="button-group">
        <button
          className='random-btn'
          onClick={() => navigate("/random", { state: { name } })}
          disabled={!name.trim()} // Disable if name is empty
        >
          Quick Match
        </button>
        <button
          className="friend-btn"
          onClick={() => navigate("/friend", { state: { name } })}
          disabled={!name.trim()} // Disable if name is empty
        >
          Play with Friends
        </button>
      </div>
    </div>
  )
}
{/* <>
      <input type="text" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} className="name" /><br />
      <button className='random' onClick={() => navigate("/random", { state: { name } })}>Quick Match
      </button><br /><br />
      <button className="friend" onClick={() => navigate("/friend", { state: { name } })}> Join Friends
      </button>
    </> */}

export default Home;