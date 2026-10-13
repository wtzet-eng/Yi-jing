import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import QuestionInput from "@/components/QuestionInput";
import HexagramLines from "@/components/HexagramLines";
import HexagramCard from "@/components/HexagramCard";
import ChangingLines from "@/components/ChangingLines";
import PresenceSession from "@/components/PresenceSession";
import InstallButton from "@/components/InstallButton";
import { useDarkMode, useServiceWorker } from "@/lib/hooks";
import { linesToHexagramNumber, transformedHexagramNumber } from "@/lib/casting";
import { VIDEOS } from "@/data/videos";

function rollLine(): number {
  // Three coins per line: each coin is 2 (tails) or 3 (heads).
  const a = Math.floor(Math.random() * 2) + 2;
  const b = Math.floor(Math.random() * 2) + 2;
  const c = Math.floor(Math.random() * 2) + 2;
  return a + b + c;
}

export default function App() {
  useServiceWorker();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [question, setQuestion] = useState("");
  const [isCasting, setIsCasting] = useState(false);
  const [lines, setLines] = useState<number[] | null>(null);
  const [hexagramNumber, setHexagramNumber] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [transformedNumber, setTransformedNumber] = useState<number | null>(null);
  const [showTransformed, setShowTransformed] = useState(false);
  const [noChangingLines, setNoChangingLines] = useState(false);

  const castHexagram = async () => {
    setIsCasting(true);
    setLines(null);
    setHexagramNumber(null);
    setSelectedLine(null);
    setTransformedNumber(null);
    setShowTransformed(false);
    setNoChangingLines(false);
    await new Promise((r) => setTimeout(r, 2000));
    const rolled: number[] = [];
    for (let i = 0; i < 6; i++) rolled.push(rollLine());
    setLines(rolled);
    setHexagramNumber(linesToHexagramNumber(rolled));
    setIsCasting(false);
  };

  const handleSelectLine = (position: number) => {
    setSelectedLine(position);
    if (lines) {
      const transformed = transformedHexagramNumber(lines);
      setTransformedNumber(transformed);
    }
    setShowTransformed(true);
  };

  const handleNoChangingLines = () => {
    setNoChangingLines(true);
    setShowTransformed(true);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-300" : "bg-white text-gray-700"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1
            className={`text-2xl mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
          >
            Synchronicity Awareness Practice (Yijing)
          </h1>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              onClick={toggleDarkMode}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                darkMode
                  ? "border-gray-600 text-gray-400 hover:text-gray-300"
                  : "border-gray-300 text-gray-500 hover:text-gray-700"
              }`}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <InstallButton darkMode={darkMode} />
          </div>
        </motion.div>

        {!hexagramNumber && !isCasting && (
          <QuestionInput question={question} setQuestion={setQuestion} darkMode={darkMode} />
        )}

        {!isCasting && !hexagramNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <Button
              onClick={castHexagram}
              className={`px-8 py-3 ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-500 text-gray-100"
                  : "bg-gray-800 hover:bg-gray-900 text-white"
              }`}
            >
              Cast Hexagram
            </Button>
          </motion.div>
        )}

        {isCasting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-8">
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>exhale long</p>
          </motion.div>
        )}

        <AnimatePresence>
          {hexagramNumber && lines && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {question && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-1">Your Question</p>
                  <p className="text-gray-700">"{question}"</p>
                </div>
              )}
              <HexagramLines lines={lines} hexagramNumber={hexagramNumber} darkMode={darkMode} />
              <HexagramCard hexagramNumber={hexagramNumber} darkMode={darkMode} />
              <ChangingLines
                lines={lines}
                selectedLine={selectedLine}
                onSelectLine={handleSelectLine}
                onNoChangingLines={handleNoChangingLines}
                darkMode={darkMode}
                hexagramNumber={hexagramNumber}
              />
              {showTransformed && (
                <div className="space-y-12">
                  {transformedNumber && selectedLine && !noChangingLines && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`pt-12 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <h3
                        className={`text-xl text-center mb-8 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Transformed Hexagram
                      </h3>
                      <HexagramCard hexagramNumber={transformedNumber} isTransformed darkMode={darkMode} />
                    </motion.div>
                  )}
                  <PresenceSession
                    hexagramNumber={hexagramNumber}
                    changingLine={selectedLine}
                    transformedNumber={transformedNumber}
                    question={question}
                    noChangingLines={noChangingLines}
                    darkMode={darkMode}
                  />
                </div>
              )}
              <div className="flex justify-center mt-8">
                <Button
                  onClick={castHexagram}
                  className={`px-6 py-2 text-sm ${
                    darkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-gray-100"
                      : "bg-gray-800 hover:bg-gray-900 text-white"
                  }`}
                >
                  Cast Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hexagramNumber && (
          <div className="flex justify-center mt-8 mb-8">
            <a
              href={VIDEOS[hexagramNumber]}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                  : "bg-gray-800 hover:bg-gray-900 text-white"
              }`}
            >
              <span>▶️</span> Watch Video
            </a>
          </div>
        )}

        <div
          className={`text-center mt-12 pt-6 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <a
            href="https://zuqu.netlify.app/#session"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-base font-medium underline ${
              darkMode
                ? "text-gray-300 hover:text-gray-100"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            AI presence session
          </a>
        </div>
        <div className="text-center mt-4">
          <a
            href="/privacy.html"
            className={`text-sm underline underline-offset-4 ${
              darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
