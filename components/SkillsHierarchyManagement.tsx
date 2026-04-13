
import React, { useState } from 'react';
import SkillsManagement from './SkillsManagement';
import ProficiencyLevels from './ProficiencyLevels';
import SkillRelationships from './SkillRelationships';
import { ExtendedTaxonomyItem, SkillCategory, ProficiencyMapping, Competency, JobRole, JobVariant, SkillRelationship, TaxonomyNode } from '../types';

interface SkillsHierarchyManagementProps {
  taxonomyNodes: TaxonomyNode[];
  skills: ExtendedTaxonomyItem[];
  setSkills: React.Dispatch<React.SetStateAction<ExtendedTaxonomyItem[]>>;
  skillCategories: SkillCategory[];
  setSkillCategories: React.Dispatch<React.SetStateAction<SkillCategory[]>>;
  descriptorMappings: ProficiencyMapping[];
  setDescriptorMappings: React.Dispatch<React.SetStateAction<ProficiencyMapping[]>>;
  skillRelationships: SkillRelationship[];
  setSkillRelationships: React.Dispatch<React.SetStateAction<SkillRelationship[]>>;
  jobRoles: JobRole[];
  jobVariants: JobVariant[];
  competencies: Competency[];
  initialSubTab?: SubTab;
}

type SubTab = 'Skills' | 'Skill-Proficiency descriptors' | 'Skill-Skill Relationships';

const SkillsHierarchyManagement: React.FC<SkillsHierarchyManagementProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    props.initialSubTab === 'Skill-Proficiency descriptors' 
      ? 'Skill-Proficiency descriptors' 
      : props.initialSubTab === 'Skill-Skill Relationships'
        ? 'Skill-Skill Relationships'
        : 'Skills'
  );

  // Sync with prop if it changes (e.g. from dashboard navigation)
  React.useEffect(() => {
    if (props.initialSubTab === 'Skill-Proficiency descriptors' || props.initialSubTab === 'Skills' || props.initialSubTab === 'Skill-Skill Relationships') {
      setActiveSubTab(props.initialSubTab as SubTab);
    }
  }, [props.initialSubTab]);

  const tabs: SubTab[] = [
    'Skills',
    'Skill-Proficiency descriptors',
    'Skill-Skill Relationships'
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'Skills':
        return (
          <SkillsManagement 
            taxonomyNodes={props.taxonomyNodes}
            skills={props.skills} setSkills={props.setSkills}
            skillCategories={props.skillCategories}
            jobRoles={props.jobRoles}
            jobVariants={props.jobVariants}
            descriptorMappings={props.descriptorMappings}
            setDescriptorMappings={props.setDescriptorMappings}
            skillRelationships={props.skillRelationships}
            setSkillRelationships={props.setSkillRelationships}
            competencies={props.competencies}
          />
        );
      case 'Skill-Proficiency descriptors':
        return (
          <ProficiencyLevels 
            taxonomyNodes={props.taxonomyNodes}
            skills={props.skills}
            skillCategories={props.skillCategories}
            mappings={props.descriptorMappings}
            setMappings={props.setDescriptorMappings}
          />
        );
      case 'Skill-Skill Relationships':
        return (
          <SkillRelationships 
            skills={props.skills}
            relationships={props.skillRelationships}
            setRelationships={props.setSkillRelationships}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Top Nav Menu Bar */}
      <div className="bg-white border-b border-gray-200 px-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Skills</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Manage your skills and their proficiency descriptors</p>
          </div>
        </div>
        
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeSubTab === tab 
                  ? 'text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeSubTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700 rounded-t-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderSubContent()}
      </div>
    </div>
  );
};

export default SkillsHierarchyManagement;
