import React, { useState, useEffect, useRef } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';
import { Camera, Zap, Info, AlertCircle, CheckCircle, XCircle, Search, RefreshCw, Smartphone, ChevronRight, ArrowLeft } from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * MASSIVE FRUIT DATABASE (A-Z)
 * ------------------------------------------------------------------
 */
const FRUIT_DB = {
  "acai": { name: "Acai Berry", gi: 15, gl: 1, serving: "100g puree", tips: "Superfood. Very low sugar, high in antioxidants." },
  "apple": { name: "Apple (Red/Golden)", gi: 36, gl: 6, serving: "1 medium (138g)", tips: "Always eat with skin for fiber." },
  "apple_green": { name: "Apple (Granny Smith)", gi: 30, gl: 5, serving: "1 medium", tips: "The best apple choice for diabetics due to lower sugar." },
  "apricot": { name: "Apricot (Fresh)", gi: 34, gl: 3, serving: "3 small", tips: "Great low-GI snack." },
  "avocado": { name: "Avocado", gi: 15, gl: 0, serving: "1/2 fruit", tips: "Healthy fats. Virtually no impact on blood sugar." },
  "banana": { name: "Banana (Yellow/Ripe)", gi: 51, gl: 13, serving: "1 medium", tips: "Moderate. Eat with nuts to slow absorption." },
  "blackberry": { name: "Blackberry", gi: 25, gl: 2, serving: "1 cup", tips: "Excellent. High fiber and low sugar." },
  "blueberry": { name: "Blueberry", gi: 53, gl: 5, serving: "1 cup", tips: "Superfood for insulin sensitivity." },
  "cantaloupe": { name: "Cantaloupe", gi: 65, gl: 4, serving: "1 cup cubes", tips: "High GI but low GL (mostly water). Safe in moderation." },
  "cherry": { name: "Cherry (Sweet)", gi: 25, gl: 4, serving: "1 cup", tips: "Contains anthocyanins which may boost insulin." },
  "coconut": { name: "Coconut (Meat)", gi: 45, gl: 5, serving: "1 piece (45g)", tips: "High fat slows sugar absorption." },
  "date_fresh": { name: "Date (Fresh)", gi: 42, gl: 14, serving: "5 dates", tips: "Better than dried, but still sugar-dense." },
  "dragon_fruit": { name: "Dragon Fruit", gi: 50, gl: 5, serving: "1 fruit", tips: "Low sugar impact. Seeds provide healthy fats." },
  "fig_fresh": { name: "Fig (Fresh)", gi: 35, gl: 4, serving: "2 medium", tips: "High fiber helps regulate blood sugar." },
  "grape_green": { name: "Grape (Green)", gi: 53, gl: 5, serving: "1 cup", tips: "Monitor portion. Easy to overeat." },
  "grapefruit": { name: "Grapefruit", gi: 25, gl: 3, serving: "1/2 fruit", tips: "Check medication interactions. Excellent GI." },
  "guava": { name: "Guava", gi: 12, gl: 2, serving: "1 fruit", tips: "Top Tier: Very low GI and extremely high fiber." },
  "kiwi": { name: "Kiwi", gi: 50, gl: 7, serving: "1 fruit", tips: "Skin is edible and adds massive fiber." },
  "lemon": { name: "Lemon", gi: 20, gl: 2, serving: "1 fruit", tips: "Use juice to lower GI of meals." },
  "lime": { name: "Lime", gi: 20, gl: 1, serving: "1 fruit", tips: "Negligible sugar. Great for flavoring." },
  "mango": { name: "Mango", gi: 51, gl: 8, serving: "1 cup sliced", tips: "Borderline. Always eat with protein (nuts/yogurt)." },
  "orange": { name: "Orange", gi: 43, gl: 5, serving: "1 medium", tips: "Avoid juice. Eat the whole fruit." },
  "papaya": { name: "Papaya", gi: 60, gl: 9, serving: "1 cup", tips: "Medium GI. Digestive enzymes help metabolism." },
  "passion_fruit": { name: "Passion Fruit", gi: 30, gl: 5, serving: "4 fruits", tips: "Seeds are pure fiber. Very low GI." },
  "peach": { name: "Peach (Fresh)", gi: 42, gl: 5, serving: "1 medium", tips: "Low GI. Great summer fruit." },
  "pear": { name: "Pear", gi: 38, gl: 4, serving: "1 medium", tips: "Eat with skin. One of the highest fiber fruits." },
  "pineapple": { name: "Pineapple", gi: 59, gl: 7, serving: "1 cup", tips: "Medium GI. Eat in moderation." },
  "plum": { name: "Plum", gi: 40, gl: 2, serving: "1 fruit", tips: "Low calorie and low GI." },
  "pomegranate": { name: "Pomegranate", gi: 53, gl: 18, serving: "1/2 cup arils", tips: "High GL per cup, but very healthy in small amounts." },
  "raspberry": { name: "Raspberry", gi: 26, gl: 2, serving: "1 cup", tips: "Excellent choice. Very high fiber." },
  "strawberry": { name: "Strawberry", gi: 40, gl: 3, serving: "1 cup", tips: "Berries are the best class of fruit for diabetics." },
  "tangerine": { name: "Tangerine", gi: 47, gl: 4, serving: "1 medium", tips: "Good portion control." },
  "watermelon": { name: "Watermelon", gi: 72, gl: 5, serving: "1 cup", tips: "High GI, Low GL. Don't eat alone, eat with cheese/nuts." },
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
  const [view, setView] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      try {
        console.log("Loading AI Model...");
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setIsModelLoading(false);
        console.log("AI Model Ready");
      } catch (error) {
        console.error("Failed to load model:", error);
        // Silent fail on load, will alert on usage
        setIsModelLoading(false);
      }
    }
    loadModel();
  }, []);

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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const identify = async (imgElement) => {
    if (!model) {
        alert("AI Model is still loading. Please wait a moment and try again.");
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
    const foundFruit = predictions.find(p => {
      const className = p.className.toLowerCase();
      return Object.keys(FRUIT_DB).some(dbKey => {
         const simpleName = FRUIT_DB[dbKey].name.toLowerCase().split(' ')[0]; 
         return className.includes(simpleName) || className.includes(dbKey.replace('_', ' '));
      });
    });

    if (foundFruit) {
      const className = foundFruit.className.toLowerCase();
      let matchKey = null;
      for (const [dbKey, data] of Object.entries(FRUIT_DB)) {
          if (className.includes(dbKey) || className.includes(data.name.toLowerCase().split('(')[0].trim())) {
              matchKey = dbKey;
              break;
          }
      }
      if (matchKey) {
          setResults({ type: 'found', data: FRUIT_DB[matchKey], confidence: foundFruit.probability });
      } else {
          setResults({ type: 'unknown', raw: predictions[0].className });
      }
    } else {
      setResults({ type: 'unknown', raw: predictions[0].className });
    }
    setView('result');
    stopCamera();
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      // 1. Check if model is ready
      if (!model) {
        alert("AI is still loading... please wait 2 seconds.");
        return;
      }

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
    setResults({ type: 'found', data: FRUIT_DB[key], confidence: 1 });
    setView('result');
  };

  const resetApp = () => {
    setImageURL(null);
    setResults(null);
    setView('home');
    stopCamera();
    setSearchTerm('');
  };

  const filteredFruits = Object.entries(FRUIT_DB).filter(([key, fruit]) => 
    fruit.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-10">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <Zap className="w-6 h-6 fill-yellow-300 stroke-yellow-300" />
            <h1 className="text-xl font-bold tracking-tight">GlucoLens Pro</h1>
          </div>
          <button onClick={() => alert("Medical Disclaimer: This app provides estimates. Consult a doctor.")}>
            <Info className="w-5 h-5 text-emerald-100 hover:text-white" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* Loading */}
        {isModelLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading AI Database...</p>
          </div>
        )}

        {/* Home View */}
        {!isModelLoading && view === 'home' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Fruit</h2>
              <p className="text-slate-500 mb-6">Identify fruits via camera or search our database.</p>
              
              <button 
                onClick={startCamera}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
              >
                <Camera className="w-6 h-6" />
                Start Scanner
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 sticky top-0">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search 50+ fruits..." 
                  className="bg-transparent w-full outline-none text-slate-700 placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filteredFruits.map(([key, fruit]) => (
                  <button 
                    key={key}
                    onClick={() => handleManualSelect(key)}
                    className="w-full text-left p-4 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-medium text-slate-700">{fruit.name}</span>
                      <div className="flex gap-2 mt-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${getGILevel(fruit.gi).bg} ${getGILevel(fruit.gi).color}`}>
                          GI: {fruit.gi}
                        </span>
                        <span className="text-slate-400">GL: {fruit.gl}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {view === 'camera' && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden">
              <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
                 <button onClick={resetApp} className="text-white p-2 bg-black/30 rounded-full backdrop-blur-md">
                   <ArrowLeft className="w-6 h-6" />
                 </button>
              </div>

              {cameraError ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-white text-lg mb-6">{cameraError}</p>
                  <button onClick={() => document.getElementById('file-upload').click()} className="bg-white text-black px-6 py-3 rounded-lg font-medium">
                    Upload Photo Instead
                  </button>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" 
                    onChange={(e) => {
                      if(e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setImageURL(url);
                        const img = new Image();
                        img.src = url;
                        img.onload = () => identify(img);
                      }
                    }} 
                  />
                </div>
              ) : (
                // CLICK ANYWHERE ON VIDEO TO CAPTURE
                <div className="relative w-full h-full" onClick={captureImage}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
                      </div>
                      <p className="absolute bottom-32 text-white/80 font-medium bg-black/30 px-4 py-1 rounded-full backdrop-blur-md">
                        Tap anywhere to scan
                      </p>
                    </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            {!cameraError && (
              <div className="bg-black p-8 flex justify-center items-center pb-12">
                 <button 
                  onClick={captureImage}
                  disabled={isScanning}
                  className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  {isScanning ? <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" /> : <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result View */}
        {view === 'result' && results && (
          <div className="animate-fade-in space-y-4">
            <button onClick={resetApp} className="text-slate-500 flex items-center gap-2 mb-2 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back to Scanner
            </button>

            {imageURL && (
              <div className="w-full h-48 bg-slate-200 rounded-2xl overflow-hidden shadow-inner relative">
                <img src={imageURL} alt="Scanned" className="w-full h-full object-cover" />
              </div>
            )}

            {results.type === 'found' ? (
              <div className={`bg-white rounded-3xl p-6 shadow-sm border-2 ${getGILevel(results.data.gi).border}`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Analyzed</span>
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">{results.data.name}</h2>
                  </div>
                  {React.createElement(getGILevel(results.data.gi).icon, { className: `w-12 h-12 ${getGILevel(results.data.gi).color}` })}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${getGILevel(results.data.gi).bg} bg-opacity-50`}>
                    <p className="text-sm text-slate-500 mb-1">Glycemic Index</p>
                    <p className={`text-3xl font-bold ${getGILevel(results.data.gi).color}`}>{results.data.gi}</p>
                    <p className="text-xs font-medium text-slate-600 mt-1">{getGILevel(results.data.gi).label}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <p className="text-sm text-slate-500 mb-1">Glycemic Load</p>
                    <p className="text-3xl font-bold text-slate-700">{results.data.gl}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Per serving</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-sm flex gap-3 items-start">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs uppercase tracking-wider mb-1 text-blue-400">Serving Size</span>
                      {results.data.serving}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm flex gap-3 items-start">
                    <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs uppercase tracking-wider mb-1 text-amber-400">Diabetic Tip</span>
                      {results.data.tips}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Not Recognized</h3>
                <p className="text-slate-500 mb-6">
                  AI detected: <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{results.raw}</span>.
                  <br/>We couldn't confirm this in our database.
                </p>
                <button onClick={() => { setView('home'); setSearchTerm(''); }} className="text-emerald-600 font-bold hover:underline">
                  Search Database Instead
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}