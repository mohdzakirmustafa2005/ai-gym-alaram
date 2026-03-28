import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Flame, Trophy, Zap, Calendar, ArrowRight, Dumbbell } from "lucide-react";
import { generateMotivation, generateWorkout } from "../services/geminiService";
import { cn } from "../lib/utils";
import Markdown from "react-markdown";

export default function Dashboard({ userData }: { userData: any }) {
  const [motivation, setMotivation] = useState("");
  const [workout, setWorkout] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mot, work] = await Promise.all([
          generateMotivation(userData?.streak || 0, false),
          generateWorkout(userData?.goals || ["Fitness"])
        ]);
        setMotivation(mot);
        setWorkout(work);
      } catch (error) {
        console.error("AI Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <section>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userData?.displayName?.split(" ")[0]}!</h1>
        <p className="text-gray-400">Ready to crush your goals today?</p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame className="w-5 h-5 fill-orange-500" />
            <span className="text-sm font-bold uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-3xl font-bold">{userData?.streak || 0} <span className="text-sm text-gray-500 font-normal">Days</span></div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Zap className="w-5 h-5 fill-blue-500" />
            <span className="text-sm font-bold uppercase tracking-wider">Level</span>
          </div>
          <div className="text-3xl font-bold">{userData?.level || 1} <span className="text-sm text-gray-500 font-normal">Pro</span></div>
        </div>
      </div>

      {/* AI Motivation Card */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-3xl text-black shadow-xl shadow-orange-500/20">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 fill-black" />
            <span className="text-xs font-black uppercase tracking-widest">Coach Motivation</span>
          </div>
          <p className="text-xl font-bold italic leading-tight">
            {loading ? "Thinking..." : `"${motivation}"`}
          </p>
        </div>
        <Dumbbell className="absolute -right-4 -bottom-4 w-32 h-32 text-black/10 rotate-12" />
      </section>

      {/* Workout of the Day */}
      <section className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-bold text-lg">Daily Workout</h3>
          </div>
          <span className="text-xs bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">AI Generated</span>
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
            </div>
          ) : (
            <div className="text-gray-300">
              <Markdown>{workout}</Markdown>
            </div>
          )}
        </div>

        <button className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
          Start Training <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Recent Achievements */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Badges</h3>
          <button className="text-orange-500 text-sm font-bold">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { icon: Flame, label: "Early Bird", color: "text-orange-500" },
            { icon: Trophy, label: "Beast Mode", color: "text-yellow-500" },
            { icon: Zap, label: "Consistent", color: "text-blue-500" },
          ].map((badge, i) => (
            <div key={i} className="flex-shrink-0 w-24 flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                <badge.icon className={cn("w-8 h-8", badge.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-500 text-center">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
