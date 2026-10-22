import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HEXAGRAMS } from "@/data/hexagrams";
import { isChangingLine } from "@/lib/iching";

interface Props {
  lines: number[];
  selectedLine: number | null;
  onSelectLine: (position: number) => void;
  onNoChangingLines: () => void;
  darkMode: boolean;
  hexagramNumber: number;
}

export default function ChangingLines({
  lines,
  selectedLine,
  onSelectLine,
  onNoChangingLines,
  darkMode,
  hexagramNumber,
}: Props) {
  const lineTexts = HEXAGRAMS[hexagramNumber]?.lines ?? {};
  const changing = lines
    .map((value, i) => ({ value, position: i + 1 }))
    .filter(({ value }) => isChangingLine(value));

  if (changing.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-2xl p-8 text-center ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
      >
        <BookOpen className={`w-10 h-10 mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
        <p className={`mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          No changing lines in this hexagram.
        </p>
        <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          The hexagram stands complete. Explore its wisdom through presence practice.
        </p>
        <Button
          onClick={onNoChangingLines}
          className={`px-8 py-4 ${darkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-100" : "bg-gray-800 hover:bg-gray-900 text-white"}`}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Begin Presence Practice
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-8 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
    >
      <h3 className={`text-xl mb-4 text-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
        Select Changing Line
      </h3>
      <p className={`text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        {changing.length === 1
          ? "Click to see the transformation"
          : `${changing.length} changing lines - select the dominant one`}
      </p>
      {changing.length > 1 && (
        <div className="mb-6">
          <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Choose the highest solid line (yang), or if none, the lowest broken line (yin)
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {changing.map(({ position, value }) => {
          const isYang = value === 9;
          const text = lineTexts[String(position)];
          return (
            <div key={position}>
              <Button
                onClick={() => onSelectLine(position)}
                className={`px-8 py-5 mb-2 ${
                  selectedLine === position
                    ? darkMode
                      ? "bg-gray-500 text-white"
                      : "bg-gray-800 text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Line {position} ({isYang ? "yang" : "yin"})
              </Button>
              {text && (
                <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {text}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {selectedLine && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Line {selectedLine} selected
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
