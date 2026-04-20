import React, { useState, useEffect, useRef } from 'react';
import RainCanvas from './components/RainCanvas';
import Controls from './components/Controls';
import DiaryEditor from './components/DiaryEditor';
import { RainParams, DEFAULT_PARAMS } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<RainParams>(DEFAULT_PARAMS);
  const [mediaSource, setMediaSource] = useState<HTMLVideoElement | HTMLImageElement | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  
  // Hidden elements to hold the actual media DOM nodes
  const hiddenMediaContainer = useRef<HTMLDivElement>(null);

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.split('/')[0];
    
    // Cleanup previous media
    if (hiddenMediaContainer.current) {
       hiddenMediaContainer.current.innerHTML = '';
    }

    if (type === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      // Important for WebGL textures to work with videos immediately
      video.oncanplay = () => {
         video.play();
         setMediaSource(video);
         setIsVideo(true);
      };
      // Force load
      video.load();
      hiddenMediaContainer.current?.appendChild(video);
    } else {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setMediaSource(img);
        setIsVideo(false);
      };
      hiddenMediaContainer.current?.appendChild(img);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      {/* Hidden Container for Media Elements */}
      <div ref={hiddenMediaContainer} className="hidden"></div>

      {/* The WebGL Rain Layer */}
      <RainCanvas 
        params={params} 
        mediaSource={mediaSource} 
        isVideo={isVideo} 
      />

      {/* Main Content: Diary Editor */}
      <DiaryEditor />

      {/* Interactive Controls */}
      <div className="pointer-events-auto">
        <Controls 
          params={params} 
          setParams={setParams} 
          onUpload={handleUpload} 
        />
      </div>
    </div>
  );
};

export default App;