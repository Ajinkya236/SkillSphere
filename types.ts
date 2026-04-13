
export type NavigationTab = 
  | 'Dashboard' 
  | 'Skills'
  | 'Job Profiles'
  | 'Skill Types'
  | 'Skill Groups'
  | 'Skill-Proficiency descriptors' 
  | 'Skill Relationships' 
  | 'Job Role Mapping' 
  | 'Job Variant Mapping'
  | 'Competencies';

export interface TaxonomyItem {
  id: string;
  type: 'Cluster' | 'Group' | 'Skill' | 'Competency';
  name: string;
  description: string;
}

export interface ExtendedTaxonomyItem extends TaxonomyItem {
  taxonomyNodeId?: string; // Link to TaxonomyNode
  categoryId?: string; // Link to SkillCategory
}

export interface TaxonomyNode {
  id: string;
  name: string;
  description: string;
  parentId: string | null; // null means child of root
}

export interface CategoryProficiencyLevel {
  id: string;
  name: string;
  description: string;
  levelNo: number;
  createdDate: string;
  lastEditedDate: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  lastEditedDate: string;
  proficiencyLevels: CategoryProficiencyLevel[];
}

export interface ProficiencyMapping {
  id: string;
  skillId: string;
  level: string;
  description: string;
}

export interface CompetencyProficiencyMapping {
  id: string;
  competencyId: string;
  level: string;
  description: string;
}

export interface CompetencyRelationship {
  id: string;
  competencyId1: string;
  competencyId2: string;
}

export interface SkillRelationship {
  id: string;
  skillId1: string;
  skillId2: string;
}

export interface JobRoleSkillMapping {
  skillId: string;
  proficiencyLevel: string;
  criticality: 'High' | 'Medium' | 'Low';
}

export interface JobRoleCompetencyMapping {
  competencyId: string;
  aggregatedLevel: number;
  desiredLevel: string;
}

export interface JobRole {
  id: string;
  code: string;
  name: string;
  description: string;
  mappedSkills: JobRoleSkillMapping[];
  mappedCompetencies?: JobRoleCompetencyMapping[];
}

export interface JobVariantSkillMapping {
  skillId: string;
  proficiencyLevel: string;
  criticality: 'High' | 'Medium' | 'Low';
  source: 'Inherited' | 'VariantSpecific';
}

export interface JobVariantCompetencyMapping {
  competencyId: string;
  aggregatedLevel: number;
  desiredLevel: string;
  source: 'Inherited' | 'VariantSpecific';
}

export interface JobVariant {
  id: string;
  name: string;
  description: string;
  rolesResponsibilities: string;
  parentJobRoleId: string;
  mappedSkills: JobVariantSkillMapping[];
  mappedCompetencies?: JobVariantCompetencyMapping[];
  lastUpdated: string;
}

export interface SummaryStat {
  label: string;
  count: number;
}

export interface CompetencySkillMapping {
  skillId: string;
  proficiencyLevel?: string;
  descriptor?: string;
  criticality?: 'High' | 'Medium' | 'Low';
}

export interface Competency {
  id: string;
  title: string;
  description: string;
  typeId: string; // Link to SkillCategory
  taxonomyNodeId?: string;
  mappedSkills: CompetencySkillMapping[];
  createdDate: string;
  lastEditedDate: string;
  lastEditedBy: string;
}
