import { randomUUID } from 'node:crypto';
import type {
  AiEngineeringData,
  AiNotionNote,
  AiRoadmapStage,
  CreateAiNoteInput,
} from '@/contracts/ai-engineering';
import { JsonFileStore } from '@/services/storage/json-store';

interface StoredAiState {
  id: string;
  roadmap: AiRoadmapStage[];
  notes: AiNotionNote[];
}

const initialRoadmap: AiRoadmapStage[] = [
  {
    id: 'stage-math',
    order: 1,
    title: 'Mathematical Foundations',
    description: 'Vector spaces, matrix decompositions, multivariable gradients, and statistical learning principles.',
    status: 'completed',
    topics: [
      { id: 'math-1', name: 'Linear algebra, eigenvalues & SVD', completed: true },
      { id: 'math-2', name: 'Multivariable calculus & gradient descent', completed: true },
      { id: 'math-3', name: 'Probability, Bayes theorem & distributions', completed: true },
      { id: 'math-4', name: 'Information theory, entropy & KL divergence', completed: true },
    ],
  },
  {
    id: 'stage-dl',
    order: 2,
    title: 'Deep Learning & Neural Architectures',
    description: 'Computational graphs, backpropagation mechanics, attention layers, and sequence modeling.',
    status: 'in_progress',
    topics: [
      { id: 'dl-1', name: 'Automatic differentiation & backprop', completed: true },
      { id: 'dl-2', name: 'Transformer self-attention mechanism', completed: true },
      {
        id: 'dl-3',
        name: 'Rotary position embeddings (RoPE) & RMSNorm',
        completed: false,
        nextStep: 'Derive complex 2D rotation matrix and verify RoPE invariance in PyTorch.',
      },
      { id: 'dl-4', name: 'Mixture of Experts (MoE) routing', completed: false },
    ],
  },
  {
    id: 'stage-llm',
    order: 3,
    title: 'LLM Systems & Inference Optimization',
    description: 'Autoregressive generation, speculative decoding, memory bandwidth bounds, and KV caching.',
    status: 'in_progress',
    topics: [
      { id: 'llm-1', name: 'Tokenization (BPE, SentencePiece)', completed: true },
      {
        id: 'llm-2',
        name: 'KV Cache memory management & PagedAttention',
        completed: false,
        nextStep: 'Benchmark memory fragmentation on long context sequences with vLLM.',
      },
      { id: 'llm-3', name: 'Quantization (GPTQ, AWQ, FP8)', completed: false },
      { id: 'llm-4', name: 'Speculative decoding & draft models', completed: false },
    ],
  },
  {
    id: 'stage-agents',
    order: 4,
    title: 'Autonomous Agents & Cognitive Scaffolding',
    description: 'Agentic feedback loops, dynamic planning, tool calling, Model Context Protocol, and verification harnesses.',
    status: 'upcoming',
    topics: [
      { id: 'agent-1', name: 'ReAct loops & structured tool invocation', completed: true },
      {
        id: 'agent-2',
        name: 'Model Context Protocol (MCP) integration',
        completed: false,
        nextStep: 'Build a local SQLite MCP server for seamless agentic knowledge query.',
      },
      { id: 'agent-3', name: 'Evaluation benchmarks & trace telemetry', completed: false },
      { id: 'agent-4', name: 'Multi-agent orchestration & delegation', completed: false },
    ],
  },
];

