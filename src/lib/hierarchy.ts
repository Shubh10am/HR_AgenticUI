
export interface TreeNode {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  dataAiHint: string;
  email: string;
  children: TreeNode[];
}

const names = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte',
  'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
  'Henry', 'Evelyn', 'Alexander', 'Harper', 'Michael', 'Camila', 'Ethan', 'Gianna',
  'Daniel', 'Abigail', 'Matthew', 'Luna', 'Aiden', 'Ella', 'David', 'Elizabeth',
  'Joseph', 'Sofia', 'Jackson', 'Emily', 'Samuel', 'Avery', 'Sebastian', 'Mila',
  'Carter', 'Scarlett', 'Jayden', 'Eleanor', 'Luke', 'Madison', 'Gabriel', 'Layla',
  'John', 'Penelope', 'Julian', 'Aria'
];

const surnames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez'
];

const roles = [
  'Software Engineer', 'Product Manager', 'UX/UI Designer', 'Data Scientist',
  'DevOps Engineer', 'QA Tester', 'Marketing Specialist', 'Sales Representative',
  'HR Coordinator', 'Recruiter', 'Content Writer', 'Graphic Designer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Business Analyst', 'Scrum Master', 'IT Support', 'Financial Analyst', 'Accountant'
];

let nameIndex = 0;
function getUniqueName() {
  const name = names[nameIndex % names.length];
  const surname = surnames[Math.floor(nameIndex / names.length) % surnames.length];
  nameIndex++;
  return `${name} ${surname}`;
}

let usedAvatars: Set<string> = new Set();
function getUniqueAvatar() {
    let gender: 'men' | 'women';
    let index: number;
    let url: string;
    
    do {
        gender = Math.random() > 0.5 ? 'men' : 'women';
        index = Math.floor(Math.random() * 100);
        url = `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
    } while (usedAvatars.has(url));
    
    usedAvatars.add(url);
    return url;
}

function createEmployee(role: string): Omit<TreeNode, 'children' | 'id'> {
  const name = getUniqueName();
  return {
    name,
    role,
    email: `${name.toLowerCase().replace(' ', '.')}@examplecorp.com`,
    avatarUrl: getUniqueAvatar(),
    dataAiHint: 'person face'
  };
}

export function generateMockHierarchy(): TreeNode {
    nameIndex = 0;
    usedAvatars = new Set();
  
    const ceo = { id: '1', ...createEmployee('CEO'), children: [] as TreeNode[] };
  
    const vps = [
      { id: '2', ...createEmployee('VP of Engineering'), children: [] as TreeNode[] },
      { id: '3', ...createEmployee('VP of Product'), children: [] as TreeNode[] },
      { id: '4', ...createEmployee('VP of Marketing'), children: [] as TreeNode[] },
    ];
  
    ceo.children = vps;
  
    // Engineering Department (3 people)
    const engManager = { id: '5', ...createEmployee('Engineering Manager'), children: [] as TreeNode[] };
    vps[0].children = [engManager];
    engManager.children.push({ id: `7-0`, ...createEmployee('Software Engineer'), children: [] });
    engManager.children.push({ id: `7-1`, ...createEmployee('Software Engineer'), children: [] });
  
    // Product Department (2 people)
    const prodManager = { id: '9', ...createEmployee('Product Manager'), children: [] as TreeNode[] };
    vps[1].children = [prodManager];
    prodManager.children.push({ id: `11-0`, ...createEmployee('UX/UI Designer'), children: [] });
  
    // Marketing Department (1 person)
    vps[2].children = [{ id: `13-0`, ...createEmployee('Marketing Specialist'), children: [] }];
    
    return ceo;
  }
