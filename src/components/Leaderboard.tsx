import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, Flame, Zap } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { cn } from "../lib/utils";

export default function Leaderboard({ user }: { user: any }) {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaders(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <Trophy className="w-7 h-7 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Hall of Fame</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Global Rankings</p>
        </div>
      </div>

      <div className="space-y-3">
        {leaders.map((leader, i) => (
          <div 
            key={leader.uid}
            className={cn(
              "p-4 rounded-3xl border flex items-center justify-between transition-all",
              leader.uid === user.uid ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/10"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {i === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> : 
                 i === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                 i === 2 ? <Medal className="w-6 h-6 text-orange-700" /> :
                 <span className="text-gray-500 font-bold">#{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/20">
                <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} alt="" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="font-bold text-sm">{leader.displayName}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    {leader.streak || 0}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                    <Zap className="w-3 h-3 fill-blue-500" />
                    Lvl {leader.level || 1}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black tracking-tighter">{leader.xp.toLocaleString()}</p>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">XP Points</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
