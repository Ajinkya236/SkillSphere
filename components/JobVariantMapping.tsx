
import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { ExtendedTaxonomyItem, JobRole, JobVariant, JobVariantSkillMapping, SkillCategory, ProficiencyMapping, Competency, TaxonomyNode, JobVariantCompetencyMapping } from '../types';

interface JobVariantMappingProps {
  jobRoles: JobRole[];
  jobVariants: JobVariant[];
  setJobVariants: React.Dispatch<React.SetStateAction<JobVariant[]>>;
  skills: ExtendedTaxonomyItem[];
  taxonomyNodes: TaxonomyNode[];
  skillCategories: SkillCategory[];
  descriptorMappings: ProficiencyMapping[];
  competencies: Competency[];
}

const CRITICALITY_LEVELS: JobVariantSkillMapping['criticality'][] = ['High', 'Medium', 'Low'];

const JobVariantMapping: React.FC<JobVariantMappingProps> = ({ jobRoles, jobVariants, setJobVariants, skills, taxonomyNodes, skillCategories, descriptorMappings, competencies }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('Latest Updated');

  // Form States
  const [selectedParentRoleId, setSelectedParentRoleId] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantDesc, setVariantDesc] = useState('');
  const [variantRoles, setVariantRoles] = useState('');
  const [variantSkills, setVariantSkills] = useState<JobVariantSkillMapping[]>([]);
  const [variantCompetencies, setVariantCompetencies] = useState<JobVariantCompetencyMapping[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Modal States
  const [modalMode, setModalMode] = useState<'addSkill' | 'editSkillMapping' | 'addCompetency' | 'bulkMap' | 'bulkMapCompetency' | 'editCompetencyMapping' | null>(null);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [editingSkillMapping, setEditingSkillMapping] = useState<JobVariantSkillMapping | null>(null);
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState<string[]>([]);
  const [configSkills, setConfigSkills] = useState<Record<string, { proficiency: string; criticality: JobVariantSkillMapping['criticality'] }>>({});

  // Edit Competency States
  const [editCompDesiredLevel, setEditCompDesiredLevel] = useState('');
  const [editCompSkillConfigs, setEditCompSkillConfigs] = useState<Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }>>({});
  const [targetCompetencyId, setTargetCompetencyId] = useState<string | null>(null);

  // Add Competency Modal States
  const [compStep, setCompStep] = useState<1 | 2 | 3>(1);
  const [selectedCompsToAdd, setSelectedCompsToAdd] = useState<string[]>([]);
  const [configComps, setConfigComps] = useState<Record<string, { 
    desiredLevel: string;
    skillConfigs: Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }>
  }>>({});

  // Bulk Map Competency States
  const [bulkCompStep, setBulkCompStep] = useState<1 | 2 | 3>(1);
  const [bulkSelectedComps, setBulkSelectedComps] = useState<string[]>([]);
  const [bulkConfigComps, setBulkConfigComps] = useState<Record<string, { desiredLevel: string }>>({});
  const [bulkCompSelectedVariants, setBulkCompSelectedVariants] = useState<string[]>([]);
  const [bulkCompSearch, setBulkCompSearch] = useState('');
  const [bulkCompVariantSearch, setBulkCompVariantSearch] = useState('');

  // Bulk Map States
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1);
  const [bulkSelectedSkills, setBulkSelectedSkills] = useState<string[]>([]);
  const [bulkConfigSkills, setBulkConfigSkills] = useState<Record<string, { proficiency: string; criticality: JobVariantSkillMapping['criticality'] }>>({});
  const [bulkSelectedJobVariants, setBulkSelectedJobVariants] = useState<string[]>([]);
  const [bulkSkillSearch, setBulkSkillSearch] = useState('');
  const [bulkJobVariantSearch, setBulkJobVariantSearch] = useState('');

  // Toasts
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredJobVariants = useMemo(() => {
    return jobVariants.filter(jv => {
      const parent = jobRoles.find(jr => jr.id === jv.parentJobRoleId);
      const search = searchTerm.toLowerCase();
      return jv.name.toLowerCase().includes(search) || 
             jv.description.toLowerCase().includes(search) || 
             parent?.name.toLowerCase().includes(search) ||
             parent?.code.toLowerCase().includes(search);
    }).sort((a, b) => {
      if (selectedSort === 'Latest Updated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [jobVariants, searchTerm, selectedSort, jobRoles]);

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

  const getDescriptorDesc = (skillId: string, level: string) => {
    return descriptorMappings.find(m => m.skillId === skillId && m.level === level)?.description || 'No descriptor description defined';
  };

  const handleOpenEditCompetency = (mc: JobVariantCompetencyMapping) => {
    const comp = competencies.find(c => c.id === mc.competencyId);
    if (!comp) return;

    setTargetCompetencyId(mc.competencyId);
    setEditCompDesiredLevel(mc.desiredLevel);
    
    const skillConfigs: Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }> = {};
    comp.mappedSkills?.forEach(ms => {
      const skillMapping = variantSkills.find(s => s.skillId === ms.skillId);
      if (skillMapping) {
        skillConfigs[ms.skillId] = {
          proficiency: skillMapping.proficiencyLevel,
          criticality: skillMapping.criticality
        };
      }
    });
    setEditCompSkillConfigs(skillConfigs);
    setModalMode('editCompetencyMapping');
  };

  const handleSaveEditCompetency = () => {
    if (!targetCompetencyId) return;

    const mc = variantCompetencies.find(c => c.competencyId === targetCompetencyId);
    if (!mc) return;

    // Recalculate aggregated level
    const comp = competencies.find(c => c.id === targetCompetencyId);
    if (!comp) return;
    const newAggregatedLevel = calculateAggregatedLevel(comp, editCompSkillConfigs);

    // Validation: desired level <= aggregated level
    if (parseFloat(editCompDesiredLevel) > newAggregatedLevel) {
      showToast(`Desired level (${editCompDesiredLevel}) cannot exceed aggregated level (${newAggregatedLevel})`, "error");
      return;
    }

    setVariantCompetencies(prev => prev.map(compMapping => {
      if (compMapping.competencyId === targetCompetencyId) {
        return { ...compMapping, desiredLevel: editCompDesiredLevel, aggregatedLevel: newAggregatedLevel };
      }
      return compMapping;
    }));

    setVariantSkills(prev => prev.map(skillMapping => {
      if (editCompSkillConfigs[skillMapping.skillId]) {
        return {
          ...skillMapping,
          proficiencyLevel: editCompSkillConfigs[skillMapping.skillId].proficiency,
          criticality: editCompSkillConfigs[skillMapping.skillId].criticality
        };
      }
      return skillMapping;
    }));

    setModalMode(null);
    showToast("Competency requirements updated successfully");
  };

  const handleOpenBulkMap = () => {
    setBulkStep(1);
    setBulkSelectedSkills([]);
    setBulkConfigSkills({});
    setBulkSelectedJobVariants([]);
    setBulkSkillSearch('');
    setBulkJobVariantSearch('');
    setModalMode('bulkMap');
  };

  const handleBulkSubmit = () => {
    if (bulkSelectedJobVariants.length === 0) {
      showToast("Please select at least one job variant", "error");
      return;
    }

    const newMappings: JobVariantSkillMapping[] = bulkSelectedSkills.map(id => ({
      skillId: id,
      proficiencyLevel: bulkConfigSkills[id].proficiency,
      criticality: bulkConfigSkills[id].criticality
    }));

    setJobVariants(prev => prev.map(jv => {
      if (!bulkSelectedJobVariants.includes(jv.id)) return jv;
      
      const existingIds = (jv.mappedSkills || []).map(ms => ms.skillId);
      const uniqueNewMappings = newMappings.filter(nm => !existingIds.includes(nm.skillId));
      
      return {
        ...jv,
        mappedSkills: [...(jv.mappedSkills || []), ...uniqueNewMappings],
        lastUpdated: new Date().toISOString()
      };
    }));

    setModalMode(null);
    showToast(`Skills mapped to ${bulkSelectedJobVariants.length} job variants successfully`);
  };

  const handleOpenBulkCompMap = () => {
    setBulkCompStep(1);
    setBulkSelectedComps([]);
    setBulkConfigComps({});
    setBulkCompSelectedVariants([]);
    setBulkCompSearch('');
    setBulkCompVariantSearch('');
    setModalMode('bulkMapCompetency');
  };

  const handleBulkCompSubmit = () => {
    if (bulkCompSelectedVariants.length === 0) {
      showToast("Please select at least one job variant", "error");
      return;
    }

    const isComplete = bulkSelectedComps.every(id => bulkConfigComps[id]?.desiredLevel);
    if (!isComplete) {
      showToast("Please set desired level for all competencies", "error");
      return;
    }

    const selectedCompetencies = competencies.filter(c => bulkSelectedComps.includes(c.id));

    setJobVariants(prev => prev.map(jv => {
      if (!bulkCompSelectedVariants.includes(jv.id)) return jv;
      
      const existingCompIds = (jv.mappedCompetencies || []).map(mc => mc.competencyId);
      const directSkillIds = (jv.mappedSkills || []).filter(vs => vs.source === 'VariantSpecific').map(vs => vs.skillId);

      // Filter out competencies already mapped OR having conflicting skills
      const uniqueNewComps = selectedCompetencies.filter(c => {
        if (existingCompIds.includes(c.id)) return false;
        const compSkillIds = c.mappedSkills.map(ms => ms.skillId);
        return !compSkillIds.some(id => directSkillIds.includes(id));
      });
      
      if (uniqueNewComps.length === 0) return jv;

      const newCompMappings: JobVariantCompetencyMapping[] = uniqueNewComps.map(c => ({
        competencyId: c.id,
        aggregatedLevel: calculateAggregatedLevel(c),
        desiredLevel: bulkConfigComps[c.id].desiredLevel,
        source: 'VariantSpecific'
      }));

      const newSkillMappings: JobVariantSkillMapping[] = uniqueNewComps.flatMap(c => 
        c.mappedSkills.map(ms => ({
          skillId: ms.skillId,
          proficiencyLevel: ms.proficiencyLevel || '',
          criticality: ms.criticality || 'Medium',
          source: 'VariantSpecific'
        }))
      );

      const existingSkillIds = (jv.mappedSkills || []).map(ms => ms.skillId);
      const uniqueNewSkills = newSkillMappings.filter(nm => !existingSkillIds.includes(nm.skillId));

      return {
        ...jv,
        mappedCompetencies: [...(jv.mappedCompetencies || []), ...newCompMappings],
        mappedSkills: [...(jv.mappedSkills || []), ...uniqueNewSkills],
        lastUpdated: new Date().toISOString()
      };
    }));

    setModalMode(null);
    showToast(`Competencies mapped to ${bulkCompSelectedVariants.length} job variants successfully`);
  };

  const handleStartCreate = () => {
    setSelectedParentRoleId('');
    setVariantName('');
    setVariantDesc('');
    setVariantRoles('');
    setVariantSkills([]);
    setVariantCompetencies([]);
    setEditingVariantId(null);
    setView('create');
  };

  const handleSelectParentRole = (role: JobRole) => {
    setSelectedParentRoleId(role.id);
    
    // AC18: Variant inherits role competencies
    const inheritedCompetencies: JobVariantCompetencyMapping[] = (role.mappedCompetencies || []).map(mc => ({
      ...mc,
      source: 'Inherited'
    }));
    setVariantCompetencies(inheritedCompetencies);

    const inheritedSkills: JobVariantSkillMapping[] = role.mappedSkills.map(ms => ({
      skillId: ms.skillId,
      proficiencyLevel: ms.proficiencyLevel,
      criticality: ms.criticality,
      source: 'Inherited'
    }));
    setVariantSkills(inheritedSkills);
  };

  const calculateAggregatedLevel = (competency: Competency, skillConfigs?: Record<string, { proficiency: string }>) => {
    let totalLevel = 0;
    let count = 0;
    competency.mappedSkills?.forEach(ms => {
      const skill = skills.find(s => s.id === ms.skillId);
      if (skill && skill.categoryId) {
        const category = skillCategories.find(c => c.id === skill.categoryId);
        if (category) {
          const profLevelName = skillConfigs?.[ms.skillId]?.proficiency || ms.proficiencyLevel;
          const level = category.proficiencyLevels.find(l => l.name === profLevelName);
          if (level) {
            totalLevel += level.levelNo;
            count++;
          }
        }
      }
    });
    return count > 0 ? parseFloat((totalLevel / count).toFixed(1)) : 0;
  };

  const handleOpenAddCompetency = () => {
    setCompStep(1);
    setSelectedCompsToAdd([]);
    setConfigComps({});
    setSkillSearchTerm('');
    setModalMode('addCompetency');
  };

  const handleAddCompetencies = () => {
    // Validation
    const isComplete = selectedCompsToAdd.every(id => {
      const compConfig = configComps[id];
      if (!compConfig?.desiredLevel) return false;
      const comp = competencies.find(c => c.id === id);
      if (!comp) return false;
      return comp.mappedSkills.every(ms => compConfig.skillConfigs?.[ms.skillId]?.proficiency);
    });

    if (!isComplete) {
      showToast("Please complete all configurations for competencies and skills", "error");
      return;
    }

    // AC13: Prevent duplicate competency mapping for variants
    const existingCompIds = variantCompetencies.map(vc => vc.competencyId);
    const duplicateId = selectedCompsToAdd.find(id => existingCompIds.includes(id));
    if (duplicateId) {
      const compTitle = competencies.find(c => c.id === duplicateId)?.title;
      showToast(`Competency "${compTitle}" already mapped to this Job Variant.`, "error");
      return;
    }

    // AC15: Block competency mapping if skill already mapped directly
    const selectedCompetencies = competencies.filter(c => selectedCompsToAdd.includes(c.id));
    const competencySkillIds = selectedCompetencies.flatMap(c => c.mappedSkills.map(ms => ms.skillId));
    const directSkillIds = (variantSkills || []).filter(vs => vs.source === 'VariantSpecific').map(vs => vs.skillId);
    
    // Check for conflicts with existing direct skills
    const conflictingSkillId = competencySkillIds.find(id => directSkillIds.includes(id));
    if (conflictingSkillId) {
      const skillName = skills.find(s => s.id === conflictingSkillId)?.name;
      showToast(`Cannot map competencies. Skill "${skillName}" is already mapped directly. Please remove the existing skill mapping first.`, "error");
      return;
    }

    // Check for duplicate skills within the selection itself
    const seenSkillIds = new Set<string>();
    for (const comp of selectedCompetencies) {
      for (const ms of comp.mappedSkills) {
        if (seenSkillIds.has(ms.skillId)) {
          const skillName = skills.find(s => s.id === ms.skillId)?.name;
          showToast(`Duplicate skill "${skillName}" found across selected competencies. Please ensure each skill is mapped only once.`, "error");
          return;
        }
        seenSkillIds.add(ms.skillId);
      }
    }

    const newCompMappings: JobVariantCompetencyMapping[] = selectedCompetencies.map(c => ({
      competencyId: c.id,
      aggregatedLevel: calculateAggregatedLevel(c, configComps[c.id].skillConfigs),
      desiredLevel: configComps[c.id].desiredLevel,
      source: 'VariantSpecific'
    }));

    const newSkillMappings: JobVariantSkillMapping[] = selectedCompetencies.flatMap(c => 
      c.mappedSkills.map(ms => ({
        skillId: ms.skillId,
        proficiencyLevel: configComps[c.id].skillConfigs[ms.skillId].proficiency,
        criticality: configComps[c.id].skillConfigs[ms.skillId].criticality,
        source: 'VariantSpecific'
      }))
    );

    setVariantCompetencies([...variantCompetencies, ...newCompMappings]);
    
    const existingIds = (variantSkills || []).map(vs => vs.skillId);
    const uniqueNew = newSkillMappings.filter(nm => !existingIds.includes(nm.skillId));
    
    setVariantSkills([...(variantSkills || []), ...uniqueNew]);
    setModalMode(null);
    showToast(`${selectedCompsToAdd.length} competencies added to variant`);
  };

  const handleRemoveCompetency = (competencyId: string) => {
    const competency = competencies.find(c => c.id === competencyId);
    if (!competency) return;

    // AC17: Remove derived skill mappings
    const otherCompIds = variantCompetencies.filter(mc => mc.competencyId !== competencyId).map(mc => mc.competencyId);
    const otherCompSkills = competencies.filter(c => otherCompIds.includes(c.id)).flatMap(c => c.mappedSkills.map(ms => ms.skillId));
    
    const competencySkillIds = competency.mappedSkills.map(ms => ms.skillId);
    const skillsToRemove = competencySkillIds.filter(id => !otherCompSkills.includes(id));
    
    setVariantCompetencies(prev => prev.filter(mc => mc.competencyId !== competencyId));
    setVariantSkills(prev => prev.filter(vs => !skillsToRemove.includes(vs.skillId)));
    showToast("Competency removed from variant");
  };

  const handleOpenAddSkill = () => {
    setSkillSearchTerm('');
    setSelectedSkillsToAdd([]);
    setConfigSkills({});
    setModalMode('addSkill');
  };

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillsToAdd(prev => {
      const isSelecting = !prev.includes(skillId);
      if (isSelecting) {
        // Initialize config for this skill if it doesn't exist
        setConfigSkills(current => ({
          ...current,
          [skillId]: current[skillId] || { proficiency: '', criticality: 'Medium' }
        }));
        return [...prev, skillId];
      } else {
        return prev.filter(id => id !== skillId);
      }
    });
  };

  const handleAddVariantSkills = () => {
    // AC16: Block skill mapping if competency already mapped
    const mappedCompetencyIds = variantCompetencies.map(vc => vc.competencyId);
    const mappedCompetencies = competencies.filter(c => mappedCompetencyIds.includes(c.id));
    const competencySkillIds = mappedCompetencies.flatMap(c => c.mappedSkills.map(ms => ms.skillId));

    const conflictingId = selectedSkillsToAdd.find(id => competencySkillIds.includes(id));
    if (conflictingId) {
      const skillName = skills.find(s => s.id === conflictingId)?.name;
      showToast(`Cannot map skill "${skillName}". It is already part of a mapped competency. Please remove the competency mapping first.`, "error");
      return;
    }

    // Added optional chaining to prevent crash if config for an ID is somehow missing
    const isComplete = selectedSkillsToAdd.every(id => configSkills[id]?.proficiency && configSkills[id]?.criticality);
    if (!isComplete) {
      showToast("Please set proficiency and criticality for all skills", "error");
      return;
    }

    const newMappings: JobVariantSkillMapping[] = selectedSkillsToAdd.map(id => ({
      skillId: id,
      proficiencyLevel: configSkills[id].proficiency,
      criticality: configSkills[id].criticality,
      source: 'VariantSpecific'
    }));

    const existingIds = (variantSkills || []).map(s => s.skillId);
    const uniqueNew = newMappings.filter(n => !existingIds.includes(n.skillId));

    if (uniqueNew.length < newMappings.length) {
      showToast("Some selected skills are already added.", "error");
    }

    setVariantSkills([...(variantSkills || []), ...uniqueNew]);
    setModalMode(null);
    if (uniqueNew.length > 0) {
      showToast(`${uniqueNew.length} skills added to variant. Click Update to persist changes.`);
    }
  };

  const handleOpenEditSkillMapping = (mapping: JobVariantSkillMapping) => {
    setEditingSkillMapping({ ...mapping });
    setModalMode('editSkillMapping');
  };

  const handleSaveSkillMappingEdit = () => {
    if (!editingSkillMapping) return;
    setVariantSkills(prev => prev.map(s => 
      s.skillId === editingSkillMapping.skillId ? editingSkillMapping : s
    ));
    setModalMode(null);
    showToast("Skill mapping updated for variant");
  };

  const handleRemoveSkill = (skillId: string) => {
    setVariantSkills(prev => prev.filter(s => s.skillId !== skillId));
    showToast("Skill removed from variant listing");
  };

  const handleSubmit = () => {
    if (!variantName || !variantDesc || !variantRoles || !selectedParentRoleId) {
      showToast("All mandatory fields (*) are required", "error");
      return;
    }

    const isDuplicate = jobVariants.some(jv => 
      jv.parentJobRoleId === selectedParentRoleId && 
      jv.name.toLowerCase() === variantName.toLowerCase() &&
      jv.id !== editingVariantId
    );
    if (isDuplicate) {
      showToast("A variant with this name already exists for this role", "error");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', { 
      month: 'short', day: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const newVariant: JobVariant = {
      id: editingVariantId || Math.random().toString(36).substr(2, 9),
      name: variantName,
      description: variantDesc,
      rolesResponsibilities: variantRoles,
      parentJobRoleId: selectedParentRoleId,
      mappedSkills: variantSkills,
      mappedCompetencies: variantCompetencies,
      lastUpdated: formattedDate
    };

    if (view === 'create') {
      setJobVariants([newVariant, ...jobVariants]);
      showToast("Job Variant created successfully");
    } else {
      setJobVariants(jobVariants.map(jv => jv.id === editingVariantId ? newVariant : jv));
      showToast("Job Variant updated successfully");
    }
    setView('list');
  };

  const handleEditVariant = (jv: JobVariant) => {
    setEditingVariantId(jv.id);
    setVariantName(jv.name);
    setVariantDesc(jv.description);
    setVariantRoles(jv.rolesResponsibilities);
    setSelectedParentRoleId(jv.parentJobRoleId);
    setVariantSkills([...(jv.mappedSkills || [])]);
    
    // Merge inherited competencies from parent role with variant-specific ones from the variant itself
    const parentRole = jobRoles.find(r => r.id === jv.parentJobRoleId);
    const inheritedComps: JobVariantCompetencyMapping[] = (parentRole?.mappedCompetencies || []).map(mc => ({
      ...mc,
      source: 'Inherited'
    }));
    
    const variantSpecific = (jv.mappedCompetencies || []).filter(vc => vc.source === 'VariantSpecific');
    setVariantCompetencies([...inheritedComps, ...variantSpecific]);
    
    setView('edit');
  };

  const getFullSkillInfo = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    const group = taxonomyNodes.find(n => n.id === skill?.taxonomyNodeId);
    const cluster = taxonomyNodes.find(n => n.id === group?.parentId);
    return { skill, group, cluster };
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="p-8 space-y-8 animate-fadeIn">
        <header className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-gray-800 cursor-pointer hover:text-blue-700 font-bold" onClick={() => setView('list')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="text-sm">Back</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">{view === 'create' ? 'Create Job Variant' : 'Edit Job Variant'}</h2>
          <p className="text-gray-500 text-sm font-medium">{view === 'create' ? 'Create a new job variant with specific skill requirements' : 'Modify an existing job variant.'}</p>
        </header>

        {/* Step 1: Select Job Role */}
        <section className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Job Role *</h3>
            {selectedParentRoleId && view === 'create' && <button onClick={() => setSelectedParentRoleId('')} className="text-xs font-bold text-blue-700 hover:underline">Change</button>}
          </div>
          <div className="p-8">
            {!selectedParentRoleId ? (
              <div className="space-y-6">
                 <p className="text-xs text-gray-400 font-medium italic">First, select the base job role for this variant</p>
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Search job roles..." 
                     className="w-full px-4 py-3 bg-white text-black border-2 border-blue-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                     onChange={(e) => setSkillSearchTerm(e.target.value)}
                   />
                 </div>
                 <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {jobRoles.filter(jr => jr.name.toLowerCase().includes(skillSearchTerm.toLowerCase()) || jr.code.includes(skillSearchTerm)).map(role => (
                      <div 
                        key={role.id} 
                        onClick={() => handleSelectParentRole(role)}
                        className="p-6 border border-gray-100 rounded-xl bg-purple-50/10 hover:bg-purple-50/30 cursor-pointer transition active:scale-[0.99] border-l-4 border-l-blue-100"
                      >
                         <p className="text-sm font-bold text-gray-900">{role.name}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Job Code: {role.code}</p>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-blue-50 bg-blue-50/10 rounded-xl">
                 <p className="text-sm font-bold text-gray-900">{jobRoles.find(r => r.id === selectedParentRoleId)?.name}</p>
                 <p className="text-[10px] font-bold text-gray-400 mt-1">Job Code : {jobRoles.find(r => r.id === selectedParentRoleId)?.code}</p>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Basic Info */}
        {selectedParentRoleId && (
          <>
            <section className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-500 font-medium">Provide details for the job variant</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-2">Job Variant Name *</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Senior Frontend Developer - React Specialist"
                     className={`w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 ${view === 'edit' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                     value={variantName}
                     onChange={e => setVariantName(e.target.value)}
                     readOnly={view === 'edit'}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-2">Mapped to Job Role</label>
                   <input readOnly value={jobRoles.find(r => r.id === selectedParentRoleId)?.name} className="w-full px-4 py-3 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                   <textarea 
                     rows={3}
                     placeholder="Describe the job variant..."
                     className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                     value={variantDesc}
                     onChange={e => setVariantDesc(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-2">Roles & Responsibilities *</label>
                   <textarea 
                     rows={3}
                     placeholder="List the responsibilities for this variant..."
                     className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                     value={variantRoles}
                     onChange={e => setVariantRoles(e.target.value)}
                   />
                </div>
              </div>
            </section>

            {/* Step 3: Competencies */}
            <section className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Mapped Competencies</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 italic">Competencies inherited from the job role cannot be modified.</p>
                </div>
                <button 
                  onClick={handleOpenAddCompetency}
                  className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-blue-900 transition active:scale-95 shadow-lg"
                >
                  + Add Competency
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-[#1e3a8a] text-white text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-5 border-r border-blue-800">Competency</th>
                      <th className="px-6 py-5 border-r border-blue-800">Aggregated Level</th>
                      <th className="px-6 py-5 border-r border-blue-800">Desired Level</th>
                      <th className="px-6 py-5 border-r border-blue-800">Underlying Skills</th>
                      <th className="px-6 py-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variantCompetencies.map(mc => {
                      const comp = competencies.find(c => c.id === mc.competencyId);
                      if (!comp) return null;
                      const isInherited = mc.source === 'Inherited';
                      return (
                        <tr key={mc.competencyId} className="hover:bg-blue-50/20 transition group">
                          <td className="px-6 py-6 border-r border-gray-50">
                            <p className="font-bold text-gray-900">{comp.title}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{comp.description}</p>
                            <div className="mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${isInherited ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                {isInherited ? 'Inherited' : 'Variant Specific'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 border-r border-gray-50">
                            <span className="text-sm font-bold text-blue-700">{mc.aggregatedLevel}</span>
                          </td>
                          <td className="px-6 py-6 border-r border-gray-50">
                            <span className="text-sm font-bold text-purple-700">{mc.desiredLevel}</span>
                          </td>
                          <td className="px-6 py-6 border-r border-gray-50 p-0 align-top">
                            <table className="w-full text-left text-[10px]">
                              <thead className="bg-gray-50 text-gray-500 uppercase">
                                <tr>
                                  <th className="px-3 py-2 font-bold border-b border-gray-100">Skill</th>
                                  <th className="px-3 py-2 font-bold border-b border-gray-100">Desired Level</th>
                                  <th className="px-3 py-2 font-bold border-b border-gray-100">Descriptor</th>
                                  <th className="px-3 py-2 font-bold border-b border-gray-100">Criticality</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {comp.mappedSkills.map(ms => {
                                  const skillMapping = (variantSkills || []).find(s => s.skillId === ms.skillId);
                                  return (
                                    <tr key={ms.skillId} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-bold text-gray-700">{skills.find(s => s.id === ms.skillId)?.name}</td>
                                      <td className="px-3 py-2">
                                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{skillMapping?.proficiencyLevel || 'N/A'}</span>
                                      </td>
                                      <td className="px-3 py-2 text-gray-500 italic max-w-[200px] line-clamp-2" title={getDescriptorDesc(ms.skillId, skillMapping?.proficiencyLevel || '')}>
                                        {getDescriptorDesc(ms.skillId, skillMapping?.proficiencyLevel || '')}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                                          skillMapping?.criticality === 'High' ? 'bg-red-50 text-red-600' :
                                          skillMapping?.criticality === 'Medium' ? 'bg-blue-50 text-blue-600' :
                                          'bg-green-50 text-green-600'
                                        }`}>{skillMapping?.criticality}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex justify-center space-x-3">
                              {!isInherited ? (
                                <>
                                  <button onClick={() => handleOpenEditCompetency(mc)} className="px-4 py-2 bg-white border border-gray-200 text-blue-800 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Edit</button>
                                  <button onClick={() => handleRemoveCompetency(mc.competencyId)} className="px-4 py-2 bg-white border border-gray-200 text-red-600 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Unmap</button>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold italic">Inherited</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {variantCompetencies.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-medium italic">
                    No competencies mapped yet.
                  </div>
                )}
              </div>
            </section>

            {/* Step 4: Skills */}
            <section className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Required Skills & Proficiencies *</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 italic">Skills inherited from the job role cannot be modified. Add variant specific skills as needed.</p>
                </div>
                <button 
                  onClick={handleOpenAddSkill}
                  className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-blue-900 transition active:scale-95 shadow-lg"
                >
                  + Add Skills
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-[#1e3a8a] text-white text-xs font-bold uppercase">
                    <tr>
                      <th className="px-5 py-4 w-12 border-r border-blue-800">#</th>
                      <th className="px-5 py-4 border-r border-blue-800">Skill</th>
                      <th className="px-5 py-4 border-r border-blue-800">Skill Category</th>
                      <th className="px-5 py-4 border-r border-blue-800">Source</th>
                      <th className="px-5 py-4 border-r border-blue-800">Proficiency Level</th>
                      <th className="px-5 py-4 border-r border-blue-800">Descriptor Description</th>
                      <th className="px-5 py-4 border-r border-blue-800">Criticality</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variantSkills.map((vms, idx) => {
                      const info = getFullSkillInfo(vms.skillId);
                      return (
                        <tr key={vms.skillId} className="hover:bg-gray-50/50">
                          <td className="px-5 py-5 text-sm text-gray-900 border-r border-gray-50">{idx + 1}</td>
                          <td className="px-5 py-5 border-r border-gray-50">
                            <p className="text-sm font-bold text-gray-900">{info.skill?.name}</p>
                          </td>
                          <td className="px-5 py-5 border-r border-gray-50 text-xs font-bold text-gray-700 italic">{getCategoryNameForSkill(vms.skillId)}</td>
                          <td className="px-5 py-5 border-r border-gray-50">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-bold ${vms.source === 'Inherited' ? 'bg-purple-50 text-purple-700' : 'bg-pink-50 text-pink-700'}`}>
                               {vms.source === 'Inherited' ? 'From Job Role' : 'Variant Specific'}
                            </span>
                          </td>
                          <td className="px-5 py-5 text-sm text-gray-800 border-r border-gray-50">{vms.proficiencyLevel}</td>
                          {/* Requirement 1: View/Edit Job Variant: show proficiency level - descriptor description column */}
                          <td className="px-5 py-5 text-sm text-gray-500 border-r border-gray-50 italic max-w-xs">{getDescriptorDesc(vms.skillId, vms.proficiencyLevel)}</td>
                          <td className="px-5 py-5 text-sm text-gray-800 border-r border-gray-50">{vms.criticality}</td>
                          <td className="px-5 py-5 border-r border-gray-50">
                            <div className="flex justify-center items-center space-x-2">
                               {vms.source === 'Inherited' ? (
                                 <span className="text-[10px] text-gray-300 font-bold italic">Inherited</span>
                               ) : (
                                 <>
                                   {variantCompetencies.some(mc => 
                                     competencies.find(c => c.id === mc.competencyId)?.mappedSkills.some(ms => ms.skillId === vms.skillId)
                                   ) ? (
                                     <span className="text-[10px] text-gray-400 font-bold italic">Derived from Competency</span>
                                   ) : (
                                     <>
                                       <button 
                                         onClick={() => handleOpenEditSkillMapping(vms)}
                                         className="p-2 bg-white border border-gray-100 rounded-lg text-blue-700 hover:bg-gray-50 shadow-sm"
                                       >
                                         <Icons.Edit />
                                       </button>
                                       <button 
                                         onClick={() => handleRemoveSkill(vms.skillId)} 
                                         className="p-2 bg-white border border-gray-100 rounded-lg text-blue-900 hover:bg-gray-50 shadow-sm"
                                       >
                                         <Icons.Delete />
                                       </button>
                                     </>
                                   )}
                                 </>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex justify-end items-center space-x-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white sticky bottom-4 z-10 shadow-lg">
               <button onClick={() => setView('list')} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-white transition duration-200">Cancel</button>
               <button onClick={handleSubmit} className="px-12 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">{view === 'create' ? 'Submit' : 'Update Variant'}</button>
            </div>
          </>
        )}

        {/* Add Competency Modal */}
        {modalMode === 'addCompetency' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scaleIn overflow-hidden max-h-[90vh] flex flex-col">
               <div className="p-10 overflow-y-auto">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-baseline space-x-3">
                      <h3 className={`text-2xl font-extrabold ${compStep === 1 ? 'text-gray-900' : 'text-gray-300'}`}>1. Select</h3>
                      <h3 className={`text-2xl font-extrabold ${compStep === 2 ? 'text-gray-900' : 'text-gray-300'}`}>2. Skills</h3>
                      <h3 className={`text-2xl font-extrabold ${compStep === 3 ? 'text-gray-900' : 'text-gray-300'}`}>3. Competencies</h3>
                    </div>
                    <button onClick={() => setModalMode(null)} className="text-blue-800 p-2 hover:bg-gray-100 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                  
                  {compStep === 1 ? (
                    <div className="space-y-8 mt-6">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">Available Competencies</h4>
                         <input 
                           type="text" 
                           placeholder="Search competencies..." 
                           className="w-full px-4 py-3.5 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 mb-8" 
                           onChange={(e) => setSkillSearchTerm(e.target.value)}
                         />
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {competencies.filter(c => 
                              !variantCompetencies.some(vc => vc.competencyId === c.id) &&
                              (c.title.toLowerCase().includes(skillSearchTerm.toLowerCase()) || c.description.toLowerCase().includes(skillSearchTerm.toLowerCase()))
                            ).map(c => {
                              const isSelected = selectedCompsToAdd.includes(c.id);
                              return (
                                <div 
                                  key={c.id} 
                                  onClick={() => {
                                    setSelectedCompsToAdd(prev => {
                                      const newSelection = prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id];
                                      if (!prev.includes(c.id)) {
                                        // Initialize configs for the competency and its skills
                                        const initialSkillConfigs: Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }> = {};
                                        c.mappedSkills?.forEach(ms => {
                                          initialSkillConfigs[ms.skillId] = { 
                                            proficiency: ms.proficiencyLevel || '', 
                                            criticality: ms.criticality || 'Medium' 
                                          };
                                        });
                                        setConfigComps(prevConfig => ({
                                          ...prevConfig,
                                          [c.id]: { desiredLevel: '', skillConfigs: initialSkillConfigs }
                                        }));
                                      }
                                      return newSelection;
                                    });
                                  }}
                                  className={`relative p-6 bg-white border-2 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isSelected ? 'border-blue-700 shadow-xl shadow-blue-50' : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'}`}
                                >
                                   {isSelected && <span className="absolute top-4 right-4 bg-[#1e3a8a] text-white px-3 py-1 rounded-lg text-[10px] font-bold">Selected</span>}
                                   <h5 className="text-lg font-extrabold text-[#1e3a8a] mb-2">{c.title}</h5>
                                   <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">{c.description}</p>
                                   <div className="mt-3 flex flex-wrap gap-1">
                                      {c.mappedSkills.slice(0, 3).map(ms => (
                                        <span key={ms.skillId} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold rounded">
                                          {skills.find(s => s.id === ms.skillId)?.name}
                                        </span>
                                      ))}
                                      {c.mappedSkills.length > 3 && <span className="text-[8px] text-gray-400 font-bold">+{c.mappedSkills.length - 3} more</span>}
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                       </div>
                       <div className="flex justify-center mt-12">
                          <button 
                            disabled={selectedCompsToAdd.length === 0}
                            onClick={() => setCompStep(2)} 
                            className="px-10 py-3 bg-[#c2d1f0] text-[#1e3a8a] rounded-full text-sm font-extrabold hover:bg-blue-200 transition shadow-md disabled:opacity-50"
                          >
                            Continue to Skill Configuration
                          </button>
                       </div>
                    </div>
                  ) : compStep === 2 ? (
                    <div className="space-y-8 mt-6">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">Step 2: Configure Underlying Skills</h4>
                         <div className="space-y-8">
                            {selectedCompsToAdd.map(compId => {
                              const comp = competencies.find(c => c.id === compId);
                              if (!comp) return null;
                              return (
                                <div key={compId} className="p-8 border-2 border-gray-100 rounded-[1.5rem] bg-white space-y-6">
                                  <h5 className="text-lg font-extrabold text-[#1e3a8a] border-b pb-2">{comp.title} - Skills</h5>
                                  <div className="space-y-6">
                                    {comp.mappedSkills.map(ms => {
                                      const skill = skills.find(s => s.id === ms.skillId);
                                      if (!skill) return null;
                                      const category = skillCategories.find(cat => cat.id === skill.categoryId);
                                      const levels = category ? category.proficiencyLevels : [];
                                      return (
                                        <div key={ms.skillId} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-xl">
                                          <div className="md:col-span-1">
                                            <p className="text-sm font-bold text-gray-900">{skill.name}</p>
                                            <p className="text-[10px] text-gray-500">{category?.name}</p>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Proficiency *</label>
                                            <select 
                                              value={configComps[compId]?.skillConfigs[ms.skillId]?.proficiency || ''}
                                              onChange={e => setConfigComps(prev => ({
                                                ...prev,
                                                [compId]: {
                                                  ...prev[compId],
                                                  skillConfigs: {
                                                    ...prev[compId].skillConfigs,
                                                    [ms.skillId]: { ...prev[compId].skillConfigs[ms.skillId], proficiency: e.target.value }
                                                  }
                                                }
                                              }))}
                                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                              <option value="">Select Level</option>
                                              {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Criticality *</label>
                                            <select 
                                              value={configComps[compId]?.skillConfigs[ms.skillId]?.criticality || 'Medium'}
                                              onChange={e => setConfigComps(prev => ({
                                                ...prev,
                                                [compId]: {
                                                  ...prev[compId],
                                                  skillConfigs: {
                                                    ...prev[compId].skillConfigs,
                                                    [ms.skillId]: { ...prev[compId].skillConfigs[ms.skillId], criticality: e.target.value as any }
                                                  }
                                                }
                                              }))}
                                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                              <option value="High">High</option>
                                              <option value="Medium">Medium</option>
                                              <option value="Low">Low</option>
                                            </select>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                         </div>
                       </div>
                       <div className="flex justify-center space-x-4 mt-12 pt-8 border-t border-gray-100">
                          <button onClick={() => setCompStep(1)} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition">Back to Selection</button>
                          <button 
                            onClick={() => {
                              // Validate all skills configured
                              const allSkillsConfigured = selectedCompsToAdd.every(compId => {
                                const comp = competencies.find(c => c.id === compId);
                                return comp?.mappedSkills.every(ms => configComps[compId]?.skillConfigs[ms.skillId]?.proficiency);
                              });
                              if (allSkillsConfigured) {
                                setCompStep(3);
                              } else {
                                showToast("Please set proficiency levels for all skills", "error");
                              }
                            }} 
                            className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-extrabold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
                          >
                            Continue to Competency Levels
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-8 mt-6">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">Step 3: Configure Competency Desired Levels</h4>
                         <div className="space-y-8">
                            {selectedCompsToAdd.map(id => {
                              const c = competencies.find(comp => comp.id === id);
                              if (!c) return null;
                              const aggLevel = calculateAggregatedLevel(c, configComps[id].skillConfigs);
                              return (
                                <div key={id} className="p-8 border-2 border-gray-100 rounded-[1.5rem] bg-white space-y-6">
                                   <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="text-lg font-extrabold text-[#1e3a8a] mb-1">{c.title}</h5>
                                        <p className="text-xs text-gray-500 font-medium line-clamp-1">{c.description}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aggregated Level</p>
                                         <p className="text-sm font-extrabold text-blue-700">{aggLevel}</p>
                                      </div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                         <label className="block text-xs font-bold text-gray-800 mb-3">Desired Level (Decimal) *</label>
                                         <input 
                                           type="number"
                                           step="0.1"
                                           min="0"
                                           placeholder="e.g. 3.5"
                                           value={configComps[id]?.desiredLevel || ''}
                                           onChange={e => setConfigComps(prev => ({ ...prev, [id]: { ...prev[id], desiredLevel: e.target.value } }))}
                                           className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                                         />
                                      </div>
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                       </div>
                       <div className="flex justify-center space-x-4 mt-12 pt-8 border-t border-gray-100">
                          <button onClick={() => setCompStep(2)} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition">Back to Skills</button>
                          <button onClick={handleAddCompetencies} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-extrabold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Map Competencies</button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Bulk Map Competency Modal */}
        {modalMode === 'bulkMapCompetency' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scaleIn overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900">Bulk Map Competencies to Job Variants</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${bulkCompStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 w-8 ${bulkCompStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${bulkCompStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 w-8 ${bulkCompStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${bulkCompStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
                <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600 transition"><Icons.Back /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {bulkCompStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-900">Step 1: Select Competencies</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkSelectedComps.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search competencies..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkCompSearch}
                        onChange={e => setBulkCompSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {competencies.filter(c => c.title.toLowerCase().includes(bulkCompSearch.toLowerCase())).map(comp => (
                        <div 
                          key={comp.id}
                          onClick={() => {
                            setBulkSelectedComps(prev => 
                              prev.includes(comp.id) ? prev.filter(id => id !== comp.id) : [...prev, comp.id]
                            );
                            if (!bulkConfigComps[comp.id]) {
                              setBulkConfigComps(prev => ({ ...prev, [comp.id]: { desiredLevel: '' } }));
                            }
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkSelectedComps.includes(comp.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{comp.title}</p>
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{comp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkCompStep === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-900">Step 2: Configure Desired Levels</h4>
                    <div className="space-y-4">
                      {bulkSelectedComps.map(compId => {
                        const comp = competencies.find(c => c.id === compId);
                        const category = skillCategories.find(cat => cat.id === comp?.typeId);
                        const levels = category ? category.proficiencyLevels : [];
                        return (
                          <div key={compId} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                              <p className="font-bold text-sm text-gray-900">{comp?.title}</p>
                              <p className="text-[10px] text-gray-500">Aggregated: {comp ? calculateAggregatedLevel(comp) : 0}</p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Desired Level *</label>
                              <select 
                                value={bulkConfigComps[compId]?.desiredLevel}
                                onChange={e => setBulkConfigComps(prev => ({ ...prev, [compId]: { ...prev[compId], desiredLevel: e.target.value } }))}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Level</option>
                                {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bulkCompStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-900">Step 3: Select Job Variants</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkCompSelectedVariants.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search job variants..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkCompVariantSearch}
                        onChange={e => setBulkCompVariantSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobVariants.filter(jv => jv.name.toLowerCase().includes(bulkCompVariantSearch.toLowerCase())).map(jv => (
                        <div 
                          key={jv.id}
                          onClick={() => setBulkCompSelectedVariants(prev => 
                            prev.includes(jv.id) ? prev.filter(id => id !== jv.id) : [...prev, jv.id]
                          )}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkCompSelectedVariants.includes(jv.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{jv.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Parent: {jobRoles.find(jr => jr.id === jv.parentJobRoleId)?.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <button 
                  onClick={() => bulkCompStep > 1 ? setBulkCompStep(bulkCompStep - 1 as any) : setModalMode(null)}
                  className="px-8 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  {bulkCompStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button 
                  onClick={() => {
                    if (bulkCompStep === 1) {
                      if (bulkSelectedComps.length === 0) showToast("Select at least one competency", "error");
                      else setBulkCompStep(2);
                    } else if (bulkCompStep === 2) {
                      if (bulkSelectedComps.every(id => bulkConfigComps[id]?.desiredLevel)) setBulkCompStep(3);
                      else showToast("Configure all competencies", "error");
                    } else {
                      handleBulkCompSubmit();
                    }
                  }}
                  className="px-10 py-2.5 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition shadow-lg"
                >
                  {bulkCompStep === 3 ? 'Finish & Map' : 'Next Step'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Skill Modal */}
        {modalMode === 'addSkill' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
              <div className="p-10 overflow-y-auto">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-extrabold text-gray-900">Add Variant-specific Skills</h3>
                    <button onClick={() => setModalMode(null)} className="text-blue-800 hover:bg-gray-100 p-2 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {skills.filter(s => !(variantSkills || []).some(vs => vs.skillId === s.id)).map(s => {
                          const info = getFullSkillInfo(s.id);
                          const isSelected = selectedSkillsToAdd.includes(s.id);
                          const validLevels = getValidLevelsForSkill(s.id);
                          const currentLevel = configSkills[s.id]?.proficiency || '';
                          return (
                            <div 
                              key={s.id} 
                              onClick={() => toggleSkillSelection(s.id)}
                              className={`p-6 bg-white border-2 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isSelected ? 'border-blue-700 shadow-xl shadow-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                               <div className="flex items-start space-x-3">
                                  <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-700 border-blue-700' : 'border-gray-300'}`}>
                                     {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                                  </div>
                                  <div className="flex-1">
                                     <h5 className="text-sm font-extrabold text-gray-900 mb-1 leading-tight">{s.name}</h5>
                                     <p className="text-[10px] text-[#1e3a8a] font-bold mb-2">Category: {getCategoryNameForSkill(s.id)}</p>
                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{info.cluster?.name} • {info.group?.name}</p>
                                     
                                     {isSelected && (
                                       <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fadeIn">
                                          <div>
                                             <label className="block text-[10px] font-bold text-gray-800 mb-2">Proficiency *</label>
                                             <select 
                                               onClick={e => e.stopPropagation()}
                                               value={currentLevel}
                                               onChange={e => setConfigSkills(prev => ({ ...prev, [s.id]: { ...(prev[s.id] || {}), proficiency: e.target.value } }))}
                                               className="w-full px-3 py-2 bg-white text-black border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-100"
                                             >
                                                <option value="">Select Level</option>
                                                {validLevels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                             </select>
                                             {currentLevel && (
                                               <p className="mt-2 text-[9px] text-gray-400 italic font-medium">Def: {getDescriptorDesc(s.id, currentLevel)}</p>
                                             )}
                                          </div>
                                          <div>
                                             <label className="block text-[10px] font-bold text-gray-800 mb-2">Criticality *</label>
                                             <select 
                                               onClick={e => e.stopPropagation()}
                                               value={configSkills[s.id]?.criticality || 'Medium'}
                                               onChange={e => setConfigSkills(prev => ({ ...prev, [s.id]: { ...(prev[s.id] || {}), criticality: e.target.value as any } }))}
                                               className="w-full px-3 py-2 bg-white text-black border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-100"
                                             >
                                                {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                             </select>
                                          </div>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>

                 <div className="flex justify-end space-x-4 mt-12 pt-8 border-t border-gray-100">
                    <button onClick={() => setModalMode(null)} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition">Cancel</button>
                    <button 
                      disabled={selectedSkillsToAdd.length === 0}
                      onClick={handleAddVariantSkills}
                      className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-extrabold hover:bg-blue-900 transition shadow-xl disabled:opacity-50"
                    >
                      Add Selected
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Competency Modal */}
        {modalMode === 'editCompetencyMapping' && targetCompetencyId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl animate-scaleIn overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-extrabold text-gray-900">Edit Competency Requirements</h3>
                  <button onClick={() => setModalMode(null)} className="text-blue-800 p-2 hover:bg-gray-100 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <h4 className="text-lg font-bold text-[#1e3a8a] mb-2">{competencies.find(c => c.id === targetCompetencyId)?.title}</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Aggregated Level (Auto)</label>
                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-blue-700">
                          {(() => {
                            const comp = competencies.find(c => c.id === targetCompetencyId);
                            return comp ? calculateAggregatedLevel(comp, editCompSkillConfigs) : 0;
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Desired Aggregated Level</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={editCompDesiredLevel}
                          onChange={e => setEditCompDesiredLevel(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Underlying Skills</h5>
                    {competencies.find(c => c.id === targetCompetencyId)?.mappedSkills.map(ms => {
                      const skill = skills.find(s => s.id === ms.skillId);
                      const levels = getValidLevelsForSkill(ms.skillId);
                      return (
                        <div key={ms.skillId} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{skill?.name}</p>
                            <p className="text-[10px] text-gray-500">{getCategoryNameForSkill(ms.skillId)}</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Proficiency Level</label>
                            <select 
                              value={editCompSkillConfigs[ms.skillId]?.proficiency}
                              onChange={e => setEditCompSkillConfigs(prev => ({ ...prev, [ms.skillId]: { ...prev[ms.skillId], proficiency: e.target.value } }))}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Criticality</label>
                            <select 
                              value={editCompSkillConfigs[ms.skillId]?.criticality}
                              onChange={e => setEditCompSkillConfigs(prev => ({ ...prev, [ms.skillId]: { ...prev[ms.skillId], criticality: e.target.value as any } }))}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-12 pt-8 border-t border-gray-100">
                  <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={handleSaveEditCompetency} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-extrabold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Skill Mapping Modal */}
        {modalMode === 'editSkillMapping' && editingSkillMapping && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden">
               <div className="p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-extrabold text-gray-900">Edit Skill Mapping</h3>
                    <button onClick={() => setModalMode(null)} className="text-blue-800 hover:bg-gray-100 p-2 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{getFullSkillInfo(editingSkillMapping.skillId).skill?.name}</p>
                      <p className="text-xs text-[#1e3a8a] font-bold">Category: {getCategoryNameForSkill(editingSkillMapping.skillId)}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2">Proficiency Level</label>
                      <select 
                        value={editingSkillMapping.proficiencyLevel}
                        onChange={e => setEditingSkillMapping({ ...editingSkillMapping, proficiencyLevel: e.target.value })}
                        className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      >
                         {getValidLevelsForSkill(editingSkillMapping.skillId).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-gray-400 italic font-medium">Def: {getDescriptorDesc(editingSkillMapping.skillId, editingSkillMapping.proficiencyLevel)}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2">Criticality</label>
                      <select 
                        value={editingSkillMapping.criticality}
                        onChange={e => setEditingSkillMapping({ ...editingSkillMapping, criticality: e.target.value as any })}
                        className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      >
                         {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end items-center space-x-4 mt-12">
                     <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                     <button onClick={handleSaveSkillMappingEdit} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Save Changes</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Skills</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Job Variant - Skill Management</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Manage skill relationships for job variants and their specific requirements</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleOpenBulkCompMap}
            className="bg-white text-[#1e3a8a] border-2 border-[#1e3a8a] px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            <span>Map competencies to Job variants</span>
          </button>
          <button 
            onClick={handleOpenBulkMap}
            className="bg-white text-[#1e3a8a] border-2 border-[#1e3a8a] px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            <span>Map skills to Job variants</span>
          </button>
          <button 
            onClick={handleStartCreate}
            className="bg-[#1e3a8a] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95"
          >
            Create Job Variant
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 space-y-6">
         <div className="flex justify-between items-end">
            <div className="flex-1 max-w-2xl">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Filter Job Variants</h3>
              <p className="text-xs text-gray-400 mb-6 italic">Search job variants or job roles, then sort by update time or name.</p>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by job variant, job role description, or job role ID..." 
                  className="w-full px-6 py-4 bg-white text-black border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="ml-8 w-64">
               <select 
                 value={selectedSort}
                 onChange={e => setSelectedSort(e.target.value)}
                 className="w-full px-4 py-3 bg-white text-black border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 shadow-sm"
               >
                 <option>Latest Updated</option>
                 <option>Name (A-Z)</option>
               </select>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6 overflow-hidden">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Job Variants ({filteredJobVariants.length})</h3>
          <p className="text-gray-400 text-xs font-medium mt-1">Default sorting shows the most recently updated variants first.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
              <tr>
                <th className="px-8 py-5 border-r border-blue-800">Job Variant</th>
                <th className="px-8 py-5 border-r border-blue-800">Mapped to Job Role</th>
                <th className="px-8 py-5 border-r border-blue-800 text-center">Mapped Skills</th>
                <th className="px-8 py-5 border-r border-blue-800">Last Updated</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobVariants.map(jv => {
                const parent = jobRoles.find(jr => jr.id === jv.parentJobRoleId);
                return (
                  <tr key={jv.id} className="hover:bg-blue-50/20 transition group">
                    <td className="px-8 py-8 border-r border-gray-50">
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-gray-900 leading-tight">{jv.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">desc: {jv.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-8 border-r border-gray-50">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-800 leading-tight">{parent?.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Job Role ID: {parent?.code}</p>
                      </div>
                    </td>
                    <td className="px-8 py-8 border-r border-gray-50 text-center">
                       <span className="w-8 h-8 inline-flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-extrabold rounded-lg border border-blue-100 shadow-inner">
                          {jv.mappedSkills.length}
                       </span>
                    </td>
                    <td className="px-8 py-8 border-r border-gray-50">
                      <p className="text-sm text-gray-700 font-medium">{jv.lastUpdated}</p>
                    </td>
                    <td className="px-8 py-8">
                       <div className="flex justify-center">
                          <button 
                            onClick={() => handleEditVariant(jv)}
                            className="px-8 py-2.5 bg-white border border-gray-200 text-blue-900 font-extrabold rounded-xl text-sm hover:bg-gray-50 transition shadow-sm"
                          >
                            View / Edit
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredJobVariants.length === 0 && (
             <div className="p-20 text-center text-gray-400 italic font-medium">No job variants found matching your criteria.</div>
          )}
        </div>

        <div className="mt-12 flex justify-center items-center space-x-2">
            <button className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-blue-700 transition">First</button>
            <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button className="w-10 h-10 rounded-lg text-sm font-bold transition bg-gray-200 text-gray-900 shadow-inner">1</button>
            <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-blue-700 transition">Last</button>
        </div>
      </div>

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

        {/* Bulk Map Modal */}
        {modalMode === 'bulkMap' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scaleIn overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900">Bulk Map Skills to Job Variants</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${bulkStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 w-8 ${bulkStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${bulkStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 w-8 ${bulkStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${bulkStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
                <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600 transition"><Icons.Back /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {bulkStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-900">Step 1: Select Skills</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkSelectedSkills.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search skills by name..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkSkillSearch}
                        onChange={e => setBulkSkillSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skills.filter(s => s.name.toLowerCase().includes(bulkSkillSearch.toLowerCase())).slice(0, 20).map(skill => (
                        <div 
                          key={skill.id}
                          onClick={() => {
                            setBulkSelectedSkills(prev => 
                              prev.includes(skill.id) ? prev.filter(id => id !== skill.id) : [...prev, skill.id]
                            );
                            if (!bulkConfigSkills[skill.id]) {
                              setBulkConfigSkills(prev => ({ ...prev, [skill.id]: { proficiency: '', criticality: 'Medium' } }));
                            }
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkSelectedSkills.includes(skill.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{skill.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{getCategoryNameForSkill(skill.id)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkStep === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-900">Step 2: Configure Proficiency & Criticality</h4>
                    <div className="space-y-4">
                      {bulkSelectedSkills.map(skillId => {
                        const skill = skills.find(s => s.id === skillId);
                        const levels = getValidLevelsForSkill(skillId);
                        return (
                          <div key={skillId} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div>
                              <p className="font-bold text-sm text-gray-900">{skill?.name}</p>
                              <p className="text-[10px] text-gray-500">{getCategoryNameForSkill(skillId)}</p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Proficiency Level</label>
                              <select 
                                value={bulkConfigSkills[skillId]?.proficiency}
                                onChange={e => setBulkConfigSkills(prev => ({ ...prev, [skillId]: { ...prev[skillId], proficiency: e.target.value } }))}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Level</option>
                                {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Criticality</label>
                              <div className="flex space-x-2">
                                {CRITICALITY_LEVELS.map(level => (
                                  <button
                                    key={level}
                                    onClick={() => setBulkConfigSkills(prev => ({ ...prev, [skillId]: { ...prev[skillId], criticality: level } }))}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                      bulkConfigSkills[skillId]?.criticality === level 
                                        ? 'bg-[#1e3a8a] text-white shadow-md' 
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bulkStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-900">Step 3: Select Job Variants</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkSelectedJobVariants.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search by job variant name or parent role..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkJobVariantSearch}
                        onChange={e => setBulkJobVariantSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobVariants.filter(jv => {
                        const parent = jobRoles.find(jr => jr.id === jv.parentJobRoleId);
                        return jv.name.toLowerCase().includes(bulkJobVariantSearch.toLowerCase()) || 
                               parent?.name.toLowerCase().includes(bulkJobVariantSearch.toLowerCase()) ||
                               parent?.code.toLowerCase().includes(bulkJobVariantSearch.toLowerCase());
                      }).map(jv => (
                        <div 
                          key={jv.id}
                          onClick={() => setBulkSelectedJobVariants(prev => 
                            prev.includes(jv.id) ? prev.filter(id => id !== jv.id) : [...prev, jv.id]
                          )}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkSelectedJobVariants.includes(jv.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{jv.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Parent: {jobRoles.find(jr => jr.id === jv.parentJobRoleId)?.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-gray-100 flex justify-between items-center">
                <button 
                  onClick={() => bulkStep > 1 ? setBulkStep(prev => (prev - 1) as any) : setModalMode(null)}
                  className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition"
                >
                  {bulkStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button 
                  onClick={() => {
                    if (bulkStep === 1) {
                      if (bulkSelectedSkills.length === 0) {
                        showToast("Please select at least one skill", "error");
                        return;
                      }
                      setBulkStep(2);
                    } else if (bulkStep === 2) {
                      const isComplete = bulkSelectedSkills.every(id => bulkConfigSkills[id]?.proficiency);
                      if (!isComplete) {
                        showToast("Please set proficiency for all skills", "error");
                        return;
                      }
                      setBulkStep(3);
                    } else {
                      handleBulkSubmit();
                    }
                  }}
                  className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition shadow-xl active:scale-95"
                >
                  {bulkStep === 3 ? 'Submit Mapping' : 'Continue'}
                </button>
              </div>
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

export default JobVariantMapping;
