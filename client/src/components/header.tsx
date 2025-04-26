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
      <header className="bg-gradient-to-r from-primary to-darkBlue text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={APP_IMAGES.logo} alt="App logo" className="w-8 h-8 rounded-full" />
            <h1 className="font-inter font-bold text-xl">{title}</h1>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
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
              className="w-5 h-5"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
