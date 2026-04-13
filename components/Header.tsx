
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { NavigationTab } from '../types';

interface HeaderProps {
  onNavigate: (tab: NavigationTab) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-blue-700 text-white flex items-center justify-between px-6 py-3 shadow-md sticky top-0 z-50">
      <div className="flex items-center space-x-12">
        <div className="flex items-center space-x-2">
           <div className="grid grid-cols-2 gap-1 p-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
           </div>
           <span className="text-xl font-bold tracking-tight">Skill<span className="font-light">Demo</span></span>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-sm font-medium items-center">
          <button onClick={() => onNavigate('Dashboard')} className="hover:text-blue-200 transition">Home</button>
          <a href="#" className="hover:text-blue-200 transition">Discover</a>
          <a href="#" className="hover:text-blue-200 transition">My Learning</a>
          <a href="#" className="hover:text-blue-200 transition">My Team</a>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="hover:text-blue-200 transition flex items-center focus:outline-none"
            >
              More
              <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {isMoreOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 text-gray-800 border border-gray-100 animate-fadeIn">
                <button 
                  onClick={() => {
                    onNavigate('Type Configuration');
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-medium flex items-center"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Type Configuration
                </button>
                <button 
                  onClick={() => {
                    onNavigate('Hierarchy Management');
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-medium flex items-center"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Hierarchy Management
                </button>
                <button 
                  onClick={() => {
                    onNavigate('Skills Management');
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-medium flex items-center"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Skills Management
                </button>
                <button 
                  onClick={() => {
                    onNavigate('Competency Management');
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-medium flex items-center"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  Competency Management
                </button>
                <button 
                  onClick={() => {
                    onNavigate('Job Profile Management');
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition font-medium flex items-center"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  Job Profile Management
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition">Performance</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition">Analytics</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition">Settings</button>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="flex items-center space-x-5">
        <button className="p-2 hover:bg-blue-600 rounded-full transition"><Icons.Search /></button>
        <button className="p-2 hover:bg-blue-600 rounded-full transition"><Icons.Calendar /></button>
        <button className="p-2 hover:bg-blue-600 rounded-full transition relative">
          <Icons.Bell />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-blue-700"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-white overflow-hidden border-2 border-blue-400">
          <Icons.User />
        </div>
      </div>
    </header>
  );
};

export default Header;
