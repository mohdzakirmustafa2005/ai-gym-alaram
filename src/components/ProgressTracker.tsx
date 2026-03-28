import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, Calendar, Activity, Zap } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays } from "date-fns";

export default function ProgressTracker({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "activityLogs"), 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setLogs(data);

      // Prepare chart data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "MMM dd");
        const dayLogs = data.filter(log => format(new Date(log.timestamp), "MMM dd") === dateStr);
        return {
          name: dateStr,
          wakeups: dayLogs.length,
        };
      }).reverse();
      
      setChartData(last7Days);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold">Consistency</h1>

      <section className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold">Wake Up Frequency</h3>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWake" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#f97316' }}
              />
              <Area 
                type="monotone" 
                dataKey="wakeups" 
                stroke="#f97316" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWake)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Wakes</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Avg. Time</p>
          <p className="text-2xl font-bold">06:15</p>
        </div>
      </div>

      <section>
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {logs.slice(0, 5).map((log, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Woke Up Successfully</p>
                  <p className="text-[10px] text-gray-500">{format(new Date(log.timestamp), "MMM dd, hh:mm a")}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full uppercase">+{log.difficulty === 'hard' ? 50 : 25} XP</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
