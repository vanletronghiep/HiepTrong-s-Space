'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Code,
  Plus,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/client/queries/projects';
import type { ProjectItem, ProjectStatus } from '@/contracts/project';
import { computeProjectStats } from '@/domain/project-domain';
import { Button } from '@/ui/Button';
import styles from './projects.module.css';

export function ProjectsView() {
  const { data: projects = [], isLoading } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [activeFilter, setActiveFilter] = useState<'all' | ProjectStatus>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setIsCreateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stats = useMemo(() => computeProjectStats(projects), [projects]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => p.status === activeFilter);
  }, [projects, activeFilter]);

  // Form state for creating a project
  const [newTitle, setNewTitle] = useState('');
  const [newOverview, setNewOverview] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('active');
  const [newProgress, setNewProgress] = useState(0);
  const [newNextStep, setNewNextStep] = useState('');
  const [newBlockers, setNewBlockers] = useState('');
  const [newTechStack, setNewTechStack] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createMutation.mutate(
      {
        title: newTitle.trim(),
        overview: newOverview.trim(),
        status: newStatus,
        progressPercent: Number(newProgress),
        deadlineAt: null,
        nextStep: newNextStep.trim() || null,
        blockers: newBlockers.trim() || null,
        techStack: newTechStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        linkedTaskIds: [],
        linkedMilestoneIds: [],
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewTitle('');
          setNewOverview('');
          setNewProgress(0);
          setNewNextStep('');
          setNewBlockers('');
          setNewTechStack('');
        },
      },
    );
  };

  const handleProgressChange = (project: ProjectItem, delta: number) => {
    const nextProgress = Math.max(0, Math.min(100, project.progressPercent + delta));
    const nextStatus = nextProgress === 100 ? 'completed' : project.status === 'completed' ? 'in_progress' : project.status;
    updateMutation.mutate({
      id: project.id,
      patch: {
        progressPercent: nextProgress,
        status: nextStatus,
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.techGlow} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>
            <Code size={16} />
            <span>Engineering & Creations</span>
          </div>
          <h1 className={styles.title}>In Progress Projects</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-ws-accent hover:bg-ws-accent-hover text-white"
        >
          <Plus size={16} className="mr-1" />
          <span>New project</span>
        </Button>
      </header>

      {/* Overview Statistics */}
      <section className={styles.statsGrid} aria-label="Project statistics">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--daily-sky)' }}>
            {stats.activeCount}
          </span>
          <span className={styles.statLabel}>Active development</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--status-done)' }}>
            {stats.completedCount}
          </span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.averageProgress}%</span>
          <span className={styles.statLabel}>Average progress</span>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className={styles.controlsBar}>
        <div className={styles.filterTabs} role="tablist" aria-label="Project status filter">
          {(['all', 'active', 'in_progress', 'completed'] as const).map((st) => (
            <button
              key={st}
              role="tab"
              aria-selected={activeFilter === st}
              className={`${styles.filterTab} ${activeFilter === st ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(st)}
            >
              {st === 'all'
                ? 'All'
                : st === 'active'
                  ? 'Active'
                  : st === 'in_progress'
                    ? 'In progress'
                    : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-ws-text-muted">Loading projects…</div>
      ) : (
        <div className={styles.projectsGrid}>
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-ws-text-muted">
              No projects found in this view.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <article key={project.id} className={styles.projectCard}>
                <div className={styles.projectCardTop}>
                  <div className={styles.cardHeaderRow}>
                    <h2 className={styles.cardTitle}>{project.title}</h2>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`statusBadge_${project.status}` as keyof typeof styles] ?? ''
                      }`}
                    >
                      {project.status === 'completed' && <CheckCircle2 size={12} />}
                      <span>{project.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <p className={styles.cardOverview}>{project.overview}</p>

                  {/* Progress Bar & Controls */}
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span className="text-ws-text-muted">Manual progress</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleProgressChange(project, -5)}
                          className="px-1.5 py-0.5 rounded text-xs bg-ws-bg-alt hover:bg-ws-border text-ws-text"
                          title="-5%"
                        >
                          -5%
                        </button>
                        <span className={styles.progressPercent}>{project.progressPercent}%</span>
                        <button
                          type="button"
                          onClick={() => handleProgressChange(project, 5)}
                          className="px-1.5 py-0.5 rounded text-xs bg-ws-bg-alt hover:bg-ws-border text-ws-text"
                          title="+5%"
                        >
                          +5%
                        </button>
                      </div>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Step */}
                  {project.nextStep && (
                    <div className={styles.nextStepBox}>
                      <div className="flex items-center gap-1.5 text-daily-sky">
                        <ArrowRight size={13} />
                        <span className={styles.nextStepLabel}>Next meaningful step</span>
                      </div>
                      <p className="text-ws-text font-medium">{project.nextStep}</p>
                    </div>
                  )}

                  {/* Blocker (if any) */}
                  {project.blockers && (
                    <div className={styles.blockerBox}>
                      <div className="flex items-center gap-1.5 text-status-urgent">
                        <AlertCircle size={13} />
                        <span className={styles.blockerLabel}>Current blocker</span>
                      </div>
                      <p className="text-ws-text">{project.blockers}</p>
                    </div>
                  )}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 && (
                    <div className={styles.techTags}>
                      {project.techStack.map((tech) => (
                        <span key={tech} className={styles.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-ws-border">
                  <div className="flex items-center gap-2">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ws-accent hover:underline"
                      >
                        <Code size={13} />
                        <span>Source</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ws-accent hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>Launch</span>
                      </a>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProject(project)}
                    className="text-xs text-ws-text-muted hover:text-ws-text"
                  >
                    Edit details
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Edit Details Dialog */}
      {selectedProject && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setSelectedProject(null)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-ws-text">
              Edit {selectedProject.title}
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Next meaningful step</label>
                <input
                  type="text"
                  defaultValue={selectedProject.nextStep ?? ''}
                  id="edit-next-step"
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Current blockers</label>
                <textarea
                  rows={2}
                  defaultValue={selectedProject.blockers ?? ''}
                  id="edit-blockers"
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Status</label>
                <select
                  defaultValue={selectedProject.status}
                  id="edit-status"
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On hold</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-ws-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-status-urgent hover:bg-status-urgent-soft"
                  onClick={() => {
                    deleteMutation.mutate(selectedProject.id);
                    setSelectedProject(null);
                  }}
                >
                  Delete project
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedProject(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const nextStep = (
                        document.getElementById('edit-next-step') as HTMLInputElement
                      )?.value;
                      const blockers = (
                        document.getElementById('edit-blockers') as HTMLTextAreaElement
                      )?.value;
                      const status = (
                        document.getElementById('edit-status') as HTMLSelectElement
                      )?.value as ProjectStatus;

                      updateMutation.mutate({
                        id: selectedProject.id,
                        patch: {
                          nextStep: nextStep?.trim() || null,
                          blockers: blockers?.trim() || null,
                          status,
                        },
                      });
                      setSelectedProject(null);
                    }}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal Dialog */}
      {isCreateOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsCreateOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setIsCreateOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-ws-text">Create new project</h2>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Project title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Go Game AI or Compiler"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Overview & description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What is this project and what problem does it solve?"
                  value={newOverview}
                  onChange={(e) => setNewOverview(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Initial progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On hold</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Next meaningful step</label>
                <input
                  type="text"
                  placeholder="The next concrete action to take"
                  value={newNextStep}
                  onChange={(e) => setNewNextStep(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Tech stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Python, Pygame, NumPy"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-ws-accent hover:bg-ws-accent-hover text-white"
                >
                  Create project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
