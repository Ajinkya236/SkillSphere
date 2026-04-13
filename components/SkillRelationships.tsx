import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { ExtendedTaxonomyItem, SkillRelationship } from '../types';

interface SkillRelationshipsProps {
  skills: ExtendedTaxonomyItem[];
  relationships: SkillRelationship[];
  setRelationships: React.Dispatch<React.SetStateAction<SkillRelationship[]>>;
}

const SkillRelationships: React.FC<SkillRelationshipsProps> = ({ skills, relationships, setRelationships }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState<string | null>(null); // skillId
  const [mappingSearchTerm, setMappingSearchTerm] = useState('');
  const [selectedForMapping, setSelectedForMapping] = useState<string[]>([]);
  const [showUnmapConfirm, setShowUnmapConfirm] = useState<{ relationshipId: string; skillName: string; relatedName: string } | null>(null);

  const filteredSkills = useMemo(() => {
    return skills.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [skills, searchTerm]);

  const getRelatedSkills = (skillId: string) => {
    return relationships
      .filter(r => r.skillId1 === skillId || r.skillId2 === skillId)
      .map(r => {
        const relatedId = r.skillId1 === skillId ? r.skillId2 : r.skillId1;
        const relatedSkill = skills.find(s => s.id === relatedId);
        return {
          relationshipId: r.id,
          skill: relatedSkill
        };
      })
      .filter(item => item.skill !== undefined);
  };

  const handleOpenAddModal = (skillId: string) => {
    setShowAddModal(skillId);
    setMappingSearchTerm('');
    setSelectedForMapping([]);
  };

  const availableForMapping = useMemo(() => {
    if (!showAddModal) return [];
    const currentRelatedIds = getRelatedSkills(showAddModal).map(r => r.skill?.id);
    
    return skills.filter(s => 
      s.id !== showAddModal && 
      !currentRelatedIds.includes(s.id) &&
      s.name.toLowerCase().includes(mappingSearchTerm.toLowerCase())
    );
  }, [showAddModal, skills, relationships, mappingSearchTerm]);

  const handleToggleSelection = (id: string) => {
    setSelectedForMapping(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddRelationships = () => {
    if (!showAddModal || selectedForMapping.length === 0) return;

    const newRelationships: SkillRelationship[] = selectedForMapping.map(targetId => ({
      id: Math.random().toString(36).substr(2, 9),
      skillId1: showAddModal,
      skillId2: targetId
    }));

    setRelationships([...relationships, ...newRelationships]);
    setShowAddModal(null);
  };

  const handleUnmap = (relationshipId: string) => {
    setRelationships(relationships.filter(r => r.id !== relationshipId));
    setShowUnmapConfirm(null);
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full bg-[#f8fafc]">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Skill-Skill Relationships</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Manage bidirectional relationships between skills in the taxonomy</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search skills..." 
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
                <th className="px-6 py-5 border-r border-blue-800 w-1/4">Skill Name</th>
                <th className="px-6 py-5 border-r border-blue-800">Related Skills</th>
                <th className="px-6 py-5 text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSkills.map(skill => {
                const related = getRelatedSkills(skill.id);
                return (
                  <tr key={skill.id} className="hover:bg-blue-50/20 transition group">
                    <td className="px-6 py-6 border-r border-gray-50 text-sm font-extrabold text-gray-900">{skill.name}</td>
                    <td className="px-6 py-6 border-r border-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {related.map(item => (
                          <div key={item.relationshipId} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 group/tag">
                            <span>{item.skill?.name}</span>
                            <button 
                              onClick={() => setShowUnmapConfirm({ 
                                relationshipId: item.relationshipId, 
                                skillName: skill.name, 
                                relatedName: item.skill?.name || '' 
                              })}
                              className="ml-2 text-blue-300 hover:text-red-600 transition-colors"
                              title="Unmap Relationship"
                            >
                              <Icons.Delete />
                            </button>
                          </div>
                        ))}
                        {related.length === 0 && (
                          <span className="text-gray-400 italic text-xs">No related skills mapped.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center space-x-3">
                        <button 
                          onClick={() => handleOpenAddModal(skill.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition shadow-sm active:scale-95"
                          title="Add Related Skills"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSkills.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic font-medium">
              {searchTerm ? `No skills found matching "${searchTerm}"` : "No skills defined yet."}
            </div>
          )}
        </div>
      </div>

      {/* Add Related Skills Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-scaleIn overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-10 border-b border-gray-100">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Add Related Skills</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Select skills to relate with <span className="text-blue-700 font-bold">"{skills.find(s => s.id === showAddModal)?.name}"</span>
              </p>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search skills to add..." 
                  className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  value={mappingSearchTerm}
                  onChange={e => setMappingSearchTerm(e.target.value)}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icons.Search />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
              {availableForMapping.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => handleToggleSelection(s.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border cursor-pointer ${
                    selectedForMapping.includes(s.id)
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedForMapping.includes(s.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedForMapping.includes(s.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{s.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {availableForMapping.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic text-sm">
                  {mappingSearchTerm ? "No matching skills found." : "All available skills are already related."}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-100 flex justify-end items-center space-x-4">
              <span className="text-sm font-bold text-gray-500 mr-auto">
                {selectedForMapping.length} selected
              </span>
              <button onClick={() => setShowAddModal(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
              <button 
                onClick={handleAddRelationships}
                disabled={selectedForMapping.length === 0}
                className={`px-10 py-3 rounded-full text-sm font-bold transition-all shadow-xl active:scale-95 ${
                  selectedForMapping.length === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#1e3a8a] text-white hover:bg-blue-900'
                }`}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

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
                Are you sure you want to remove the relationship between <span className="text-gray-900 font-bold">"{showUnmapConfirm.skillName}"</span> and <span className="text-blue-700 font-bold">"{showUnmapConfirm.relatedName}"</span>?
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
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default SkillRelationships;
