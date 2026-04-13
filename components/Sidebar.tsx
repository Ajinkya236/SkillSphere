
import React from 'react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { label: NavigationTab; subtext?: string }[] = [
    { label: 'Skill Types' },
    { label: 'Skill Groups' },
    { label: 'Skills' },
    { label: 'Competencies' },
    { label: 'Job Profiles' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-60px)]">
      <button 
        onClick={() => setActiveTab('Dashboard')}
        className="p-6 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left focus:outline-none w-full group"
      >
        <div className="w-8 h-8 bg-blue-700 rounded-full group-hover:scale-110 transition-transform shadow-sm"></div>
        <h1 className="text-lg font-bold text-gray-800">SkillSphere</h1>
      </button>

      <nav className="flex-1 mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveTab(item.label)}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
                  activeTab === item.label || 
                  (item.label === 'Skills' && ['Skill-Proficiency descriptors', 'Skill-Skill Relationships'].includes(activeTab)) ||
                  (item.label === 'Job Profiles' && ['Job Role Mapping', 'Job Variant Mapping'].includes(activeTab))
                    ? 'bg-blue-50 text-blue-700 border-blue-700'
                    : 'text-gray-600 border-transparent hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
