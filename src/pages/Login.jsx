import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";

function Login() {

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      alert(`Welcome ${result.user.displayName}`);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="app">
      <div className="card">

        <div className="logo">GI</div>

        <h1>Ghalib Intelligence</h1>

        <p>Learn Smarter with GI</p>

        <button
          className="google-btn"
          onClick={loginWithGoogle}
        >
          Continue with Google
        </button>

        <button className="guest-btn">
          Continue as Guest
        </button>

      </div>
    </div>
  );
}

export default Login;