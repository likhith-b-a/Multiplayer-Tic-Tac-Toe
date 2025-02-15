import {io} from "socket.io-client";
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Random from "./pages/Random";
import Friend from "./pages/Friend";

const socket = io("http://localhost:8080");
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} ></Route>
          <Route path="/random" element={<Random socket={socket}/>} ></Route>
          <Route path="/friend" element={<Friend socket={socket}/>} ></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
