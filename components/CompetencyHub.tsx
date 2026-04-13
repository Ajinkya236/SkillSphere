
import React, { useState } from 'react';
import CompetencyManagement from './CompetencyManagement';
import CompetencyProficiencyDescriptors from './CompetencyProficiencyDescriptors';
import CompetencyRelationships from './CompetencyRelationships';
import { ExtendedTaxonomyItem, SkillCategory, ProficiencyMapping, Competency, JobRole, JobVariant, CompetencyProficiencyMapping, CompetencyRelationship, TaxonomyNode } from '../types';

interface CompetencyHubProps {
  competencies: Competency[];
  setCompetencies: React.Dispatch<React.SetStateAction<Competency[]>>;
  skills: ExtendedTaxonomyItem[];
  taxonomyNodes: TaxonomyNode[];
  skillCategories: SkillCategory[];
  setSkillCategories: React.Dispatch<React.SetStateAction<SkillCategory[]>>;
  descriptorMappings: ProficiencyMapping[];
  competencyDescriptors: CompetencyProficiencyMapping[];
  setCompetencyDescriptors: React.Dispatch<React.SetStateAction<CompetencyProficiencyMapping[]>>;
  competencyRelationships: CompetencyRelationship[];
  setCompetencyRelationships: React.Dispatch<React.SetStateAction<CompetencyRelationship[]>>;
  jobRoles: JobRole[];
  jobVariants: JobVariant[];
}

type SubTab = 
  | 'Competencies' 
  | 'Competency-Proficiency descriptors' 
  | 'Competency-competency Relationships';

const CompetencyHub: React.FC<CompetencyHubProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Competencies');

  const tabs: SubTab[] = [
    'Competencies',
    'Competency-Proficiency descriptors',
    'Competency-competency Relationships'
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'Competencies':
        return (
          <CompetencyManagement 
            competencies={props.competencies}
            setCompetencies={props.setCompetencies}
            skills={props.skills}
            taxonomyNodes={props.taxonomyNodes}
            skillCategories={props.skillCategories}
            descriptorMappings={props.descriptorMappings}
            competencyDescriptors={props.competencyDescriptors}
            setCompetencyDescriptors={props.setCompetencyDescriptors}
            competencyRelationships={props.competencyRelationships}
            setCompetencyRelationships={props.setCompetencyRelationships}
            jobRoles={props.jobRoles}
            jobVariants={props.jobVariants}
          />
        );
      case 'Competency-Proficiency descriptors':
        return (
          <CompetencyProficiencyDescriptors 
            competencies={props.competencies}
            competencyDescriptors={props.competencyDescriptors}
            setCompetencyDescriptors={props.setCompetencyDescriptors}
            skillCategories={props.skillCategories}
            taxonomyNodes={props.taxonomyNodes}
          />
        );
      case 'Competency-competency Relationships':
        return (
          <CompetencyRelationships 
            competencies={props.competencies}
            relationships={props.competencyRelationships}
            setRelationships={props.setCompetencyRelationships}
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
            <h2 className="text-2xl font-extrabold text-gray-900">Competencies</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Define and organize high-level organizational competencies</p>
          </div>
        </div>
        
        <nav className="flex space-x-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${
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

export default CompetencyHub;
