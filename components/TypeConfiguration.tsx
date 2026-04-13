import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { SkillCategory, ExtendedTaxonomyItem, CategoryProficiencyLevel, Competency } from '../types';

interface TypeConfigurationProps {
  skillCategories: SkillCategory[];
  setSkillCategories: React.Dispatch<React.SetStateAction<SkillCategory[]>>;
  skills: ExtendedTaxonomyItem[];
  competencies: Competency[];
}

const TypeConfiguration: React.FC<TypeConfigurationProps> = ({ skillCategories, setSkillCategories, skills, competencies }) => {
  const [activeView, setActiveView] = useState<'categories' | 'proficiency-levels'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'add-level' | 'edit-level' | 'delete-level' | null>(null);
  const [currentCategory, setCurrentCategory] = useState<SkillCategory | null>(null);
  const [currentLevel, setCurrentLevel] = useState<CategoryProficiencyLevel | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [errors, setErrors] = useState<{ name?: string; desc?: string }>({});

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredCategories = useMemo(() => {
    return skillCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [skillCategories, searchTerm]);

  // Check if skills or competencies are mapped to a category (governance lock)
  const isCategoryMapped = (categoryId: string) => {
    const mappedToSkills = skills.some(s => s.categoryId === categoryId);
    const mappedToCompetencies = competencies.some(c => c.typeId === categoryId);
    return mappedToSkills || mappedToCompetencies;
  };

  // Category Actions
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormName('');
    setFormDesc('');
    setErrors({});
  };

  const handleOpenEdit = (cat: SkillCategory) => {
    setModalMode('edit');
    setCurrentCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description);
    setErrors({});
  };

  const handleOpenDelete = (cat: SkillCategory) => {
    setModalMode('delete');
    setCurrentCategory(cat);
  };

  const handleOpenProficiencyLevels = (cat: SkillCategory) => {
    setSelectedCategory(cat);
    setActiveView('proficiency-levels');
    setSearchTerm('');
  };

  // Level Actions
  const handleOpenAddLevel = () => {
    if (!selectedCategory) return;
    if (isCategoryMapped(selectedCategory.id)) {
      showToast("Proficiency levels cannot be added because skills or competencies are mapped to this category.", "error");
      return;
    }
    setModalMode('add-level');
    setFormName('');
    setFormDesc('');
    setErrors({});
  };

  const handleOpenEditLevel = (level: CategoryProficiencyLevel) => {
    if (!selectedCategory) return;
    if (isCategoryMapped(selectedCategory.id)) {
      showToast("Proficiency levels cannot be edited because skills or competencies are mapped to this category.", "error");
      return;
    }
    setModalMode('edit-level');
    setCurrentLevel(level);
    setFormName(level.name);
    setFormDesc(level.description);
    setErrors({});
  };

  const handleOpenDeleteLevel = (level: CategoryProficiencyLevel) => {
    if (!selectedCategory) return;
    if (isCategoryMapped(selectedCategory.id)) {
      showToast("Proficiency levels cannot be deleted because skills or competencies are mapped to this category.", "error");
      return;
    }
    setModalMode('delete-level');
    setCurrentLevel(level);
  };

  const validate = () => {
    const newErrors: { name?: string; desc?: string } = {};
    if (!formName.trim()) newErrors.name = "Name is required.";
    if (!formDesc.trim()) newErrors.desc = "Description is required.";
    
    if (modalMode === 'add' || modalMode === 'edit') {
      const isDuplicate = skillCategories.some(cat => 
        cat.name.toLowerCase() === formName.toLowerCase() && 
        (modalMode === 'add' || cat.id !== currentCategory?.id)
      );
      if (isDuplicate) newErrors.name = "Type name must be unique.";
    }

    if (modalMode === 'add-level' || modalMode === 'edit-level') {
      const isDuplicate = selectedCategory?.proficiencyLevels.some(lvl => 
        lvl.name.toLowerCase() === formName.toLowerCase() &&
        (modalMode === 'add-level' || lvl.id !== currentLevel?.id)
      );
      if (isDuplicate) newErrors.name = "Proficiency level already exists for this type.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    
    if (modalMode === 'add') {
      const newCat: SkillCategory = {
        id: Math.random().toString(36).substr(2, 9),
        name: formName,
        description: formDesc,
        createdDate: now,
        lastEditedDate: now,
        proficiencyLevels: []
      };
      setSkillCategories([newCat, ...skillCategories]);
      showToast("Type created successfully.");
    } else if (modalMode === 'edit' && currentCategory) {
      const updatedCat: SkillCategory = {
        ...currentCategory,
        name: formName,
        description: formDesc,
        lastEditedDate: now
      };
      setSkillCategories(skillCategories.map(c => c.id === updatedCat.id ? updatedCat : c));
      showToast("Type updated successfully.");
    } else if (modalMode === 'add-level' && selectedCategory) {
      const newLevel: CategoryProficiencyLevel = {
        id: Math.random().toString(36).substr(2, 9),
        name: formName,
        description: formDesc,
        levelNo: selectedCategory.proficiencyLevels.length + 1,
        createdDate: now,
        lastEditedDate: now
      };
      const updatedCat = { ...selectedCategory, proficiencyLevels: [...selectedCategory.proficiencyLevels, newLevel], lastEditedDate: now };
      setSkillCategories(skillCategories.map(c => c.id === updatedCat.id ? updatedCat : c));
      setSelectedCategory(updatedCat);
      showToast("Proficiency level added successfully.");
    } else if (modalMode === 'edit-level' && selectedCategory && currentLevel) {
      const updatedLevel: CategoryProficiencyLevel = { ...currentLevel, name: formName, description: formDesc, lastEditedDate: now };
      const updatedLevels = selectedCategory.proficiencyLevels.map(l => l.id === updatedLevel.id ? updatedLevel : l);
      const updatedCat = { ...selectedCategory, proficiencyLevels: updatedLevels, lastEditedDate: now };
      setSkillCategories(skillCategories.map(c => c.id === updatedCat.id ? updatedCat : c));
      setSelectedCategory(updatedCat);
      showToast("Proficiency level updated successfully.");
    }

    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    if (modalMode === 'delete' && currentCategory) {
      if (isCategoryMapped(currentCategory.id)) {
        showToast("Type cannot be deleted because it is mapped to existing skills or competencies.", "error");
        setModalMode(null);
        return;
      }
      setSkillCategories(skillCategories.filter(c => c.id !== currentCategory.id));
      showToast("Type deleted successfully.");
    } else if (modalMode === 'delete-level' && selectedCategory && currentLevel) {
      const updatedLevels = selectedCategory.proficiencyLevels.filter(l => l.id !== currentLevel.id);
      const updatedCat = { ...selectedCategory, proficiencyLevels: updatedLevels, lastEditedDate: now };
      setSkillCategories(skillCategories.map(c => c.id === updatedCat.id ? updatedCat : c));
      setSelectedCategory(updatedCat);
      showToast("Proficiency level deleted successfully.");
    }
    setModalMode(null);
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full bg-[#f8fafc]">
      {activeView === 'categories' ? (
        <>
          <header className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Type Configuration</h2>
              <p className="text-gray-600 text-sm font-medium mt-1">Manage types and proficiency levels for both skills and competencies</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="bg-[#1e3a8a] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
            >
              Create New Type
            </button>
          </header>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Search Types</h3>
              <div className="relative max-w-2xl">
                <input 
                  type="text" 
                  placeholder="Search by type name..." 
                  className="w-full px-6 py-4 bg-white text-black border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icons.Search />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6 overflow-hidden">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
                  <tr>
                    <th className="px-8 py-5 border-r border-blue-800">Type Name</th>
                    <th className="px-8 py-5 border-r border-blue-800">Description</th>
                    <th className="px-8 py-5 border-r border-blue-800 text-center">Mapped Items</th>
                    <th className="px-8 py-5 border-r border-blue-800">Last Edited</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map(cat => {
                    const mappedCount = skills.filter(s => s.categoryId === cat.id).length + competencies.filter(c => c.typeId === cat.id).length;
                    return (
                      <tr key={cat.id} className="hover:bg-blue-50/20 transition group">
                        <td className="px-8 py-6 border-r border-gray-50 text-sm font-extrabold text-gray-900">{cat.name}</td>
                        <td className="px-8 py-6 border-r border-gray-50 text-sm text-gray-500 font-medium max-w-xs truncate">{cat.description}</td>
                        <td className="px-8 py-6 border-r border-gray-50 text-center">
                           <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                              {mappedCount}
                           </span>
                        </td>
                        <td className="px-8 py-6 border-r border-gray-50 text-sm text-gray-600 font-medium">{cat.lastEditedDate}</td>
                        <td className="px-8 py-6">
                           <div className="flex justify-center space-x-3">
                              <button onClick={() => handleOpenProficiencyLevels(cat)} className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition shadow-sm" title="Manage Proficiency Levels">Levels</button>
                              <button onClick={() => handleOpenEdit(cat)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-600"><Icons.Edit /></button>
                              <button onClick={() => handleOpenDelete(cat)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-900"><Icons.Delete /></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCategories.length === 0 && (
                <div className="p-20 text-center text-gray-400 italic font-medium">No results found matching your criteria.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <header className="flex flex-col space-y-4">
            <button 
              onClick={() => setActiveView('categories')} 
              className="flex items-center space-x-2 text-blue-700 hover:underline font-bold text-sm w-fit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              <span>Back to Types</span>
            </button>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Proficiency Level Configuration</p>
                <h2 className="text-5xl font-extrabold text-gray-900 leading-tight">{selectedCategory?.name}</h2>
              </div>
              <button 
                onClick={handleOpenAddLevel}
                className="bg-[#1e3a8a] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
              >
                + Add Proficiency Level
              </button>
            </div>
          </header>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6 overflow-hidden">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
                  <tr>
                    <th className="px-8 py-5 border-r border-blue-800">Proficiency Level Name</th>
                    <th className="px-8 py-5 border-r border-blue-800">Description</th>
                    <th className="px-8 py-5 border-r border-blue-800">Last Edited Date</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedCategory?.proficiencyLevels.map(lvl => (
                    <tr key={lvl.id} className="hover:bg-blue-50/20 transition group">
                      <td className="px-8 py-6 border-r border-gray-50 text-sm font-bold text-gray-900">{lvl.name}</td>
                      <td className="px-8 py-6 border-r border-gray-50 text-sm text-gray-500 font-medium max-w-xs truncate">{lvl.description}</td>
                      <td className="px-8 py-6 border-r border-gray-50 text-sm text-gray-600 font-medium">{lvl.lastEditedDate}</td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center space-x-3">
                            <button onClick={() => handleOpenEditLevel(lvl)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-600" title="Edit Level"><Icons.Edit /></button>
                            <button onClick={() => handleOpenDeleteLevel(lvl)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-900" title="Delete Level"><Icons.Delete /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedCategory?.proficiencyLevels.length === 0 && (
                <div className="p-20 text-center text-gray-400 font-medium italic">No proficiency levels defined for this type.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl animate-scaleIn overflow-hidden">
             <div className="p-10">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                  {modalMode === 'add' ? 'Create New Type' : 'Edit Type'}
                </h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">Define type details below.</p>
                
                <div className="space-y-6">
                   <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Type Name *</label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.name ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                        placeholder="e.g. Behavioral Skills"
                      />
                      {errors.name && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.name}</p>}
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                      <textarea 
                        rows={4}
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 resize-none ${errors.desc ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                        placeholder="Describe the type purpose..."
                      />
                      {errors.desc && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.desc}</p>}
                   </div>
                </div>

                <div className="flex justify-end items-center space-x-4 mt-12">
                   <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                   <button onClick={handleSave} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Save Changes</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Proficiency Level Modal */}
      {(modalMode === 'add-level' || modalMode === 'edit-level') && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-scaleIn overflow-hidden">
             <div className="p-10">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                  {modalMode === 'add-level' ? 'Add Proficiency Level' : 'Edit Proficiency Level'}
                </h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">Define a proficiency level within <span className="text-[#1e3a8a] font-bold">"{selectedCategory?.name}"</span>.</p>
                
                <div className="space-y-6">
                   <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Proficiency Level Name *</label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.name ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                        placeholder="e.g. Expert"
                      />
                      {errors.name && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.name}</p>}
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                      <textarea 
                        rows={4}
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 resize-none ${errors.desc ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                        placeholder="Describe what this proficiency level represents..."
                      />
                      {errors.desc && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.desc}</p>}
                   </div>
                </div>

                <div className="flex justify-end items-center space-x-4 mt-12">
                   <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                   <button onClick={handleSave} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Save Level</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {(modalMode === 'delete' || modalMode === 'delete-level') && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
                {modalMode === 'delete' ? 'Delete Type?' : 'Delete Proficiency Level?'}
              </h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to delete <span className="text-gray-900 font-bold">"{modalMode === 'delete' ? currentCategory?.name : currentLevel?.name}"</span>? This action is permanent.
              </p>
              
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
                <button onClick={handleDeleteConfirm} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl">Confirm Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-12 left-12 z-[300] animate-slideInRight">
          <div className={`${toast.type === 'success' ? 'bg-[#eefcf4] border-green-500' : 'bg-[#fff1f1] border-red-500'} border-l-4 p-6 rounded-xl shadow-2xl flex items-start space-x-5 min-w-[400px]`}>
            <div className={`flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full p-2.5`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
            </div>
            <div className="flex-1">
              <h4 className={`text-xl font-bold ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'} mb-1`}>{toast.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className={`${toast.type === 'success' ? 'text-green-500' : 'text-red-500'} text-[15px] font-medium leading-snug`}>{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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

export default TypeConfiguration;
