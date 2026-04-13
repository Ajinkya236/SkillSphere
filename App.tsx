
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SkillsManagement from './components/SkillsManagement';
import ProficiencyLevels from './components/ProficiencyLevels';
import JobRoleMapping from './components/JobRoleMapping';
import JobVariantMapping from './components/JobVariantMapping';
import CompetencyManagement from './components/CompetencyManagement';
import SkillsHierarchyManagement from './components/SkillsHierarchyManagement';
import JobProfileManagement from './components/JobProfileManagement';
import CompetencyHub from './components/CompetencyHub';
import HierarchyManagement from './components/HierarchyManagement';
import TypeConfiguration from './components/TypeConfiguration';
import { NavigationTab, ExtendedTaxonomyItem, JobRole, JobVariant, SkillCategory, CategoryProficiencyLevel, ProficiencyMapping, Competency, CompetencyProficiencyMapping, CompetencyRelationship, SkillRelationship, TaxonomyNode } from './types';

const DEFAULT_LEVELS: CategoryProficiencyLevel[] = [
  { id: 'l1', name: 'Level 1 – Awareness', description: 'Basic understanding of concepts and terminology.', levelNo: 1, createdDate: 'Jan 01, 2026', lastEditedDate: 'Jan 01, 2026' },
  { id: 'l2', name: 'Level 2 – Knowledge', description: 'Ability to apply skills in simple or routine situations.', levelNo: 2, createdDate: 'Jan 01, 2026', lastEditedDate: 'Jan 01, 2026' },
  { id: 'l3', name: 'Level 3 – Skill', description: 'Proficient in applying skills to complex problems independently.', levelNo: 3, createdDate: 'Jan 01, 2026', lastEditedDate: 'Jan 01, 2026' },
  { id: 'l4', name: 'Level 4 – Mastery', description: 'Expert level knowledge; capable of mentoring and strategic design.', levelNo: 4, createdDate: 'Jan 01, 2026', lastEditedDate: 'Jan 01, 2026' },
];

const INITIAL_TAXONOMY_NODES: TaxonomyNode[] = [
  { id: 'root', name: 'Hierarchy Root', description: 'The root of the skill and competency hierarchy', parentId: null },
  { id: 'node1', name: 'Engineering', description: 'Technical engineering skills', parentId: 'root' },
  { id: 'node2', name: 'Frontend Development', description: 'Web UI skills', parentId: 'node1' },
  { id: 'node3', name: 'Backend Development', description: 'Server-side skills', parentId: 'node1' },
  { id: 'node4', name: 'HR & People', description: 'People management and soft skills', parentId: 'root' },
  { id: 'node5', name: 'Recruitment', description: 'Talent acquisition', parentId: 'node4' },
];

const INITIAL_SKILLS: ExtendedTaxonomyItem[] = [
  { id: 's1', type: 'Skill', name: 'React', description: 'JavaScript library', taxonomyNodeId: 'node2', categoryId: 'cat1' },
  { id: 's2', type: 'Skill', name: 'Node.js', description: 'Runtime environment', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's3', type: 'Skill', name: 'Interviewing', description: 'Skill to hire people', taxonomyNodeId: 'node5', categoryId: 'cat2' },
  { id: 's4', type: 'Skill', name: 'MySQL', description: 'Relational DB', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's5', type: 'Skill', name: 'Python', description: 'General purpose language', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's6', type: 'Skill', name: 'JavaScript', description: 'Programming language', taxonomyNodeId: 'node2', categoryId: 'cat1' },
  { id: 's7', type: 'Skill', name: 'Data Analytics', description: 'Analysing data', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's8', type: 'Skill', name: 'C++', description: 'Systems programming', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's9', type: 'Skill', name: 'Typescript', description: 'Typed JS', taxonomyNodeId: 'node2', categoryId: 'cat1' },
  { id: 's10', type: 'Skill', name: 'Public Speaking', description: 'Communication', taxonomyNodeId: 'node4', categoryId: 'cat3' },
  { id: 's11', type: 'Skill', name: 'Kubernetes', description: 'Orchestration', taxonomyNodeId: 'node3', categoryId: 'cat1' },
  { id: 's12', type: 'Skill', name: 'Market Research', description: 'Analysis', taxonomyNodeId: 'node1', categoryId: 'cat3' },
  { id: 's13', type: 'Skill', name: 'Technical Architecture Design', description: 'System design', taxonomyNodeId: 'node3', categoryId: 'cat1' },
];

const INITIAL_SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'cat1', name: 'Technical Skills', description: 'Core technical and engineering competencies.', createdDate: 'Jan 10, 2026', lastEditedDate: 'Feb 15, 2026', proficiencyLevels: [...DEFAULT_LEVELS] },
  { id: 'cat2', name: 'Management Skills', description: 'Leadership and resource management abilities.', createdDate: 'Jan 12, 2026', lastEditedDate: 'Feb 10, 2026', proficiencyLevels: [...DEFAULT_LEVELS] },
  { id: 'cat3', name: 'Soft Skills', description: 'Interpersonal and communication skills.', createdDate: 'Jan 15, 2026', lastEditedDate: 'Feb 12, 2026', proficiencyLevels: [...DEFAULT_LEVELS] },
];

