import React, { useState, useEffect, useRef } from 'react';
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';
import { Camera, Zap, Info, AlertCircle, CheckCircle, XCircle, Search, RefreshCw, Smartphone, ChevronRight, ArrowLeft, LogOut, User, Lock, Mail, Loader2, Save, Activity, UserPlus, SkipForward } from 'lucide-react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * ------------------------------------------------------------------
 * FIREBASE CONFIGURATION
 * ------------------------------------------------------------------
 */
const firebaseConfig = {
  apiKey: "AIzaSyB0qsFhnVpqog08HCmUIi7FpkdkV6O09Kc",
  authDomain: "ai-recognition-of-food-gi-gl.firebaseapp.com",
  projectId: "ai-recognition-of-food-gi-gl",
  storageBucket: "ai-recognition-of-food-gi-gl.firebasestorage.app",
  messagingSenderId: "21245340258",
  appId: "1:21245340258:web:6b11036056fdf5b82bbf3b",
  measurementId: "G-TJLYS2NG7L"
};

// Initialize Firebase
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init failed:", e);
}

/**
 * ------------------------------------------------------------------
 * MASSIVE FOOD DATABASE
 * ------------------------------------------------------------------
 */
const FOOD_DB = {
  // --- COMMON STAPLES ---
  "bread_white": { name: "White Bread", gi: 75, gl: 10, serving: "1 slice", tips: "High GI. Causes rapid spikes. Switch to whole grain." },
  "bread_wheat": { name: "Whole Wheat Bread", gi: 50, gl: 9, serving: "1 slice", tips: "Better fiber content than white bread. Good choice." },
  "bread_sourdough": { name: "Sourdough Bread", gi: 54, gl: 8, serving: "1 slice", tips: "Fermentation lowers the GI. Excellent option." },
  "oats": { name: "Oats (Rolled/Porridge)", gi: 55, gl: 13, serving: "1 cup cooked", tips: "Great source of beta-glucan fiber. Stabilizes sugar." },
  "egg": { name: "Egg (Boiled/Poached)", gi: 0, gl: 0, serving: "1 large", tips: "Zero GI. Pure protein/fat. Perfect for diabetics." },
  "milk": { name: "Milk (Whole)", gi: 39, gl: 4, serving: "1 cup", tips: "Low GI but contains natural sugar (lactose)." },
  "yogurt": { name: "Yogurt (Plain/Greek)", gi: 14, gl: 2, serving: "1 cup", tips: "Excellent low GI snack. Avoid sweetened versions." },
  "cheese": { name: "Cheese", gi: 0, gl: 0, serving: "50g", tips: "No carbs. Good for slowing down sugar absorption." },
  "rice_white": { name: "White Rice (Cooked)", gi: 73, gl: 43, serving: "1 cup (150g)", tips: "High GI. Watch portions carefully. Pair with fiber/protein." },
  "rice_brown": { name: "Brown Rice", gi: 68, gl: 23, serving: "1 cup", tips: "Better than white rice due to fiber content." },
  "pasta_white": { name: "Pasta (White)", gi: 50, gl: 23, serving: "1 cup cooked", tips: "Cook 'Al Dente' (firm) to keep GI lower." },
  
  // --- INDIAN FOODS ---
  "roti": { name: "Roti (Whole Wheat)", gi: 62, gl: 15, serving: "1 medium", tips: "Moderate GI. Eat with dal or sabzi to lower impact." },
  "chapati": { name: "Chapati", gi: 52, gl: 12, serving: "1 medium", tips: "Lower GI than white bread. Good staple." },
  "dal": { name: "Dal (Lentil Curry)", gi: 29, gl: 5, serving: "1 bowl", tips: "Excellent! Very low GI and high protein." },
  "idli": { name: "Idli", gi: 60, gl: 12, serving: "2 pieces", tips: "Steamed and healthy, but moderate GI due to rice." },
  "dosa": { name: "Dosa (Plain)", gi: 77, gl: 20, serving: "1 medium", tips: "High GI. Masala dosa (with potato) is even higher." },
  "paneer": { name: "Paneer (Cheese)", gi: 30, gl: 0, serving: "100g", tips: "Low carb, high fat/protein. Great for blood sugar control." },
  "chana": { name: "Chana Masala (Chickpeas)", gi: 28, gl: 8, serving: "1 cup", tips: "Low GI superfood. Very filling." },
  "poha": { name: "Poha (Flattened Rice)", gi: 70, gl: 15, serving: "1 bowl", tips: "High GI. Add lots of veggies and peanuts to lower it." },
  "upma": { name: "Upma (Semolina)", gi: 68, gl: 14, serving: "1 bowl", tips: "Moderate. Semolina (Rava) is refined wheat." },
  "samosa": { name: "Samosa", gi: 75, gl: 18, serving: "1 piece", tips: "High GI and high fat. Occasional treat only." },
  "biryani": { name: "Biryani (Chicken)", gi: 60, gl: 25, serving: "1 cup", tips: "Mixed GI. Rice raises sugar, but chicken/fat slows it down." },
  "naan": { name: "Naan (Butter)", gi: 71, gl: 20, serving: "1 piece", tips: "Refined flour (Maida) causes spikes. Avoid if possible." },
  "rajma": { name: "Rajma (Kidney Beans)", gi: 24, gl: 6, serving: "1 cup", tips: "Excellent low GI choice." },
  "butter_chicken": { name: "Butter Chicken", gi: 58, gl: 10, serving: "1 small bowl", tips: "High fat slows sugar absorption." },

  // --- FRUITS ---
  "apple": { name: "Apple", gi: 36, gl: 6, serving: "1 medium", tips: "Always eat with skin for fiber." },
  "banana": { name: "Banana", gi: 51, gl: 13, serving: "1 medium", tips: "Moderate. Eat with nuts to slow absorption." },
  "orange": { name: "Orange", gi: 43, gl: 5, serving: "1 medium", tips: "Avoid juice. Eat the whole fruit." },
  "mango": { name: "Mango", gi: 51, gl: 8, serving: "1 cup sliced", tips: "Borderline. Always eat with protein (nuts/yogurt)." },
  "watermelon": { name: "Watermelon", gi: 72, gl: 5, serving: "1 cup", tips: "High GI, Low GL. Don't eat alone." },
  "papaya": { name: "Papaya", gi: 60, gl: 9, serving: "1 cup", tips: "Medium GI. Digestive enzymes help metabolism." },
  "grape": { name: "Grapes", gi: 53, gl: 5, serving: "1 cup", tips: "Monitor portion. Easy to overeat." },
};

