
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
  
    // Engineering Department
    const engManagers = [
      { id: '5', ...createEmployee('Engineering Manager'), children: [] as TreeNode[] },
      { id: '6', ...createEmployee('Engineering Manager'), children: [] as TreeNode[] },
    ];
    vps[0].children = engManagers;
  
    for (let i = 0; i < 5; i++) {
      engManagers[0].children.push({ id: `7-${i}`, ...createEmployee('Software Engineer'), children: [] });
    }
    for (let i = 0; i < 4; i++) {
        const role = i < 2 ? 'Frontend Developer' : 'Backend Developer';
        engManagers[1].children.push({ id: `8-${i}`, ...createEmployee(role), children: [] });
    }
     engManagers[1].children.push({ id: `8-4`, ...createEmployee('QA Tester'), children: [] });
  
    // Product Department
    const prodManagers = [
      { id: '9', ...createEmployee('Product Manager'), children: [] as TreeNode[] },
      { id: '10', ...createEmployee('Product Manager'), children: [] as TreeNode[] },
    ];
    vps[1].children = prodManagers;
  
    for (let i = 0; i < 3; i++) {
      prodManagers[0].children.push({ id: `11-${i}`, ...createEmployee('UX/UI Designer'), children: [] });
    }
    for (let i = 0; i < 2; i++) {
        prodManagers[1].children.push({ id: `12-${i}`, ...createEmployee('Data Scientist'), children: [] });
    }
    prodManagers[1].children.push({ id: `12-2`, ...createEmployee('Business Analyst'), children: [] });
  
    // Marketing Department
    const marketingManagers = [
        { id: '13', ...createEmployee('Marketing Director'), children: [] as TreeNode[] }
    ];
    vps[2].children = marketingManagers;
  
    for (let i = 0; i < 3; i++) {
      marketingManagers[0].children.push({ id: `14-${i}`, ...createEmployee('Marketing Specialist'), children: [] });
    }
    marketingManagers[0].children.push({ id: `14-3`, ...createEmployee('Content Writer'), children: [] });
    marketingManagers[0].children.push({ id: `14-4`, ...createEmployee('Graphic Designer'), children: [] });
    
    // Add more employees to reach ~50
    let idCounter = 15;
    const additionalEng = vps[0].children[0] as TreeNode;
    for (let i=0; i<5; i++) {
        additionalEng.children.push({ id: `${idCounter++}`, ...createEmployee('Software Engineer'), children: [] });
    }
    const additionalProd = vps[1].children[0] as TreeNode;
    for (let i=0; i<3; i++) {
        additionalProd.children.push({ id: `${idCounter++}`, ...createEmployee('UX/UI Designer'), children: [] });
    }
     const additionalMkt = vps[2].children[0] as TreeNode;
    for (let i=0; i<4; i++) {
        additionalMkt.children.push({ id: `${idCounter++}`, ...createEmployee('Sales Representative'), children: [] });
    }


    return ceo;
  }
