function FeatureCard({ icon, title, subtitle, onClick }) {
  return (
    <div className="feature-card" onClick={onClick}>
      <div className="feature-icon">{icon}</div>

      <div className="feature-content">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default FeatureCard;