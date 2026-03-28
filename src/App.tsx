import React, { useState, useEffect } from "react";
import { auth, db, signIn, logOut } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { 
  Dumbbell, 
  AlarmClock, 
  MessageSquare, 
  TrendingUp, 
  Trophy, 
  LogOut, 
  Flame, 
  Plus, 
  Bell,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

// Components
import Dashboard from "./components/Dashboard";
import AlarmPage from "./components/AlarmPage";
import AICoach from "./components/AICoach";
import ProgressTracker from "./components/ProgressTracker";
import Leaderboard from "./components/Leaderboard";
import AlarmOverlay from "./components/AlarmOverlay";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const initialData = {
            uid: u.uid,
            displayName: u.displayName || "Athlete",
            email: u.email,
            photoURL: u.photoURL,
            xp: 0,
            level: 1,
            streak: 0,
            lastWakeUp: null,
            goals: ["Build Muscle", "Wake Up Early"]
          };
          await setDoc(userRef, initialData);
          setUserData(initialData);
        } else {
          setUserData(userSnap.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time alarm checker
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "alarms"), where("userId", "==", user.uid), where("enabled", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alarms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const interval = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay();

        const triggered = alarms.find((a: any) => {
          return a.time === currentTime && a.days.includes(currentDay);
        });

        if (triggered && !activeAlarm) {
          setActiveAlarm(triggered);
        }
      }, 1000);

      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, [user, activeAlarm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Dumbbell className="w-12 h-12 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20">
            <Dumbbell className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">GymAlarm <span className="text-orange-500">AI</span></h1>
          <p className="text-gray-400 mb-10 text-lg">The only alarm that forces you to be a beast. Wake up, workout, and win.</p>
          <button 
            onClick={signIn}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
          >
            <UserIcon className="w-5 h-5" />
            Start Your Journey
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", icon: Dumbbell, label: "Home" },
    { id: "alarms", icon: AlarmClock, label: "Alarms" },
    { id: "coach", icon: MessageSquare, label: "AI Coach" },
    { id: "progress", icon: TrendingUp, label: "Stats" },
    { id: "leaderboard", icon: Trophy, label: "Social" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">GymAlarm</h2>
            <span className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Pro Edition</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-bold text-sm">{userData?.streak || 0}</span>
          </div>
          <button onClick={logOut} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <LogOut className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && <Dashboard key="dashboard" userData={userData} />}
          {activeTab === "alarms" && <AlarmPage key="alarms" user={user} />}
          {activeTab === "coach" && <AICoach key="coach" user={user} />}
          {activeTab === "progress" && <ProgressTracker key="progress" user={user} />}
          {activeTab === "leaderboard" && <Leaderboard key="leaderboard" user={user} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 p-4 flex justify-around items-center z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === tab.id ? "text-orange-500" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "fill-orange-500/10")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-indicator"
                className="w-1 h-1 bg-orange-500 rounded-full mt-0.5"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Alarm Overlay */}
      <AnimatePresence>
        {activeAlarm && (
          <AlarmOverlay 
            alarm={activeAlarm} 
            onDismiss={() => setActiveAlarm(null)} 
            user={user}
            userData={userData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
