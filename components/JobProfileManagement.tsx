
import React, { useState, useEffect } from 'react';
import JobRoleMapping from './JobRoleMapping';
import JobVariantMapping from './JobVariantMapping';
import { ExtendedTaxonomyItem, SkillCategory, ProficiencyMapping, Competency, JobRole, JobVariant, TaxonomyNode } from '../types';

interface JobProfileManagementProps {
  jobRoles: JobRole[];
  setJobRoles: React.Dispatch<React.SetStateAction<JobRole[]>>;
  jobVariants: JobVariant[];
  setJobVariants: React.Dispatch<React.SetStateAction<JobVariant[]>>;
  skills: ExtendedTaxonomyItem[];
  taxonomyNodes: TaxonomyNode[];
  skillCategories: SkillCategory[];
  descriptorMappings: ProficiencyMapping[];
  competencies: Competency[];
  initialSubTab?: SubTab;
}

type SubTab = 'Job Role Mapping' | 'Job Variant Mapping';

const JobProfileManagement: React.FC<JobProfileManagementProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(props.initialSubTab || 'Job Role Mapping');

  // Sync with prop if it changes (e.g. from dashboard navigation)
  useEffect(() => {
    if (props.initialSubTab) {
      setActiveSubTab(props.initialSubTab);
    }
  }, [props.initialSubTab]);

  const tabs: SubTab[] = [
    'Job Role Mapping',
    'Job Variant Mapping'
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'Job Role Mapping':
        return (
          <JobRoleMapping 
            jobRoles={props.jobRoles}
            setJobRoles={props.setJobRoles}
            skills={props.skills}
            taxonomyNodes={props.taxonomyNodes}
            skillCategories={props.skillCategories}
            descriptorMappings={props.descriptorMappings}
            competencies={props.competencies}
          />
        );
      case 'Job Variant Mapping':
        return (
          <JobVariantMapping 
            jobRoles={props.jobRoles}
            jobVariants={props.jobVariants}
            setJobVariants={props.setJobVariants}
            skills={props.skills}
            taxonomyNodes={props.taxonomyNodes}
            skillCategories={props.skillCategories}
            descriptorMappings={props.descriptorMappings}
            competencies={props.competencies}
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
            <h2 className="text-2xl font-extrabold text-gray-900">Job Profile Management</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">Align job roles and variants with the required skill sets</p>
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

export default JobProfileManagement;
