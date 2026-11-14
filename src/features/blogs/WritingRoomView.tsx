'use client';

import React, { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ExternalLink,
  Feather,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import {
  clearEditorDraft,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useBlogArticles,
  useCreateBlogArticle,
  useUpdateBlogArticle,
} from '@/client/queries/blogs';
import type { BlogArticle, BlogAuthorship, BlogCategory } from '@/contracts/blog';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { Skeleton } from '@/ui/Skeleton';
import styles from './writing-room.module.css';

const CATEGORIES: { label: string; value: BlogCategory | 'all' }[] = [
  { label: 'All writings', value: 'all' },
  { label: 'Personal stories', value: 'personal_stories' },
  { label: 'Ideas & perspectives', value: 'ideas_and_perspectives' },
];

const AUTHORSHIP_FILTERS: { label: string; value: BlogAuthorship | 'all' }[] = [
  { label: 'All authors', value: 'all' },
  { label: 'By Hiep', value: 'by_hiep' },
  { label: 'Saved from others', value: 'saved_from_others' },
];

const TOPIC_TAGS = ['Habits', 'Human Behavior', 'Communication', 'Learning', 'Focus', 'Technology'];

const BLOG_ARTICLE_FORM_ID = 'blog-article';

interface ArticleEditorValues {
  title: string;
  subtitle: string;
  category: BlogCategory;
  authorship: BlogAuthorship;
  authorName: string;
  commentary: string;
  shortVersion: string;
  content: string;
  tags: string;
  originalSourceUrl: string;
}

const EMPTY_ARTICLE_VALUES: ArticleEditorValues = {
  title: '',
  subtitle: '',
  category: 'ideas_and_perspectives',
  authorship: 'by_hiep',
  authorName: 'Hiep Trong',
  commentary: '',
  shortVersion: '',
  content: '',
  tags: '',
  originalSourceUrl: '',
};

const VALID_CATEGORIES = new Set<BlogCategory>(['personal_stories', 'ideas_and_perspectives']);
const VALID_AUTHORSHIPS = new Set<BlogAuthorship>(['by_hiep', 'saved_from_others']);

function isArticleDraftValues(raw: unknown): raw is ArticleEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.title === 'string' &&
    typeof value.subtitle === 'string' &&
    typeof value.category === 'string' &&
    VALID_CATEGORIES.has(value.category as BlogCategory) &&
    typeof value.authorship === 'string' &&
    VALID_AUTHORSHIPS.has(value.authorship as BlogAuthorship) &&
    typeof value.authorName === 'string' &&
    typeof value.commentary === 'string' &&
    typeof value.shortVersion === 'string' &&
    typeof value.content === 'string' &&
    typeof value.tags === 'string' &&
    typeof value.originalSourceUrl === 'string'
  );
}

function sameArticleValues(a: ArticleEditorValues, b: ArticleEditorValues): boolean {
  return (
    a.title === b.title &&
    a.subtitle === b.subtitle &&
    a.category === b.category &&
    a.authorship === b.authorship &&
    a.authorName === b.authorName &&
    a.commentary === b.commentary &&
    a.shortVersion === b.shortVersion &&
    a.content === b.content &&
    a.tags === b.tags &&
    a.originalSourceUrl === b.originalSourceUrl
  );
}

function formatDraftTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return 'recently';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

function formatArticleDate(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return iso;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(ms));
}

function formatCategoryLabel(category: BlogCategory): string {
  return category === 'personal_stories' ? 'Personal story' : 'Ideas & perspectives';
}

function isSafeHttpUrl(url: string | null | undefined): url is string {
  return Boolean(url && /^https?:\/\//i.test(url.trim()));
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**') && raw.length > 4) {
      tokens.push(<strong key={`b-${keyIdx++}`}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length > 2) {
      tokens.push(<em key={`i-${keyIdx++}`}>{raw.slice(1, -1)}</em>);
    } else {
      tokens.push(raw);
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function renderProse(text: string): ReactNode[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n{2,}/);

  return blocks
    .map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        return <h3 key={idx}>{renderInlineMarkdown(trimmed.slice(4))}</h3>;
      }

      const lines = trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0 && lines.every((line) => line.startsWith('> '))) {
        const quoteText = lines.map((line) => line.slice(2)).join(' ');
        return <blockquote key={idx}>{renderInlineMarkdown(quoteText)}</blockquote>;
      }

      if (lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line))) {
        return (
          <ol key={idx}>
            {lines.map((line, itemIdx) => (
              <li key={itemIdx}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>
            ))}
          </ol>
        );
      }

      if (lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line))) {
        return (
          <ul key={idx}>
            {lines.map((line, itemIdx) => (
              <li key={itemIdx}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>
            ))}
          </ul>
        );
      }

      return <p key={idx}>{renderInlineMarkdown(trimmed)}</p>;
    })
    .filter(Boolean);
}

