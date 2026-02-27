import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<h1>Home</h1>} />
      <Route path="/auth" element={<Login />} />
      <Route path="/contact" element={<h1>Contact</h1>} />
    </Routes>
  );
};

export default App;
