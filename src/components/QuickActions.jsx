function QuickActions({ setMessage }) {
  const actions = {
    "📄 PDF": "Summarize my PDF...",
    "📝 Notes": "Create smart notes...",
    "🧠 Quiz": "Generate quiz...",
    "💻 Coding": "Help me solve coding problem...",
    "📅 Planner": "Create today's study plan...",
    "📸 Image": "Solve question from image..."
  };

  return (
    <>
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
        {Object.keys(actions).map((item) => (
          <button
            key={item}
            className="chip"
            onClick={() => setMessage(actions[item])}
          >
            {item}
          </button>
        ))}
      </div>
    </>
  );
}

export default QuickActions;