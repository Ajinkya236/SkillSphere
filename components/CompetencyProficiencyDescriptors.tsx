import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { Competency, CompetencyProficiencyMapping, SkillCategory, ExtendedTaxonomyItem, TaxonomyNode } from '../types';

interface CompetencyProficiencyDescriptorsProps {
  competencies: Competency[];
  competencyDescriptors: CompetencyProficiencyMapping[];
  setCompetencyDescriptors: React.Dispatch<React.SetStateAction<CompetencyProficiencyMapping[]>>;
  skillCategories: SkillCategory[];
  taxonomyNodes: TaxonomyNode[];
}

const CompetencyProficiencyDescriptors: React.FC<CompetencyProficiencyDescriptorsProps> = ({
  competencies,
  competencyDescriptors,
  setCompetencyDescriptors,
  skillCategories,
  taxonomyNodes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTaxonomyNode, setFilterTaxonomyNode] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest'>('date-newest');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [currentMapping, setCurrentMapping] = useState<CompetencyProficiencyMapping | null>(null);

  // Form States
  const [formCompetencyId, setFormCompetencyId] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [errors, setErrors] = useState<{ competencyId?: string; level?: string; description?: string }>({});

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredMappings = useMemo(() => {
    let list = competencyDescriptors.filter(mapping => {
      const competency = competencies.find(c => c.id === mapping.competencyId);
      if (!competency) return false;
      
      const matchesSearch = competency.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTaxonomyNode = !filterTaxonomyNode || competency.taxonomyNodeId === filterTaxonomyNode;
      
      return matchesSearch && matchesTaxonomyNode;
    });

    // Sorting
    list.sort((a, b) => {
      const compA = competencies.find(c => c.id === a.competencyId);
      const compB = competencies.find(c => c.id === b.competencyId);
      if (!compA || !compB) return 0;

      switch (sortBy) {
        case 'name-asc':
          return compA.title.localeCompare(compB.title);
        case 'name-desc':
          return compB.title.localeCompare(compA.title);
        case 'date-newest':
          // We don't have edited date on mapping, but we can use competency's lastEditedDate as a proxy or just assume newest added
          return new Date(compB.lastEditedDate).getTime() - new Date(compA.lastEditedDate).getTime();
        case 'date-oldest':
          return new Date(compA.lastEditedDate).getTime() - new Date(compB.lastEditedDate).getTime();
        default:
          return 0;
      }
    });

    return list;
  }, [competencyDescriptors, competencies, searchTerm, filterTaxonomyNode, sortBy]);

  const validate = () => {
    const newErrors: { competencyId?: string; level?: string; description?: string } = {};
    if (!formCompetencyId) newErrors.competencyId = "Competency is required.";
    if (!formLevel) newErrors.level = "Proficiency Level is required.";
    if (!formDescription.trim()) newErrors.description = "Description is required.";

    // Uniqueness check
    if (formCompetencyId && formLevel) {
      const isDuplicate = competencyDescriptors.some(m => 
        m.competencyId === formCompetencyId && 
        m.level === formLevel && 
        (!currentMapping || m.id !== currentMapping.id)
      );
      if (isDuplicate) {
        newErrors.level = "This proficiency level already has a descriptor for the selected competency.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentMapping(null);
    setFormCompetencyId('');
    setFormLevel('');
    setFormDescription('');
    setErrors({});
  };

  const handleOpenEdit = (mapping: CompetencyProficiencyMapping) => {
    setModalMode('edit');
    setCurrentMapping(mapping);
    setFormCompetencyId(mapping.competencyId);
    setFormLevel(mapping.level);
    setFormDescription(mapping.description);
    setErrors({});
  };

  const handleOpenDelete = (mapping: CompetencyProficiencyMapping) => {
    setModalMode('delete');
    setCurrentMapping(mapping);
  };

  const handleSave = () => {
    if (!validate()) return;

    if (modalMode === 'add') {
      const newMapping: CompetencyProficiencyMapping = {
        id: Math.random().toString(36).substr(2, 9),
        competencyId: formCompetencyId,
        level: formLevel,
        description: formDescription.trim()
      };
      setCompetencyDescriptors([...competencyDescriptors, newMapping]);
      showToast("Proficiency descriptor created successfully.");
    } else if (modalMode === 'edit' && currentMapping) {
      const updatedMapping: CompetencyProficiencyMapping = {
        ...currentMapping,
        competencyId: formCompetencyId,
        level: formLevel,
        description: formDescription.trim()
      };
      setCompetencyDescriptors(competencyDescriptors.map(m => m.id === currentMapping.id ? updatedMapping : m));
      showToast("Proficiency descriptor updated successfully.");
    }

    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    if (currentMapping) {
      setCompetencyDescriptors(competencyDescriptors.filter(m => m.id !== currentMapping.id));
      showToast("Proficiency descriptor deleted successfully.");
      setModalMode(null);
    }
  };

  const getCompetencyDetails = (id: string) => {
    const comp = competencies.find(c => c.id === id);
    if (!comp) return { title: 'N/A', node: 'N/A' };
    const node = taxonomyNodes.find(n => n.id === comp.taxonomyNodeId)?.name || 'N/A';
    return { title: comp.title, node };
  };

  const selectedCompetency = competencies.find(c => c.id === formCompetencyId);
  const selectedType = skillCategories.find(cat => cat.id === selectedCompetency?.typeId);

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Competency Proficiency Descriptors</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Define specific behavioral indicators for each proficiency level of a competency</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-[#1e3a8a] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
        >
          Add Proficiency Descriptor
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Search by competency name..." 
                className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <select 
                value={filterTaxonomyNode}
                onChange={e => setFilterTaxonomyNode(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all"
              >
                <option value="">All Hierarchy Nodes</option>
                {taxonomyNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>

              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all"
              >
                <option value="date-newest">Last Edited Date (Newest)</option>
                <option value="date-oldest">First Edited Date (Oldest)</option>
                <option value="name-asc">Competency Name (A-Z)</option>
                <option value="name-desc">Competency Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
              <tr>
                <th className="px-6 py-5 border-r border-blue-800">Competency Name</th>
                <th className="px-6 py-5 border-r border-blue-800">Proficiency Level</th>
                <th className="px-6 py-5 border-r border-blue-800">Descriptor Description</th>
                <th className="px-6 py-5 border-r border-blue-800">Hierarchy Node</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMappings.map(mapping => {
                const details = getCompetencyDetails(mapping.competencyId);
                return (
                  <tr key={mapping.id} className="hover:bg-blue-50/20 transition group">
                    <td className="px-6 py-6 border-r border-gray-50 text-sm font-extrabold text-gray-900">{details.title}</td>
                    <td className="px-6 py-6 border-r border-gray-50 text-sm text-blue-700 font-bold">{mapping.level}</td>
                    <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-500 font-medium max-w-md">{mapping.description}</td>
                    <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-600 font-medium">{details.node}</td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center space-x-3">
                        <button onClick={() => handleOpenEdit(mapping)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-600" title="Edit"><Icons.Edit /></button>
                        <button onClick={() => handleOpenDelete(mapping)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-red-600" title="Delete"><Icons.Delete /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMappings.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic font-medium">
              {searchTerm ? `No proficiency descriptors found matching "${searchTerm}"` : "No proficiency descriptors defined yet."}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-scaleIn overflow-hidden">
            <div className="p-10">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {modalMode === 'add' ? "Add Proficiency Descriptor" : "Edit Proficiency Descriptor"}
              </h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                {modalMode === 'add' ? "Associate a behavioral indicator with a competency and level" : "Update the proficiency descriptor details"}
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Select Competency *</label>
                  <select 
                    value={formCompetencyId}
                    onChange={e => {
                      setFormCompetencyId(e.target.value);
                      setFormLevel(''); // Reset level when competency changes
                    }}
                    disabled={modalMode === 'edit'}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.competencyId ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'} ${modalMode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Competency</option>
                    {competencies.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  {errors.competencyId && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.competencyId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Select Proficiency Level *</label>
                  <select 
                    value={formLevel}
                    onChange={e => setFormLevel(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.level ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                  >
                    <option value="">Select Level</option>
                    {selectedType?.proficiencyLevels.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  {errors.level && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.level}</p>}
                  {!formCompetencyId && <p className="mt-1 text-[10px] text-gray-400 italic">Please select a competency first to see available levels.</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Proficiency Description *</label>
                  <textarea 
                    rows={4}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.description ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="Describe the behavioral indicators for this level..."
                  />
                  {errors.description && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.description}</p>}
                </div>
              </div>

              <div className="flex justify-end items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                <button onClick={handleSave} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">
                  {modalMode === 'add' ? "Create Descriptor" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && currentMapping && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Delete Proficiency Descriptor?</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to delete the descriptor for <span className="text-gray-900 font-bold">"{getCompetencyDetails(currentMapping.competencyId).title}"</span> at <span className="text-blue-700 font-bold">"{currentMapping.level}"</span>?
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

export default CompetencyProficiencyDescriptors;
