import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Routes>

      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/" />}
      />

      <Route
        path="/ai"
        element={user ? <AIChat /> : <Navigate to="/" />}
      />

      <Route
        path="*"
        element={<Navigate to="/" />}
      />

    </Routes>
  );
}

export default App;