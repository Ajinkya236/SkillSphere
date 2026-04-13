
import React from 'react';
import { NavigationTab } from '../types';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const dashboardCards = [
    {
      title: 'Skills Management',
      desc: 'Design skill clusters, skill groups, and individual skills to build a shared language.',
      link: 'Open Hierarchy',
      color: 'bg-indigo-500',
      tab: 'Skills Management' as NavigationTab
    },
    {
      title: 'Competency Management',
      desc: 'Define and manage organizational competencies by grouping skills.',
      link: 'Manage Competencies',
      color: 'bg-cyan-500',
      tab: 'Competency Management' as NavigationTab
    },
    {
      title: 'Job Profile Management',
      desc: 'Align job roles and variants with the unique skill sets they require.',
      link: 'Map Roles',
      color: 'bg-pink-500',
      tab: 'Job Profile Management' as NavigationTab
    }
  ];

  return (
    <div className="p-8 max-w-full mx-auto animate-fadeIn">
      <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100 min-h-[500px] flex flex-col justify-center">
        <header className="mb-12">
          <p className="text-blue-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">SkillSphere</p>
          <h2 className="text-[2.5rem] font-bold text-gray-900 mb-4 leading-tight">Welcome to Skill Management</h2>
          <p className="text-gray-600 max-w-3xl text-lg leading-relaxed font-normal">
            Manage every aspect of your organisation's skill ecosystem from this workspace. 
            Use the menu on the left to curate taxonomy, define proficiency levels, 
            connect related skills, or configure job variants.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
          {dashboardCards.map((card, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group/card flex flex-col min-h-[320px]"
              onClick={() => onNavigate(card.tab)}
            >
              <div className={`w-12 h-12 ${card.color} rounded-xl mb-6 shadow-sm group-hover/card:scale-110 transition-transform`}></div>
              <h3 className="font-extrabold text-[#1e3a8a] text-lg mb-3 leading-snug">{card.title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed flex-grow">
                {card.desc}
              </p>
              <button className="text-blue-600 text-sm font-bold group-hover/card:text-blue-800 flex items-center mt-auto">
                {card.link}
                <svg className="w-4 h-4 ml-2 group-hover/card:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