export function WritingRoomView() {
  const existingTheme = useFeatureTheme();
  const savingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');
  const [selectedAuthorship, setSelectedAuthorship] = useState<BlogAuthorship | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  // Writing desk state
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ArticleEditorValues>(EMPTY_ARTICLE_VALUES);
  const [formValues, setFormValues] = useState<ArticleEditorValues>(EMPTY_ARTICLE_VALUES);
  const [loadedDraft, setLoadedDraft] = useState<EditorDraftPayload<ArticleEditorValues> | null>(
    null,
  );
  const [editorError, setEditorError] = useState<string>('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState<boolean>(false);

  const editorFormId = useId();
  const searchInputId = useId();
  const titleInputId = useId();
  const subtitleInputId = useId();
  const categorySelectId = useId();
  const authorshipSelectId = useId();
  const authorNameInputId = useId();
  const commentaryInputId = useId();
  const shortVersionInputId = useId();
  const contentInputId = useId();
  const tagsInputId = useId();
  const sourceInputId = useId();

  // Queries & Mutations
  const {
    data: articles = [],
    isLoading,
    isError: loadFailed,
    refetch,
  } = useBlogArticles(
    selectedCategory !== 'all' ? selectedCategory : undefined,
    selectedAuthorship !== 'all' ? selectedAuthorship : undefined,
    selectedTag !== 'all' ? selectedTag : undefined,
  );
  const createArticle = useCreateBlogArticle();
  const updateArticle = useUpdateBlogArticle();

  const isEditorDirty = isWriting && !sameArticleValues(formValues, initialValues);

  const startNewPiece = () => {
    const existing = loadEditorDraft<ArticleEditorValues>(
      BLOG_ARTICLE_FORM_ID,
      null,
      isArticleDraftValues,
    );
    setEditingId(null);
    setInitialValues(EMPTY_ARTICLE_VALUES);
    setFormValues(EMPTY_ARTICLE_VALUES);
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorError('');
    setIsWriting(true);
  };

  const editArticle = (article: BlogArticle) => {
    const base: ArticleEditorValues = {
      title: article.title,
      subtitle: article.subtitle,
      category: article.category,
      authorship: article.authorship,
      authorName: article.authorName,
      commentary: article.commentary ?? '',
      shortVersion: article.shortVersion,
      content: article.content,
      tags: article.tags.join(', '),
      originalSourceUrl: article.originalSourceUrl ?? '',
    };
    const existing = loadEditorDraft<ArticleEditorValues>(
      BLOG_ARTICLE_FORM_ID,
      article.id,
      isArticleDraftValues,
    );
    setEditingId(article.id);
    setInitialValues(base);
    setFormValues(base);
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorError('');
    setIsWriting(true);
  };

  const handleSaveLocalDraft = useCallback((): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: BLOG_ARTICLE_FORM_ID,
      recordId: editingId,
      recordUpdatedAt: null,
      values: formValues,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setLoadedDraft(null);
    setInitialValues(formValues);
    return {
      ok: true,
      message: `Local draft saved (${formatDraftTimestamp(result.draft.savedAt)}).`,
    };
  }, [editingId, formValues]);

  const handleDiscardEditorChanges = useCallback(() => {
    setFormValues(initialValues);
    setEditorError('');
  }, [initialValues]);

  const handleCloseEditor = useCallback(() => {
    setIsWriting(false);
    setEditingId(null);
    setEditorError('');
    setLoadedDraft(null);
  }, []);

  // Escape exits Reading Mode when the Writing Desk dialog is closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isWriting && activeArticle) {
        setActiveArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWriting, activeArticle]);

  const filteredArticles = articles.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q) ||
      a.shortVersion.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSubmitArticle = useCallback(
    async (status: BlogArticle['status']) => {
      if (savingRef.current) return;

      if (!formValues.title.trim()) {
        setEditorError('Enter a title before saving.');
        titleInputRef.current?.focus();
        return;
      }
      if (!formValues.content.trim()) {
        setEditorError('Enter your prose essay before saving.');
        contentInputRef.current?.focus();
        return;
      }

      const tagsArray = formValues.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      savingRef.current = true;
      setIsSubmittingArticle(true);
      setEditorError('');

      try {
        const input = {
          title: formValues.title.trim(),
          subtitle: formValues.subtitle.trim(),
          category: formValues.category,
          authorship: formValues.authorship,
          authorName:
            formValues.authorship === 'by_hiep'
              ? 'Hiep Trong'
              : formValues.authorName.trim() || 'External author',
          commentary: formValues.commentary.trim() || null,
          shortVersion: formValues.shortVersion.trim(),
          content: formValues.content.trim(),
          tags: tagsArray,
          originalSourceUrl: formValues.originalSourceUrl.trim() || null,
          status,
        };
        const saved = editingId
          ? await updateArticle.mutateAsync({ id: editingId, patch: input })
          : await createArticle.mutateAsync(input);

        clearEditorDraft(BLOG_ARTICLE_FORM_ID, editingId);
        if (activeArticle?.id === editingId) {
          setActiveArticle(saved);
        }
        setLoadedDraft(null);
        setEditingId(null);
        setInitialValues(EMPTY_ARTICLE_VALUES);
        setFormValues(EMPTY_ARTICLE_VALUES);
        setIsWriting(false);
      } catch (error) {
        setEditorError(
          error instanceof Error
            ? error.message
            : 'The change could not be saved. Your input is retained; retry the action.',
        );
      } finally {
        savingRef.current = false;
        setIsSubmittingArticle(false);
      }
    },
    [activeArticle?.id, createArticle, editingId, formValues, updateArticle],
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSubmitArticle('published');
  };

  const viewContent = (
    <div className={styles.pageStack}>
      {/* Open Editorial Woodland Masthead (Overview Mode) */}
      {!activeArticle && (
        <header className={styles.masthead}>
          <div className={styles.mastheadCopy}>
            <div className={styles.eyebrow}>
              <Feather size={14} strokeWidth={1.7} aria-hidden="true" />
              <span>Wood, warmth &amp; quiet prose</span>
            </div>

            <h1 className={styles.title}>The Writing Room</h1>
            <p className={styles.description}>
              Essays, architectural reflections, and personal perspectives. A calm space dedicated
              to deliberate long-form thinking, free from algorithmic feeds and distractions.
            </p>
          </div>

          <Image
            src="/visuals/blogs-hub/woodland-cabin.svg"
            alt=""
            aria-hidden="true"
            width={480}
            height={300}
            unoptimized
            className={styles.mastheadCabinArt}
          />
        </header>
      )}

      {/* Non-blocking load failure alert */}
      {loadFailed ? (
        <div role="alert" className={styles.errorCard}>
          <p className={styles.errorMessage}>
            <AlertTriangle size={18} strokeWidth={1.7} aria-hidden="true" />
            <span>Could not load the writing room right now.</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} aria-hidden="true" />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : activeArticle ? (
        /* Calm Reader Mode */
        <article className={styles.readerContainer}>
          <Image
            src="/visuals/blogs-hub/falling-maple-pair.svg"
            alt=""
            aria-hidden="true"
            width={240}
            height={240}
            unoptimized
            className={styles.readerCornerArt}
          />

          <div className={styles.readerInner}>
            <div className={styles.readerActionBar}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" />}
                className={styles.mobileTouchBtn}
                onClick={() => setActiveArticle(null)}
                aria-label="Back to all articles"
              >
                All articles
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil size={14} strokeWidth={1.7} aria-hidden="true" />}
                className={styles.mobileTouchBtn}
                onClick={() => editArticle(activeArticle)}
              >
                Edit piece
              </Button>
            </div>

            {/* Editorial Dateline Banner */}
            <div className={styles.datelineBanner}>
              <span>
                {activeArticle.status === 'draft' ? 'Draft saved' : 'Published'}{' '}
                {formatArticleDate(activeArticle.publishedAt)}
              </span>
              <span className={styles.datelineDot} aria-hidden="true">
                ·
              </span>
              <span>By {activeArticle.authorName}</span>
              <span className={styles.datelineDot} aria-hidden="true">
                ·
              </span>
              <span>{activeArticle.readingTimeMinutes} min read</span>
              <span className={styles.datelineDot} aria-hidden="true">
                ·
              </span>
              <span>{formatCategoryLabel(activeArticle.category)}</span>
            </div>

            <h1 className={styles.readerTitle}>{activeArticle.title}</h1>
            {activeArticle.subtitle && (
              <p className={styles.readerSubtitle}>{activeArticle.subtitle}</p>
            )}

            {/* "The short version" executive answer box */}
            {activeArticle.shortVersion && (
              <section className={styles.shortVersionBox} aria-label="The short version">
                <h2 className={styles.shortVersionHeading}>
                  <Clock size={14} strokeWidth={2} aria-hidden="true" />
                  <span>The short version</span>
                </h2>
                <p className={styles.shortVersionText}>{activeArticle.shortVersion}</p>
              </section>
            )}

            {/* Hiep's Commentary Callout */}
            {activeArticle.commentary && (
              <section className={styles.commentaryBox} aria-label="Commentary and takeaways">
                <h2 className={styles.commentaryHeading}>
                  <span>Hiep&apos;s commentary &amp; takeaways</span>
                </h2>
                <p className={styles.commentaryText}>{activeArticle.commentary}</p>
              </section>
            )}

            {isSafeHttpUrl(activeArticle.originalSourceUrl) && (
              <div className={styles.originalSourceRow}>
                <a
                  href={activeArticle.originalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.originalSourceLink}
                >
                  <span>Original source</span>
                  <ExternalLink size={14} strokeWidth={1.7} aria-hidden="true" />
                </a>
              </div>
            )}

            {/* Full Prose Body */}
            <div className={styles.proseContent}>{renderProse(activeArticle.content)}</div>

            {/* Sources and References List */}
            {activeArticle.sources && activeArticle.sources.length > 0 && (
              <footer className={styles.sourcesSection}>
                <div className={styles.sourcesRuleWrap} aria-hidden="true">
                  <Image
                    src="/visuals/blogs-hub/timber-grain-rule.svg"
                    alt=""
                    aria-hidden="true"
                    width={720}
                    height={100}
                    unoptimized
                    className={styles.sectionRuleArt}
                  />
                </div>
                <h2 className={styles.sourcesTitle}>Sources &amp; references</h2>
                <div className={styles.sourceList}>
                  {activeArticle.sources.map((src, i) => (
                    <div key={i} className={styles.sourceItem}>
                      <span>[{i + 1}] </span>
                      {isSafeHttpUrl(src.url) ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.sourceLink}
                        >
                          {src.title}
                        </a>
                      ) : (
                        <strong>{src.title}</strong>
                      )}
                      {src.note && <span> — {src.note}</span>}
                    </div>
                  ))}
                </div>
              </footer>
            )}
          </div>
        </article>
      ) : (
        /* Overview Mode */
        <>
          <div className={styles.controlsStack}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <Search
                  size={16}
                  strokeWidth={1.7}
                  aria-hidden="true"
                  className={styles.searchIcon}
                />
                <input
                  id={searchInputId}
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search essays, topics, or ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search articles"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={15} strokeWidth={1.9} aria-hidden="true" />}
                className={styles.mobileTouchBtn}
                onClick={startNewPiece}
              >
                Write new piece
              </Button>
            </div>

            {/* Category & Authorship Filters */}
            <div className={styles.filterRow}>
              <div className={styles.filterRow} role="group" aria-label="Category filter">
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.value}
                    active={selectedCategory === cat.value}
                    className={styles.filterChip}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </div>

              <span className={styles.filterSeparator} aria-hidden="true">
                |
              </span>

              <div className={styles.filterRow} role="group" aria-label="Authorship filter">
                {AUTHORSHIP_FILTERS.map((author) => (
                  <Chip
                    key={author.value}
                    active={selectedAuthorship === author.value}
                    className={styles.filterChip}
                    onClick={() => setSelectedAuthorship(author.value)}
                  >
                    {author.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Topic Tags Bar */}
            <div className={styles.filterRow} role="group" aria-label="Topic tags">
              <span className={styles.filterLabel}>Topics:</span>
              <Chip
                active={selectedTag === 'all'}
                className={styles.filterChip}
                onClick={() => setSelectedTag('all')}
              >
                All topics
              </Chip>
              {TOPIC_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  active={selectedTag === tag}
                  className={styles.filterChip}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>

          <div className={styles.sectionDivider} aria-hidden="true">
            <Image
              src="/visuals/blogs-hub/timber-grain-rule.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.sectionRuleArt}
            />
          </div>

          {/* Articles Grid */}
          <section aria-labelledby="articles-heading">
            <h2 id="articles-heading" className="sr-only">
              Articles and essays
            </h2>

            {isLoading ? (
              <div aria-label="Loading articles" aria-busy="true" className={styles.articlesGrid}>
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className={styles.skeletonCard}>
                    <Skeleton className="h-5 w-32 rounded-pill" />
                    <Skeleton className="h-7 w-4/5 rounded-item" />
                    <Skeleton className="h-4 w-full rounded-item" />
                    <Skeleton className="h-14 w-full rounded-item" />
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div role="status" className={styles.emptyCard}>
                <EmptyState
                  title="No articles match your current criteria."
                  description="Try clearing a topic filter or start a fresh essay in the writing desk."
                />
              </div>
            ) : (
              <div className={styles.articlesGrid}>
                {filteredArticles.map((article) => (
                  <article key={article.id} className={styles.articleCard}>
                    <div>
                      <div className={styles.cardHeaderLine}>
                        <div className={styles.cardHeaderBadges}>
                          <span className={styles.categoryBadge}>
                            {formatCategoryLabel(article.category)}
                          </span>
                          {article.status === 'draft' && <Badge tone="normal">Draft</Badge>}
                        </div>
                        <span className={styles.readingTime}>
                          {article.readingTimeMinutes} min read
                        </span>
                      </div>

                      <h3 className={styles.cardTitle}>
                        <button
                          type="button"
                          className={styles.cardTitleBtn}
                          onClick={() => setActiveArticle(article)}
                        >
                          {article.title}
                        </button>
                      </h3>
                      {article.subtitle && (
                        <p className={styles.cardSubtitle}>{article.subtitle}</p>
                      )}
                    </div>

                    {article.shortVersion && (
                      <div className={styles.cardSummaryBox}>
                        <strong>The short version: </strong>
                        <span>{article.shortVersion}</span>
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <span>{article.authorName}</span>
                      <div className={styles.tagPills}>
                        {article.tags.slice(0, 2).map((t) => (
                          <span key={t} className={styles.tagPill}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Distraction-Free Writing Desk (LargeEditorDialog + Dual Draft Persistence) */}
      <LargeEditorDialog
        open={isWriting}
        onClose={handleCloseEditor}
        title={editingId ? 'Edit piece' : 'Draft a new piece'}
        eyebrow="The Writing Room"
        description="Compose long-form essays in calm focus. Save a server draft anytime or keep a local recovery copy."
        formId={editorFormId}
        isDirty={isEditorDirty}
        isSubmitting={createArticle.isPending || updateArticle.isPending || isSubmittingArticle}
        submitLabel="Publish to Writing Room"
        submittingLabel="Saving..."
        cancelLabel="Close"
        draftLabel="Save local draft"
        closeAriaLabel="Close writing desk"
        initialFocusRef={titleInputRef}
        errorMessage={editorError || null}
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedDraft.savedAt),
                onResume: () => {
                  setFormValues(loadedDraft.values);
                  setLoadedDraft(null);
                  setEditorError('');
                },
                onDiscard: () => {
                  clearEditorDraft(BLOG_ARTICLE_FORM_ID, editingId);
                  setLoadedDraft(null);
                },
              }
            : null
        }
        onSaveDraft={handleSaveLocalDraft}
        onDiscardChanges={handleDiscardEditorChanges}
        footerActions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={createArticle.isPending || updateArticle.isPending || isSubmittingArticle}
            onClick={() => void handleSubmitArticle('draft')}
          >
            Save draft
          </Button>
        }
      >
        <form id={editorFormId} onSubmit={handleFormSubmit} noValidate>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className={styles.formGroup}>
                  <label htmlFor={titleInputId} className={styles.formLabel}>
                    Title
                  </label>
                  <input
                    ref={titleInputRef}
                    id={titleInputId}
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g., The Architecture of Habit Loops"
                    value={formValues.title}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, title: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor={subtitleInputId} className={styles.formLabel}>
                    Subtitle
                  </label>
                  <input
                    id={subtitleInputId}
                    type="text"
                    className={styles.inputField}
                    placeholder="A one-line premise or thesis"
                    value={formValues.subtitle}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor={contentInputId} className={styles.formLabel}>
                    Prose essay (Markdown supported)
                  </label>
                  <textarea
                    ref={contentInputRef}
                    id={contentInputId}
                    rows={14}
                    required
                    className={`${styles.textareaField} ${styles.proseTextarea}`}
                    placeholder="Write your reflection here. Use ### for section headings and > for quotes..."
                    value={formValues.content}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, content: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                  />
                </div>
              </>
            }
            metadata={
              <>
                <div className={styles.formGroup}>
                  <label htmlFor={categorySelectId} className={styles.formLabel}>
                    Category
                  </label>
                  <select
                    id={categorySelectId}
                    className={styles.selectField}
                    value={formValues.category}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        category: e.target.value as BlogCategory,
                      }))
                    }
                  >
                    <option value="ideas_and_perspectives">Ideas &amp; perspectives</option>
                    <option value="personal_stories">Personal stories</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor={authorshipSelectId} className={styles.formLabel}>
                    Authorship
                  </label>
                  <select
                    id={authorshipSelectId}
                    className={styles.selectField}
                    value={formValues.authorship}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        authorship: e.target.value as BlogAuthorship,
                      }))
                    }
                  >
                    <option value="by_hiep">By Hiep</option>
                    <option value="saved_from_others">Saved from others</option>
                  </select>
                </div>

                {formValues.authorship === 'saved_from_others' && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor={authorNameInputId} className={styles.formLabel}>
                        Original author name
                      </label>
                      <input
                        id={authorNameInputId}
                        type="text"
                        className={styles.inputField}
                        placeholder="e.g., Andy Matuschak"
                        value={formValues.authorName}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, authorName: e.target.value }))
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor={commentaryInputId} className={styles.formLabel}>
                        Hiep&apos;s personal commentary
                      </label>
                      <textarea
                        id={commentaryInputId}
                        rows={3}
                        className={styles.textareaField}
                        placeholder="Why did this piece resonate with you?"
                        value={formValues.commentary}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, commentary: e.target.value }))
                        }
                      />
                    </div>
                  </>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor={shortVersionInputId} className={styles.formLabel}>
                    The short version (executive summary)
                  </label>
                  <textarea
                    id={shortVersionInputId}
                    rows={3}
                    className={styles.textareaField}
                    placeholder="A concise 2-sentence executive summary..."
                    value={formValues.shortVersion}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, shortVersion: e.target.value }))
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor={tagsInputId} className={styles.formLabel}>
                    Tags (comma separated)
                  </label>
                  <input
                    id={tagsInputId}
                    type="text"
                    className={styles.inputField}
                    placeholder="Habits, Focus, Learning"
                    value={formValues.tags}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor={sourceInputId} className={styles.formLabel}>
                    Original source URL (optional)
                  </label>
                  <input
                    id={sourceInputId}
                    type="url"
                    className={styles.inputField}
                    placeholder="https://..."
                    value={formValues.originalSourceUrl}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, originalSourceUrl: e.target.value }))
                    }
                  />
                </div>

                <p className={styles.metaHint}>
                  Save server drafts or publish directly in this Writing Room.
                </p>

                <Image
                  src="/visuals/blogs-hub/woodland-typewriter.svg"
                  alt=""
                  aria-hidden="true"
                  width={320}
                  height={280}
                  unoptimized
                  className={styles.typewriterArt}
                />
              </>
            }
          />
        </form>
      </LargeEditorDialog>
    </div>
  );

  if (!existingTheme) {
    return <FeatureThemeProvider name="blogs-hub">{viewContent}</FeatureThemeProvider>;
  }

  return viewContent;
}
