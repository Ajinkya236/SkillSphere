import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { ExtendedTaxonomyItem, ProficiencyMapping, SkillCategory, TaxonomyNode } from '../types';

interface ProficiencyLevelsProps {
  taxonomyNodes: TaxonomyNode[];
  skills: ExtendedTaxonomyItem[];
  skillCategories: SkillCategory[];
  mappings: ProficiencyMapping[];
  setMappings: React.Dispatch<React.SetStateAction<ProficiencyMapping[]>>;
}

const ProficiencyLevels: React.FC<ProficiencyLevelsProps> = ({ taxonomyNodes, skills, skillCategories, mappings, setMappings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [currentMapping, setCurrentMapping] = useState<ProficiencyMapping | null>(null);
  
  // Form states
  const [formSkillId, setFormSkillId] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [errors, setErrors] = useState<{ skill?: string; level?: string; desc?: string }>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toast
  const [errorToast, setErrorToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const showToast = (message: string) => {
    setErrorToast({ show: true, message });
    setTimeout(() => setErrorToast({ show: false, message: '' }), 5000);
  };

  const getValidLevelsForSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill || !skill.categoryId) return [];
    const category = skillCategories.find(c => c.id === skill.categoryId);
    return category ? category.proficiencyLevels : [];
  };

  const getCategoryNameForSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill || !skill.categoryId) return 'None';
    const category = skillCategories.find(c => c.id === skill.categoryId);
    return category ? category.name : 'Unknown';
  };

  const validate = () => {
    const newErrors: { skill?: string; level?: string; desc?: string } = {};
    if (!formSkillId) newErrors.skill = "Skill is required.";
    if (!formLevel) newErrors.level = "Proficiency Level is required.";
    if (!formDesc.trim()) newErrors.desc = "Description is required.";
    
    // Duplicate check
    const isDuplicate = mappings.some(m => 
      m.skillId === formSkillId && 
      m.level === formLevel && 
      (modalMode === 'add' || m.id !== currentMapping?.id)
    );
    
    if (isDuplicate) {
      showToast("Duplicate proficiency levels are not allowed for the same skill.");
      return null;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? true : false;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormSkillId('');
    setFormLevel('');
    setFormDesc('');
    setErrors({});
  };

  const handleOpenEdit = (mapping: ProficiencyMapping) => {
    setModalMode('edit');
    setCurrentMapping(mapping);
    setFormSkillId(mapping.skillId);
    setFormLevel(mapping.level);
    setFormDesc(mapping.description);
    setErrors({});
  };

  const handleOpenDelete = (mapping: ProficiencyMapping) => {
    setModalMode('delete');
    setCurrentMapping(mapping);
  };

  const handleSave = () => {
    if (!validate()) return;

    const newMapping: ProficiencyMapping = {
      id: modalMode === 'add' ? Math.random().toString(36).substr(2, 9) : currentMapping!.id,
      skillId: formSkillId,
      level: formLevel,
      description: formDesc
    };

    if (modalMode === 'add') {
      setMappings([newMapping, ...mappings]);
    } else {
      setMappings(mappings.map(m => m.id === newMapping.id ? newMapping : m));
    }
    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    if (currentMapping) {
      setMappings(mappings.filter(m => m.id !== currentMapping.id));
    }
    setModalMode(null);
  };

  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      const skill = skills.find(s => s.id === m.skillId);
      const content = `${skill?.name} ${m.description} ${m.level}`.toLowerCase();
      return content.includes(searchTerm.toLowerCase());
    });
  }, [mappings, searchTerm, skills]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMappings.slice(start, start + itemsPerPage);
  }, [filteredMappings, currentPage]);

  const totalPages = Math.ceil(filteredMappings.length / itemsPerPage);

  const getSkillInfo = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    const node = taxonomyNodes.find(n => n.id === skill?.taxonomyNodeId);
    return { skill, node };
  };

  return (
    <div className="p-8 space-y-6 animate-fadeIn min-h-full">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Skill-Proficiency Descriptors</h2>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage skill proficiency descriptors mapped to skills</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-white text-blue-800 border-2 border-blue-100 px-6 py-2.5 rounded-full text-sm font-bold flex items-center hover:bg-blue-50 transition shadow-sm"
        >
          <span className="mr-2 text-xl font-normal">+</span> Add Descriptor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="mb-6 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search By Skill and Descriptor Description"
              className="w-full pl-4 pr-10 py-3 bg-white text-black border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#1e3a8a] text-white text-sm">
              <tr>
                <th className="px-6 py-5 font-bold border-r border-blue-800">Skill</th>
                <th className="px-6 py-5 font-bold border-r border-blue-800">Proficiency Level</th>
                <th className="px-6 py-5 font-bold border-r border-blue-800">Descriptor Description</th>
                <th className="px-6 py-5 font-bold border-r border-blue-800">Hierarchy Node</th>
                <th className="px-6 py-5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((m) => {
                const { skill, node } = getSkillInfo(m.skillId);
                return (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-5 text-sm font-medium text-gray-800 border-r border-gray-50">{skill?.name || 'Deleted Skill'}</td>
                    <td className="px-6 py-5 text-sm text-gray-600 border-r border-gray-50">{m.level}</td>
                    <td className="px-6 py-5 text-sm text-gray-500 border-r border-gray-50 max-w-xs truncate">{m.description}</td>
                    <td className="px-6 py-5 text-sm text-gray-600 border-r border-gray-50">{node?.name || 'Unmapped'}</td>
                    <td className="px-6 py-5 text-sm">
                      <div className="flex justify-center space-x-3">
                        <button onClick={() => handleOpenEdit(m)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition"><Icons.Edit /></button>
                        <button onClick={() => handleOpenDelete(m)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition"><Icons.Delete /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMappings.length === 0 && (
            <div className="p-12 text-center text-gray-500 font-medium">No skill proficiency descriptors found matching your search.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-4 py-2 text-sm font-bold text-gray-400 disabled:opacity-30 hover:text-blue-700 transition"
            >
              First
            </button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition ${currentPage === i + 1 ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-4 py-2 text-sm font-bold text-gray-400 disabled:opacity-30 hover:text-blue-700 transition"
            >
              Last
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="p-10">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {modalMode === 'add' ? 'Create New Descriptor Definition' : 'Edit Descriptor Mapping'}
                </h3>
                <button onClick={() => setModalMode(null)} className="text-blue-800 p-1 hover:bg-gray-100 rounded-full transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-8 font-medium">Manage descriptors for specific skill proficiencies</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Select Skill *</label>
                  <select
                    value={formSkillId}
                    disabled={modalMode === 'edit'}
                    onChange={(e) => {
                      setFormSkillId(e.target.value);
                      setFormLevel('');
                    }}
                    className={`w-full px-4 py-3.5 bg-white text-black rounded-xl border-2 focus:ring-4 transition-all duration-200 outline-none appearance-none ${errors.skill ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                  >
                    <option value="">Search skills...</option>
                    {skills.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.skill && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.skill}</p>}
                </div>

                {/* Requirement 2: show skill category non editable field */}
                {formSkillId && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Skill Category (Non-editable)</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={getCategoryNameForSkill(formSkillId)}
                      className="w-full px-4 py-3.5 bg-gray-50 text-gray-600 rounded-xl border-2 border-gray-100 outline-none font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Proficiency Level *</label>
                  {/* Requirement 2: show proficiency levels as per skill category of that skill */}
                  <select
                    value={formLevel}
                    disabled={!formSkillId}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black rounded-xl border-2 focus:ring-4 transition-all duration-200 outline-none appearance-none ${errors.level ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                  >
                    <option value="">Select a proficiency level...</option>
                    {getValidLevelsForSkill(formSkillId).map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  {errors.level && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.level}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Descriptor Description *</label>
                  <textarea
                    rows={5}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black rounded-xl border-2 focus:ring-4 transition-all duration-200 outline-none resize-none ${errors.desc ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="Describe this descriptor"
                  />
                  {errors.desc && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.desc}</p>}
                </div>
              </div>

              <div className="flex justify-end items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                <button 
                  onClick={handleSave} 
                  className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition duration-200 active:scale-95"
                >
                  {modalMode === 'add' ? 'Create Descriptor' : 'Confirm Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Delete Descriptor Mapping</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">Are you sure you want to delete this descriptor mapping? This action cannot be undone.</p>
              
              <div className="flex justify-end items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                <button onClick={handleDeleteConfirm} className="px-8 py-2.5 bg-[#1e3a8a] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition duration-200 shadow-xl shadow-blue-100">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast.show && (
        <div className="fixed bottom-12 left-12 z-[200] animate-slideInRight">
          <div className="bg-[#fff1f1] border-l-4 border-red-500 p-6 rounded-lg shadow-2xl flex items-start space-x-5 min-w-[450px]">
            <div className="flex-shrink-0 bg-red-500 rounded-full p-2.5">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-red-600 mb-1">Error</h4>
              <p className="text-red-500 text-[15px] font-medium leading-snug">{errorToast.message}</p>
            </div>
            <button onClick={() => setErrorToast({ show: false, message: '' })} className="text-red-400 hover:text-red-600 transition-colors p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(-40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default ProficiencyLevels;
