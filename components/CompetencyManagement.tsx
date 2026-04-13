import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { 
  Competency, 
  CompetencySkillMapping, 
  ExtendedTaxonomyItem, 
  SkillCategory, 
  ProficiencyMapping,
  CompetencyProficiencyMapping,
  CompetencyRelationship,
  JobRole,
  JobVariant,
  TaxonomyNode
} from '../types';
import SearchableDropdown from './SearchableDropdown';

interface CompetencyManagementProps {
  competencies: Competency[];
  setCompetencies: React.Dispatch<React.SetStateAction<Competency[]>>;
  skills: ExtendedTaxonomyItem[];
  taxonomyNodes: TaxonomyNode[];
  skillCategories: SkillCategory[];
  descriptorMappings: ProficiencyMapping[];
  competencyDescriptors: CompetencyProficiencyMapping[];
  setCompetencyDescriptors: React.Dispatch<React.SetStateAction<CompetencyProficiencyMapping[]>>;
  competencyRelationships: CompetencyRelationship[];
  setCompetencyRelationships: React.Dispatch<React.SetStateAction<CompetencyRelationship[]>>;
  jobRoles: JobRole[];
  jobVariants: JobVariant[];
}

const CompetencyManagement: React.FC<CompetencyManagementProps> = ({
  competencies,
  setCompetencies,
  skills,
  taxonomyNodes,
  skillCategories,
  descriptorMappings,
  competencyDescriptors,
  setCompetencyDescriptors,
  competencyRelationships,
  setCompetencyRelationships,
  jobRoles,
  jobVariants
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTaxonomyNode, setFilterTaxonomyNode] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [formTaxonomyNodeId, setFormTaxonomyNodeId] = useState('');
  const [formMappedSkills, setFormMappedSkills] = useState<CompetencySkillMapping[]>([]);
  const [formRelatedCompetencyIds, setFormRelatedCompetencyIds] = useState<string[]>([]);
  const [formCompetencyDescriptors, setFormCompetencyDescriptors] = useState<Record<string, string>>({});
  const [relatedSearch, setRelatedSearch] = useState('');
  const [errors, setErrors] = useState<any>({});

  // Skill Selection Modal
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillFilterTaxonomyNode, setSkillFilterTaxonomyNode] = useState('');
  const [skillFilterCategory, setSkillFilterCategory] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // Deletion Modal
  const [deleteModalCompetency, setDeleteModalCompetency] = useState<Competency | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const filteredCompetencies = useMemo(() => {
    return (competencies || []).filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTaxonomyNode = !filterTaxonomyNode || c.taxonomyNodeId === filterTaxonomyNode;
      const matchesType = !filterType || c.typeId === filterType;
      return matchesSearch && matchesTaxonomyNode && matchesType;
    });
  }, [competencies, searchTerm, filterTaxonomyNode, filterType]);

  const getCategoryName = (id: string) => (skillCategories || []).find(cat => cat.id === id)?.name || 'N/A';
  const getSkillName = (id: string) => (skills || []).find(s => s.id === id)?.name || 'Unknown';
  const getTaxonomyNodeName = (id?: string) => (taxonomyNodes || []).find(n => n.id === id)?.name || 'N/A';

  const handleOpenForm = (comp?: Competency) => {
    if (comp) {
      setEditingCompetency(comp);
      setFormTitle(comp.title);
      setFormDescription(comp.description);
      setFormTypeId(comp.typeId);
      setFormTaxonomyNodeId(comp.taxonomyNodeId || '');
      setFormMappedSkills(comp.mappedSkills || []);
      
      const relatedIds = (competencyRelationships || [])
        .filter(r => r.competencyId1 === comp.id || r.competencyId2 === comp.id)
        .map(r => r.competencyId1 === comp.id ? r.competencyId2 : r.competencyId1);
      setFormRelatedCompetencyIds(relatedIds);
      
      const descriptors: Record<string, string> = {};
      (competencyDescriptors || []).filter(cd => cd.competencyId === comp.id).forEach(cd => {
        descriptors[cd.level] = cd.description;
      });
      setFormCompetencyDescriptors(descriptors);
    } else {
      setEditingCompetency(null);
      setFormTitle('');
      setFormDescription('');
      setFormTypeId('');
      setFormTaxonomyNodeId('');
      setFormMappedSkills([]);
      setFormRelatedCompetencyIds([]);
      setFormCompetencyDescriptors({});
    }
    setErrors({});
    setView('form');
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formTitle.trim()) newErrors.title = "Competency Title is required.";
    if (!formDescription.trim()) newErrors.description = "Competency Description is required.";
    if (!formTypeId) newErrors.typeId = "Competency Type is required.";
    
    // AC3: Prevent duplicate competency titles (case insensitive)
    const isDuplicateTitle = (competencies || []).some(c => 
      c.title.toLowerCase() === formTitle.toLowerCase().trim() && 
      (!editingCompetency || c.id !== editingCompetency.id)
    );
    if (isDuplicateTitle) newErrors.title = "Competency title already exists.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const competencyId = editingCompetency ? editingCompetency.id : Math.random().toString(36).substr(2, 9);
    const competencyData: Competency = {
      id: competencyId,
      title: formTitle,
      description: formDescription,
      typeId: formTypeId,
      taxonomyNodeId: formTaxonomyNodeId || undefined,
      mappedSkills: formMappedSkills || [],
      createdDate: editingCompetency ? editingCompetency.createdDate : now,
      lastEditedDate: now,
      lastEditedBy: 'Admin' // Mock user
    };

    // Update Competencies
    if (editingCompetency) {
      setCompetencies((competencies || []).map(c => c.id === competencyData.id ? competencyData : c));
    } else {
      setCompetencies([competencyData, ...(competencies || [])]);
    }

    // Update Descriptors
    const otherDescriptors = (competencyDescriptors || []).filter(cd => cd.competencyId !== competencyId);
    const newDescriptors = [...otherDescriptors];
    Object.entries(formCompetencyDescriptors).forEach(([level, description]) => {
      if (typeof description === 'string' && description.trim()) {
        newDescriptors.push({
          id: `cd${Date.now()}_${Math.random().toString(36).substring(7)}`,
          competencyId: competencyId,
          level,
          description
        });
      }
    });
    setCompetencyDescriptors(newDescriptors);

    // Update Relationships
    const otherRelationships = (competencyRelationships || []).filter(r => r.competencyId1 !== competencyId && r.competencyId2 !== competencyId);
    const newRelationships = [...otherRelationships];
    formRelatedCompetencyIds.forEach(relatedId => {
      newRelationships.push({
        id: Math.random().toString(36).substr(2, 9),
        competencyId1: competencyId,
        competencyId2: relatedId
      });
    });
    setCompetencyRelationships(newRelationships);

    showToast(editingCompetency ? "Competency updated successfully." : "Competency created successfully.");
    setView('list');
  };

  const handleAddSkill = (skill: ExtendedTaxonomyItem) => {
    // AC4: Prevent duplicate skills within competency
    if ((formMappedSkills || []).some(ms => ms.skillId === skill.id)) {
      showToast("Skill already added to this competency.", "error");
      return;
    }
    setFormMappedSkills([...(formMappedSkills || []), { skillId: skill.id }]);
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    setFormMappedSkills((formMappedSkills || []).filter(ms => ms.skillId !== skillId));
  };

  const filteredSkillsForSelection = useMemo(() => {
    return (skills || []).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase());
      const matchesTaxonomyNode = !skillFilterTaxonomyNode || s.taxonomyNodeId === skillFilterTaxonomyNode;
      const matchesCategory = !skillFilterCategory || s.categoryId === skillFilterCategory;
      return matchesSearch && matchesTaxonomyNode && matchesCategory;
    });
  }, [skills, skillSearch, skillFilterTaxonomyNode, skillFilterCategory]);

  const getValidLevelsForSkill = (skillId: string) => {
    const skill = (skills || []).find(s => s.id === skillId);
    if (!skill || !skill.categoryId) return [];
    const category = (skillCategories || []).find(c => c.id === skill.categoryId);
    return category ? category.proficiencyLevels : [];
  };

  const getDescriptorForLevel = (skillId: string, level: string) => {
    return descriptorMappings.find(m => m.skillId === skillId && m.level === level)?.description || '';
  };

  const handleOpenDelete = (comp: Competency) => {
    // AC16, AC17: Restrict competency deletion
    const isUsedInJobRole = (jobRoles || []).some(jr => jr.mappedCompetencies?.includes(comp.id));
    const isUsedInJobVariant = (jobVariants || []).some(jv => jv.mappedCompetencies?.includes(comp.id));
    
    if (isUsedInJobRole || isUsedInJobVariant) {
      showToast("Competency cannot be deleted because it is mapped to existing job roles or job variants.", "error");
      return;
    }
    setDeleteModalCompetency(comp);
  };

  const isTypeEditable = (compId: string) => {
    const isUsedInJobRole = (jobRoles || []).some(jr => (jr.mappedCompetencies || []).includes(compId));
    const isUsedInJobVariant = (jobVariants || []).some(jv => (jv.mappedCompetencies || []).includes(compId));
    return !isUsedInJobRole && !isUsedInJobVariant;
  };

  const getDependencies = (compId: string) => {
    const roles = (jobRoles || []).filter(jr => (jr.mappedCompetencies || []).includes(compId)).map(r => r.name);
    const variants = (jobVariants || []).filter(jv => (jv.mappedCompetencies || []).includes(compId)).map(v => v.name);
    return { roles, variants };
  };

  const handleDeleteConfirm = () => {
    if (deleteModalCompetency) {
      setCompetencies((competencies || []).filter(c => c.id !== deleteModalCompetency.id));
      showToast("Competency deleted successfully.");
      setDeleteModalCompetency(null);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full">
      {view === 'list' ? (
        <>
          <header className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Competency Management</h2>
              <p className="text-gray-600 text-sm font-medium mt-1">Define and manage organizational competencies</p>
            </div>
            <button 
              onClick={() => handleOpenForm()}
              className="bg-[#1e3a8a] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
            >
              Create Competency
            </button>
          </header>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[300px]">
                <input 
                  type="text" 
                  placeholder="Search by name or description..." 
                  className="w-full px-6 py-4 bg-white text-black border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icons.Search />
                </div>
              </div>
              <select 
                value={filterTaxonomyNode}
                onChange={e => setFilterTaxonomyNode(e.target.value)}
                className="px-4 py-4 bg-white border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
              >
                <option value="">All Hierarchy Nodes</option>
                {(taxonomyNodes || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-4 py-4 bg-white border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
              >
                <option value="">All Competency Types</option>
                {(skillCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
                  <tr>
                    <th className="px-6 py-5 border-r border-blue-800">Competency Title</th>
                    <th className="px-6 py-5 border-r border-blue-800">Description</th>
                    <th className="px-6 py-5 border-r border-blue-800">Competency Type</th>
                    <th className="px-6 py-5 border-r border-blue-800">Hierarchy Node</th>
                    <th className="px-6 py-5 border-r border-blue-800">Skills</th>
                    <th className="px-6 py-5 border-r border-blue-800">Last Edited</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(filteredCompetencies || []).map(comp => (
                    <tr key={comp.id} className="hover:bg-blue-50/20 transition group">
                      <td className="px-6 py-6 border-r border-gray-50 text-sm font-extrabold text-gray-900">{comp.title}</td>
                      <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-500 font-medium max-w-xs truncate">{comp.description}</td>
                      <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-600 font-bold">{getCategoryName(comp.typeId)}</td>
                      <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-600">{getTaxonomyNodeName(comp.taxonomyNodeId)}</td>
                      <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-600 font-bold text-center">{(comp.mappedSkills || []).length}</td>
                      <td className="px-6 py-6 border-r border-gray-50 text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-bold">{comp.lastEditedDate}</span>
                          <span className="text-[10px]">{comp.lastEditedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center space-x-3">
                          <button onClick={() => handleOpenForm(comp)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-blue-600" title="View/Edit"><Icons.Edit /></button>
                          <button onClick={() => handleOpenDelete(comp)} className="p-2 border border-gray-100 rounded-full hover:bg-white shadow-sm transition text-red-600" title="Delete"><Icons.Delete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCompetencies.length === 0 && (
                <div className="p-20 text-center text-gray-400 italic font-medium">No competencies found.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 max-w-5xl mx-auto">
          <header className="flex flex-col space-y-4">
            <button 
              onClick={() => setView('list')} 
              className="flex items-center space-x-2 text-blue-700 hover:underline font-bold text-sm w-fit"
            >
              <Icons.Back />
              <span>Back to Competencies</span>
            </button>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
              {editingCompetency ? 'Edit Competency' : 'Create New Competency'}
            </h2>
          </header>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Competency Title *</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.title ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="e.g. Strategic Leadership"
                  />
                  {errors.title && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                  <textarea 
                    rows={4}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.description ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="Describe the competency..."
                  />
                  {errors.description && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.description}</p>}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Competency Type *</label>
                  <select 
                    value={formTypeId}
                    onChange={e => setFormTypeId(e.target.value)}
                    disabled={editingCompetency ? !isTypeEditable(editingCompetency.id) : false}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.typeId ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'} ${editingCompetency && !isTypeEditable(editingCompetency.id) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Type</option>
                    {(skillCategories || []).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.typeId && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.typeId}</p>}
                  {editingCompetency && !isTypeEditable(editingCompetency.id) && (
                    <p className="mt-2 text-[10px] text-gray-500 font-medium italic">Type cannot be edited as it is mapped to job roles or variants.</p>
                  )}
                </div>
                <div>
                  <SearchableDropdown
                    label="Hierarchy Node"
                    options={(taxonomyNodes || []).map(n => ({ id: n.id, label: n.name, description: n.description }))}
                    value={formTaxonomyNodeId}
                    onChange={(id) => setFormTaxonomyNodeId(id)}
                    placeholder="Select Hierarchy Node"
                  />
                </div>
              </div>
            </div>

            {/* Proficiency Scale View (AC12) */}
            {formTypeId && (
              <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center">
                  <span className="mr-2">ℹ️</span> Proficiency Scale for Competency Type: {getCategoryName(formTypeId)}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {((skillCategories || []).find(c => c.id === formTypeId)?.proficiencyLevels || []).map(level => {
                    return (
                      <div key={level.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col h-full">
                        <p className="text-xs font-bold text-blue-700 mb-1">{level.name}</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic mb-2">Type Default: {level.description}</p>
                        <div className="mt-auto pt-2 border-t border-blue-50">
                          <p className="text-[9px] font-bold text-blue-900 uppercase tracking-widest mb-1">Competency Specific Indicator</p>
                          <textarea
                            value={formCompetencyDescriptors[level.name] || ''}
                            onChange={(e) => setFormCompetencyDescriptors({...formCompetencyDescriptors, [level.name]: e.target.value})}
                            placeholder="Enter specific descriptor for this level..."
                            className="w-full text-[10px] text-gray-800 font-medium p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Mapped Skills</h3>
                  <p className="text-gray-500 text-xs font-medium mt-1">Add skills to this competency</p>
                </div>
                <button 
                  onClick={() => setShowSkillModal(true)}
                  className="px-6 py-2.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                >
                  + Add Skill
                </button>
              </div>

              {errors.skills && <p className="mb-4 text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-lg border border-red-100">{errors.skills}</p>}

              <div className="space-y-4">
                {(formMappedSkills || []).map((ms, index) => {
                  const skill = (skills || []).find(s => s.id === ms.skillId);
                  const skillCategory = (skillCategories || []).find(cat => cat.id === skill?.categoryId);

                  return (
                    <div key={ms.skillId} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-gray-900">{skill?.name}</h4>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{getCategoryName(skill?.categoryId || '')}</p>
                        </div>
                        <button onClick={() => handleRemoveSkill(ms.skillId)} className="text-red-500 hover:text-red-700 transition">
                          <Icons.Delete />
                        </button>
                      </div>

                      <div className="mt-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Proficiency Scale & Descriptors</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(skillCategory?.proficiencyLevels || []).map(level => {
                            const customDescriptor = (descriptorMappings || []).find(m => m.skillId === ms.skillId && m.level === level.name)?.description;
                            return (
                              <div key={level.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-blue-700 mb-1">{level.name}</p>
                                <p className="text-[10px] text-gray-600 leading-relaxed italic mb-2">{level.description}</p>
                                <div className="pt-2 border-t border-gray-50">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Skill Specific Descriptor</p>
                                  <p className="text-[10px] text-gray-800 font-medium">
                                    {customDescriptor || <span className="text-gray-300">No specific descriptor mapped.</span>}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(formMappedSkills || []).length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-medium italic">
                    No skills mapped yet. Click "+ Add Skill" to begin.
                  </div>
                )}
              </div>
            </div>

            {/* Related Competencies Section */}
            <div className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Related Competencies</h4>
                  <p className="text-xs text-gray-500 font-medium">Manage relationships with other competencies</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List of related competencies */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Currently Related</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {formRelatedCompetencyIds.map(relatedId => {
                      const relatedComp = (competencies || []).find(c => c.id === relatedId);
                      if (!relatedComp) return null;
                      return (
                        <div key={relatedId} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl group">
                          <span className="text-sm font-bold text-blue-900 truncate">{relatedComp.title}</span>
                          <button 
                            onClick={() => {
                              setFormRelatedCompetencyIds(prev => prev.filter(id => id !== relatedId));
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Unmap"
                          >
                            <Icons.Delete />
                          </button>
                        </div>
                      );
                    })}
                    {formRelatedCompetencyIds.length === 0 && (
                      <div className="p-8 text-center border border-dashed border-gray-100 rounded-xl text-gray-400 text-xs italic">
                        No related competencies mapped.
                      </div>
                    )}
                  </div>
                </div>

                {/* Add new relationship */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add Relationship</p>
                  <SearchableDropdown
                    options={(competencies || [])
                      .filter(c => {
                        return c.id !== editingCompetency?.id && 
                          !formRelatedCompetencyIds.includes(c.id);
                      })
                      .map(c => ({ id: c.id, label: c.title, description: c.description }))
                    }
                    value=""
                    onChange={(id) => {
                      if (id && !formRelatedCompetencyIds.includes(id)) {
                        setFormRelatedCompetencyIds(prev => [...prev, id]);
                      }
                    }}
                    placeholder="Search competencies to relate..."
                  />
                </div>
              </div>
            </div>

            {/* Mapped Job Profiles (AC15) - Moved to bottom */}
            {editingCompetency && (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Mapped Job Profiles</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Mapped Job Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {getDependencies(editingCompetency.id).roles.length > 0 ? (
                        getDependencies(editingCompetency.id).roles.map(r => (
                          <span key={r} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">{r}</span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No job roles mapped.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Mapped Job Variants</p>
                    <div className="flex flex-wrap gap-2">
                      {getDependencies(editingCompetency.id).variants.length > 0 ? (
                        getDependencies(editingCompetency.id).variants.map(v => (
                          <span key={v} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">{v}</span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No job variants mapped.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center space-x-4 pt-8 border-t border-gray-100">
              <button onClick={() => setView('list')} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
              <button onClick={handleSave} className="px-12 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">
                {editingCompetency ? 'Update Competency' : 'Create Competency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Selection Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSkillModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scaleIn overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900">Select Skills</h3>
                <button onClick={() => setShowSkillModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <Icons.Back />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search skills..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icons.Search />
                  </div>
                </div>
                <select 
                  value={skillFilterTaxonomyNode}
                  onChange={e => setSkillFilterTaxonomyNode(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Hierarchy Nodes</option>
                  {(taxonomyNodes || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <select 
                  value={skillFilterCategory}
                  onChange={e => setSkillFilterCategory(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {(skillCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(filteredSkillsForSelection || []).map(skill => {
                  const isAdded = (formMappedSkills || []).some(ms => ms.skillId === skill.id);
                  return (
                    <button 
                      key={skill.id}
                      onClick={() => handleAddSkill(skill)}
                      disabled={isAdded}
                      className={`p-4 rounded-2xl border text-left transition-all group ${isAdded ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-blue-500 hover:shadow-md'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold text-sm ${isAdded ? 'text-gray-400' : 'text-gray-900 group-hover:text-blue-700'}`}>{skill.name}</h4>
                        {isAdded && <span className="text-[10px] font-bold text-gray-400 uppercase">Added</span>}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">{skill.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded uppercase tracking-wider">{getCategoryName(skill.categoryId || '')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredSkillsForSelection.length === 0 && (
                <div className="p-20 text-center text-gray-400 italic font-medium">No skills found matching your filters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCompetency && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModalCompetency(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Delete Competency?</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to delete <span className="text-gray-900 font-bold">"{deleteModalCompetency.title}"</span>? This action is permanent.
              </p>
              
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button onClick={() => setDeleteModalCompetency(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
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

export default CompetencyManagement;
