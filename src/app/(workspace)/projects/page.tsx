import type { Metadata } from 'next';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { getFeatureById } from '@/features/registry';

const feature = getFeatureById('projects');

export const metadata: Metadata = {
  title: feature?.title ?? 'In Progress Projects',
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
