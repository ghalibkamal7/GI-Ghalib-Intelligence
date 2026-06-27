function Navbar({ user }) {
  const hour = new Date().getHours();

  let greeting = "Hello";

  if (hour < 12) greeting = "Good Morning ☀️";
  else if (hour < 17) greeting = "Good Afternoon 🌤️";
  else greeting = "Good Evening 🌙";

  return (
    <div className="navbar">

      <div>

        <h2>{greeting}, {user?.displayName}</h2>

        <p>Learn Smarter with GI</p>

      </div>

      <img
        src={user?.photoURL}
        alt="Profile"
        className="profile-img"
      />

    </div>
  );
}

export default Navbar;