// --- Helper Functions ---
const getGILevel = (gi) => {
  if (gi <= 55) return { label: 'Safe (Low)', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle };
  if (gi <= 69) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: AlertCircle };
  return { label: 'Caution (High)', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle };
};

export default function App() {
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [imageURL, setImageURL] = useState(null);
  const [results, setResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [view, setView] = useState('auth'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth & Profile State
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // Profile Data - Initialized to null to represent "No Profile Yet"
  const [profile, setProfile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- AUTH LISTENERS ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if profile exists
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
            setView('home'); // Has profile -> Go to home
          } else {
            setProfile(null);
            setView('welcome'); // No profile -> Go to Welcome Screen
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setView('home'); // Fail safe
        }
      } else {
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- PROFILE LOGIC ---
  const calculateGLTarget = (type, activity) => {
    let baseGL = 100;
    
    // 1. Base on Condition
    if (type === 'Type 1') baseGL = 80;
    else if (type === 'Type 2') baseGL = 100;
    else if (type === 'Pre-diabetic') baseGL = 110;
    else if (type === 'Non-diabetic') baseGL = 130;

    // 2. Adjust for Activity
    if (activity === 'Sedentary (0 days)') baseGL += 0;
    else if (activity === 'Light (1-3 days)') baseGL += 15;
    else if (activity === 'Moderate (3-5 days)') baseGL += 30;
    else if (activity === 'Very Active (6-7 days)') baseGL += 45;

    return baseGL;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    const target = calculateGLTarget(profile.diabetesType, profile.activityLevel);
    const newProfile = { ...profile, dailyGLTarget: target };
    setProfile(newProfile);

    try {
      if (user) {
        await setDoc(doc(db, "users", user.uid), newProfile);
        // Removed alert for smoother experience
        setView('home');
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert(`Profile saved locally (enable Firestore to save permanently). Target GL: ${target}`);
      setView('home');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startProfileCreation = () => {
    // Initialize default profile values before going to form
    setProfile({
        age: '',
        diabetesType: 'Type 2',
        activityLevel: 'Light',
        dailyGLTarget: 100
    });
    setView('profile');
  };

  const skipProfile = () => {
      // User chose to skip. We keep profile as null so no card shows.
      setProfile(null);
      setView('home');
  };

  // --- AUTH HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName: displayName });
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setView('auth');
      setImageURL(null);
      setResults(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // --- AI MODEL ---
  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Failed to load model:", error);
        setIsModelLoading(false);
      }
    }
    loadModel();
  }, []);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setView('camera');
    setCameraError(null);
    setResults(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } else {
        throw new Error("Camera API not supported");
      }
    } catch (err) {
      setCameraError("Could not access camera. Check permissions or use HTTPS.");
    }
  };

  const identify = async (imgElement) => {
    if (!model) {
        alert("AI Model is still loading...");
        return;
    }
    setIsScanning(true);
    try {
      const predictions = await model.classify(imgElement);
      processResults(predictions);
    } catch (err) {
      alert("Error identifying image");
    } finally {
      setIsScanning(false);
    }
  };

  const processResults = (predictions) => {
    const foundItem = predictions.find(p => {
      const className = p.className.toLowerCase();
      return Object.keys(FOOD_DB).some(dbKey => {
         const foodName = FOOD_DB[dbKey].name.toLowerCase().split(' ')[0]; 
         if (dbKey === 'roti' || dbKey === 'chapati' || dbKey === 'naan' || dbKey.includes('bread')) {
            if (className.includes('bread') || className.includes('dough') || className.includes('bakery')) return true;
         }
         return className.includes(foodName) || className.includes(dbKey.replace('_', ' '));
      });
    });

    if (foundItem) {
      const className = foundItem.className.toLowerCase();
      let matchKey = null;
      if (className.includes('bread') || className.includes('dough') || className.includes('bakery')) {
          matchKey = 'bread_white'; 
      } else {
        for (const [dbKey, data] of Object.entries(FOOD_DB)) {
            if (className.includes(dbKey) || className.includes(data.name.toLowerCase().split('(')[0].trim())) {
                matchKey = dbKey;
                break;
            }
        }
      }
      if (matchKey) {
          setResults({ type: 'found', data: FOOD_DB[matchKey], confidence: foundItem.probability });
      } else {
          setResults({ type: 'unknown', raw: predictions[0].className });
      }
    } else {
      setResults({ type: 'unknown', raw: predictions[0].className });
    }
    setView('result');
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      if (!model) { alert("AI loading..."); return; }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg');
      setImageURL(url);
      const img = new Image();
      img.src = url;
      img.onload = () => identify(img);
    }
  };

  const handleManualSelect = (key) => {
    setResults({ type: 'found', data: FOOD_DB[key], confidence: 1 });
    setView('result');
  };

  // --- VIEWS ---
  if (view === 'auth' && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300" />
            </div>
            <h1 className="text-3xl font-bold text-white">Glyco Calculator</h1>
            <p className="text-emerald-100 mt-2">Your diabetic food companion</p>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
            {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && <div className="relative"><User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="text" placeholder="Full Name" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>}
              <div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="email" placeholder="Email Address" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="password" placeholder="Password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <button type="submit" disabled={isAuthLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center">{isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? 'Sign In' : 'Sign Up')}</button>
            </form>
            <div className="mt-6 text-center"><button onClick={() => setIsLoginMode(!isLoginMode)} className="text-slate-500 text-sm hover:text-emerald-600 font-medium">{isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button></div>
          </div>
        </div>
      </div>
    );
  }

  // --- WELCOME / SETUP VIEW ---
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
          <p className="text-slate-500 mb-8">
            Tell us about your age, condition, and activity level so we can calculate a personalized Glycemic Load target for you.
          </p>
          
          <button 
            onClick={startProfileCreation}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 mb-4"
          >
            Create Profile
          </button>
          
          <button 
            onClick={skipProfile}
            className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-4 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            Skip for Now <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- PROFILE FORM VIEW ---
  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-10">
        <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50 flex items-center gap-3">
          <button onClick={() => setView(user ? 'home' : 'welcome')}><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">My Profile</h1>
        </header>
        <main className="max-w-md mx-auto p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">
                {user?.displayName?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.displayName || "User"}</h2>
                <p className="text-slate-500 text-sm">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input type="number" placeholder="e.g. 45" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={profile?.age || ''} onChange={(e) => setProfile({...profile, age: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Diabetes Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Type 1', 'Type 2', 'Pre-diabetic', 'Non-diabetic'].map((type) => (
                    <button key={type} type="button" onClick={() => setProfile({...profile, diabetesType: type})} className={`p-3 rounded-xl border text-sm font-medium transition-all ${profile?.diabetesType === type ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{type}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Activity Level</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={profile?.activityLevel || 'Light'} onChange={(e) => setProfile({...profile, activityLevel: e.target.value})}>
                  <option value="Sedentary (0 days)">Sedentary (Little/No Exercise)</option>
                  <option value="Light (1-3 days)">Light (1-3 days/week)</option>
                  <option value="Moderate (3-5 days)">Moderate (3-5 days/week)</option>
                  <option value="Very Active (6-7 days)">Very Active (6-7 days/week)</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">Based on your selection, we will calculate a recommended Daily Glycemic Load limit for you.</p>
              </div>

              <button type="submit" disabled={isSavingProfile} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // --- HOME VIEW ---
  const filteredFoods = Object.entries(FOOD_DB).filter(([key, food]) => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-10">
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('home'); setResults(null); setImageURL(null); }}>
            <Zap className="w-6 h-6 fill-yellow-300 stroke-yellow-300" />
            <h1 className="text-xl font-bold tracking-tight">Glyco Calculator</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={startProfileCreation} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-full transition-colors">
               <User className="w-4 h-4 text-white" />
               <span className="text-xs font-medium text-white hidden sm:inline-block">
                 {user?.displayName || "Profile"}
               </span>
             </button>
             <button onClick={handleSignOut} title="Sign Out">
               <LogOut className="w-5 h-5 text-emerald-100 hover:text-white" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* DAILY GL TARGET CARD - ONLY SHOWS IF PROFILE EXISTS */}
        {view === 'home' && profile && profile.dailyGLTarget > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <Activity className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/10" />
            <p className="text-blue-100 text-sm font-medium mb-1">Your Recommended Limit</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold">{profile.dailyGLTarget}</h3>
              <span className="text-sm opacity-80">Daily Glycemic Load</span>
            </div>
            <div className="mt-4 flex gap-2 text-xs bg-white/20 p-2 rounded-lg inline-flex backdrop-blur-sm">
              <span>Type: {profile.diabetesType}</span>
              <span>•</span>
              <span>{profile.activityLevel.split(' ')[0]} Active</span>
            </div>
          </div>
        )}

        {!isModelLoading && view === 'home' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Food</h2>
              <p className="text-slate-500 mb-6">Scan fruits or Indian dishes via camera, or search our database.</p>
              
              <button onClick={startCamera} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200">
                <Camera className="w-6 h-6" /> Start Scanner
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search Roti, Rice, Apple..." className="bg-transparent w-full outline-none text-slate-700 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filteredFoods.map(([key, food]) => (
                  <button key={key} onClick={() => handleManualSelect(key)} className="w-full text-left p-4 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex items-center justify-between group">
                    <div>
                      <span className="font-medium text-slate-700">{food.name}</span>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${getGILevel(food.gi).bg} ${getGILevel(food.gi).color}`}>GI: {food.gi}</span>
                        <span className="text-slate-400">GL: {food.gl}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden">
              <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
                 <button onClick={resetApp} className="text-white p-2 bg-black/30 rounded-full backdrop-blur-md"><ArrowLeft className="w-6 h-6" /></button>
              </div>
              {cameraError ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-white text-lg mb-6">{cameraError}</p>
                  <button onClick={() => document.getElementById('file-upload').click()} className="bg-white text-black px-6 py-3 rounded-lg font-medium">Upload Photo Instead</button>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files[0]) { const url = URL.createObjectURL(e.target.files[0]); setImageURL(url); const img = new Image(); img.src = url; img.onload = () => identify(img); } }} />
                </div>
              ) : (
                <div className="relative w-full h-full" onClick={captureImage}>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
                      </div>
                      <p className="absolute bottom-32 text-white/80 font-medium bg-black/30 px-4 py-1 rounded-full backdrop-blur-md">Tap anywhere to scan</p>
                    </div>
                </div>
              )}
            </div>
            {!cameraError && <div className="bg-black p-8 flex justify-center items-center pb-12"><button onClick={captureImage} disabled={isScanning} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">{isScanning ? <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" /> : <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />}</button></div>}
          </div>
        )}

        {view === 'result' && results && (
          <div className="animate-fade-in space-y-4">
            <button onClick={resetApp} className="text-slate-500 flex items-center gap-2 mb-2 hover:text-emerald-600 transition-colors"><ArrowLeft className="w-5 h-5" /> Back to Scanner</button>
            {imageURL && <div className="w-full h-48 bg-slate-200 rounded-2xl overflow-hidden shadow-inner relative"><img src={imageURL} alt="Scanned" className="w-full h-full object-cover" /></div>}
            {results.type === 'found' ? (
              <div className={`bg-white rounded-3xl p-6 shadow-sm border-2 ${getGILevel(results.data.gi).border}`}>
                <div className="flex items-start justify-between mb-6">
                  <div><span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Analyzed</span><h2 className="text-2xl font-bold text-slate-800 leading-tight">{results.data.name}</h2></div>
                  {React.createElement(getGILevel(results.data.gi).icon, { className: `w-12 h-12 ${getGILevel(results.data.gi).color}` })}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${getGILevel(results.data.gi).bg} bg-opacity-50`}><p className="text-sm text-slate-500 mb-1">Glycemic Index</p><p className={`text-3xl font-bold ${getGILevel(results.data.gi).color}`}>{results.data.gi}</p><p className="text-xs font-medium text-slate-600 mt-1">{getGILevel(results.data.gi).label}</p></div>
                  <div className="p-4 rounded-2xl bg-slate-50"><p className="text-sm text-slate-500 mb-1">Glycemic Load</p><p className="text-3xl font-bold text-slate-700">{results.data.gl}</p><p className="text-xs font-medium text-slate-400 mt-1">Per serving</p></div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm flex gap-3 items-start"><Info className="w-5 h-5 shrink-0 mt-0.5" /><div><span className="font-bold block text-xs uppercase tracking-wider mb-1 text-blue-400">Serving Size</span>{results.data.serving}</div></div>
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm flex gap-3 items-start"><Zap className="w-5 h-5 shrink-0 mt-0.5" /><div><span className="font-bold block text-xs uppercase tracking-wider mb-1 text-amber-400">Diabetic Tip</span>{results.data.tips}</div></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" /><h3 className="text-xl font-bold text-slate-800 mb-2">Not Recognized</h3><p className="text-slate-500 mb-6">AI detected: <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{results.raw}</span>.<br/>We couldn't confirm this in our database.</p>
                <button onClick={() => { setView('home'); setSearchTerm(''); }} className="text-emerald-600 font-bold hover:underline">Search Database Instead</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}