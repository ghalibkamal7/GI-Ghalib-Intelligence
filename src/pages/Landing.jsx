import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GILogo from "../components/GILogo";

const FEATURES = [
  { icon: "⚡", title: "Real-time Streaming", desc: "Responses appear word by word — just like thinking out loud." },
  { icon: "🎙️", title: "Voice Mode", desc: "Speak your question. GI listens and replies in your language." },
  { icon: "🃏", title: "AI Flashcards", desc: "Enter any topic. GI generates 8 study cards instantly." },
  { icon: "🎯", title: "Focus Timer", desc: "Pomodoro timer built-in. Study smarter, not longer." },
  { icon: "🇮🇳", title: "Hinglish Mode", desc: "Chat in Hindi-English mix. GI replies the same way." },
  { icon: "📊", title: "Study Analytics", desc: "Weekly charts of your learning activity." },
  { icon: "📌", title: "Pin Messages", desc: "Save any GI reply for quick reference later." },
  { icon: "🎨", title: "Mood Themes", desc: "App accent color shifts based on conversation mood." },
];

const TESTIMONIALS = [
  { name: "Arjun S.", role: "IIT Student", text: "GI helped me crack my DSA prep in half the time. The flashcards are insane." },
  { name: "Priya M.", role: "Class 12 Student", text: "Finally an AI that talks like a friend. Hinglish mode is my favourite feature." },
  { name: "Rahul K.", role: "Developer", text: "The code debugging feature is better than Stack Overflow for me." },
];

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* BG blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <GILogo size={32} animate={true} spinning={false} />
          <span className="font-bold text-white text-sm">Ghalib Intelligence</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          Get Started →
        </motion.button>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }} className="mb-8">
          <GILogo size={120} animate={true} spinning={false} glow />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="mb-3">
          <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            🚀 The Future of AI Learning
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl sm:text-7xl font-bold mb-4 leading-tight">
          <span className="text-gradient">Learn Smarter</span>
          <br />
          <span className="text-white">With GI</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          Ghalib Intelligence is your personal AI companion — built for students, developers, and curious minds.
          Chat, learn, and grow — in English or Hinglish.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }} className="flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
            Start for Free →
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 rounded-2xl glass border border-white/10 text-slate-300 font-medium text-base hover:text-white transition-all cursor-pointer">
            See Features ↓
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex flex-wrap gap-8 justify-center mt-16">
          {[
            { num: "8+", label: "Unique Features" },
            { num: "100%", label: "Free to Use" },
            { num: "∞", label: "Conversations" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-gradient">{s.num}</p>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm uppercase tracking-widest mb-3">What makes GI different</p>
          <h2 className="text-4xl font-bold">Features built for <span className="text-gradient">real learners</span></h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-5 border border-white/[0.07] hover:border-indigo-500/30 transition-all group">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1.5 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Loved by <span className="text-gradient">students</span></h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 border border-white/[0.07]">
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-white text-sm font-medium">{t.name}</p>
                <p className="text-slate-600 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GILogo size={72} animate={true} spinning={false} />
          <h2 className="text-4xl font-bold mt-6 mb-4">Ready to learn smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of students using GI every day.</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-all shadow-xl shadow-indigo-500/25 cursor-pointer glow">
            Start for Free →
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GILogo size={24} animate={false} spinning={false} />
          <span className="text-slate-600 text-sm">Ghalib Intelligence © 2025</span>
        </div>
        <p className="text-slate-700 text-xs">Built with ❤️ by Ghalib Kamal</p>
      </footer>
    </div>
  );
}

export default Landing;