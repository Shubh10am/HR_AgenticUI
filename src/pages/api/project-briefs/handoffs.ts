import mongoose from 'mongoose';
import { z } from 'zod';
import Employee from '@/models/Employee';
import { withAuth } from '@/lib/withAuth';
import { projectSchema } from '@/services/project-briefs/schema';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const inputSchema = z.object({
  projectId: objectId,
  sourceIndex: z.number().int().min(0),
  sourceUrl: z.string(),
  assigneeId: objectId,
  dueDate: z.string().date(),
  notes: z.string().trim().min(1).max(3000),
});

export default withAuth(async (req, res) => {
  const { organizationId, id } = req.user;
  if (!organizationId) return res.status(403).json({ error: 'An organization is required.' });
  const handoffs = mongoose.connection.collection('project_handoffs');
  try {
    if (req.method === 'GET') {
      const [employees, tasks] = await Promise.all([
        Employee.find({ organizationId }).select('name').sort({ name: 1 }).lean(),
        handoffs.find({ organizationId, $or: [{ createdBy: id }, { assigneeId: id }] }).sort({ _id: -1 }).limit(50).toArray(),
      ]);
      return res.json({ employees: employees.map((employee) => ({ id: String(employee._id), name: employee.name })), tasks });
    }
    if (req.method === 'POST') {
      const result = inputSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: 'Choose an assignee and due date, and review the draft.' });
      const input = result.data;
      const [row, assignee] = await Promise.all([
        mongoose.connection.collection('project_briefs').findOne({ organizationId, employeeId: id, _id: new mongoose.Types.ObjectId(input.projectId) }),
        Employee.findOne({ organizationId, _id: input.assigneeId }).select('name').lean(),
      ]);
      if (!row || !assignee) return res.status(404).json({ error: 'Project or assignee not found.' });
      const project = projectSchema.parse(row);
      const source = project.evidence[input.sourceIndex];
      if (!source || source.url !== input.sourceUrl) return res.status(409).json({ error: 'The source changed. Reopen the project before assigning this task.' });
      const task = {
        organizationId, createdBy: id, assigneeId: input.assigneeId, assigneeName: assignee.name,
        department: project.department, projectName: project.name, title: source.title,
        sourceUrl: source.url, dueDate: input.dueDate, notes: input.notes, status: 'Open',
      };
      const saved = await handoffs.insertOne(task);
      return res.status(201).json({ ...task, _id: String(saved.insertedId) });
    }
    if (req.method === 'PATCH') {
      const input = z.object({ id: objectId, status: z.enum(['Open', 'Done']) }).safeParse(req.body);
      if (!input.success) return res.status(400).json({ error: 'Invalid handoff update.' });
      const result = await handoffs.updateOne(
        { organizationId, _id: new mongoose.Types.ObjectId(input.data.id), $or: [{ createdBy: id }, { assigneeId: id }] },
        { $set: { status: input.data.status } },
      );
      if (!result.matchedCount) return res.status(404).json({ error: 'Handoff not found.' });
      return res.json({ status: input.data.status });
    }
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch {
    return res.status(500).json({ error: 'Could not complete the handoff request.' });
  }
});
