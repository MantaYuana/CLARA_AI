import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Files from "./pages/Files";
import ChatDetail from "./pages/ChatDetail";
import AuthCallback from "./pages/AuthCallback";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Login />} />
      <Route path="/my-files" element={<Files />} />
      <Route path="/chat/:id" element={<ChatDetail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
};

export default App;
