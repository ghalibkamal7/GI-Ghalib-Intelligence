import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AIChat from "./pages/AIChat";
import GILogo from "./components/GILogo";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e]">
      <div className="flex flex-col items-center gap-5">
        <GILogo size={72} animate={true} spinning={true} />
        <p className="text-slate-500 text-sm tracking-wide">Loading GI...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;