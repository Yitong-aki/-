import React, { useState, useEffect, useRef } from 'react';

interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  content: string;
}

const DiaryEditor: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('rainy-diary-entries');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load diary entries", e);
    }

    return [{
      id: Date.now().toString(),
      title: '',
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      content: ''
    }];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 使用用户指定的更温和的轻雨声
  const AMBIENT_RAIN_URL = 'https://assets.mixkit.co/active_storage/sfx/1253/1253-preview.mp3';

  useEffect(() => {
    try {
        localStorage.setItem('rainy-diary-entries', JSON.stringify(entries));
    } catch (e) {
        console.error("Failed to save diary entries", e);
    }
  }, [entries]);

  useEffect(() => {
    const audio = new Audio(AMBIENT_RAIN_URL);
    audio.loop = true;
    audio.volume = 0; 
    audio.preload = 'auto';
    
    audioRef.current = audio;

    return () => {
        if (audio) {
            audio.pause();
            audio.src = '';
            audio.load();
        }
        audioRef.current = null;
    };
  }, []);

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;

    if (isPlaying) {
        // 优雅的淡出
        let volume = audio.volume;
        const fadeOut = setInterval(() => {
            if (volume > 0.02) {
                volume -= 0.02;
                audio.volume = volume;
            } else {
                audio.pause();
                audio.volume = 0;
                clearInterval(fadeOut);
                setIsPlaying(false);
            }
        }, 30);
    } else {
        try {
            audio.volume = 0;
            await audio.play();
            setIsPlaying(true);
            // 优雅的淡入至极其温和的背景音量
            let volume = 0;
            const fadeIn = setInterval(() => {
                if (volume < 0.25) {
                    volume += 0.01;
                    audio.volume = volume;
                } else {
                    audio.volume = 0.3;
                    clearInterval(fadeIn);
                }
            }, 40);
        } catch (e) {
            console.error("Audio playback failed:", e);
            setIsPlaying(false);
        }
    }
  };

  const currentEntry = entries[currentIndex] || entries[0];

  const updateEntry = (field: keyof DiaryEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[currentIndex] = { ...newEntries[currentIndex], [field]: value };
    setEntries(newEntries);
  };

  const addNewEntry = () => {
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      title: '',
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      content: ''
    };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setCurrentIndex(newEntries.length - 1);
  };

  const deleteEntry = () => {
    if (entries.length <= 1) {
        const newEntries = [...entries];
        newEntries[0] = {
             id: Date.now().toString(),
             title: '',
             date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
             content: ''
        };
        setEntries(newEntries);
        return;
    }
    const newEntries = entries.filter((_, i) => i !== currentIndex);
    setEntries(newEntries);
    if (currentIndex >= newEntries.length) {
        setCurrentIndex(newEntries.length - 1);
    }
  };

  const nextEntry = () => {
    if (currentIndex < entries.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevEntry = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div className="w-[90%] md:w-full md:max-w-[480px] h-[75vh] md:h-[80vh] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col p-6 md:p-8 text-white pointer-events-auto transition-all duration-500 ease-out hover:bg-white/[0.06] hover:border-white/20 hover:shadow-white/5 ring-1 ring-white/5">
        
        <div className="flex flex-col gap-2 mb-6 shrink-0">
          <input 
            type="text" 
            value={currentEntry.title}
            onChange={(e) => updateEntry('title', e.target.value)}
            placeholder="Title your mood..."
            className="bg-transparent text-2xl md:text-3xl font-extralight tracking-tight outline-none placeholder-white/20 w-full text-white/90"
          />
          <div className="flex items-center justify-between text-xs font-medium tracking-widest uppercase text-white/40">
            <span>{currentEntry.date}</span>
            <span>{currentIndex + 1} / {entries.length}</span>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4 shrink-0"></div>

        <textarea
            value={currentEntry.content}
            onChange={(e) => updateEntry('content', e.target.value)}
            placeholder="Write here..."
            className="flex-1 bg-transparent resize-none outline-none text-lg font-light leading-relaxed placeholder-white/10 text-white/80 custom-scrollbar selection:bg-white/20 overflow-y-auto pr-2"
        />

        <div className="mt-6 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity duration-300 shrink-0">
            <button 
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-300 ${isPlaying ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10 text-white/60'}`}
                title="Toggle Gentle Rain"
            >
                {isPlaying ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
            </button>

            <div className="flex items-center gap-2 transform scale-[0.6] origin-right">
                 <button 
                    onClick={deleteEntry}
                    className="p-3 hover:bg-red-500/20 hover:text-red-200 rounded-full transition-all group"
                    title="Delete Entry"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="opacity-70 group-hover:opacity-100"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                
                <button 
                    onClick={addNewEntry}
                    className="p-3 hover:bg-white/10 rounded-full transition-all text-blue-200/80 hover:text-blue-100"
                    title="New Entry"
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1"></div>

                <button 
                    onClick={prevEntry} 
                    disabled={currentIndex === 0}
                    className="p-3 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                    aria-label="Previous Entry"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                
                <button 
                    onClick={nextEntry} 
                    disabled={currentIndex === entries.length - 1}
                    className="p-3 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                    aria-label="Next Entry"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;