const INITIAL_JOB_ROLES: JobRole[] = [
  { 
    id: 'jr1', code: '104413', name: 'Lead Performance & Rewards', description: 'Responsible for compensation and benefits.',
    mappedSkills: [
      { skillId: 's13', proficiencyLevel: 'Level 1 – Awareness', criticality: 'Medium' }
    ]
  },
  { 
    id: 'jr2', code: '173398', name: 'Job Role #173398', description: '',
    mappedSkills: [
      { skillId: 's4', proficiencyLevel: 'Level 2 – Knowledge', criticality: 'High' },
      { skillId: 's7', proficiencyLevel: 'Level 3 – Skill', criticality: 'Medium' }
    ]
  },
  { id: 'jr3', code: '58925', name: 'Product Manager', description: 'Directs product strategy.', mappedSkills: [] },
  { id: 'jr4', code: '58908', name: 'Senior Software Development Engineer', description: '', mappedSkills: [] },
  { id: 'jr5', code: '114695', name: 'Client Servicing', description: '', mappedSkills: [] },
  { id: 'jr6', code: '100657', name: 'Director Product Management', description: '', mappedSkills: [] },
  { id: 'jr7', code: '203051', name: 'Software Development Engineer II', description: '', mappedSkills: [] },
  { id: 'jr8', code: '80192', name: 'SMB Team Lead Mid-Market', description: '', mappedSkills: [] },
  { id: 'jr9', code: '58967', name: 'Software Engineer', description: '', mappedSkills: [] },
  { id: 'jr10', code: '160463', name: 'SDWAN NOC Engineer L1 - IOCL', description: '', mappedSkills: [] },
];

const INITIAL_JOB_VARIANTS: JobVariant[] = [
  {
    id: 'jv1',
    name: 'Deep Variant Newly Created 123',
    description: '.,s,ma',
    rolesResponsibilities: 'High level ownership of rewards.',
    parentJobRoleId: 'jr3',
    mappedSkills: [
       { skillId: 's12', proficiencyLevel: 'Level 3 – Skill', criticality: 'High', source: 'VariantSpecific' },
       { skillId: 's7', proficiencyLevel: 'Level 2 – Knowledge', criticality: 'Medium', source: 'Inherited' }
    ],
    lastUpdated: 'Feb 18, 2026, 11:02 AM'
  }
];

const INITIAL_DESCRIPTOR_MAPPINGS: ProficiencyMapping[] = [
  { id: 'm1', skillId: 's4', level: 'Level 2 – Knowledge', description: 'KNOW JOIN intersections' },
  { id: 'm2', skillId: 's1', level: 'Level 3 – Skill', description: 'data exploration' },
  { id: 'm3', skillId: 's5', level: 'Level 4 – Mastery', description: 'master at logic and scripting' },
];

const INITIAL_COMPETENCIES: Competency[] = [
  {
    id: 'comp1',
    title: 'Full Stack Development',
    description: 'Ability to build end-to-end web applications.',
    typeId: 'cat1',
    taxonomyNodeId: 'node2',
    mappedSkills: [
      { skillId: 's1' },
      { skillId: 's2' }
    ],
    createdDate: 'Feb 20, 2026',
    lastEditedDate: 'Feb 20, 2026',
    lastEditedBy: 'System'
  }
];

