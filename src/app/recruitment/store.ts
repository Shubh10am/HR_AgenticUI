'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ScreenCandidateOutput } from '@/ai/flows/screen-candidate-flow';

// Roles and candidates live in this browser only. Resume text is never stored, just the AI's
// screening result, so no candidate documents leave the recruiter's machine beyond the AI call.

export const STAGES = ['screened', 'interview', 'offer', 'hired', 'declined'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = { screened: 'Screened', interview: 'Interviewing', offer: 'Offer', hired: 'Hired', declined: 'Declined' };

export interface RoleDetails {
  title: string;
  department: string;
  location: string;
  workMode: 'On-site' | 'Hybrid' | 'Remote';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  level: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Manager';
  mustHaves: string;
  niceToHaves: string;
  salaryRange: string;
  notes: string;
}

export interface Candidate extends ScreenCandidateOutput {
  id: string;
  stage: Stage;
  source: string;
  addedAt: string;
  recruiterNotes: string;
}

export interface Role {
  id: string;
  details: RoleDetails;
  jobDescription: string;
  candidates: Candidate[];
  createdAt: string;
}

export const EMPTY_DETAILS: RoleDetails = {
  title: '', department: '', location: '', workMode: 'Hybrid', employmentType: 'Full-time', level: 'Mid',
  mustHaves: '', niceToHaves: '', salaryRange: '', notes: '',
};

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

/** Open roles and their candidates, saved in this browser per signed-in user. */
export function useRecruitmentStore(userKey: string) {
  const storageKey = `recruitment:${userKey}`;
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      setRoles(saved?.roles ?? []);
      setActiveRoleId(saved?.activeRoleId ?? saved?.roles?.[0]?.id ?? null);
    } catch {
      setRoles([]);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify({ roles, activeRoleId }));
  }, [roles, activeRoleId, loaded, storageKey]);

  const activeRole = roles.find((r) => r.id === activeRoleId) ?? null;

  const updateRole = useCallback((id: string, patch: (role: Role) => Role) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? patch(r) : r)));
  }, []);

  const createRole = useCallback((details: RoleDetails = EMPTY_DETAILS, jobDescription = '') => {
    const role: Role = { id: newId(), details, jobDescription, candidates: [], createdAt: new Date().toISOString() };
    setRoles((prev) => [role, ...prev]);
    setActiveRoleId(role.id);
    return role;
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      setActiveRoleId((current) => (current === id ? next[0]?.id ?? null : current));
      return next;
    });
  }, []);

  const addCandidate = useCallback((roleId: string, result: ScreenCandidateOutput, source: string) => {
    const candidate: Candidate = { ...result, id: newId(), stage: 'screened', source, addedAt: new Date().toISOString(), recruiterNotes: '' };
    updateRole(roleId, (r) => ({ ...r, candidates: [candidate, ...r.candidates] }));
    return candidate;
  }, [updateRole]);

  const updateCandidate = useCallback((roleId: string, candidateId: string, patch: Partial<Candidate>) => {
    updateRole(roleId, (r) => ({ ...r, candidates: r.candidates.map((c) => (c.id === candidateId ? { ...c, ...patch } : c)) }));
  }, [updateRole]);

  const removeCandidate = useCallback((roleId: string, candidateId: string) => {
    updateRole(roleId, (r) => ({ ...r, candidates: r.candidates.filter((c) => c.id !== candidateId) }));
  }, [updateRole]);

  return { loaded, roles, activeRole, setActiveRoleId, createRole, updateRole, deleteRole, addCandidate, updateCandidate, removeCandidate };
}

export type RecruitmentStore = ReturnType<typeof useRecruitmentStore>;

/** Turns the structured role fields into the brief the job-description AI writes from. */
export function roleBrief(d: RoleDetails): string {
  return [
    `Job title: ${d.title}`,
    d.department && `Team: ${d.department}`,
    `Level: ${d.level}`,
    `Employment: ${d.employmentType}, ${d.workMode}${d.location ? ` (${d.location})` : ''}`,
    d.salaryRange && `Salary range: ${d.salaryRange}`,
    d.mustHaves && `Must-have requirements:\n${d.mustHaves}`,
    d.niceToHaves && `Nice to have:\n${d.niceToHaves}`,
    d.notes && `Other notes: ${d.notes}`,
  ].filter(Boolean).join('\n');
}
