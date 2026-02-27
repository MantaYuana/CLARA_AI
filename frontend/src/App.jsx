import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Login />} />
      <Route path="/contact" element={<h1>Contact</h1>} />
      {/* TODO: replace <h1> placeholder with the real ChatDetail page component */}
      <Route
        path="/chat/:id"
        element={
          <h1 style={{ color: "white", padding: "2rem" }}>
            Chat Detail — ID: {window.location.pathname.split("/").pop()}
          </h1>
        }
      />
    </Routes>
  );
};
export default App;
