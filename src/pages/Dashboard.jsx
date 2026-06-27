import Layout from "../components/Layout";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import FeatureCard from "../components/FeatureCard";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  return (

    <Layout>

      <Navbar user={user} />

      <SearchBar placeholder="Search notes, PDFs, quizzes..." />

      <div className="feature-grid">

        <FeatureCard
          icon="🤖"
          title="AI Chat"
          subtitle="Ask GI anything"
          onClick={() => navigate("/ai")}
        />

        <FeatureCard
          icon="📄"
          title="PDF Chat"
          subtitle="Chat with PDFs"
        />

        <FeatureCard
          icon="📝"
          title="Smart Notes"
          subtitle="Generate Notes"
        />

        <FeatureCard
          icon="🧠"
          title="Quiz"
          subtitle="Practice Questions"
        />

        <FeatureCard
          icon="💻"
          title="Coding"
          subtitle="Programming Help"
        />

        <FeatureCard
          icon="📅"
          title="Study Planner"
          subtitle="Daily Goals"
        />

        <FeatureCard
          icon="📸"
          title="Image Solver"
          subtitle="Solve from Photo"
        />

        <FeatureCard
          icon="📈"
          title="Progress"
          subtitle="Track Learning"
        />

      </div>

    </Layout>

  );

}

export default Dashboard;