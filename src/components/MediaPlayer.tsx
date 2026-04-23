import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Shuffle, 
  Repeat,
  X,
  Minus,
  Maximize2
} from 'lucide-react';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  src: string;
  onMinimize: () => void;
  isHidden?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ onMinimize, isHidden }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [currentTrack, setCurrentTrack] = useState(0);
  
  // Drag and drop states
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sample playlist - в реальном приложении это будет загружаться из базы данных
  const playlist: Track[] = [
    {
      id: 1,
      title: "Девочка пай",
      artist: "Михаил Круг",
      duration: "4:18",
      src: "/mihail_krug_devochka_pay.wav"
    }
  ];

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    const nextTrack = (currentTrack + 1) % playlist.length;
    setCurrentTrack(nextTrack);
  };

  const handlePrevious = () => {
    const prevTrack = currentTrack === 0 ? playlist.length - 1 : currentTrack - 1;
    setCurrentTrack(prevTrack);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleTrackSelect = (trackIndex: number) => {
    setCurrentTrack(trackIndex);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, []);

  return (
    <div 
      className="fixed win95-window font-win95 text-xs select-none"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        display: isHidden ? 'none' : 'block'
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={playlist[currentTrack]?.src}
        onEnded={handleNext}
      />

      {/* Title Bar */}
      <div 
        className="win95-window-header cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-win95-red"></div>
          <span className="font-bold">MEDIA PLAYER</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="win95-button p-1"
            onClick={onMinimize}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button 
            className="win95-button p-1"
            onClick={() => {
              handleStop();
              onMinimize();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Player */}
      <div className="win95-panel p-2">
        {/* Display Area */}
        <div className="win95-panel p-2 mb-2 bg-black">
          <div className="flex items-center justify-between mb-1">
            <div className="text-winamp-display-text font-win95 text-lg font-bold">
              {formatTime(currentTime)}
            </div>
            <div className="text-winamp-display-text text-xs">
              {playlist[currentTrack]?.title || 'No track'} - {playlist[currentTrack]?.artist || ''}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full h-1 bg-win95-gray appearance-none slider"
              style={{
                background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${(currentTime / duration) * 100}%, #333 ${(currentTime / duration) * 100}%, #333 100%)`
              }}
            />
          </div>

          {/* Fake Spectrum Analyzer (just visual bars) */}
          <div className="flex items-end gap-px h-8 mb-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="bg-winamp-display-text flex-1"
                style={{
                  height: `${Math.random() * (isPlaying ? 100 : 20)}%`,
                  minHeight: '2px'
                }}
              />
            ))}
          </div>

          {/* Info Display */}
          <div className="text-winamp-display-text text-xs flex justify-between font-win95">
            <span>320 kbps</span>
            <span>44 kHz</span>
            <span>stereo</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={handlePrevious}
            className="win95-button px-2 py-1"
          >
            <SkipBack className="h-4 w-4 text-win95-black" />
          </button>
          <button
            onClick={handlePlayPause}
            className="win95-button px-2 py-1"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-win95-black" />
            ) : (
              <Play className="h-4 w-4 text-win95-black" />
            )}
          </button>
          <button
            onClick={handleStop}
            className="win95-button px-2 py-1"
          >
            <Square className="h-4 w-4 text-win95-black" />
          </button>
          <button
            onClick={handleNext}
            className="win95-button px-2 py-1"
          >
            <SkipForward className="h-4 w-4 text-win95-black" />
          </button>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-4">
            <Volume2 className="h-4 w-4 text-win95-black" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-win95-gray appearance-none slider"
            />
          </div>

          {/* Additional Controls */}
          <div className="flex items-center gap-1 ml-4">
            <button className="win95-button px-2 py-1">
              <Shuffle className="h-3 w-3 text-win95-black" />
            </button>
            <button className="win95-button px-2 py-1">
              <Repeat className="h-3 w-3 text-win95-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Editor */}
      <div className="win95-panel border-t-2 border-win95-gray-dark">
        <div className="win95-window-header">
          <span className="font-bold text-xs">PLAYLIST EDITOR</span>
        </div>
        <div className="win95-panel p-2 max-h-48 overflow-y-auto bg-white">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={`flex items-center justify-between px-2 py-1 cursor-pointer text-xs font-win95 ${
                index === currentTrack
                  ? 'bg-win95-blue text-white'
                  : 'text-win95-black hover:bg-win95-gray-light'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={index === currentTrack ? 'text-white' : 'text-win95-black'}>
                  {(index + 1).toString().padStart(2, '0')}.
                </span>
                <span>{track.artist} - {track.title}</span>
              </div>
              <span className={index === currentTrack ? 'text-white' : 'text-win95-black'}>{track.duration}</span>
            </div>
          ))}
        </div>
        
        {/* Playlist Controls */}
        <div className="win95-panel p-2 border-t-2 border-win95-gray-dark flex items-center justify-end">
          <div className="ml-auto text-win95-black text-xs font-win95">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;