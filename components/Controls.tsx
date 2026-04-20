import React, { useState } from 'react';
import { RainParams } from '../types';

interface ControlsProps {
  params: RainParams;
  setParams: React.Dispatch<React.SetStateAction<RainParams>>;
  onUpload: (file: File) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step = 0.01, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs uppercase tracking-widest text-white/70 mb-1">
      <span>{label}</span>
      <span>{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer focus:outline-none focus:bg-white/40 accent-blue-400 transition-all"
    />
  </div>
);

const Controls: React.FC<ControlsProps> = ({ params, setParams, onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateParam = (key: keyof RainParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div 
        className={`fixed z-50 transition-all duration-500 ease-out ${isOpen ? 'bottom-6 right-80' : 'bottom-8 right-8'}`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center 
            backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-300
            ${isOpen ? 'bg-white/10 rotate-90' : 'bg-black/40 hover:bg-black/60'}
          `}
        >
            {/* Simple Water Drop Icon */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="1.5"
              className={`transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}
            >
               <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            
            {/* Close Icon */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="1.5"
              className={`absolute transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
      </div>

      {/* Control Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-black/60 backdrop-blur-xl border-l border-white/10
          transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 p-8 pt-24
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="mb-8">
            <h2 className="text-2xl font-light text-white mb-2 tracking-tight">Atmosphere</h2>
            <p className="text-white/40 text-sm">Fine tune the weather conditions.</p>
        </div>

        <Slider
          label="Rain Intensity"
          value={params.rainAmount}
          min={0}
          max={2.0}
          onChange={(v) => updateParam('rainAmount', v)}
        />
        <Slider
          label="Simulation Speed"
          value={params.speed}
          min={0}
          max={3.0}
          onChange={(v) => updateParam('speed', v)}
        />
        <Slider
          label="Refraction (Glass)"
          value={params.refraction}
          min={0}
          max={1.0}
          onChange={(v) => updateParam('refraction', v)}
        />
        <Slider
          label="Zoom Background"
          value={params.zoom}
          min={0.5}
          max={3.0}
          onChange={(v) => updateParam('zoom', v)}
        />
        <Slider
          label="Brightness"
          value={params.brightness}
          min={0.2}
          max={1.5}
          onChange={(v) => updateParam('brightness', v)}
        />

        <div className="mt-12 pt-8 border-t border-white/10">
          <label className="flex flex-col gap-3 group cursor-pointer">
             <span className="text-xs uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                Change Background
             </span>
             <div className="h-12 w-full rounded-lg border border-dashed border-white/30 flex items-center justify-center group-hover:border-white/60 group-hover:bg-white/5 transition-all">
                <span className="text-sm text-white/50">Upload Image/Video</span>
             </div>
             <input 
                type="file" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
             />
          </label>
        </div>
      </div>
    </>
  );
};

export default Controls;