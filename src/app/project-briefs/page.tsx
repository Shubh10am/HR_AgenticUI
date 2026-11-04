'use client';

import { useEffect, useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { isGuestToken } from '@/lib/guest-demo';
import { evidenceSchema, providerIds, type Evidence } from '@/services/connectors/contracts';
import { launchEvidence } from '@/services/connectors/providers/sample';
import { departments, groupEvidence, type ProjectBrief, type SavedBrief } from '@/services/project-briefs/schema';

import { departmentViews } from '@/services/project-briefs/department-views';

type Person = { id: string; name: string };
type Handoff = { _id: string; title: string; projectName: string; department: ProjectBrief['department']; assigneeName: string; dueDate: string; notes: string; sourceUrl: string; status: 'Open' | 'Done' };

type Answer = { findings: { text: string; sources: number[] }[]; gaps: string[] };
const sample: ProjectBrief = { name: 'Onboarding launch', department: 'Cross-team', evidence: launchEvidence };
const empty: ProjectBrief = { name: '', department: 'Cross-team', evidence: [] };
const selectStyle = 'h-10 rounded-md border bg-background px-3 text-sm';

export default function ProjectBriefsPage() {
  const { token } = useAuth();
  const guest = isGuestToken(token);
  const [projects, setProjects] = useState<SavedBrief[]>([]);
  const [project, setProject] = useState<ProjectBrief | SavedBrief>(sample);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState('');
  const [editing, setEditing] = useState(false);
  const [departmentView, setDepartmentView] = useState<ProjectBrief['department'] | 'All'>('All');
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Handoff[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const saved = 'id' in project;
  const sampleOpen = project === sample;

  useEffect(() => {
    if (!token || guest) return;
    const controller = new AbortController();
    fetch('/api/project-briefs', { headers: { Authorization: 'Bearer ' + token }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setProjects(await response.json());
      })
      .catch(() => { if (!controller.signal.aborted) setMessage('Could not load saved projects.'); });
    fetch('/api/project-briefs/handoffs', { headers: { Authorization: 'Bearer ' + token }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setPeople(data.employees);
        setTasks(data.tasks);
      })
      .catch(() => { if (!controller.signal.aborted) setMessage('Could not load handoffs.'); });
    return () => controller.abort();
  }, [token, guest]);

  function open(next: ProjectBrief | SavedBrief) {
    setProject(next);
    setEditing(next === empty);
    setAnswer(null);
    setHandoff('');
    setAssigneeId('');
    setDueDate('');
    setMessage('');
  }

  async function submit(method: 'POST' | 'PUT' | 'PATCH') {
    if (!token || guest || busy) return;
    setBusy(true);
    setMessage('');
    if (method === 'PATCH') setAnswer(null);
    try {
      const response = await fetch('/api/project-briefs', {
        method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(method !== 'PATCH' ? project : { projectId: saved ? project.id : '', question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed.');
      if (method !== 'PATCH') {
        setProjects((current) => [data, ...current.filter((entry) => entry.id !== data.id)]);
        open(data);
      } else {
        setAnswer(data);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = evidenceSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      setMessage(result.error.issues[0].message);
      return;
    }
    setProject({ ...project, evidence: [...project.evidence, result.data] });
    setMessage('');
    event.currentTarget.reset();
  }

  async function updateHandoff(method: 'POST' | 'PATCH', body: object) {
    if (!token || guest || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/project-briefs/handoffs', {
        method,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save handoff.');
      if (method === 'POST') {
        setTasks((current) => [data, ...current]);
        setHandoff('');
        setMessage('Handoff assigned.');
      } else if ('id' in body) {
        setTasks((current) => current.map((task) => task._id === body.id ? { ...task, status: data.status } : task));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save handoff.');
    } finally {
      setBusy(false);
    }
  }

  function prepareHandoff(item: Evidence, index: number) {
    setSourceIndex(index);
    setAssigneeId('');
    setDueDate('');
    setHandoff(['Handoff: ' + item.title, 'Owner: ' + (item.owner || 'To assign'), item.detail, 'Source: ' + item.url].join('\n'));
  }

  return (
    <>
      <PageHeader title="Project Briefs" description="Bring work items, code changes, and team decisions into one view." />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className={selectStyle} aria-label="Department view" value={departmentView} disabled={busy} onChange={(event) => {
          const next = event.target.value as typeof departmentView;
          setDepartmentView(next);
          setQuestion(next === 'All' ? '' : departmentViews[next].question);
          open(projects.find((entry) => entry.department === next) ?? sample);
        }}>
          <option value="All">All departments</option>
          {departments.map((department) => <option key={department}>{department}</option>)}
        </select>
        {departmentView !== 'All' && <p className="self-center text-sm text-muted-foreground">{departmentViews[departmentView].focus}</p>}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => open(sample)}>Sample launch</Button>
        <Button disabled={busy || guest || !token} onClick={() => { open(empty); if (departmentView !== 'All') setProject({ ...empty, department: departmentView }); }}>New project</Button>
        <select className={selectStyle} aria-label="Saved projects" disabled={busy} value={saved ? project.id : ''} onChange={(event) => open(projects.find((entry) => entry.id === event.target.value) ?? sample)}>
          <option value="">Saved projects</option>
          {projects.filter((entry) => departmentView === 'All' || entry.department === departmentView || (saved && entry.id === project.id)).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </div>

      {message && <p role="status" className="mb-4 text-sm text-destructive">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="space-y-5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{project.department}</p>
            <h2 className="mt-1 text-2xl font-semibold">{project.name || 'Untitled project'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {sampleOpen ? 'Sample data showing how a ticket, pull request, and discussion fit together.' : 'Private to you. Add source excerpts you can share with your workspace AI provider.'}
            </p>
          </div>
          {saved && !editing && <Button variant="outline" disabled={busy} onClick={() => { setEditing(true); setAnswer(null); setHandoff(''); }}>Edit project</Button>}
          {editing && (
            <fieldset disabled={busy} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Input className="max-w-xs" aria-label="Project name" placeholder="Project name" maxLength={120} value={project.name} onChange={(event) => setProject({ ...project, name: event.target.value })} />
                <select aria-label="Department" className={selectStyle} value={project.department} onChange={(event) => setProject({ ...project, department: event.target.value as ProjectBrief['department'] })}>
                  {departments.map((department) => <option key={department}>{department}</option>)}
                </select>
              </div>
              <form onSubmit={addSource} className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                <h3 className="font-semibold sm:col-span-2">Add source evidence</h3>
                <select name="provider" aria-label="Source provider" className={selectStyle}>{providerIds.map((provider) => <option key={provider}>{provider}</option>)}</select>
                <select name="kind" aria-label="Record type" className={selectStyle}>{evidenceSchema.shape.kind.options.map((kind) => <option key={kind}>{kind}</option>)}</select>
                <Input name="title" aria-label="Source title" placeholder="Source title" maxLength={160} required />
                <Input name="url" aria-label="Source link" placeholder="https://…" type="url" required />
                <Input name="reference" aria-label="Shared reference" placeholder="Shared reference (e.g. LAUNCH-42)" maxLength={80} />
                <Input name="owner" aria-label="Owner" placeholder="Owner or team" maxLength={100} />
                <select name="status" aria-label="Record status" className={selectStyle}>{evidenceSchema.shape.status.options.map((status) => <option key={status}>{status}</option>)}</select>
                <Textarea name="detail" aria-label="Source excerpt" placeholder="Relevant excerpt or update" maxLength={2000} className="sm:col-span-2" required />
                <Button type="submit" variant="outline" disabled={project.evidence.length >= 30}>Add evidence</Button>
              </form>
              <Button disabled={!project.name.trim() || !project.evidence.length || busy} onClick={() => void submit(saved ? 'PUT' : 'POST')}>Save project</Button>
            </fieldset>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">Evidence</h3>
            {project.evidence.map((item, index) => (
              <article key={index} className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">{item.provider} · {item.kind} · {item.status}</p>
                <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">{index + 1}. {item.title}</a>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{[item.owner, item.reference].filter(Boolean).join(' · ')}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => prepareHandoff(item, index)}>Draft handoff</Button>
                  {editing && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setProject({ ...project, evidence: project.evidence.filter((_, position) => position !== index) })}>Remove</Button>}
                </div>
              </article>
            ))}
          </div>
          {groupEvidence(project.evidence).map(([reference, indexes]) => (
            <p key={reference} className="rounded-md bg-muted p-3 text-sm">{reference} links evidence {indexes.map((index) => index + 1).join(', ')}.</p>
          ))}
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Ask about this project</h3>
            {sampleOpen ? (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Sample brief · Are we ready to launch?</p>
                <p>The onboarding fix merged [2], but production verification is blocked [1]. Marketing is holding the announcement [3].</p>
                <p className="text-muted-foreground">Still unknown: the production release window.</p>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void submit('PATCH'); }}>
                <Textarea aria-label="Project question" placeholder="What’s blocked and who owns the next step?" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} />
                <Button type="submit" disabled={!saved || editing || !question.trim() || busy}>Ask Copilot</Button>
                {(!saved || editing) && <p className="text-xs text-muted-foreground">Save the project to ask Copilot.</p>}
              </form>
            )}
            {answer && <div className="space-y-3 text-sm">
              {answer.findings.map((finding, index) => <p key={index}>{finding.text} {finding.sources.map((source) => <a key={source} href={project.evidence[source].url} target="_blank" rel="noreferrer" className="ml-1 text-primary underline">[{source + 1}]</a>)}</p>)}
              {!answer.findings.length && <p>No supported findings.</p>}
              {answer.gaps.map((gap, index) => <p key={index} className="text-muted-foreground">{gap}</p>)}
            </div>}
          </Card>
          {!guest && <Card className="space-y-3 p-5">
            <h3 className="font-semibold">Handoff queue</h3>
            {tasks.filter((task) => departmentView === 'All' || task.department === departmentView).map((task) => (
              <article key={task._id} className="space-y-2 rounded-md border p-3 text-sm">
                <p className="font-medium">{task.title}</p>
                <p className="text-muted-foreground">{task.projectName} · {task.assigneeName} · Due {task.dueDate}</p>
                <p className="whitespace-pre-wrap break-words">{task.notes}</p>
                <a href={task.sourceUrl} target="_blank" rel="noreferrer" className="mr-3 text-primary underline">Source</a>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void updateHandoff('PATCH', { id: task._id, status: task.status === 'Done' ? 'Open' : 'Done' })}>
                  {task.status === 'Done' ? 'Reopen' : 'Mark done'}
                </Button>
              </article>
            ))}
            {!tasks.some((task) => departmentView === 'All' || task.department === departmentView) && <p className="text-sm text-muted-foreground">No handoffs in this view.</p>}
          </Card>}
          {handoff && <Card className="space-y-3 p-5">
            <h3 className="font-semibold">Review handoff draft</h3>
            <Textarea aria-label="Handoff draft" rows={8} value={handoff} onChange={(event) => setHandoff(event.target.value)} />
            {saved && !editing && <div className="grid gap-3">
              <p className="text-xs text-muted-foreground">Your teammate will see the draft and source link in their handoff queue.</p>
              <select aria-label="Assign to" className={selectStyle} value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                <option value="">Choose a teammate</option>
                {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
              <Input type="date" aria-label="Due date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              <Button disabled={busy || !assigneeId || !dueDate || !handoff.trim()} onClick={() => void updateHandoff('POST', {
                projectId: project.id, sourceIndex, sourceUrl: project.evidence[sourceIndex]?.url, assigneeId, dueDate, notes: handoff,
              })}>Confirm and assign</Button>
            </div>}
            <Button variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(handoff);
                setMessage('Handoff copied.');
              } catch {
                setMessage('Clipboard unavailable. Select and copy the draft.');
              }
            }}>Copy draft</Button>
          </Card>}
        </div>
      </div>
    </>
  );
}
