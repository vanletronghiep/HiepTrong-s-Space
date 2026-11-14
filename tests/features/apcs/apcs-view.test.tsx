// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApcsDirectoryListing, ApcsFileItem, ApcsOverview } from '@/contracts/apcs';
import { ApcsView } from '@/features/apcs/ApcsView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';

const mockUseApcsOverview = vi.fn();
const mockUseApcsDirectory = vi.fn();
const mockUseApcsSearch = vi.fn();

vi.mock('@/client/queries/apcs', () => ({
  useApcsOverview: () => mockUseApcsOverview(),
  useApcsDirectory: (subpath: string) => mockUseApcsDirectory(subpath),
  useApcsSearch: (query: string, course?: string, category?: string) =>
    mockUseApcsSearch(query, course, category),
}));

function renderApcsView() {
  return render(
    <FeatureThemeProvider name="apcs-hub">
      <ApcsView />
    </FeatureThemeProvider>,
  );
}

const pdfFile: ApcsFileItem = {
  id: 'file-syllabus',
  name: 'CS160_Syllabus.pdf',
  relativePath: 'CS160/CS160_Syllabus.pdf',
  fullPath: 'D:\\APCS\\University\\Year I\\CS160\\CS160_Syllabus.pdf',
  isDirectory: false,
  size: 524288,
  formattedSize: '512 KB',
  extension: '.pdf',
  modifiedAt: '2026-11-08T15:35:36.647Z',
  category: 'document',
  parentPath: 'CS160',
};

const imageFile: ApcsFileItem = {
  id: 'file-diagram',
  name: 'FSM_Diagram.png',
  relativePath: 'CM102/FSM_Diagram.png',
  fullPath: 'D:\\APCS\\University\\Year I\\CM102\\FSM_Diagram.png',
  isDirectory: false,
  size: 131072,
  formattedSize: '128 KB',
  extension: '.png',
  modifiedAt: '2026-11-06T10:00:00.000Z',
  category: 'image',
  parentPath: 'CM102',
};

const sampleOverview: ApcsOverview = {
  courses: [
    {
      id: 'course-cs160',
      code: 'CS160',
      name: 'Introduction to Computer Science',
      description: 'Foundational algorithms, C++ programming, and discrete problem solving.',
      folderName: 'CS160',
      semester: 'Fall · Year I',
      fileCount: 24,
      totalSizeBytes: 12582912,
      formattedSize: '12 MB',
      tags: ['C++', 'Algorithms'],
      topics: ['Recursion', 'Pointers', 'Sorting'],
    },
    {
      id: 'course-calc1',
      code: 'MTH101',
      name: 'Calculus I',
      description: 'Limits, derivatives, integrals, and series foundations.',
      folderName: 'Calculus I',
      semester: 'Fall · Year I',
      fileCount: 18,
      totalSizeBytes: 8388608,
      formattedSize: '8 MB',
      tags: ['Math'],
      topics: ['Limits', 'Integrals', 'Series'],
    },
  ],
  stats: {
    totalCourses: 2,
    totalFiles: 42,
    totalSizeBytes: 20971520,
    formattedSize: '20 MB',
  },
  recentFiles: [pdfFile, imageFile],
};

const rootDirectory: ApcsDirectoryListing = {
  currentPath: '',
  breadcrumbs: [{ name: 'Year I', path: '' }],
  parentPath: null,
  courseId: null,
  items: [
    {
      id: 'dir-cs160',
      name: 'CS160',
      relativePath: 'CS160',
      fullPath: 'D:\\APCS\\University\\Year I\\CS160',
      isDirectory: true,
      size: 0,
      formattedSize: '—',
      extension: '',
      modifiedAt: '2026-11-08T15:35:36.647Z',
      category: 'other',
      parentPath: '',
    },
    pdfFile,
  ],
};

const cs160Directory: ApcsDirectoryListing = {
  currentPath: 'CS160',
  breadcrumbs: [
    { name: 'Year I', path: '' },
    { name: 'CS160', path: 'CS160' },
  ],
  parentPath: '',
  courseId: 'CS160',
  items: [pdfFile],
};

