import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { ExtendedTaxonomyItem, SkillCategory, JobRole, JobVariant, ProficiencyMapping, Competency, SkillRelationship, TaxonomyNode } from '../types';
import SearchableDropdown from './SearchableDropdown';

interface SkillsManagementProps {
  taxonomyNodes: TaxonomyNode[];
  skills: ExtendedTaxonomyItem[];
  setSkills: React.Dispatch<React.SetStateAction<ExtendedTaxonomyItem[]>>;
  skillCategories: SkillCategory[];
  jobRoles: JobRole[];
  jobVariants: JobVariant[];
  descriptorMappings: ProficiencyMapping[];
  setDescriptorMappings: React.Dispatch<React.SetStateAction<ProficiencyMapping[]>>;
  skillRelationships: SkillRelationship[];
  setSkillRelationships: React.Dispatch<React.SetStateAction<SkillRelationship[]>>;
  competencies: Competency[];
}

const SkillsManagement: React.FC<SkillsManagementProps> = ({
  taxonomyNodes, skills, setSkills, skillCategories, jobRoles, jobVariants, descriptorMappings, setDescriptorMappings, skillRelationships, setSkillRelationships, competencies
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // View States
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentItem, setCurrentItem] = useState<ExtendedTaxonomyItem | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTaxonomyNodeId, setFormTaxonomyNodeId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [localDescriptors, setLocalDescriptors] = useState<{ [level: string]: string }>({});
  const [selectedRelatedSkills, setSelectedRelatedSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; desc?: string; taxonomyNode?: string; category?: string }>({});

  // Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ExtendedTaxonomyItem | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const validate = (name: string, desc: string, taxonomyNodeId: string, categoryId: string) => {
    const newErrors: { name?: string; desc?: string; taxonomyNode?: string; category?: string } = {};
    const regex = /^[a-zA-Z0-9\s-_,.&()]*$/;
    
    if (!name.trim()) newErrors.name = "Name is required.";
    else if (!regex.test(name)) newErrors.name = "Special characters allowed: -, _, ,, ., &, (, )";
    
    if (!desc.trim()) newErrors.desc = "Description is required.";
    else if (!regex.test(desc)) newErrors.desc = "Special characters allowed: -, _, ,, ., &, (, )";

    // Taxonomy node is optional per requirement: "skill can be optionally mapped to any node"
    // However, if we want to keep it mandatory for some reason, we can check it.
    // The prompt says "skill can be optionally mapped to any node in the above tree"
    // So I will NOT make it mandatory.

    if (!categoryId) newErrors.category = "Skill Category is mandatory.";

    return newErrors;
  };

  const isSkillUsed = (skillId: string) => {
    const inJobRoles = jobRoles.some(jr => jr.mappedSkills.some(ms => ms.skillId === skillId));
    const inJobVariants = jobVariants.some(jv => jv.mappedSkills.some(ms => ms.skillId === skillId));
    const inDescriptors = descriptorMappings.some(m => m.skillId === skillId);
    const inCompetencies = competencies.some(c => c.mappedSkills.some(ms => ms.skillId === skillId));
    return inJobRoles || inJobVariants || inDescriptors || inCompetencies;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleOpenAdd = () => {
    setViewMode('form');
    setFormMode('add');
    setFormName('');
    setFormDesc('');
    setFormTaxonomyNodeId('');
    setFormCategoryId('');
    setLocalDescriptors({});
    setSelectedRelatedSkills([]);
    setErrors({});
  };

  const handleOpenEdit = (item: ExtendedTaxonomyItem) => {
    setViewMode('form');
    setFormMode('edit');
    setCurrentItem(item);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormTaxonomyNodeId(item.taxonomyNodeId || '');
    setFormCategoryId(item.categoryId || '');
    
    // Load descriptors
    const mappings = descriptorMappings.filter(m => m.skillId === item.id);
    const descMap: { [level: string]: string } = {};
    mappings.forEach(m => {
      descMap[m.level] = m.description;
    });
    setLocalDescriptors(descMap);

    // Load related skills
    const related = skillRelationships
      .filter(r => r.skillId1 === item.id || r.skillId2 === item.id)
      .map(r => r.skillId1 === item.id ? r.skillId2 : r.skillId1);
    setSelectedRelatedSkills(related);

    setErrors({});
  };

  const handleSave = () => {
    const validationErrors = validate(formName, formDesc, formTaxonomyNodeId, formCategoryId);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (formMode === 'edit' && currentItem?.categoryId !== formCategoryId) {
      if (isSkillUsed(currentItem!.id)) {
        showToast("Skill Category cannot be changed because this skill is mapped to Job Roles, Job Variants, Skill-Proficiency descriptors, or Competencies.", "error");
        return;
      }
    }

    const skillId = formMode === 'add' ? Math.random().toString(36).substr(2, 9) : currentItem!.id;

    const itemData: ExtendedTaxonomyItem = {
      id: skillId,
      type: 'Skill',
      name: formName,
      description: formDesc,
      taxonomyNodeId: formTaxonomyNodeId || undefined,
      categoryId: formCategoryId
    };

    // Update Skills
    setSkills(formMode === 'add' ? [itemData, ...skills] : skills.map(s => s.id === itemData.id ? itemData : s));

    // Update Descriptors
    const otherMappings = descriptorMappings.filter(m => m.skillId !== skillId);
    const newMappings: ProficiencyMapping[] = Object.entries(localDescriptors).map(([level, desc]) => ({
      id: Math.random().toString(36).substr(2, 9),
      skillId,
      level,
      description: desc as string
    }));
    setDescriptorMappings([...otherMappings, ...newMappings]);

    // Update Relationships
    const otherRelationships = skillRelationships.filter(r => r.skillId1 !== skillId && r.skillId2 !== skillId);
    const newRelationships: SkillRelationship[] = selectedRelatedSkills.map(targetId => ({
      id: Math.random().toString(36).substr(2, 9),
      skillId1: skillId,
      skillId2: targetId
    }));
    setSkillRelationships([...otherRelationships, ...newRelationships]);

    showToast(`Skill ${formMode === 'add' ? 'created' : 'updated'} successfully`);
    setViewMode('table');
  };

  const handleDeleteConfirm = () => {
    if (!showDeleteConfirm) return;

    if (isSkillUsed(showDeleteConfirm.id)) {
      showToast("Skill cannot be deleted because it is mapped to Job Roles, Job Variants, Skill-Proficiency descriptors, or Competencies.", "error");
      setShowDeleteConfirm(null);
      return;
    }
    setSkills(skills.filter(s => s.id !== showDeleteConfirm.id));

    showToast(`Skill deleted successfully`);
    setShowDeleteConfirm(null);
  };

  const currentTableData = useMemo(() => {
    return skills.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [skills, searchTerm]);

  const getTaxonomyNodeName = (item: ExtendedTaxonomyItem) => {
    if (!item.taxonomyNodeId) return 'Unmapped';
    return taxonomyNodes.find(n => n.id === item.taxonomyNodeId)?.name || 'Unknown Node';
  };

  const getCategoryName = (item: ExtendedTaxonomyItem) => {
    return skillCategories.find(cat => cat.id === item.categoryId)?.name || 'N/A';
  };

  const selectedCategory = skillCategories.find(cat => cat.id === formCategoryId);

  const mappedJobRoles = useMemo(() => {
    if (formMode === 'add' || !currentItem) return [];
    return jobRoles.filter(jr => jr.mappedSkills.some(ms => ms.skillId === currentItem.id));
  }, [jobRoles, currentItem, formMode]);

  const mappedJobVariants = useMemo(() => {
    if (formMode === 'add' || !currentItem) return [];
    return jobVariants.filter(jv => jv.mappedSkills.some(ms => ms.skillId === currentItem.id));
  }, [jobVariants, currentItem, formMode]);

  if (viewMode === 'form') {
    return (
      <div className="p-8 space-y-8 animate-fadeIn bg-[#f8fafc] min-h-full pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('table')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Icons.ArrowLeft />
            </button>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {formMode === 'add' ? 'Create New Skill' : `Edit Skill: ${currentItem?.name}`}
              </h2>
              <p className="text-gray-500 text-sm font-medium mt-1">
                {formMode === 'add' ? 'Define a new skill and its proficiency descriptors' : 'Update skill details, proficiency descriptors and relationships'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('table')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition duration-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition duration-200 shadow-xl shadow-blue-100 active:scale-95"
            >
              {formMode === 'add' ? 'Create Skill' : 'Save Changes'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Skill Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 text-black rounded-xl border focus:ring-4 transition-all duration-200 outline-none ${errors.name ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="e.g. React Development"
                  />
                  {errors.name && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-50 text-black rounded-xl border focus:ring-4 transition-all duration-200 outline-none resize-none ${errors.desc ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="Enter a detailed description of the skill..."
                  />
                  {errors.desc && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.desc}</p>}
                </div>

                <div>
                  <SearchableDropdown
                    label="Hierarchy Node (Optional)"
                    options={taxonomyNodes.map(node => ({ id: node.id, label: node.name, description: node.description }))}
                    value={formTaxonomyNodeId}
                    onChange={(id) => setFormTaxonomyNodeId(id)}
                    placeholder="Select Hierarchy Node"
                    error={errors.taxonomyNode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Skill Type *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    disabled={formMode === 'edit' && isSkillUsed(currentItem!.id)}
                    className={`w-full px-4 py-3 bg-gray-50 text-black rounded-xl border focus:ring-4 transition-all duration-200 outline-none ${errors.category ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'} ${formMode === 'edit' && isSkillUsed(currentItem!.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Type</option>
                    {skillCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.category}</p>}
                  {formMode === 'edit' && isSkillUsed(currentItem!.id) && (
                    <p className="mt-2 text-[10px] text-orange-600 font-bold italic">
                      Governance Lock: Type cannot be changed because this skill is in use.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                Proficiency Level Descriptors
              </h3>
              
              {!formCategoryId ? (
                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">Please select a Skill Type to view and edit proficiency descriptors.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedCategory?.proficiencyLevels.map((level) => (
                    <div key={level.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-extrabold text-gray-900">{level.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 italic">Default Definition: {level.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Level {level.levelNo}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={localDescriptors[level.name] || ''}
                        onChange={(e) => setLocalDescriptors({ ...localDescriptors, [level.name]: e.target.value })}
                        className="w-full px-4 py-3 bg-white text-black rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all duration-200 outline-none resize-none text-sm font-medium"
                        placeholder={`Enter specific descriptor for ${level.name}...`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Relationships & Mappings */}
          <div className="space-y-8">
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                Related Skills
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedRelatedSkills.map(id => {
                    const skill = skills.find(s => s.id === id);
                    return (
                      <div key={id} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 group">
                        <span>{skill?.name}</span>
                        <button 
                          onClick={() => setSelectedRelatedSkills(prev => prev.filter(i => i !== id))}
                          className="ml-2 text-blue-300 hover:text-red-600 transition-colors"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    );
                  })}
                  {selectedRelatedSkills.length === 0 && (
                    <p className="text-gray-400 text-xs italic">No related skills selected.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <SearchableDropdown
                    label="Add Related Skill"
                    options={skills
                      .filter(s => s.id !== currentItem?.id && !selectedRelatedSkills.includes(s.id))
                      .map(s => ({ id: s.id, label: s.name, description: s.description }))
                    }
                    value=""
                    onChange={(id) => {
                      if (id && !selectedRelatedSkills.includes(id)) {
                        setSelectedRelatedSkills([...selectedRelatedSkills, id]);
                      }
                    }}
                    placeholder="Select a skill to relate..."
                  />
                </div>
              </div>
            </section>

            {formMode === 'edit' && (
              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                  Usage & Mappings
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mapped Job Roles</h4>
                    <div className="space-y-2">
                      {mappedJobRoles.map(jr => (
                        <div key={jr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-sm font-bold text-gray-800">{jr.name}</span>
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold">{jr.code}</span>
                        </div>
                      ))}
                      {mappedJobRoles.length === 0 && (
                        <p className="text-gray-400 text-xs italic">Not mapped to any job roles.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mapped Job Variants</h4>
                    <div className="space-y-2">
                      {mappedJobVariants.map(jv => (
                        <div key={jv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-sm font-bold text-gray-800">{jv.name}</span>
                          <span className="text-[10px] text-gray-500 font-medium">Variant</span>
                        </div>
                      ))}
                      {mappedJobVariants.length === 0 && (
                        <p className="text-gray-400 text-xs italic">Not mapped to any job variants.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl px-8 py-4 flex items-center space-x-6 z-50 animate-slideInUp">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${formMode === 'add' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-bold text-gray-700">{formMode === 'add' ? 'New Skill Draft' : 'Editing Skill'}</span>
          </div>
          <div className="h-6 w-px bg-gray-200"></div>
          <button 
            onClick={() => setViewMode('table')}
            className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-900 transition shadow-lg active:scale-95"
          >
            {formMode === 'add' ? 'Publish Skill' : 'Update Skill'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fadeIn relative min-h-full bg-[#f8fafc]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleOpenAdd} 
                className="bg-[#1e3a8a] text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center hover:bg-blue-900 transition shadow-xl shadow-blue-100 active:scale-95"
              >
                <span className="mr-2 text-xl font-normal">+</span> Add Skill
              </button>
            </div>
            
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search Skill Name or Description..."
                className="w-full pl-6 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
              <tr>
                <th className="px-8 py-5 border-r border-blue-800 w-1/4">Skill Name</th>
                <th className="px-8 py-5 border-r border-blue-800 w-1/3">Skill Description</th>
                <th className="px-8 py-5 border-r border-blue-800">Hierarchy Node</th>
                <th className="px-8 py-5 border-r border-blue-800">Skill Type</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTableData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition group border-b border-gray-50 last:border-0">
                  <td className="px-8 py-6 text-sm font-extrabold text-gray-900 border-r border-gray-50">{item.name}</td>
                  <td className="px-8 py-6 text-sm text-gray-500 border-r border-gray-50 leading-relaxed">{item.description}</td>
                  <td className="px-8 py-6 text-sm text-blue-700 font-bold border-r border-gray-50">
                    <span className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{getTaxonomyNodeName(item)}</span>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-700 font-extrabold border-r border-gray-50">
                    <span className="bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{getCategoryName(item)}</span>
                  </td>
                  <td className="px-8 py-6 text-sm">
                    <div className="flex justify-center space-x-3">
                      <button onClick={() => handleOpenEdit(item)} className="p-3 hover:bg-blue-50 rounded-xl transition border border-gray-100 shadow-sm text-blue-700 bg-white" title="Edit"><Icons.Edit /></button>
                      <button onClick={() => setShowDeleteConfirm(item)} className="p-3 hover:bg-red-50 rounded-xl transition border border-gray-100 shadow-sm text-red-600 bg-white" title="Delete"><Icons.Delete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentTableData.length === 0 && (
            <div className="p-24 text-center text-gray-400 italic font-medium">
              {searchTerm ? `No skills found matching "${searchTerm}"` : "No skills defined yet."}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Delete Skill?</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to delete <span className="text-gray-900 font-bold">"{showDeleteConfirm.name}"</span>? This action is permanent and cannot be undone.
              </p>
              
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button onClick={() => setShowDeleteConfirm(null)} className="px-8 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition duration-200">Cancel</button>
                <button onClick={handleDeleteConfirm} className="px-8 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl shadow-red-100">Delete Skill</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-12 left-12 z-[300] animate-slideInRight">
          <div className={`${toast.type === 'success' ? 'bg-[#eefcf4] border-green-500' : 'bg-[#fff1f1] border-red-500'} border-l-4 p-6 rounded-2xl shadow-2xl flex items-start space-x-5 min-w-[450px] bg-white`}>
            <div className={`flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full p-2.5`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className={`text-xl font-bold ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'} mb-1`}>{toast.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className={`${toast.type === 'success' ? 'text-green-500' : 'text-red-500'} text-[15px] font-medium leading-snug`}>{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
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
        @keyframes slideInUp { from { transform: translate(-50%, 40px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInUp { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default SkillsManagement;
