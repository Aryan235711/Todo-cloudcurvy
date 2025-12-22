
import React, { useState } from 'react';
import { Cloud, Sparkles, ShieldCheck, ArrowRight, Check, Zap, Mic, Database, Key, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Weightless Focus",
    subtitle: "Organize with a breath of fresh air.",
    description: "CurvyCloud is a space designed to clear your mind. No clutter, just your goals floating in a sea of calm.",
    icon: <Cloud size={60} className="text-sky-400" />,
    color: "from-sky-50 to-white",
    accent: "bg-sky-500",
    illustration: (
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-sky-200/30 rounded-[3rem] animate-pulse" />
        <Cloud size={80} className="text-sky-500 animate-bounce-slow relative z-10" />
      </div>
    )
  },
  {
    title: "AI Co-Pilot",
    subtitle: "Manifest your vision instantly.",
    description: "Type or speak your goal. Our AI breaks down complex tasks into tiny, actionable steps so you never feel overwhelmed.",
    icon: <Sparkles size={60} className="text-indigo-400" />,
    color: "from-indigo-50 to-white",
    accent: "bg-indigo-500",
    illustration: (
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-indigo-200/30 rounded-full animate-spin-slow" />
        <div className="flex flex-col gap-2 relative z-10">
          <div className="bg-white p-3 rounded-2xl curvy-shadow flex items-center gap-2 -translate-x-4 animate-in slide-in-from-left">
            <Zap size={16} className="text-amber-400" /> <div className="w-12 h-2 bg-slate-100 rounded" />
          </div>
          <div className="bg-white p-3 rounded-2xl curvy-shadow flex items-center gap-2 translate-x-4 animate-in slide-in-from-right delay-150">
            <Mic size={16} className="text-sky-400" /> <div className="w-16 h-2 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Sustainable AI",
    subtitle: "Bring your own magic.",
    description: "CurvyCloud uses the BYOK model. Link your Gemini API key to enjoy unlimited, private AI manifestations at zero cost to us and you.",
    icon: <Key size={60} className="text-indigo-400" />,
    color: "from-indigo-50 to-white",
    accent: "bg-indigo-600",
    illustration: (
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-indigo-100 rounded-[3rem] rotate-12" />
        <div className="bg-white p-6 rounded-[2.5rem] curvy-shadow relative z-10 text-indigo-500">
          <Key size={48} strokeWidth={2.5} />
        </div>
      </div>
    )
  },
  {
    title: "Privacy First",
    subtitle: "Your data, your device.",
    description: "We don't use clouds for storage. Everything you create stays strictly inside your local storage. Private by design, always.",
    icon: <ShieldCheck size={60} className="text-emerald-400" />,
    color: "from-emerald-50 to-white",
    accent: "bg-emerald-500",
    illustration: (
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-emerald-100 border-dashed rounded-[4rem] animate-spin-slow" />
        <div className="bg-emerald-500 text-white p-6 rounded-[2.5rem] curvy-shadow relative z-10">
          <Database size={40} />
        </div>
      </div>
    )
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Fixed: currentStep is a number; removed the incorrect 'prev.push' check.
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-gradient-to-b ${step.color} transition-colors duration-700 ease-in-out px-8 py-12 overflow-hidden`}>
      {currentStep > 0 && (
        <button 
          onClick={handleBack}
          className="absolute top-8 left-8 p-3.5 liquid-glass-dark rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-95 curvy-btn shadow-sm"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="mb-12 animate-in fade-in zoom-in-95 duration-1000">
          {step.illustration}
        </div>
        
        <div key={currentStep} className="animate-in slide-in-from-bottom-8 fade-in duration-700">
          <h1 className="text-5xl font-black text-slate-800 leading-tight mb-4 tracking-tighter">
            {step.title}
          </h1>
          <h2 className="text-xl font-bold text-slate-400 mb-6 px-4 italic leading-snug">
            {step.subtitle}
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            {step.description}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentStep ? `w-8 ${step.accent}` : 'w-2 bg-slate-200'
              }`} 
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className={`w-full ${step.accent} text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3`}
        >
          {currentStep === steps.length - 1 ? (
            <>Ready to Float <Check size={24} strokeWidth={4} /></>
          ) : (
            <>Next Breeze <ArrowRight size={24} strokeWidth={4} /></>
          )}
        </button>
        
        <button 
          onClick={onComplete}
          className="text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:text-slate-500 transition-colors"
        >
          Skip to Cloud
        </button>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};
