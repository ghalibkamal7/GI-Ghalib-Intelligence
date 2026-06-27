
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function AIChat() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const greetings = [
    `Hello ${user?.displayName} 👋`,
    `Welcome back ${user?.displayName} 🔥`,
    `Ready to learn today, ${user?.displayName}?`,
    `Let's achieve today's goals together, ${user?.displayName}!`
  ];

  const placeholders = [
    "💬 Ask GI anything...",
    "📄 Summarize my PDF...",
    "📝 Create Smart Notes...",
    "🧠 Generate a Quiz...",
    "💻 Help me with Coding...",
    "📅 Make Today's Study Plan...",
    "📸 Solve this question from an image..."
  ];

  const quickActions = [
    "📄 PDF",
    "📝 Notes",
    "🧠 Quiz",
    "💻 Coding",
    "📅 Planner",
    "📸 Image"
  ];

  const [greetingIndex, setGreetingIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const greetingTimer = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 5000);

    const placeholderTimer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => {
      clearInterval(greetingTimer);
      clearInterval(placeholderTimer);
    };
  }, []);

  const actionPrompt = {
    "📄 PDF": "Summarize my PDF...",
    "📝 Notes": "Create smart notes from...",
    "🧠 Quiz": "Generate a quiz about...",
    "💻 Coding": "Help me solve this coding problem...",
    "📅 Planner": "Create today's study plan...",
    "📸 Image": "Solve this question from an image..."
  };

  return (
    <div className="app">

      <div className="card">

        <button
          className="guest-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <h1
          style={{
            fontSize: "50px",
            marginTop: "20px"
          }}
        >
          GI
        </h1>

        <h2>{greetings[greetingIndex]}</h2>

        <p>
          I'm GI.
          <br />
          Your Personal AI Study Companion.
          <br /><br />
          What would you like to learn today?
        </p>

        <h3
          style={{
            color: "white",
            marginTop: "25px",
            marginBottom: "15px"
          }}
        >
          🔥 Quick Actions
        </h3>

        <div className="chips">

          {quickActions.map((item) => (

            <button
              key={item}
              className="chip"
              onClick={() => setMessage(actionPrompt[item])}
            >
              {item}
            </button>

          ))}

        </div>

        <div className="focus-card">

          <h3>🎯 Today's Focus</h3>

          <ul>

            <li>Complete 2 Study Sessions</li>

            <li>Revise Chemistry</li>

            <li>Solve 15 MCQs</li>

          </ul>

          <p>🔥 Keep your streak alive!</p>

        </div>

        <input
          className="search-box"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholders[placeholderIndex]}
        />

        <button className="google-btn">

          Send

        </button>

      </div>

    </div>
  );
}

export default AIChat;

