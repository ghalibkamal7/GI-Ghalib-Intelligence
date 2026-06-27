import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#f5f5f5",
      }}
    >
      <h1>GI AI Assistant</h1>
      <p>Login to continue</p>

      <button
        onClick={handleLogin}
        style={{
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          background: "#000",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Continue with Google
      </button>
    </div>
  );
}

export default Login;