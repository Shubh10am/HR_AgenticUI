
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee, { type EmployeeRole } from '@/models/Employee';
import Organization from '@/models/Organization';
import bcrypt from 'bcryptjs';
import { signToken, type JwtPayload } from '@/lib/jwt';

type LoginRequestBody = {
  email: string;
  password: string;
};

type ResponseData = {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: JwtPayload['role'];
    organizationId: string;
  };
};

// Define dummy credentials and organization details
const DUMMY_ADMIN_EMAIL = 'testadmin@example.com';
const DUMMY_ADMIN_PASSWORD = 'password123';
const DUMMY_ADMIN_NAME = 'Test Admin User';
const DUMMY_ORG_NAME = 'TestCorp';
const DUMMY_ORG_DOMAIN = 'example.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  let { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  email = email.toLowerCase();

  try {
    let employee = await Employee.findOne({ email }).populate('organizationId', 'name emailDomain');

    // Handle dummy user creation if logging in with dummy credentials and user doesn't exist
    if (!employee && email === DUMMY_ADMIN_EMAIL) {
      // Find or create the dummy organization
      let organization = await Organization.findOne({ emailDomain: DUMMY_ORG_DOMAIN });
      if (!organization) {
        organization = new Organization({
          name: DUMMY_ORG_NAME,
          emailDomain: DUMMY_ORG_DOMAIN,
        });
        await organization.save();
      }

      // Create the dummy admin employee
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(DUMMY_ADMIN_PASSWORD, salt);

      const newDummyEmployee = new Employee({
        name: DUMMY_ADMIN_NAME,
        email: DUMMY_ADMIN_EMAIL,
        passwordHash,
        role: 'Admin' as EmployeeRole,
        organizationId: organization._id,
      });
      await newDummyEmployee.save();
      
      // Re-fetch the newly created employee to populate organizationId correctly for the response
      employee = await Employee.findById(newDummyEmployee._id).populate('organizationId', 'name emailDomain');
      // Since this is a new user, the provided password is the one to use for login
      password = DUMMY_ADMIN_PASSWORD; 
    }
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Ensure organizationId is populated and is an object with _id
    if (!employee.organizationId || typeof employee.organizationId !== 'object' || !('_id' in employee.organizationId)) {
        // Attempt to re-fetch employee with populated organization if somehow it wasn't populated
        const populatedEmployee = await Employee.findById(employee._id).populate('organizationId', 'name emailDomain');
        if (!populatedEmployee || !populatedEmployee.organizationId || typeof populatedEmployee.organizationId !== 'object' || !('_id' in populatedEmployee.organizationId)) {
            console.error('Organization ID missing or not populated for employee:', employee._id);
            return res.status(500).json({ error: 'Internal server error: Organization details missing.' });
        }
        employee.organizationId = populatedEmployee.organizationId;
    }


    const tokenPayload: JwtPayload = {
      employeeId: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      organizationId: (employee.organizationId as any)._id.toString(),
      name: employee.name,
    };

    const token = signToken(tokenPayload);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        organizationId: (employee.organizationId as any)._id.toString(),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
