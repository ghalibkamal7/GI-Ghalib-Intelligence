import { motion } from "framer-motion";

const CATEGORIES = [
  {
    title: "🎓 Study & Learn",
    actions: [
      { label: "✨ GI Chat", prompt: "Hello! What can you help me with today?" },
      { label: "🎙️ GI Assistant", type: "assistant" },
      { label: "📄 PDF Analysis", prompt: "Help me summarize and analyze a document." },
      { label: "🧠 Smart Notes", prompt: "Help me create smart structured notes on a topic." },
      { label: "💻 Code Help", prompt: "I have a coding problem. Help me debug and fix it." },
      { label: "📅 Study Plan", prompt: "Create a focused study plan for today." },
      { label: "🧪 Quiz Me", prompt: "Create a 5-question quiz on a topic I choose." },
    ]
  },
  {
    title: "💼 Career & Growth",
    actions: [
      { label: "📝 Resume Review", prompt: "Help me improve my resume. I'll share the details." },
      { label: "🎤 Interview Prep", prompt: "Prepare me for a job interview. Ask me practice questions." },
      { label: "💡 Career Advice", prompt: "Give me career guidance based on my skills and interests." },
      { label: "🔗 LinkedIn Bio", prompt: "Write a professional LinkedIn bio for me." },
    ]
  },
  {
    title: "💙 Wellbeing",
    actions: [
      { label: "💭 Vent & Talk", prompt: "I need someone to talk to. I'm going through something difficult." },
      { label: "🧘 Calm Me Down", prompt: "Help me calm down. Guide me through a quick breathing exercise." },
      { label: "💪 Motivate Me", prompt: "I'm feeling low. Give me a powerful motivational message." },
      { label: "❤️ Self Care Tips", prompt: "Give me 5 practical self-care tips for today." },
    ]
  },
  {
    title: "🏥 Health",
    actions: [
      { label: "🍎 Diet Plan", prompt: "Create a healthy Indian diet plan for the day." },
      { label: "🏃 Workout Plan", prompt: "Create a 20-minute home workout plan for me." },
      { label: "😴 Sleep Tips", prompt: "Give me science-backed tips to improve my sleep quality." },
      { label: "🧬 Symptom Info", prompt: "I want to understand some health symptoms. Please help me understand them (not as medical advice)." },
    ]
  },
];

function QuickActions({ onAction, onAssistant, hidden }) {
  if (hidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="max-w-3xl mx-auto px-4 pb-8 w-full space-y-5"
    >
      {CATEGORIES.map((cat, ci) => (
        <div key={ci}>
          <p className="text-slate-600 text-xs uppercase tracking-widest mb-2 px-1">{cat.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cat.actions.map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => a.type === "assistant" ? onAssistant?.() : onAction(a.prompt)}
                className={`px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer text-left leading-snug border ${
                  a.type === "assistant"
                    ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-400/50 hover:bg-indigo-500/20"
                    : "text-slate-300 glass border-white/[0.08] hover:border-indigo-500/35 hover:text-indigo-300 hover:bg-indigo-500/10"
                }`}
              >
                {a.label}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export default QuickActions;