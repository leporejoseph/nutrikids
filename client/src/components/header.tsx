import { useState } from "react";
import { APP_IMAGES } from "@/lib/constants";
import SettingsPanel from "@/components/settings-panel";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={APP_IMAGES.logo} alt="App logo" className="w-8 h-8 rounded-full" />
            <h1 className="font-inter font-bold text-xl">{title}</h1>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-purple-700 rounded hover:bg-purple-800 transition-colors flex items-center"
            aria-label="Open settings"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 mr-1"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </header>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
