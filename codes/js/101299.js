// components/WhyChoose.jsx
import { motion } from "framer-motion";
import { Award, Shield, Zap, Code } from "lucide-react";

export default function WhyChoose({ darkMode }) {
  const perks = [
    {
      icon: <Award className="w-8 h-8 text-purple-600" />,
      title: "Smart Use of AI",
      description:
         "Built using ChatGPT Pro, Figma AI & Three.js — fast delivery, top-tier visuals, lower cost.",
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Zero-Risk Guarantee",
      description:
       "If it’s not the quality you expect, you get your money back — no risk, no hassle.",
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      title: "Lightning Fast",
      description:
        "Most websites are delivered in just 48 hours — no quality sacrificed.",
    },
    {
      icon: <Code className="w-8 h-8 text-green-600" />,
      title: "Clean Handoff",
      description:
        "Well-commented code + video guide for easy edits & long-term clarity.",
    },
  ];

  return (
    <section
      id="why_us?"
      className={`py-20 ${
        darkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900"
          : "bg-gradient-to-br from-purple-50 to-blue-50"
      }`}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6 text-center">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              CraftCore ?
            </span>
          </h2>

          <p
            className={`text-lg md:text-xl text-center max-w-2xl mx-auto mb-12 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            I'm not a giant agency. I’m one skilled builder leveraging{" "}
            <span className="text-purple-400 font-semibold">AI tools</span>{" "}
            smartly to give you{" "}
            <span className="text-blue-400 font-semibold">
              studio-quality websites
            </span>{" "}
            — <span className="text-green-400 font-semibold">fast</span>,{" "}
            <span className="text-yellow-400 font-semibold">affordable</span>,
            and{" "}
            <span className="text-pink-400 font-semibold">future-ready</span>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {perks.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className={`p-8 rounded-xl shadow-lg ${
                darkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div
                className={`w-14 h-14 mb-6 rounded-xl flex items-center justify-center ${
                  darkMode ? "bg-gray-700/50" : "bg-purple-100/50"
                }`}
              >
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p
                className={` text-justify ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
