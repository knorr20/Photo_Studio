import React, { useState, useEffect } from 'react';
import { Menu, Grid, Calculator, Paintbrush, Music } from 'lucide-react';

interface AdminTaskbarProps {
  onOpenMediaPlayer?: () => void;
  isMediaPlayerMinimized?: boolean;
  onRestoreMediaPlayer?: () => void;
}

const AdminTaskbar: React.FC<AdminTaskbarProps> = ({ 
  onOpenMediaPlayer, 
  isMediaPlayerMinimized = false,
  onRestoreMediaPlayer 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleStartClick = () => {
    setIsStartMenuOpen(!isStartMenuOpen);
  };

  const handleMenuItemClick = (itemName: string) => {
    if (itemName === 'Media Player' && onOpenMediaPlayer) {
      onOpenMediaPlayer();
      setIsStartMenuOpen(false);
    } else {
      console.log(`${itemName} clicked - not implemented yet`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 win95-panel flex items-center justify-between px-1 z-40">
      {/* Start Menu */}
      {isStartMenuOpen && (
        <div className="win95-start-menu">
          <div className="win95-menu-item" onClick={() => handleMenuItemClick('Minesweeper')}>
            <Grid className="h-4 w-4" />
            <span>Minesweeper</span>
          </div>
          <div className="win95-menu-item" onClick={() => handleMenuItemClick('Calculator')}>
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </div>
          <div className="win95-menu-item" onClick={() => handleMenuItemClick('Paint')}>
            <Paintbrush className="h-4 w-4" />
            <span>Paint</span>
          </div>
          <div className="win95-menu-item" onClick={() => handleMenuItemClick('Media Player')}>
            <Music className="h-4 w-4" />
            <span>Media Player</span>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button 
        onClick={handleStartClick}
        className="win95-button h-8 px-3 flex items-center gap-2 font-win95 text-sm font-bold"
      >
        <Menu className="h-4 w-4" />
        <span>Start</span>
      </button>

      {/* Middle Area - Empty for now (future taskbar items) */}
      <div className="flex-1 flex items-center">
        {/* Minimized Media Player Indicator */}
        {isMediaPlayerMinimized && (
          <button
            onClick={onRestoreMediaPlayer}
            className="win95-button h-8 px-2 ml-2 flex items-center gap-1"
            title="Restore Media Player"
          >
            <div className="w-3 h-3 bg-win95-red"></div>
            <span className="text-xs font-win95">Media Player</span>
          </button>
        )}
      </div>

      {/* System Tray with Clock */}
      <div className="win95-panel px-2 py-1 h-8 flex items-center">
        <div className="text-xs font-win95 text-win95-black text-center">
          <div className="leading-tight">{formatTime(currentTime)}</div>
          <div className="leading-tight text-[10px]">{formatDate(currentTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminTaskbar;