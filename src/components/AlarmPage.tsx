import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Clock, Bell, Trash2, Power, ChevronRight, Check, Fingerprint, ShieldCheck } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { cn } from "../lib/utils";

export default function AlarmPage({ user }: { user: any }) {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    time: "06:00",
    days: [1, 2, 3, 4, 5],
    label: "Morning Workout",
    difficulty: "medium",
    enabled: true
  });

  useEffect(() => {
    const q = query(collection(db, "alarms"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const verifyBiometric = async () => {
    if (!biometricLock) return true;
    if (!window.PublicKeyCredential) return true;

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: []
        }
      });
      return true;
    } catch (err: any) {
      console.error("Biometric verification failed:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("feature is not enabled")) {
        alert("Biometrics are blocked in this frame. Please open the app in a new tab to use this feature.");
      }
      return false;
    }
  };

  const handleAddAlarm = async () => {
    if (!(await verifyBiometric())) return;
    await addDoc(collection(db, "alarms"), {
      ...newAlarm,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
    setIsAdding(false);
  };

  const toggleAlarm = async (alarm: any) => {
    if (!(await verifyBiometric())) return;
    await updateDoc(doc(db, "alarms", alarm.id), {
      enabled: !alarm.enabled
    });
  };

  const deleteAlarm = async (id: string) => {
    if (!(await verifyBiometric())) return;
    await deleteDoc(doc(db, "alarms", id));
  };

  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Smart Alarms</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setBiometricLock(!biometricLock)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              biometricLock ? "bg-purple-500/10 border-purple-500 text-purple-500" : "bg-white/5 border-white/10 text-gray-500"
            )}
            title="Biometric Lock for Settings"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {alarms.length === 0 && !isAdding && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No alarms set. Don't be lazy.</p>
          </div>
        )}

        {isAdding && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 border border-orange-500/30 p-6 rounded-3xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">New Alarm</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 text-sm">Cancel</button>
            </div>
            
            <input 
              type="time" 
              value={newAlarm.time}
              onChange={(e) => setNewAlarm({...newAlarm, time: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-4xl font-bold text-center text-orange-500 focus:outline-none focus:border-orange-500"
            />

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Repeat Days</label>
              <div className="flex justify-between">
                {days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newDays = newAlarm.days.includes(i) 
                        ? newAlarm.days.filter(d => d !== i)
                        : [...newAlarm.days, i];
                      setNewAlarm({...newAlarm, days: newDays});
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full font-bold text-sm transition-all",
                      newAlarm.days.includes(i) ? "bg-orange-500 text-black" : "bg-white/5 text-gray-500"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Difficulty</label>
              <div className="grid grid-cols-2 gap-2">
                {["easy", "medium", "hard", "biometric"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setNewAlarm({...newAlarm, difficulty: d})}
                    className={cn(
                      "py-2 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                      newAlarm.difficulty === d ? "bg-orange-500 border-orange-500 text-black" : "bg-white/5 border-white/10 text-gray-500"
                    )}
                  >
                    {d === 'biometric' && <Fingerprint className="w-3 h-3" />}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAddAlarm}
              className="w-full bg-orange-500 text-black font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20"
            >
              Save Alarm
            </button>
          </motion.div>
        )}

        {alarms.map((alarm) => (
          <div 
            key={alarm.id}
            className={cn(
              "p-6 rounded-3xl border transition-all flex items-center justify-between",
              alarm.enabled ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5 opacity-60"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold tracking-tighter">{alarm.time}</span>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1",
                  alarm.difficulty === 'hard' ? "bg-red-500/20 text-red-500" : 
                  alarm.difficulty === 'medium' ? "bg-orange-500/20 text-orange-500" : 
                  alarm.difficulty === 'biometric' ? "bg-purple-500/20 text-purple-500" : "bg-green-500/20 text-green-500"
                )}>
                  {alarm.difficulty === 'biometric' && <Fingerprint className="w-2 h-2" />}
                  {alarm.difficulty}
                </span>
              </div>
              <div className="flex gap-1">
                {days.map((day, i) => (
                  <span key={i} className={cn(
                    "text-[10px] font-bold",
                    alarm.days.includes(i) ? "text-orange-500" : "text-gray-700"
                  )}>
                    {day}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 font-medium">{alarm.label}</p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleAlarm(alarm)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all",
                  alarm.enabled ? "bg-orange-500" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  alarm.enabled ? "right-1" : "left-1"
                )} />
              </button>
              <button 
                onClick={() => deleteAlarm(alarm.id)}
                className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-600 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
