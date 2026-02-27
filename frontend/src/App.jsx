import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Files from "./pages/Files";
import ChatDetail from "./pages/ChatDetail";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Login />} />
      <Route path="/contact" element={<h1>Contact</h1>} />
      <Route path="/my-files" element={<Files />} />
      {/* TODO: replace <h1> placeholder with the real ChatDetail page component */}
      <Route
        path="/chat/:id"
        element={
          <h1 style={{ color: "white", padding: "2rem" }}>
            Chat Detail — ID: {window.location.pathname.split("/").pop()}
          </h1>
        }
      />
      <Route path="/chat/:id" element={<ChatDetail />} />
    </Routes>
  );
};

export default App;