const INITIAL_COMPETENCY_DESCRIPTORS: CompetencyProficiencyMapping[] = [
  { id: 'cd1', competencyId: 'comp1', level: 'Level 3 – Skill', description: 'Can build complex React applications with Node.js backends.' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('Dashboard');
  const [taxonomyNodes, setTaxonomyNodes] = useState<TaxonomyNode[]>(INITIAL_TAXONOMY_NODES);
  const [skills, setSkills] = useState<ExtendedTaxonomyItem[]>(INITIAL_SKILLS);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>(INITIAL_SKILL_CATEGORIES);
  const [jobRoles, setJobRoles] = useState<JobRole[]>(INITIAL_JOB_ROLES);
  const [jobVariants, setJobVariants] = useState<JobVariant[]>(INITIAL_JOB_VARIANTS);
  const [descriptorMappings, setDescriptorMappings] = useState<ProficiencyMapping[]>(INITIAL_DESCRIPTOR_MAPPINGS);
  const [skillRelationships, setSkillRelationships] = useState<SkillRelationship[]>([]);
  const [competencyDescriptors, setCompetencyDescriptors] = useState<CompetencyProficiencyMapping[]>(INITIAL_COMPETENCY_DESCRIPTORS);
  const [competencyRelationships, setCompetencyRelationships] = useState<CompetencyRelationship[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>(INITIAL_COMPETENCIES);

  // AC20: Automatic inheritance update
  // When jobRoles change, update all jobVariants that inherit from them
  React.useEffect(() => {
    setJobVariants(prevVariants => {
      let changed = false;
      const nextVariants = (prevVariants || []).map(jv => {
        const parentRole = (jobRoles || []).find(jr => jr.id === jv.parentJobRoleId);
        if (!parentRole) return jv;

        // AC18: Variant inherits role competencies
        const parentCompetencies = (parentRole.mappedCompetencies || []).map(mc => ({
          ...mc,
          source: 'Inherited' as const
        }));

        const currentInheritedComps = (jv.mappedCompetencies || []).filter(mc => mc.source === 'Inherited');
        const variantSpecificComps = (jv.mappedCompetencies || []).filter(mc => mc.source === 'VariantSpecific');

        // Check if competencies changed
        const competenciesChanged = JSON.stringify(parentCompetencies.sort((a, b) => a.competencyId.localeCompare(b.competencyId))) !== 
                                   JSON.stringify(currentInheritedComps.sort((a, b) => a.competencyId.localeCompare(b.competencyId)));

        // AC18: Variant inherits role skills
        const inheritedSkills = (parentRole.mappedSkills || []).map(ms => ({
          skillId: ms.skillId,
          proficiencyLevel: ms.proficiencyLevel,
          criticality: ms.criticality,
          source: 'Inherited' as const
        }));

        const variantSpecificSkills = (jv.mappedSkills || []).filter(ms => ms.source === 'VariantSpecific');
        
        const nextMappedSkills = [...inheritedSkills, ...variantSpecificSkills.filter(vs => 
          !inheritedSkills.some(is => is.skillId === vs.skillId)
        )];

        // Check if skills changed
        const skillsChanged = JSON.stringify(jv.mappedSkills || []) !== JSON.stringify(nextMappedSkills);

        if (competenciesChanged || skillsChanged) {
          changed = true;
          return {
            ...jv,
            mappedCompetencies: [...parentCompetencies, ...variantSpecificComps.filter(vc => 
              !parentCompetencies.some(pc => pc.competencyId === vc.competencyId)
            )],
            mappedSkills: nextMappedSkills
          };
        }
        return jv;
      });

      return changed ? nextVariants : prevVariants;
    });
  }, [jobRoles]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'Skills Management':
      case 'Skill-Proficiency descriptors':
        let initialSubTab: any = 'Skills Management';
        if (activeTab === 'Skill-Proficiency descriptors') initialSubTab = 'Skill-Proficiency descriptors';
        
        return (
          <SkillsHierarchyManagement 
            taxonomyNodes={taxonomyNodes}
            skills={skills} setSkills={setSkills}
            skillCategories={skillCategories} setSkillCategories={setSkillCategories}
            descriptorMappings={descriptorMappings} setDescriptorMappings={setDescriptorMappings}
            skillRelationships={skillRelationships} setSkillRelationships={setSkillRelationships}
            jobRoles={jobRoles}
            jobVariants={jobVariants}
            competencies={competencies}
            initialSubTab={initialSubTab}
          />
        );
      case 'Job Profile Management':
      case 'Job Role Mapping':
      case 'Job Variant Mapping':
        let initialJobSubTab: any = 'Job Role Mapping';
        if (activeTab === 'Job Variant Mapping') initialJobSubTab = 'Job Variant Mapping';

        return (
          <JobProfileManagement 
            jobRoles={jobRoles}
            setJobRoles={setJobRoles}
            jobVariants={jobVariants}
            setJobVariants={setJobVariants}
            skills={skills}
            taxonomyNodes={taxonomyNodes}
            skillCategories={skillCategories}
            descriptorMappings={descriptorMappings}
            competencies={competencies}
            initialSubTab={initialJobSubTab}
          />
        );
      case 'Competency Management':
        return (
          <CompetencyHub 
            competencies={competencies}
            setCompetencies={setCompetencies}
            skills={skills}
            taxonomyNodes={taxonomyNodes}
            skillCategories={skillCategories}
            setSkillCategories={setSkillCategories}
            descriptorMappings={descriptorMappings}
            competencyDescriptors={competencyDescriptors}
            setCompetencyDescriptors={setCompetencyDescriptors}
            competencyRelationships={competencyRelationships}
            setCompetencyRelationships={setCompetencyRelationships}
            jobRoles={jobRoles}
            jobVariants={jobVariants}
          />
        );
      case 'Hierarchy Management':
        return (
          <HierarchyManagement 
            taxonomyNodes={taxonomyNodes}
            setTaxonomyNodes={setTaxonomyNodes}
            skills={skills}
            competencies={competencies}
          />
        );
      case 'Type Configuration':
        return (
          <TypeConfiguration 
            skillCategories={skillCategories} setSkillCategories={setSkillCategories}
            skills={skills}
            competencies={competencies}
          />
        );
      default:
        return (
          <div className="p-8 flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{activeTab}</h2>
              <p className="text-gray-500">This section is currently under development.</p>
              <button 
                onClick={() => setActiveTab('Dashboard')}
                className="mt-4 text-blue-700 font-bold hover:underline"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header onNavigate={(tab) => setActiveTab(tab)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