const initialNotes: AiNotionNote[] = [
  {
    id: 'note-rope',
    title: 'Rotary Position Embedding (RoPE) Deep Dive',
    stageId: 'stage-dl',
    topic: 'Rotary position embeddings (RoPE) & RMSNorm',
    notionSourceUrl: 'https://notion.so/hiep-ai/rope-embeddings-deep-dive',
    lastSyncedAt: new Date(Date.now() - 86400000).toISOString(),
    summary:
      'RoPE encodes relative positional information into token representations by applying an orthogonal 2D rotation matrix to query and key vectors, preserving distance decay across extended context windows.',
    keyTakeaways: [
      'Encodes position directly into the complex plane without adding learned absolute vectors.',
      'Relative distance manifests naturally through the dot product of rotated vectors.',
      'Enables seamless extrapolation to longer context windows via NTK-aware scaling.',
    ],
    readingContent: `### Theoretical Formulation

In standard Transformer architectures, positional encoding was historically added linearly: x + p. However, this additive approach struggles with relative distance preservation as context lengths scale.

RoPE resolves this by rotating the vector representation in 2D coordinate pairs. For a 2D chunk of query vector q at position m, we apply a 2x2 rotation matrix with angle m * theta.

### Why the Dot Product Captures Relative Distance

When calculating the attention score between query at position m and key at position n, the inner product between the rotated vectors depends solely on the relative difference (m - n). The absolute coordinate disappears, yielding perfect translation invariance.`,
    relatedProject: 'proj-agent-core',
  },
  {
    id: 'note-kvcache',
    title: 'KV Cache Memory Bandwidth & PagedAttention',
    stageId: 'stage-llm',
    topic: 'KV Cache memory management & PagedAttention',
    notionSourceUrl: 'https://notion.so/hiep-ai/kv-cache-paged-attention',
    lastSyncedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    summary:
      'LLM inference is fundamentally memory-bandwidth bound during token generation. PagedAttention eliminates internal fragmentation by allocating non-contiguous physical memory blocks inspired by virtual memory paging.',
    keyTakeaways: [
      'Prefill phase is compute-bound (GEMM); generation phase is memory bandwidth bound (GEMV).',
      'Conventional static KV cache reservation wastes up to 60-80% of GPU VRAM due to over-allocation.',
      'PagedAttention stores keys and values in dynamic blocks, enabling 2-4x higher concurrent throughput.',
    ],
    readingContent: `### The Generation Bottleneck

During the autoregressive decoding loop, each new generated token requires loading the entire historical sequence of Key and Value tensors from high-bandwidth memory (HBM) into SRAM. 

Because we compute only one query vector at a time, the arithmetic intensity (FLOPs per byte of memory loaded) drops drastically.

### The Virtual Memory Analogy

Traditional inference frameworks allocated contiguous chunks for maximum sequence lengths. If a user asked for a 200-token response, the engine had to reserve memory for 4,096 tokens upfront.

vLLM's PagedAttention resolves this by adopting the classic operating system page table: physical memory is split into fixed-size blocks (e.g., 16 tokens), and a logical-to-physical mapping translates virtual indices on the fly.`,
    relatedProject: null,
  },
  {
    id: 'note-mcp',
    title: 'Model Context Protocol (MCP) Design Patterns',
    stageId: 'stage-agents',
    topic: 'Model Context Protocol (MCP) integration',
    notionSourceUrl: 'https://notion.so/hiep-ai/mcp-design-patterns',
    lastSyncedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    summary:
      'MCP establishes an open standard for securely exposing tools, resources, and prompt templates to AI agents over JSON-RPC, enabling clean decoupling of host models from client environments.',
    keyTakeaways: [
      'Replaces bespoke API wrappers with a standardized JSON-RPC client-server architecture.',
      'Three core primitives: Prompts, Resources (read-only data), and Tools (executable actions).',
      'Local-first security: the client maintains full authorization and execution boundaries.',
    ],
    readingContent: `### The Integration Paradox

Before MCP, integrating an AI assistant with external systems (filesystem, git, databases, issue trackers) required bespoke tool schemas for each provider. When switching models or interfaces, the entire tool bridge had to be rewritten.

### Clean Architectural Decoupling

Under MCP, an external capability is encapsulated inside an isolated server process communicating over standard input/output (stdio) or SSE:

- **Resources:** Direct structured access to files, database records, and live system state.
- **Tools:** Typed executable methods with JSON schema parameter validation.
- **Prompts:** Parameterized interaction patterns authored by domain experts.`,
    relatedProject: 'proj-agent-core',
  },
];

const aiStore = new JsonFileStore<StoredAiState>('ai-engineering-data.json', [
  {
    id: 'singleton-ai-state',
    roadmap: initialRoadmap,
    notes: initialNotes,
  },
]);

export class AiEngineeringService {
  private async getState(): Promise<StoredAiState> {
    const list = await aiStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredAiState = {
      id: 'singleton-ai-state',
      roadmap: initialRoadmap,
      notes: initialNotes,
    };
    await aiStore.save(defaultState);
    return defaultState;
  }

  async getData(): Promise<AiEngineeringData> {
    const state = await this.getState();
    const allTopics = state.roadmap.flatMap((s) => s.topics);
    const completedTopics = allTopics.filter((t) => t.completed).length;

    // Current focus topic: first incomplete topic in an in_progress stage
    const currentStage = state.roadmap.find((s) => s.status === 'in_progress') ?? state.roadmap[1];
    const focusTopic = currentStage?.topics.find((t) => !t.completed) ?? currentStage?.topics[0];

    return {
      roadmap: state.roadmap,
      notes: state.notes,
      stats: {
        totalTopics: allTopics.length,
        completedTopics,
        currentFocusTopic: focusTopic ? focusTopic.name : 'Transformer architectures',
        nextRecommendedStep:
          focusTopic?.nextStep ?? 'Derive complex 2D rotation matrix and verify RoPE invariance in PyTorch.',
      },
    };
  }

  async toggleTopic(stageId: string, topicId: string): Promise<boolean> {
    const state = await this.getState();
    const stage = state.roadmap.find((s) => s.id === stageId);
    if (!stage) return false;

    const topic = stage.topics.find((t) => t.id === topicId);
    if (!topic) return false;

    topic.completed = !topic.completed;
    await aiStore.save(state);
    return true;
  }

  async addNote(input: CreateAiNoteInput): Promise<AiNotionNote> {
    const state = await this.getState();
    const newNote: AiNotionNote = {
      id: `note-${randomUUID().slice(0, 8)}`,
      title: input.title,
      stageId: input.stageId,
      topic: input.topic,
      notionSourceUrl: input.notionSourceUrl ?? 'https://notion.so',
      lastSyncedAt: new Date().toISOString(),
      summary: input.summary ?? '',
      keyTakeaways: input.keyTakeaways ?? [],
      readingContent: input.readingContent,
      relatedProject: input.relatedProject ?? null,
    };

    state.notes.unshift(newNote);
    await aiStore.save(state);
    return newNote;
  }
}

export const aiEngineeringService = new AiEngineeringService();

