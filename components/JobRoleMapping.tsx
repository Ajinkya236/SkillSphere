
import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { ExtendedTaxonomyItem, JobRole, JobRoleSkillMapping, SkillCategory, ProficiencyMapping, Competency, TaxonomyNode } from '../types';

interface JobRoleMappingProps {
  jobRoles: JobRole[];
  setJobRoles: React.Dispatch<React.SetStateAction<JobRole[]>>;
  skills: ExtendedTaxonomyItem[];
  taxonomyNodes: TaxonomyNode[];
  skillCategories: SkillCategory[];
  descriptorMappings: ProficiencyMapping[];
  competencies: Competency[];
}

const CRITICALITY_LEVELS: JobRoleSkillMapping['criticality'][] = ['High', 'Medium', 'Low'];

const JobRoleMapping: React.FC<JobRoleMappingProps> = ({ jobRoles, setJobRoles, skills, taxonomyNodes, skillCategories, descriptorMappings, competencies }) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailSearchTerm, setDetailSearchTerm] = useState('');

  // Filtering detail view
  const [filterClusterId, setFilterClusterId] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [filterProficiency, setFilterProficiency] = useState('');
  const [filterCriticality, setFilterCriticality] = useState('');

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
  const [bulkCompSelectedJobRoles, setBulkCompSelectedJobRoles] = useState<string[]>([]);
  const [bulkCompSearch, setBulkCompSearch] = useState('');
  const [bulkCompJobRoleSearch, setBulkCompJobRoleSearch] = useState('');

  // Edit Competency States
  const [editCompDesiredLevel, setEditCompDesiredLevel] = useState('');
  const [editCompSkillConfigs, setEditCompSkillConfigs] = useState<Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }>>({});

  // Modals
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'unmap' | 'addCompetency' | 'unmapCompetency' | 'bulkMap' | 'bulkMapCompetency' | 'editCompetency' | null>(null);
  const [targetMapping, setTargetMapping] = useState<JobRoleSkillMapping | null>(null);
  const [targetCompetencyId, setTargetCompetencyId] = useState<string | null>(null);
  
  // Add Skill Modal States
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState<string[]>([]);
  const [configSkills, setConfigSkills] = useState<Record<string, { proficiency: string; criticality: JobRoleSkillMapping['criticality'] }>>({});

  // Bulk Map States
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1);
  const [bulkSelectedSkills, setBulkSelectedSkills] = useState<string[]>([]);
  const [bulkConfigSkills, setBulkConfigSkills] = useState<Record<string, { proficiency: string; criticality: JobRoleSkillMapping['criticality'] }>>({});
  const [bulkSelectedJobRoles, setBulkSelectedJobRoles] = useState<string[]>([]);
  const [bulkSkillSearch, setBulkSkillSearch] = useState('');
  const [bulkJobRoleSearch, setBulkJobRoleSearch] = useState('');

  // Edit Modal States
  const [editProficiency, setEditProficiency] = useState('');
  const [editCriticality, setEditCriticality] = useState<JobRoleSkillMapping['criticality']>('Medium');

  // Toasts
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Requirement 3: All proficiency levels filter to show all proficiency levels that are present in system
  const availableClusters = useMemo(() => {
    return taxonomyNodes.filter(n => n.parentId === 'root' || n.parentId === null);
  }, [taxonomyNodes]);

  const availableGroups = useMemo(() => {
    if (!filterClusterId) return [];
    return taxonomyNodes.filter(n => n.parentId === filterClusterId);
  }, [taxonomyNodes, filterClusterId]);

  const allProficiencyLevels = useMemo(() => {
    const levels = new Set<string>();
    skillCategories.forEach(cat => cat.proficiencyLevels?.forEach(lvl => levels.add(lvl.name)));
    return Array.from(levels).sort();
  }, [skillCategories]);

  const selectedJobRole = useMemo(() => 
    jobRoles.find(jr => jr.id === selectedJobRoleId), [jobRoles, selectedJobRoleId]);

  const filteredJobRoles = useMemo(() => {
    if (searchTerm.trim().length > 0 && searchTerm.trim().length < 3) return jobRoles;
    return jobRoles.filter(jr => 
      jr.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      jr.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobRoles, searchTerm]);

  const filteredMappedSkills = useMemo(() => {
    if (!selectedJobRole) return [];
    return (selectedJobRole.mappedSkills || []).filter(mapping => {
      const skill = skills.find(s => s.id === mapping.skillId);
      const group = taxonomyNodes.find(n => n.id === skill?.taxonomyNodeId);
      const cluster = taxonomyNodes.find(n => n.id === group?.parentId);

      const matchesSearch = skill?.name.toLowerCase().includes(detailSearchTerm.toLowerCase());
      const matchesCluster = !filterClusterId || cluster?.id === filterClusterId;
      const matchesGroup = !filterGroupId || group?.id === filterGroupId;
      const matchesProficiency = !filterProficiency || mapping.proficiencyLevel === filterProficiency;
      const matchesCriticality = !filterCriticality || mapping.criticality === filterCriticality;

      return matchesSearch && matchesCluster && matchesGroup && matchesProficiency && matchesCriticality;
    });
  }, [selectedJobRole, detailSearchTerm, filterClusterId, filterGroupId, filterProficiency, filterCriticality, skills, taxonomyNodes]);

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

  const handleOpenEdit = (mapping: JobRoleSkillMapping) => {
    setTargetMapping(mapping);
    setEditProficiency(mapping.proficiencyLevel);
    setEditCriticality(mapping.criticality);
    setModalMode('edit');
  };

  const handleSaveEdit = () => {
    if (!selectedJobRoleId || !targetMapping) return;
    if (!editProficiency || !editCriticality) {
      showToast("All fields are mandatory", "error");
      return;
    }

    setJobRoles(prev => prev.map(jr => {
      if (jr.id !== selectedJobRoleId) return jr;
      return {
        ...jr,
        mappedSkills: jr.mappedSkills.map(ms => 
          ms.skillId === targetMapping.skillId 
            ? { ...ms, proficiencyLevel: editProficiency, criticality: editCriticality }
            : ms
        )
      };
    }));
    setModalMode(null);
    showToast("Skill mapping updated successfully");
  };

  const handleOpenUnmap = (mapping: JobRoleSkillMapping) => {
    setTargetMapping(mapping);
    setModalMode('unmap');
  };

  const handleConfirmUnmap = () => {
    if (!selectedJobRoleId || !targetMapping) return;
    setJobRoles(prev => prev.map(jr => {
      if (jr.id !== selectedJobRoleId) return jr;
      return {
        ...jr,
        mappedSkills: (jr.mappedSkills || []).filter(ms => ms.skillId !== targetMapping.skillId)
      };
    }));
    setModalMode(null);
    showToast("Job Role skill unmapped successfully");
  };

  const handleOpenAddCompetency = () => {
    setCompStep(1);
    setSelectedCompsToAdd([]);
    setConfigComps({});
    setModalMode('addCompetency');
    setSearchTerm(''); 
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

   const handleAddCompetencies = () => {
    if (!selectedJobRoleId) return;
    const jr = jobRoles.find(r => r.id === selectedJobRoleId);
    if (!jr) return;

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

    // AC11: Prevent duplicate competency mapping
    const existingCompIds = (jr.mappedCompetencies || []).map(mc => mc.competencyId);
    const duplicateId = selectedCompsToAdd.find(id => existingCompIds.includes(id));
    if (duplicateId) {
      const compTitle = competencies.find(c => c.id === duplicateId)?.title;
      showToast(`Competency "${compTitle}" already mapped to this Job Role.`, "error");
      return;
    }

    // AC15: Block competency mapping if skill already mapped directly
    const selectedCompetencies = competencies.filter(c => selectedCompsToAdd.includes(c.id));
    const competencySkillIds = selectedCompetencies.flatMap(c => c.mappedSkills.map(ms => ms.skillId));
    const directSkillIds = jr.mappedSkills.map(ms => ms.skillId);
    
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

    setJobRoles(prev => prev.map(role => {
      if (role.id !== selectedJobRoleId) return role;
      
      const newCompMappings = selectedCompetencies.map(c => ({
        competencyId: c.id,
        aggregatedLevel: calculateAggregatedLevel(c, configComps[c.id].skillConfigs),
        desiredLevel: configComps[c.id].desiredLevel
      }));

      const newSkillMappings: JobRoleSkillMapping[] = selectedCompetencies.flatMap(c => 
        c.mappedSkills.map(ms => ({
          skillId: ms.skillId,
          proficiencyLevel: configComps[c.id].skillConfigs[ms.skillId].proficiency,
          criticality: configComps[c.id].skillConfigs[ms.skillId].criticality
        }))
      );

      return {
        ...role,
        mappedCompetencies: [...(role.mappedCompetencies || []), ...newCompMappings],
        mappedSkills: [...role.mappedSkills, ...newSkillMappings]
      };
    }));

    setModalMode(null);
    showToast(`${selectedCompsToAdd.length} competencies mapped successfully`);
  };

  const handleOpenUnmapCompetency = (competencyId: string) => {
    setTargetCompetencyId(competencyId);
    setModalMode('unmapCompetency');
  };

  const handleConfirmUnmapCompetency = () => {
    if (!selectedJobRoleId || !targetCompetencyId) return;
    const competency = competencies.find(c => c.id === targetCompetencyId);
    if (!competency) return;

    setJobRoles(prev => prev.map(jr => {
      if (jr.id !== selectedJobRoleId) return jr;
      
      // AC17: Remove derived skill mappings
      const otherCompIds = (jr.mappedCompetencies || []).filter(mc => mc.competencyId !== targetCompetencyId).map(mc => mc.competencyId);
      const otherCompSkills = competencies.filter(c => otherCompIds.includes(c.id)).flatMap(c => c.mappedSkills.map(ms => ms.skillId));
      
      const competencySkillIds = competency.mappedSkills.map(ms => ms.skillId);
      const skillsToRemove = competencySkillIds.filter(id => !otherCompSkills.includes(id));

      return {
        ...jr,
        mappedCompetencies: jr.mappedCompetencies?.filter(mc => mc.competencyId !== targetCompetencyId),
        mappedSkills: (jr.mappedSkills || []).filter(ms => !skillsToRemove.includes(ms.skillId))
      };
    }));

    setModalMode(null);
    showToast("Competency unmapped successfully");
  };

  const handleOpenEditCompetency = (mc: any) => {
    const comp = competencies.find(c => c.id === mc.competencyId);
    if (!comp || !selectedJobRole) return;

    setTargetCompetencyId(mc.competencyId);
    setEditCompDesiredLevel(mc.desiredLevel);
    
    const skillConfigs: Record<string, { proficiency: string; criticality: 'High' | 'Medium' | 'Low' }> = {};
    comp.mappedSkills?.forEach(ms => {
      const skillMapping = selectedJobRole.mappedSkills.find(s => s.skillId === ms.skillId);
      if (skillMapping) {
        skillConfigs[ms.skillId] = {
          proficiency: skillMapping.proficiencyLevel,
          criticality: skillMapping.criticality
        };
      }
    });
    setEditCompSkillConfigs(skillConfigs);
    setModalMode('editCompetency');
  };

  const handleSaveEditCompetency = () => {
    if (!selectedJobRoleId || !targetCompetencyId || !selectedJobRole) return;

    const mc = selectedJobRole.mappedCompetencies?.find(c => c.competencyId === targetCompetencyId);
    if (!mc) return;

    // Recalculate aggregated level
    const newAggregatedLevel = calculateAggregatedLevel(targetCompetencyId, editCompSkillConfigs);

    // Validation: desired level <= aggregated level
    if (parseFloat(editCompDesiredLevel) > newAggregatedLevel) {
      showToast(`Desired level (${editCompDesiredLevel}) cannot exceed aggregated level (${newAggregatedLevel})`, "error");
      return;
    }

    setJobRoles(prev => prev.map(jr => {
      if (jr.id !== selectedJobRoleId) return jr;

      const updatedMappedCompetencies = (jr.mappedCompetencies || []).map(compMapping => {
        if (compMapping.competencyId === targetCompetencyId) {
          return { ...compMapping, desiredLevel: editCompDesiredLevel, aggregatedLevel: newAggregatedLevel };
        }
        return compMapping;
      });

      const updatedMappedSkills = jr.mappedSkills.map(skillMapping => {
        if (editCompSkillConfigs[skillMapping.skillId]) {
          return {
            ...skillMapping,
            proficiencyLevel: editCompSkillConfigs[skillMapping.skillId].proficiency,
            criticality: editCompSkillConfigs[skillMapping.skillId].criticality
          };
        }
        return skillMapping;
      });

      return {
        ...jr,
        mappedCompetencies: updatedMappedCompetencies,
        mappedSkills: updatedMappedSkills
      };
    }));

    setModalMode(null);
    showToast("Competency requirements updated successfully");
  };

  const handleOpenAdd = () => {
    setAddStep(1);
    setSelectedSkillsToAdd([]);
    setConfigSkills({});
    setModalMode('add');
  };

  const handleOpenBulkMap = () => {
    setBulkStep(1);
    setBulkSelectedSkills([]);
    setBulkConfigSkills({});
    setBulkSelectedJobRoles([]);
    setBulkSkillSearch('');
    setBulkJobRoleSearch('');
    setModalMode('bulkMap');
  };

  const handleBulkSubmit = () => {
    if (bulkSelectedJobRoles.length === 0) {
      showToast("Please select at least one job role", "error");
      return;
    }

    const newMappings: JobRoleSkillMapping[] = bulkSelectedSkills.map(id => ({
      skillId: id,
      proficiencyLevel: bulkConfigSkills[id].proficiency,
      criticality: bulkConfigSkills[id].criticality
    }));

    setJobRoles(prev => prev.map(jr => {
      if (!bulkSelectedJobRoles.includes(jr.id)) return jr;
      
      const existingIds = (jr.mappedSkills || []).map(ms => ms.skillId);
      const uniqueNewMappings = newMappings.filter(nm => !existingIds.includes(nm.skillId));
      
      return {
        ...jr,
        mappedSkills: [...(jr.mappedSkills || []), ...uniqueNewMappings]
      };
    }));

    setModalMode(null);
    showToast(`Skills mapped to ${bulkSelectedJobRoles.length} job roles successfully`);
  };

  const handleOpenBulkCompMap = () => {
    setBulkCompStep(1);
    setBulkSelectedComps([]);
    setBulkConfigComps({});
    setBulkCompSelectedJobRoles([]);
    setBulkCompSearch('');
    setBulkCompJobRoleSearch('');
    setModalMode('bulkMapCompetency');
  };

  const handleBulkCompSubmit = () => {
    if (bulkCompSelectedJobRoles.length === 0) {
      showToast("Please select at least one job role", "error");
      return;
    }

    const isComplete = bulkSelectedComps.every(id => bulkConfigComps[id]?.desiredLevel);
    if (!isComplete) {
      showToast("Please set desired level for all competencies", "error");
      return;
    }

    const selectedCompetencies = competencies.filter(c => bulkSelectedComps.includes(c.id));

    setJobRoles(prev => prev.map(jr => {
      if (!bulkCompSelectedJobRoles.includes(jr.id)) return jr;
      
      const existingCompIds = (jr.mappedCompetencies || []).map(mc => mc.competencyId);
      const directSkillIds = jr.mappedSkills.map(ms => ms.skillId);

      // Filter out competencies already mapped OR having conflicting skills
      const uniqueNewComps = selectedCompetencies.filter(c => {
        if (existingCompIds.includes(c.id)) return false;
        const compSkillIds = c.mappedSkills.map(ms => ms.skillId);
        return !compSkillIds.some(id => directSkillIds.includes(id));
      });
      
      if (uniqueNewComps.length === 0) return jr;

      const newCompMappings = uniqueNewComps.map(c => ({
        competencyId: c.id,
        aggregatedLevel: calculateAggregatedLevel(c),
        desiredLevel: bulkConfigComps[c.id].desiredLevel
      }));

      const newSkillMappings: JobRoleSkillMapping[] = uniqueNewComps.flatMap(c => 
        c.mappedSkills.map(ms => ({
          skillId: ms.skillId,
          proficiencyLevel: ms.proficiencyLevel || '',
          criticality: ms.criticality || 'Medium'
        }))
      );

      const existingSkillIds = (jr.mappedSkills || []).map(ms => ms.skillId);
      const uniqueNewSkills = newSkillMappings.filter(nm => !existingSkillIds.includes(nm.skillId));

      return {
        ...jr,
        mappedCompetencies: [...(jr.mappedCompetencies || []), ...newCompMappings],
        mappedSkills: [...(jr.mappedSkills || []), ...uniqueNewSkills]
      };
    }));

    setModalMode(null);
    showToast(`Competencies mapped to ${bulkCompSelectedJobRoles.length} job roles successfully`);
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

  const handleContinueToConfig = () => {
    if (selectedSkillsToAdd.length === 0) return;
    const initialConfig = { ...configSkills };
    selectedSkillsToAdd.forEach(id => {
      if (!initialConfig[id]) {
        initialConfig[id] = { proficiency: '', criticality: 'Medium' };
      }
    });
    setConfigSkills(initialConfig);
    setAddStep(2);
  };

  const handleAddSkills = () => {
    if (!selectedJobRoleId) return;
    const jr = jobRoles.find(r => r.id === selectedJobRoleId);
    if (!jr) return;

    // AC16: Block skill mapping if competency already mapped
    const mappedCompetencyIds = (jr.mappedCompetencies || []).map(mc => mc.competencyId);
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

    const newMappings: JobRoleSkillMapping[] = selectedSkillsToAdd.map(id => ({
      skillId: id,
      proficiencyLevel: configSkills[id].proficiency,
      criticality: configSkills[id].criticality
    }));

    setJobRoles(prev => prev.map(jr => {
      if (jr.id !== selectedJobRoleId) return jr;
      const existingIds = (jr.mappedSkills || []).map(ms => ms.skillId);
      const uniqueNewMappings = newMappings.filter(nm => !existingIds.includes(nm.skillId));
      
      return {
        ...jr,
        mappedSkills: [...(jr.mappedSkills || []), ...uniqueNewMappings]
      };
    }));

    setModalMode(null);
    showToast(`${selectedSkillsToAdd.length} skills mapped successfully`);
  };

  const getFullSkillInfo = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    const group = taxonomyNodes.find(n => n.id === skill?.taxonomyNodeId);
    const cluster = taxonomyNodes.find(n => n.id === group?.parentId);
    return { skill, group, cluster };
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full">
      {view === 'detail' && selectedJobRole ? (
        <>
          <header className="flex flex-col space-y-4">
            <p className="text-gray-500 text-sm">Skills Management</p>
            <div className="flex items-center space-x-2 text-[#1e3a8a] cursor-pointer hover:underline" onClick={() => { setView('list'); setSelectedJobRoleId(null); }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="text-sm font-bold">Back to Job Roles</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{selectedJobRole.name}</h2>
          <div className="flex space-x-3">
             <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">Code: {selectedJobRole.code}</span>
             <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100">{selectedJobRole.mappedSkills.length} Skills Mapped</span>
          </div>
          <p className="text-gray-500 text-sm font-medium italic">{selectedJobRole.description || 'No description available for this job role.'}</p>
        </header>

        <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Mapped Competencies</h3>
              <p className="text-gray-500 text-sm font-medium">Competencies associated with this job role</p>
            </div>
            <button 
              onClick={handleOpenAddCompetency}
              className="bg-[#1e3a8a] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95"
            >
              Add Competency
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
                {selectedJobRole.mappedCompetencies?.map(mc => {
                  const comp = competencies.find(c => c.id === mc.competencyId);
                  if (!comp) return null;
                  return (
                    <tr key={mc.competencyId} className="hover:bg-blue-50/20 transition group">
                      <td className="px-6 py-6 border-r border-gray-50">
                        <p className="font-bold text-gray-900">{comp.title}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{comp.description}</p>
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
                              const skillMapping = selectedJobRole.mappedSkills.find(s => s.skillId === ms.skillId);
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
                          <button onClick={() => handleOpenEditCompetency(mc)} className="px-4 py-2 bg-white border border-gray-200 text-blue-800 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Edit</button>
                          <button onClick={() => handleOpenUnmapCompetency(mc.competencyId)} className="px-4 py-2 bg-white border border-gray-200 text-red-600 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Unmap</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!selectedJobRole.mappedCompetencies || selectedJobRole.mappedCompetencies.length === 0) && (
              <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-medium italic">
                No competencies mapped yet.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Required Skills and Proficiencies</h3>
              <p className="text-gray-500 text-sm font-medium">Manage skill requirements for this job role</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="bg-[#1e3a8a] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95"
            >
              Add Skills
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <select value={filterClusterId} onChange={e => setFilterClusterId(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">All Skill Clusters</option>
                {availableClusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <select value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">All Skill Groups</option>
                {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
             </select>
             <div className="md:col-span-2 relative">
                <input 
                  type="text" 
                  placeholder="Search skills..." 
                  value={detailSearchTerm}
                  onChange={e => setDetailSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100"
                />
             </div>
             <div className="md:col-span-2"></div>
             <select value={filterProficiency} onChange={e => setFilterProficiency(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">All Proficiency Levels</option>
                {allProficiencyLevels.map(l => <option key={l} value={l}>{l}</option>)}
             </select>
             <select value={filterCriticality} onChange={e => setFilterCriticality(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">All Criticality</option>
                {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
             </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-[#1e3a8a] text-white text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 border-r border-blue-800 w-16">No.</th>
                  <th className="px-6 py-5 border-r border-blue-800">Skill</th>
                  <th className="px-6 py-5 border-r border-blue-800">Skill Cluster</th>
                  <th className="px-6 py-5 border-r border-blue-800">Skill Group</th>
                  <th className="px-6 py-5 border-r border-blue-800">Skill Category</th>
                  <th className="px-6 py-5 border-r border-blue-800">Proficiency Level</th>
                  <th className="px-6 py-5 border-r border-blue-800">Descriptor Description</th>
                  <th className="px-6 py-5 border-r border-blue-800">Criticality</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMappedSkills.map((mapping, idx) => {
                  const info = getFullSkillInfo(mapping.skillId);
                  return (
                    <tr key={mapping.skillId} className="hover:bg-blue-50/20 transition group">
                      <td className="px-6 py-6 text-sm text-gray-800 border-r border-gray-50">{idx + 1}</td>
                      <td className="px-6 py-6 text-sm font-bold text-gray-900 border-r border-gray-50">{info.skill?.name}</td>
                      <td className="px-6 py-6 text-sm text-gray-600 border-r border-gray-50">{info.cluster?.name}</td>
                      <td className="px-6 py-6 text-sm text-gray-600 border-r border-gray-50">{info.group?.name}</td>
                      <td className="px-6 py-6 text-sm font-bold text-gray-700 border-r border-gray-50 italic">{getCategoryNameForSkill(mapping.skillId)}</td>
                      <td className="px-6 py-6 border-r border-gray-50">
                         <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100">
                            {mapping.proficiencyLevel}
                         </span>
                      </td>
                      {/* Requirement 2: View/Edit Job role: show proficiency level - descriptor description column */}
                      <td className="px-6 py-6 text-sm text-gray-500 border-r border-gray-50 italic max-w-xs">{getDescriptorDesc(mapping.skillId, mapping.proficiencyLevel)}</td>
                      <td className="px-6 py-6 border-r border-gray-50">
                         <span className={`px-4 py-1 text-[10px] font-bold rounded-full border ${
                           mapping.criticality === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                           mapping.criticality === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                           'bg-green-50 text-green-700 border-green-100'
                         }`}>
                            {mapping.criticality}
                         </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center space-x-3">
                           {selectedJobRole.mappedCompetencies?.some(mc => 
                             competencies.find(c => c.id === mc.competencyId)?.mappedSkills.some(ms => ms.skillId === mapping.skillId)
                           ) ? (
                             <span className="text-[10px] text-gray-400 font-bold italic">Derived from Competency</span>
                           ) : (
                             <>
                               <button onClick={() => handleOpenEdit(mapping)} className="px-4 py-2 bg-white border border-gray-200 text-blue-800 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Edit</button>
                               <button onClick={() => handleOpenUnmap(mapping)} className="px-4 py-2 bg-white border border-gray-200 text-blue-900 font-bold rounded-lg text-xs hover:bg-gray-50 transition shadow-sm">Unmap</button>
                             </>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredMappedSkills.length === 0 && (
              <div className="p-16 text-center text-gray-500 font-medium italic">No mapped skills found for this selection.</div>
            )}
          </div>
        </section>

        {/* Edit Competency Modal */}
        {modalMode === 'editCompetency' && targetCompetencyId && (
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
                          {calculateAggregatedLevel(targetCompetencyId, editCompSkillConfigs)}
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

        {/* Edit Modal */}
        {modalMode === 'edit' && targetMapping && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-scaleIn overflow-hidden">
               <div className="p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-extrabold text-gray-900">Edit Skill Requirements</h3>
                    <button onClick={() => setModalMode(null)} className="text-blue-800 p-2 hover:bg-gray-100 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="flex items-center">
                        <label className="w-1/3 text-sm font-bold text-gray-800">Skill Category</label>
                        <p className="flex-1 font-bold text-[#1e3a8a]">{getCategoryNameForSkill(targetMapping.skillId)}</p>
                     </div>
                     <div className="flex items-center">
                        <label className="w-1/3 text-sm font-bold text-gray-800">Proficiency Level</label>
                        <select value={editProficiency} onChange={e => setEditProficiency(e.target.value)} className="flex-1 px-4 py-3 bg-white text-black border-2 border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all">
                           <option value="">Select Level</option>
                           {getValidLevelsForSkill(targetMapping.skillId).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        </select>
                     </div>
                     {editProficiency && (
                       <div className="flex items-start">
                          <label className="w-1/3 text-sm font-bold text-gray-800">Descriptor Definition</label>
                          <p className="flex-1 text-sm text-gray-500 italic font-medium">{getDescriptorDesc(targetMapping.skillId, editProficiency)}</p>
                       </div>
                     )}
                     <div className="flex items-center">
                        <label className="w-1/3 text-sm font-bold text-gray-800">Criticality Level</label>
                        <select value={editCriticality} onChange={e => setEditCriticality(e.target.value as any)} className="flex-1 px-4 py-3 bg-white text-black border-2 border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all">
                           {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="flex justify-end items-center space-x-4 mt-12">
                     <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                     <button onClick={handleSaveEdit} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition duration-200 shadow-xl shadow-blue-100 active:scale-95">Save Changes</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {modalMode === 'add' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scaleIn overflow-hidden max-h-[90vh] flex flex-col">
               <div className="p-10 overflow-y-auto">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-baseline space-x-3">
                      <h3 className={`text-2xl font-extrabold ${addStep === 1 ? 'text-gray-900' : 'text-gray-300'}`}>1. Select Skills</h3>
                      <h3 className={`text-2xl font-extrabold ${addStep === 2 ? 'text-gray-900' : 'text-gray-300'}`}>2. Configure Skills</h3>
                    </div>
                    <button onClick={() => setModalMode(null)} className="text-blue-800 p-2 hover:bg-gray-100 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                  
                  {addStep === 1 ? (
                    <div className="space-y-8 mt-6">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">Suggested Skills</h4>
                         <input type="text" placeholder="Search skills, skill clusters, or skill groups..." className="w-full px-4 py-3.5 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 mb-8" />
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {skills.filter(s => !(selectedJobRole.mappedSkills || []).some(ms => ms.skillId === s.id)).map(s => {
                              const group = taxonomyNodes.find(n => n.id === s.taxonomyNodeId);
                              const cluster = taxonomyNodes.find(n => n.id === group?.parentId);
                              const isSelected = selectedSkillsToAdd.includes(s.id);
                              return (
                                <div 
                                  key={s.id} 
                                  onClick={() => toggleSkillSelection(s.id)}
                                  className={`relative p-6 bg-white border-2 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isSelected ? 'border-blue-700 shadow-xl shadow-blue-50' : 'border-gray-100 hover:border-blue-200 hover:shadow-lg'}`}
                                >
                                   {isSelected && <span className="absolute top-4 right-4 bg-[#1e3a8a] text-white px-3 py-1 rounded-lg text-[10px] font-bold">Selected</span>}
                                   <h5 className="text-lg font-extrabold text-[#1e3a8a] mb-2">{s.name}</h5>
                                   <p className="text-xs text-gray-500 font-medium leading-relaxed">{cluster?.name} / {group?.name}</p>
                                   <p className="mt-2 text-[10px] font-bold text-gray-400 italic">Category: {getCategoryNameForSkill(s.id)}</p>
                                </div>
                              );
                            })}
                         </div>
                       </div>
                       <div className="flex justify-center mt-12">
                          <button 
                            disabled={selectedSkillsToAdd.length === 0}
                            onClick={handleContinueToConfig} 
                            className="px-10 py-3 bg-[#c2d1f0] text-[#1e3a8a] rounded-full text-sm font-extrabold hover:bg-blue-200 transition shadow-md disabled:opacity-50"
                          >
                            Continue to Configuration
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-8 mt-6">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">Configure Skills</h4>
                         <div className="space-y-8">
                            {selectedSkillsToAdd.map(id => {
                              const s = skills.find(sk => sk.id === id);
                              const group = taxonomyNodes.find(n => n.id === s?.taxonomyNodeId);
                              const cluster = taxonomyNodes.find(n => n.id === group?.parentId);
                              const validLevels = getValidLevelsForSkill(id);
                              const currentLevel = configSkills[id]?.proficiency || '';
                              return (
                                <div key={id} className="p-8 border-2 border-gray-100 rounded-[1.5rem] bg-white space-y-6">
                                   <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="text-lg font-extrabold text-[#1e3a8a] mb-1">{s?.name}</h5>
                                        <p className="text-xs text-gray-500 font-medium">{cluster?.name} / {group?.name}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skill Category</p>
                                         <p className="text-sm font-extrabold text-[#1e3a8a]">{getCategoryNameForSkill(id)}</p>
                                      </div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                         <label className="block text-xs font-bold text-gray-800 mb-3">Proficiency Level</label>
                                         <select 
                                           value={currentLevel}
                                           onChange={e => setConfigSkills(prev => ({ ...prev, [id]: { ...prev[id], proficiency: e.target.value } }))}
                                           className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                                         >
                                            <option value="">Select Level</option>
                                            {validLevels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                         </select>
                                         {currentLevel && (
                                           <p className="mt-2 text-xs text-gray-400 italic font-medium">Def: {getDescriptorDesc(id, currentLevel)}</p>
                                         )}
                                      </div>
                                      <div>
                                         <label className="block text-xs font-bold text-gray-800 mb-3">Criticality</label>
                                         <select 
                                           value={configSkills[id]?.criticality || 'Medium'}
                                           onChange={e => setConfigSkills(prev => ({ ...prev, [id]: { ...prev[id], criticality: e.target.value as any } }))}
                                           className="w-full px-4 py-3 bg-white text-black border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                                         >
                                            {CRITICALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                </div>
                              );
                            })}
                         </div>
                       </div>
                       <div className="flex justify-center space-x-4 mt-12 pt-8 border-t border-gray-100">
                          <button onClick={() => setAddStep(1)} className="px-10 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition">Back to Selection</button>
                          <button onClick={handleAddSkills} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-extrabold hover:bg-blue-900 transition-all shadow-xl active:scale-95">Add Skills</button>
                       </div>
                    </div>
                  )}
               </div>
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
                  <h3 className="text-2xl font-extrabold text-gray-900">Bulk Map Skills to Job Roles</h3>
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
                      <h4 className="text-lg font-bold text-gray-900">Step 3: Select Job Roles</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkSelectedJobRoles.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search by job role name or code..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkJobRoleSearch}
                        onChange={e => setBulkJobRoleSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobRoles.filter(jr => 
                        jr.name.toLowerCase().includes(bulkJobRoleSearch.toLowerCase()) || 
                        jr.code.toLowerCase().includes(bulkJobRoleSearch.toLowerCase())
                      ).map(jr => (
                        <div 
                          key={jr.id}
                          onClick={() => setBulkSelectedJobRoles(prev => 
                            prev.includes(jr.id) ? prev.filter(id => id !== jr.id) : [...prev, jr.id]
                          )}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkSelectedJobRoles.includes(jr.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{jr.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Code: {jr.code}</p>
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
        </>
      ) : (
        <>
      <header className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-sm">Skills Management</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Job Role - Skill Relationship</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Manage job roles and their required skill proficiencies</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleOpenBulkCompMap}
            className="bg-white text-[#1e3a8a] border-2 border-[#1e3a8a] px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            <span>Map competencies to Job roles</span>
          </button>
          <button 
            onClick={handleOpenBulkMap}
            className="bg-[#1e3a8a] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            <span>Map skills to Job roles</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 space-y-6">
         <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">Search & Manage Job Roles</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by job role name or code... Please add minimum 3 characters" 
                className="w-full px-6 py-4 bg-white text-black border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Job Roles</h3>
          <p className="text-gray-500 text-sm font-medium">{filteredJobRoles.length} job roles found</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#1e3a8a] text-white text-sm font-bold">
              <tr>
                <th className="px-8 py-5 border-r border-blue-800">Job Role</th>
                <th className="px-8 py-5 border-r border-blue-800">Mapped Skill</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobRoles.map(jr => (
                <tr key={jr.id} className="hover:bg-blue-50/20 transition group">
                  <td className="px-8 py-8 border-r border-gray-50">
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-900">{jr.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Job Role ID: {jr.code}</p>
                    </div>
                  </td>
                  <td className="px-8 py-8 border-r border-gray-50">
                    <div className="flex flex-wrap gap-3">
                      {jr.mappedSkills.slice(0, 3).map(ms => {
                        const skill = skills.find(s => s.id === ms.skillId);
                        return (
                          <span key={ms.skillId} className="px-4 py-1.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full border border-blue-100">
                            {skill?.name}
                          </span>
                        );
                      })}
                      {jr.mappedSkills.length > 3 && (
                        <span className="px-3 py-1.5 bg-[#1e3a8a] text-white text-[10px] font-bold rounded-full border border-blue-900 shadow-sm">
                          +{jr.mappedSkills.length - 3} more
                        </span>
                      )}
                      {jr.mappedSkills.length === 0 && (
                         <span className="text-gray-300 italic text-xs">No skills mapped yet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-8">
                     <div className="flex justify-center">
                        <button 
                          onClick={() => {
                            setSelectedJobRoleId(jr.id);
                            setView('detail');
                          }}
                          className="px-8 py-2.5 bg-white border border-gray-200 text-blue-900 font-extrabold rounded-xl text-sm hover:bg-gray-50 transition shadow-sm"
                        >
                          View/Edit
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
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
                           onChange={(e) => setSearchTerm(e.target.value)}
                         />
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {competencies.filter(c => 
                              !(selectedJobRole?.mappedCompetencies || []).some(mc => mc.competencyId === c.id) &&
                              (c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
                                        <span key={ms.skillId} className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[8px] font-bold rounded">
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
                  <h3 className="text-2xl font-extrabold text-gray-900">Bulk Map Competencies to Job Roles</h3>
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
                      <h4 className="text-lg font-bold text-gray-900">Step 3: Select Job Roles</h4>
                      <span className="text-sm font-bold text-blue-600">{bulkCompSelectedJobRoles.length} selected</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search job roles..." 
                        className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50"
                        value={bulkCompJobRoleSearch}
                        onChange={e => setBulkCompJobRoleSearch(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobRoles.filter(jr => jr.name.toLowerCase().includes(bulkCompJobRoleSearch.toLowerCase()) || jr.code.toLowerCase().includes(bulkCompJobRoleSearch.toLowerCase())).map(jr => (
                        <div 
                          key={jr.id}
                          onClick={() => setBulkCompSelectedJobRoles(prev => 
                            prev.includes(jr.id) ? prev.filter(id => id !== jr.id) : [...prev, jr.id]
                          )}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            bulkCompSelectedJobRoles.includes(jr.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <p className="font-bold text-sm text-gray-900">{jr.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Code: {jr.code}</p>
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

        {/* Unmap Competency Confirmation */}
        {modalMode === 'unmapCompetency' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Icons.Delete />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Unmap Competency?</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                  Are you sure you want to unmap <span className="text-gray-900 font-bold">"{competencies.find(c => c.id === targetCompetencyId)?.title}"</span>? All derived skill mappings will also be removed.
                </p>
                
                <div className="flex justify-center items-center space-x-4 mt-10">
                  <button onClick={() => setModalMode(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
                  <button onClick={handleConfirmUnmapCompetency} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl">Confirm Unmap</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unmap Skill Confirmation */}
        {modalMode === 'unmap' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
            <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Icons.Delete />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Unmap Skill?</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                  Are you sure you want to unmap <span className="text-gray-900 font-bold">"{skills.find(s => s.id === targetMapping?.skillId)?.name}"</span>?
                </p>
                
                <div className="flex justify-center items-center space-x-4 mt-10">
                  <button onClick={() => setModalMode(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
                  <button onClick={handleConfirmUnmap} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl">Confirm Unmap</button>
                </div>
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

export default JobRoleMapping;
