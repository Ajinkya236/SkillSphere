import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { Competency, CompetencyRelationship } from '../types';
import SearchableDropdown from './SearchableDropdown';

interface CompetencyRelationshipsProps {
  competencies: Competency[];
  relationships: CompetencyRelationship[];
  setRelationships: React.Dispatch<React.SetStateAction<CompetencyRelationship[]>>;
}

const CompetencyRelationships: React.FC<CompetencyRelationshipsProps> = ({
  competencies,
  relationships,
  setRelationships
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnmapConfirm, setShowUnmapConfirm] = useState<{ relationshipId: string; compName: string; relatedName: string } | null>(null);

  const filteredCompetencies = useMemo(() => {
    return competencies.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [competencies, searchTerm]);

  const getRelatedCompetencies = (competencyId: string) => {
    return relationships
      .filter(r => r.competencyId1 === competencyId || r.competencyId2 === competencyId)
      .map(r => {
        const relatedId = r.competencyId1 === competencyId ? r.competencyId2 : r.competencyId1;
        const relatedComp = competencies.find(c => c.id === relatedId);
        return {
          relationshipId: r.id,
          competency: relatedComp
        };
      })
      .filter(item => item.competency !== undefined);
  };

  const handleUnmap = (relationshipId: string) => {
    setRelationships(relationships.filter(r => r.id !== relationshipId));
    setShowUnmapConfirm(null);
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Competency Relationships</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Manage bidirectional relationships between competencies</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search competencies..." 
              className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
              <tr>
                <th className="px-6 py-5 border-r border-blue-800 w-1/4">Competency Name</th>
                <th className="px-6 py-5 border-r border-blue-800">Related Competencies</th>
                <th className="px-6 py-5 text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompetencies.map(comp => {
                const related = getRelatedCompetencies(comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-blue-50/20 transition group">
                    <td className="px-6 py-6 border-r border-gray-50 text-sm font-extrabold text-gray-900">{comp.title}</td>
                    <td className="px-6 py-6 border-r border-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {related.map(item => (
                          <div key={item.relationshipId} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 group/tag">
                            <span>{item.competency?.title}</span>
                            <button 
                              onClick={() => setShowUnmapConfirm({ 
                                relationshipId: item.relationshipId, 
                                compName: comp.title, 
                                relatedName: item.competency?.title || '' 
                              })}
                              className="ml-2 text-blue-300 hover:text-red-600 transition-colors"
                              title="Unmap Relationship"
                            >
                              <Icons.Delete />
                            </button>
                          </div>
                        ))}
                        {related.length === 0 && (
                          <span className="text-gray-400 italic text-xs">No related competencies mapped.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        <SearchableDropdown
                          options={competencies
                            .filter(c => c.id !== comp.id && !related.some(r => r.competency?.id === c.id))
                            .map(c => ({ id: c.id, label: c.title, description: c.description }))
                          }
                          value=""
                          onChange={(targetId) => {
                            if (targetId) {
                              const newRelationship: CompetencyRelationship = {
                                id: Math.random().toString(36).substr(2, 9),
                                competencyId1: comp.id,
                                competencyId2: targetId
                              };
                              setRelationships([...relationships, newRelationship]);
                            }
                          }}
                          placeholder="Add Related..."
                          className="w-48"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCompetencies.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic font-medium">
              {searchTerm ? `No competencies found matching "${searchTerm}"` : "No competencies defined yet."}
            </div>
          )}
        </div>
      </div>

      {/* Unmap Confirmation Modal */}
      {showUnmapConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUnmapConfirm(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Unmap Relationship?</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to remove the relationship between <span className="text-gray-900 font-bold">"{showUnmapConfirm.compName}"</span> and <span className="text-blue-700 font-bold">"{showUnmapConfirm.relatedName}"</span>?
              </p>
              
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button onClick={() => setShowUnmapConfirm(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
                <button onClick={() => handleUnmap(showUnmapConfirm.relationshipId)} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl">Confirm Unmap</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default CompetencyRelationships;
