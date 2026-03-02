export interface StaffProfile {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  seniority: 'Senior' | 'Medior' | 'Lead';
  availability: 'Available' | 'On Assignment' | 'Available from Q2';
  languages: string[];
  yearsExperience: number;
  summary: string;
}

export const profiles: StaffProfile[] = [
  {
    id: 'cr-manager',
    name: 'M. van der Berg',
    role: 'Control Room Manager',
    specialty: ['AutoStore', 'WMS', 'Conveyors'],
    seniority: 'Lead',
    availability: 'Available',
    languages: ['NL', 'EN', 'DE'],
    yearsExperience: 14,
    summary: 'End-to-end control room leadership across mechanised fulfilment centres. Proven in 24/7 operations for tier-1 retailers.',
  },
  {
    id: 'flow-controller',
    name: 'J. Hendriks',
    role: 'Flow Controller',
    specialty: ['Conveyors', 'ASRS', 'Sorters'],
    seniority: 'Senior',
    availability: 'Available',
    languages: ['NL', 'EN'],
    yearsExperience: 9,
    summary: 'Real-time flow optimisation specialist. Manages throughput balancing, divert logic, and jam resolution under peak conditions.',
  },
  {
    id: 'wms-coordinator',
    name: 'S. de Groot',
    role: 'WMS / Automation Coordinator',
    specialty: ['WMS', 'AutoStore', 'Integration'],
    seniority: 'Senior',
    availability: 'On Assignment',
    languages: ['NL', 'EN', 'FR'],
    yearsExperience: 11,
    summary: 'Bridge between warehouse management systems and physical automation. Deep SAP EWM and Blue Yonder expertise.',
  },
  {
    id: 'incident-lead',
    name: 'R. Bakker',
    role: 'Incident Lead',
    specialty: ['Safety', 'Incident Management', 'Conveyors'],
    seniority: 'Medior',
    availability: 'Available',
    languages: ['NL', 'EN'],
    yearsExperience: 6,
    summary: 'ITIL-trained incident commander for warehouse environments. Calm under pressure, structured escalation, minimal mean-time-to-resolve.',
  },
  {
    id: 'perf-analyst',
    name: 'L. Visser',
    role: 'Performance Analyst',
    specialty: ['KPI', 'Reporting', 'WMS'],
    seniority: 'Senior',
    availability: 'Available from Q2',
    languages: ['NL', 'EN', 'DE'],
    yearsExperience: 8,
    summary: 'Operational analytics and KPI design for mechanised warehouses. Builds dashboards that drive shift-level decisions.',
  },
];

export type DomainFilter = 'All' | 'AutoStore' | 'Conveyors' | 'ASRS' | 'WMS' | 'Safety';
export const domainFilters: DomainFilter[] = ['All', 'AutoStore', 'Conveyors', 'ASRS', 'WMS', 'Safety'];
