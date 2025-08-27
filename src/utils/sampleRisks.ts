import { RiskItem } from '../components/RiskAssessment'

export const sampleRisks: RiskItem[] = [
  {
    id: 'sample-1',
    name: 'Technology Platform Risk',
    description: 'The chosen technology platform may not scale adequately for future growth requirements',
    category: 'technical',
    probability: 3,
    impact: 4,
    currentMitigation: 'Conducting proof-of-concept tests with expected load scenarios',
    proposedActions: ['Implement comprehensive load testing', 'Develop scalability roadmap', 'Consider alternative platforms'],
    owner: 'Technical Team Lead',
    dueDate: '2024-03-15',
    status: 'open'
  },
  {
    id: 'sample-2',
    name: 'Budget Overrun Risk',
    description: 'Project costs may exceed allocated budget due to scope creep and unforeseen technical challenges',
    category: 'financial',
    probability: 4,
    impact: 4,
    currentMitigation: 'Monthly budget reviews and change control process in place',
    proposedActions: ['Implement stricter change control', 'Add 20% contingency buffer', 'Weekly cost tracking'],
    owner: 'Project Manager',
    dueDate: '2024-02-28',
    status: 'in-progress'
  },
  {
    id: 'sample-3',
    name: 'Data Privacy Compliance',
    description: 'Potential non-compliance with GDPR and other data protection regulations',
    category: 'compliance',
    probability: 2,
    impact: 5,
    currentMitigation: 'Legal review of data handling procedures conducted',
    proposedActions: ['Data Protection Impact Assessment', 'Privacy-by-design implementation', 'Staff training'],
    owner: 'Legal Team',
    dueDate: '2024-02-15',
    status: 'closed'
  },
  {
    id: 'sample-4',
    name: 'User Adoption Risk',
    description: 'End users may resist adopting the new system due to change management challenges',
    category: 'operational',
    probability: 3,
    impact: 3,
    currentMitigation: 'User research and prototype testing with key stakeholders',
    proposedActions: ['Comprehensive training program', 'Change management strategy', 'User feedback loops'],
    owner: 'Business Analyst',
    dueDate: '2024-04-01',
    status: 'open'
  },
  {
    id: 'sample-5',
    name: 'Integration Complexity',
    description: 'Complex integration requirements with legacy systems may cause delays and technical issues',
    category: 'technical',
    probability: 4,
    impact: 3,
    currentMitigation: 'Technical discovery sessions with legacy system owners',
    proposedActions: ['API documentation review', 'Integration testing framework', 'Fallback options'],
    owner: 'Integration Architect',
    dueDate: '2024-03-01',
    status: 'in-progress'
  }
]