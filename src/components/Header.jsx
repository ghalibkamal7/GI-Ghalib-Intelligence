function Header({ user, greeting, onBack }) {
  return (
    <>
      <button
        className="guest-btn"
        onClick={onBack}
      >
        ← Dashboard
      </button>

      <h1
        style={{
          fontSize: "52px",
          marginTop: "20px",
          marginBottom: "10px"
        }}
      >
        GI
      </h1>

      <h2>{greeting}</h2>

      <p>
        I'm GI.
        <br />
        Your Personal AI Study Companion.
        <br />
        <br />
        What would you like to learn today?
      </p>
    </>
  );
}

export default Header;