describe('ApcsView ("Winter Library")', () => {
  beforeEach(() => {
    mockUseApcsOverview.mockReturnValue({
      data: sampleOverview,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseApcsDirectory.mockImplementation((subpath: string) => ({
      data: subpath === 'CS160' ? cs160Directory : rootDirectory,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));
    mockUseApcsSearch.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders unboxed masthead, library stats, recentFiles strip, and loading skeletons', () => {
    mockUseApcsOverview.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseApcsDirectory.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { rerender } = renderApcsView();
    expect(screen.getByLabelText('Loading archive summary')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading academic curriculum')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading study materials')).toBeInTheDocument();

    rerender(
      <FeatureThemeProvider name="apcs-hub">
        <ApcsView />
      </FeatureThemeProvider>,
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-feature-heading');
    expect(screen.getByRole('heading', { name: /APCS\s*Hub/i })).toBeInTheDocument();

    const summary = screen.getByLabelText('Archive summary');
    expect(summary).toHaveTextContent('42');
    expect(summary).toHaveTextContent('20 MB');

    const recentSection = screen.getByRole('region', { name: 'Recent materials' });
    expect(
      within(recentSection).getByRole('button', { name: /CS160_Syllabus\.pdf/i }),
    ).toBeVisible();
    expect(within(recentSection).getByRole('button', { name: /FSM_Diagram\.png/i })).toBeVisible();
  });

  it('supports course scoping, folder navigation, parent directory return, and category aria-pressed filters', () => {
    renderApcsView();

    const cs160Btn = screen.getByRole('button', {
      name: 'Browse materials for Introduction to Computer Science',
    });
    expect(cs160Btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(cs160Btn);

    expect(cs160Btn).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('Scoped to CS160 · Introduction to Computer Science'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '.. (Parent directory)' })).toBeInTheDocument();

    // Return via parent directory button
    fireEvent.click(screen.getByRole('button', { name: '.. (Parent directory)' }));
    expect(
      screen.queryByText('Scoped to CS160 · Introduction to Computer Science'),
    ).not.toBeInTheDocument();

    // Open folder from table action
    fireEvent.click(screen.getByRole('button', { name: 'Open folder' }));
    expect(screen.getByRole('button', { name: '.. (Parent directory)' })).toBeInTheDocument();

    // Clear via scope bar button
    fireEvent.click(
      screen.getByRole('button', { name: 'Browse materials for Introduction to Computer Science' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show all courses' }));
    expect(
      screen.queryByText('Scoped to CS160 · Introduction to Computer Science'),
    ).not.toBeInTheDocument();

    // Category filter chips use aria-pressed
    const docsChip = screen.getByRole('button', { name: 'Documents' });
    expect(docsChip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(docsChip);
    expect(docsChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens shared Dialog preview with footer and no duplicate close button, and preserves primary contrast classes', async () => {
    renderApcsView();

    // Download link in table carries .actionBtnPrimary
    const downloadLink = screen.getByRole('link', { name: 'Download' });
    expect(downloadLink.className).toContain('actionBtnPrimary');

    // Open preview dialog from Details button
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    const dialog = screen.getByRole('dialog', { name: 'CS160_Syllabus.pdf' });
    expect(dialog).toHaveAttribute('data-feature-theme', 'apcs-hub');
    expect(within(dialog).queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();

    const pdfLink = within(dialog).getByRole('link', { name: 'Open PDF in new tab' });
    expect(pdfLink.className).toContain('actionBtnPrimary');
    const modalDownloadLink = within(dialog).getByRole('link', { name: 'Download file' });
    expect(modalDownloadLink.className).toContain('actionBtnPrimary');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'CS160_Syllabus.pdf' })).not.toBeInTheDocument();

    // Verify CSS fixes the 1.00:1 hover contrast bug explicitly
    const css = await fs.readFile(path.resolve('src/features/apcs/apcs.module.css'), 'utf8');
    expect(css).toMatch(/\.actionBtnPrimary:hover[\s\S]*?color:\s*var\(--cosmos-star-white\)/);
  });

  it('renders non-blocking role="alert" with Retry button on failure and EmptyState with all 5 decorative SVGs', () => {
    const retryOverview = vi.fn();
    mockUseApcsOverview.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: retryOverview,
    });

    const { rerender, container } = renderApcsView();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not access study materials from the local archive.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(retryOverview).toHaveBeenCalledTimes(1);

    // Empty directory renders EmptyState with snow-fox-rest.svg and all 5 decorative SVGs
    mockUseApcsDirectory.mockReturnValue({
      data: {
        ...rootDirectory,
        items: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    rerender(
      <FeatureThemeProvider name="apcs-hub">
        <ApcsView />
      </FeatureThemeProvider>,
    );

    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();

    const decorativeImgs = Array.from(container.querySelectorAll('img'));
    const srcs = decorativeImgs.map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        '/visuals/apcs-hub/glacier-shelf.svg',
        '/visuals/apcs-hub/aurora-silk.svg',
        '/visuals/apcs-hub/ice-window-frame.svg',
        '/visuals/apcs-hub/frost-fern.svg',
        '/visuals/apcs-hub/snow-fox-rest.svg',
      ]),
    );
    for (const img of decorativeImgs) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
