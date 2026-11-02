/** One person on the org chart, as the API returns them. */
export interface OrgPerson {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  jobTitle: string;
  managerId: string | null;
}

export interface TreeNode extends OrgPerson {
  children: TreeNode[];
  /** Everyone below this person, at any depth. */
  totalReports: number;
}

export interface OrgStats {
  people: number;
  managers: number;
  levels: number;
  /** People with no manager and no reports — not yet placed on the chart. */
  unplaced: number;
}

/** What to show under a person's name: their job title, else department and access role. */
export const subtitleOf = (person: OrgPerson) =>
  person.jobTitle || [person.department, person.role].filter(Boolean).join(' · ');

/**
 * Builds the reporting trees. Anyone whose manager is missing (left the organization) or
 * whose chain loops back on itself is treated as a top-level person, so nobody disappears.
 */
export function buildForest(people: OrgPerson[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(people.map((person) => [person.id, { ...person, children: [], totalReports: 0 }]));
  const reachesSelf = (start: string) => {
    let cursor = nodes.get(start)?.managerId ?? null;
    for (let hops = 0; cursor && hops <= people.length; hops++) {
      if (cursor === start) return true;
      cursor = nodes.get(cursor)?.managerId ?? null;
    }
    return false;
  };

  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const manager = node.managerId ? nodes.get(node.managerId) : undefined;
    if (manager && !reachesSelf(node.id)) manager.children.push(node);
    else roots.push(node);
  }

  const finish = (node: TreeNode): number => {
    node.children.sort((a, b) => b.children.length - a.children.length || a.name.localeCompare(b.name));
    node.totalReports = node.children.reduce((total, child) => total + 1 + finish(child), 0);
    return node.totalReports;
  };
  roots.forEach(finish);
  // Biggest teams first; people not yet placed go last.
  return roots.sort((a, b) => b.totalReports - a.totalReports || a.name.localeCompare(b.name));
}

export function collectStats(forest: TreeNode[]): OrgStats {
  const stats: OrgStats = { people: 0, managers: 0, levels: 0, unplaced: 0 };
  const walk = (node: TreeNode, depth: number) => {
    stats.people += 1;
    if (node.children.length > 0) stats.managers += 1;
    stats.levels = Math.max(stats.levels, depth);
    node.children.forEach((child) => walk(child, depth + 1));
  };
  for (const root of forest) {
    if (root.children.length === 0) stats.unplaced += 1;
    walk(root, 1);
  }
  return stats;
}

/** Ids of the people whose name, email, title, department or role contains the search. */
export function matchingIds(people: OrgPerson[], query: string): Set<string> {
  const needle = query.trim().toLowerCase();
  return new Set(
    people
      .filter((person) => [person.name, person.email, person.jobTitle, person.department, person.role].join(' ').toLowerCase().includes(needle))
      .map((person) => person.id)
  );
}

/** The given people and everyone above them, so their branches can be kept open. */
export function ancestorsOf(people: OrgPerson[], from: OrgPerson[]): Set<string> {
  const byId = new Map(people.map((person) => [person.id, person]));
  const result = new Set<string>();
  for (const person of from) {
    for (let cursor: string | null = person.id, hops = 0; cursor && hops <= people.length; hops++) {
      result.add(cursor);
      cursor = byId.get(cursor)?.managerId ?? null;
    }
  }
  return result;
}

/** Everyone below a person, so the "reports to" picker can leave them out (choosing one would loop). */
export function descendantsOf(people: OrgPerson[], id: string): Set<string> {
  const result = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const person of people) {
      if (person.managerId === current && !result.has(person.id)) {
        result.add(person.id);
        queue.push(person.id);
      }
    }
  }
  return result;
}

const DEMO: [id: string, name: string, jobTitle: string, department: string, role: string, managerId: string | null][] = [
  ['d1', 'Liam Carter', 'Chief Executive Officer', 'Leadership', 'Admin', null],
  ['d2', 'Olivia Bennett', 'VP of Engineering', 'Engineering', 'Manager', 'd1'],
  ['d3', 'Noah Patel', 'VP of Product', 'Product', 'Manager', 'd1'],
  ['d4', 'Emma Rossi', 'Head of People', 'Human Resources', 'HR', 'd1'],
  ['d5', 'Oliver Kim', 'Engineering Manager', 'Engineering', 'Manager', 'd2'],
  ['d6', 'Ava Thompson', 'Senior Software Engineer', 'Engineering', 'Employee', 'd5'],
  ['d7', 'Elijah Nwosu', 'Software Engineer', 'Engineering', 'Employee', 'd5'],
  ['d8', 'Mia Fernandes', 'QA Engineer', 'Engineering', 'Employee', 'd5'],
  ['d9', 'Charlotte Ng', 'Product Manager', 'Product', 'Manager', 'd3'],
  ['d10', 'William Osei', 'Product Designer', 'Product', 'Employee', 'd9'],
  ['d11', 'Sophia Haddad', 'Talent Partner', 'Human Resources', 'HR', 'd4'],
  ['d12', 'James Okafor', 'People Operations Specialist', 'Human Resources', 'Employee', 'd4'],
  ['d13', 'Isla Moreau', 'Data Analyst', 'Product', 'Employee', null],
];

/** A small fictional company, so guests can see how the chart works. */
export function demoOrgPeople(): OrgPerson[] {
  return DEMO.map(([id, name, jobTitle, department, role, managerId]) => ({
    id,
    name,
    jobTitle,
    department,
    role,
    managerId,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  }));
}
