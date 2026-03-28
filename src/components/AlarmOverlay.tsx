import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Bell, Zap, Brain, Smartphone, Camera, Check, X, Loader2, Fingerprint, ShieldCheck } from "lucide-react";
import { db } from "../firebase";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { cn } from "../lib/utils";
import { verifySelfie } from "../services/geminiService";

export default function AlarmOverlay({ alarm, onDismiss, user, userData }: { alarm: any, onDismiss: () => void, user: any, userData: any }) {
  const [challenge, setChallenge] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (alarm.difficulty === "medium") {
      const num1 = Math.floor(Math.random() * 20) + 10;
      const num2 = Math.floor(Math.random() * 20) + 10;
      setChallenge({ type: "math", q: `${num1} + ${num2}`, a: (num1 + num2).toString() });
    } else if (alarm.difficulty === "hard") {
      setChallenge({ type: "selfie" });
      startCamera();
    } else if (alarm.difficulty === "biometric") {
      setChallenge({ type: "biometric" });
    }
  }, [alarm]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsVerifying(true);
    const context = canvasRef.current.getContext("2d");
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64Image = canvasRef.current.toDataURL("image/jpeg").split(",")[1];
      
      try {
        const isValid = await verifySelfie(base64Image);
        if (isValid) {
          stopCamera();
          handleDismiss();
        } else {
          setError(true);
          setTimeout(() => setError(false), 2000);
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      // Fallback for browsers without WebAuthn
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        handleDismiss();
      }, 2000);
      return;
    }

    try {
      setIsVerifying(true);
      setPermissionError(null);
      // Simple WebAuthn get request to trigger biometric prompt
      // Note: This is a simplified version for demonstration.
      // In a real app, you'd verify a registered credential.
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [] // This will trigger a general biometric check on some platforms
        }
      });
      
      handleDismiss();
    } catch (err: any) {
      console.error("Biometric error:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("feature is not enabled")) {
        setPermissionError("Biometrics are blocked in this frame. Please open the app in a new tab to use this feature.");
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = async () => {
    if (challenge?.type === "math" && answer !== challenge.a) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }

    // Update user stats
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      xp: increment(alarm.difficulty === 'hard' ? 50 : alarm.difficulty === 'medium' ? 25 : 10),
      streak: increment(1),
      lastWakeUp: new Date().toISOString()
    });

    // Log activity
    await addDoc(collection(db, "activityLogs"), {
      userId: user.uid,
      timestamp: new Date().toISOString(),
      type: "wake",
      difficulty: alarm.difficulty,
      alarmId: alarm.id
    });

    onDismiss();
  };

  const handleShake = () => {
    if (shakeCount + 1 >= challenge.goal) {
      handleDismiss();
    } else {
      setShakeCount(prev => prev + 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center"
    >
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.5)]"
      >
        <Bell className="w-12 h-12 text-black fill-black" />
      </motion.div>

      <h1 className="text-6xl font-black mb-2 tracking-tighter">{alarm.time}</h1>
      <p className="text-orange-500 font-bold uppercase tracking-widest mb-12">{alarm.label || "Wake Up, Beast!"}</p>

      <div className="w-full max-w-xs space-y-6">
        {challenge?.type === "biometric" && (
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
              <Fingerprint className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Biometric Identity</span>
            </div>
            
            <div className="relative w-24 h-24 mx-auto">
              <motion.div 
                animate={isVerifying ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"
              />
              <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                <Fingerprint className={cn("w-12 h-12 transition-colors", isVerifying ? "text-purple-500" : "text-gray-500")} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">Verify Identity</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Touch sensor to dismiss</p>
              {permissionError && (
                <p className="text-[10px] text-red-500 font-bold mt-2 leading-tight">
                  {permissionError}
                </p>
              )}
            </div>

            <button 
              onClick={handleBiometric}
              disabled={isVerifying}
              className="w-full bg-purple-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isVerifying ? "Verifying..." : "Scan Fingerprint"}
            </button>
          </div>
        )}

        {challenge?.type === "selfie" && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Selfie Verification</span>
            </div>
            
            <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover mirror"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isVerifying && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Analyzing...</span>
                </div>
              )}

              {error && !isVerifying && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold">
                    Face not detected. Try again!
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={captureAndVerify}
              disabled={isVerifying || !cameraActive}
              className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Capture & Verify"}
            </button>
          </div>
        )}

        {challenge?.type === "math" && (
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Brain className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Math Challenge</span>
            </div>
            <div className="text-3xl font-bold">{challenge.q} = ?</div>
            <input 
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-xl focus:outline-none focus:border-orange-500"
            />
          </motion.div>
        )}

        {challenge?.type === "shake" && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
              <Smartphone className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Shake Detection</span>
            </div>
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="60" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * shakeCount) / challenge.goal}
                  className="text-orange-500 transition-all duration-200"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{shakeCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Shakes</span>
              </div>
            </div>
            <button 
              onClick={handleShake}
              className="w-full bg-white/10 py-3 rounded-xl font-bold text-sm"
            >
              Tap to Shake (Simulated)
            </button>
          </div>
        )}

        <button 
          onClick={handleDismiss}
          disabled={challenge?.type === "selfie" || challenge?.type === "biometric"}
          className={cn(
            "w-full bg-orange-500 text-black font-black py-5 rounded-2xl text-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all",
            (challenge?.type === "selfie" || challenge?.type === "biometric") && "hidden"
          )}
        >
          {challenge ? "Solve to Dismiss" : "Dismiss Alarm"}
        </button>

        <button className="text-gray-500 font-bold text-sm hover:text-gray-400">
          Snooze (Penalty: -10 XP)
        </button>
      </div>
    </motion.div>
  );
}
