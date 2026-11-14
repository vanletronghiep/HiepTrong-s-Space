// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiEngineeringData } from '@/contracts/ai-engineering';
import { AiEngineeringView } from '@/features/ai-engineering/AiEngineeringView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';

const mockUseAiEngineeringData = vi.fn();
const mockToggleMutate = vi.fn();

const mockToggleState = {
  mutate: mockToggleMutate,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

vi.mock('@/client/queries/ai-engineering', () => ({
  useAiEngineeringData: () => mockUseAiEngineeringData(),
  useToggleAiTopic: () => mockToggleState,
}));

function renderAiEngineeringView() {
  return render(
    <FeatureThemeProvider name="ai-engineering">
      <AiEngineeringView />
    </FeatureThemeProvider>,
  );
}

const sampleData: AiEngineeringData = {
  roadmap: [
    {
      id: 'stage-math',
      order: 1,
      title: 'Mathematical Foundations',
      description: 'Vector spaces and statistical learning principles.',
      status: 'completed',
      topics: [
        {
          id: 'math-1',
          name: 'Linear algebra, eigenvalues & SVD',
          completed: true,
        },
      ],
    },
    {
      id: 'stage-dl',
      order: 2,
      title: 'Deep Learning & Neural Architectures',
      description: 'Backpropagation mechanics and sequence modeling.',
      status: 'in_progress',
      topics: [
        {
          id: 'dl-1',
          name: 'Rotary position embeddings (RoPE) & RMSNorm',
          completed: false,
          nextStep: 'Verify RoPE invariance in PyTorch.',
        },
      ],
    },
    {
      id: 'stage-agents',
      order: 3,
      title: 'Autonomous Agents',
      description: 'Tool calling and Model Context Protocol.',
      status: 'upcoming',
      topics: [
        {
          id: 'agent-1',
          name: 'Model Context Protocol (MCP) integration',
          completed: false,
        },
      ],
    },
  ],
  notes: [
    {
      id: 'note-rope',
      title: 'Rotary Position Embedding (RoPE) Deep Dive',
      stageId: 'stage-dl',
      topic: 'Rotary position embeddings (RoPE) & RMSNorm',
      notionSourceUrl: 'https://notion.so/hiep-ai/rope-embeddings-deep-dive',
      lastSyncedAt: '2026-11-08T15:35:36.647Z',
      summary: 'RoPE encodes relative positional information via 2D rotation.',
      keyTakeaways: [
        'Encodes position directly into the complex plane.',
        'Relative distance manifests through the dot product.',
      ],
      readingContent:
        '### Theoretical Formulation\n\nRoPE rotates vector pairs.\n\n- **Resources:** Direct structured access.',
      relatedProject: 'proj-agent-core',
    },
  ],
  stats: {
    totalTopics: 3,
    completedTopics: 1,
    currentFocusTopic: 'Rotary position embeddings (RoPE) & RMSNorm',
    nextRecommendedStep: 'Derive complex 2D rotation matrix and verify RoPE invariance in PyTorch.',
  },
};

describe('AiEngineeringView ("Mist Trail")', () => {
  beforeEach(() => {
    mockToggleMutate.mockReset();
    mockToggleState.isPending = false;
    mockToggleState.isError = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders loading skeletons while query is pending', () => {
    mockUseAiEngineeringData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderAiEngineeringView();

    expect(screen.getByLabelText('Loading current learning priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading curriculum')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading notes')).toBeInTheDocument();
  });

  it('renders calm alert banner with retry button on query error', () => {
    const refetchSpy = vi.fn();
    mockUseAiEngineeringData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchSpy,
    });

    renderAiEngineeringView();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load your AI Engineering trail right now.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });

  it('renders priority folio, accessible completed contrast class, and toggles stage topics', () => {
    mockUseAiEngineeringData.mockReturnValue({
      data: sampleData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderAiEngineeringView();

    expect(screen.getByRole('heading', { name: /AI\s*Engineering/i })).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Stage 2 · In progress')).toBeInTheDocument();

    const focusRegion = screen.getByRole('region', {
      name: 'Rotary position embeddings (RoPE) & RMSNorm',
    });
    expect(focusRegion).toHaveTextContent(
      'Derive complex 2D rotation matrix and verify RoPE invariance in PyTorch.',
    );

    const completedBadge = screen.getByText('Completed');
    expect(completedBadge.parentElement).toHaveClass('text-text-notif-completed');
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: 'Toggle topic Rotary position embeddings (RoPE) & RMSNorm',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(checkbox);
    expect(mockToggleMutate).toHaveBeenCalledWith({
      stageId: 'stage-dl',
      topicId: 'dl-1',
    });
  });

  it('opens semantic Note Reader dialog without duplicate close button or unrelated toggle error', () => {
    mockToggleState.isError = true;
    mockUseAiEngineeringData.mockReturnValue({
      data: sampleData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderAiEngineeringView();

    // No clickable <article role="button"> anti-pattern
    expect(container.querySelector('article[role="button"]')).toBeNull();

    // Timezone-safe Asia/Saigon date formatting (2026-11-08T15:35:36.647Z -> Nov 8)
    expect(screen.getByText('Saved Nov 8')).toBeInTheDocument();

    // Mutation error appears on the page roadmap section
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The change could not be saved. Your input is retained; retry the action.',
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Read note: Rotary Position Embedding (RoPE) Deep Dive',
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Rotary Position Embedding (RoPE) Deep Dive',
    });
    expect(dialog).toHaveAttribute('data-feature-theme', 'ai-engineering');

    // No duplicate close X button and no unrelated toggleTopic alert inside dialog
    expect(within(dialog).queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();

    // Structured readingContent headings & bold items without raw markdown markers
    expect(
      within(dialog).getByRole('heading', { name: 'Theoretical Formulation' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Resources:')).toBeInTheDocument();
    expect(dialog.textContent).not.toContain('###');
    expect(dialog.textContent).not.toContain('**');

    const notionLink = within(dialog).getByRole('link', { name: /Open original in Notion/i });
    expect(notionLink).toHaveAttribute(
      'href',
      'https://notion.so/hiep-ai/rope-embeddings-deep-dive',
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(
      screen.queryByRole('dialog', { name: 'Rotary Position Embedding (RoPE) Deep Dive' }),
    ).not.toBeInTheDocument();
  });

  it('renders FeatureEmptyState with trail-cairn.svg when notes are empty and marks all 5 curated SVGs non-interactive', () => {
    mockUseAiEngineeringData.mockReturnValue({
      data: {
        ...sampleData,
        notes: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderAiEngineeringView();

    expect(screen.getByText('No local research notes yet.')).toBeInTheDocument();

    const imgs = Array.from(container.querySelectorAll('img'));
    const srcs = imgs.map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        '/visuals/ai-engineering/ridge-trail-edge.svg',
        '/visuals/ai-engineering/mist-layered-ridges.svg',
        '/visuals/ai-engineering/misty-footbridge.svg',
        '/visuals/ai-engineering/valley-river-contours.svg',
        '/visuals/ai-engineering/trail-cairn.svg',
      ]),
    );

    for (const img of imgs) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
