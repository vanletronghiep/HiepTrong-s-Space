'use client';

import { Dialog } from '@/ui/Dialog';

import React, { useRef, useState, useEffect, useId } from 'react';
import type { BlogArticle, BlogAuthorship, BlogCategory } from '@/contracts/blog';
import { useBlogArticles, useCreateBlogArticle, useUpdateBlogArticle } from '@/client/queries/blogs';
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

export function WritingRoomView() {
  const writeLocks = useRef(new Set<string>());
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');
  const [selectedAuthorship, setSelectedAuthorship] = useState<BlogAuthorship | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  // Write modal state
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftSubtitle, setDraftSubtitle] = useState<string>('');
  const [draftCategory, setDraftCategory] = useState<BlogCategory>('ideas_and_perspectives');
  const [draftAuthorship, setDraftAuthorship] = useState<BlogAuthorship>('by_hiep');
  const [draftAuthorName, setDraftAuthorName] = useState<string>('Hiep Trong');
  const [draftCommentary, setDraftCommentary] = useState<string>('');
  const [draftShortVersion, setDraftShortVersion] = useState<string>('');
  const [draftContent, setDraftContent] = useState<string>('');
  const [draftTags, setDraftTags] = useState<string>('');
  const [draftSourceUrl, setDraftSourceUrl] = useState('');
  const sourceInputId = useId();

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

  // Queries & Mutations
  const { data: articles = [], isLoading, isError: loadFailed, refetch } = useBlogArticles(
    selectedCategory !== 'all' ? selectedCategory : undefined,
    selectedAuthorship !== 'all' ? selectedAuthorship : undefined,
    selectedTag !== 'all' ? selectedTag : undefined,
  );
  const createArticle = useCreateBlogArticle();
  const updateArticle = useUpdateBlogArticle();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const closeWriting = () => {
    if (!unsaved || window.confirm('Close with unsaved changes? Save a draft first to keep it after reloading.')) setIsWriting(false);
  };
  const startNewPiece = () => {
    setEditingId(null);
    setDraftTitle('');
    setDraftSubtitle('');
    setDraftCategory('ideas_and_perspectives');
    setDraftAuthorship('by_hiep');
    setDraftAuthorName('Hiep Trong');
    setDraftCommentary('');
    setDraftShortVersion('');
    setDraftContent('');
    setDraftTags('');
    setDraftSourceUrl('');
    setUnsaved(false);
    setIsWriting(true);
  };
  const editArticle = (article: BlogArticle) => {
    setEditingId(article.id);
    setDraftTitle(article.title);
    setDraftSubtitle(article.subtitle);
    setDraftCategory(article.category);
    setDraftAuthorship(article.authorship);
    setDraftAuthorName(article.authorName);
    setDraftCommentary(article.commentary ?? '');
    setDraftShortVersion(article.shortVersion);
    setDraftContent(article.content);
    setDraftTags(article.tags.join(', '));
    setDraftSourceUrl(article.originalSourceUrl ?? '');
    setUnsaved(false);
    setIsWriting(true);
  };
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // Escape to close modals or exit reading view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isWriting && activeArticle) setActiveArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWriting, activeArticle]);

  // Filter articles by search query
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

  const handleSaveDraft = async (e: React.FormEvent, status: BlogArticle['status'] = 'published') => {
    e.preventDefault();
    if (!(e.currentTarget as HTMLElement).closest('form')?.reportValidity()) return;
    if (!draftTitle.trim() || !draftContent.trim()) return;

    const tagsArray = draftTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (writeLocks.current.has('createArticle')) return;
    writeLocks.current.add('createArticle');
    try {
      const input = {
        title: draftTitle.trim(),
        subtitle: draftSubtitle.trim(),
        category: draftCategory,
        authorship: draftAuthorship,
        authorName:
          draftAuthorship === 'by_hiep' ? 'Hiep Trong' : draftAuthorName.trim() || 'External author',
        commentary: draftCommentary.trim() || null,
        shortVersion: draftShortVersion.trim(),
        content: draftContent.trim(),
        tags: tagsArray,
        originalSourceUrl: draftSourceUrl.trim() || null,
        status,
      };
      const saved = editingId
        ? await updateArticle.mutateAsync({ id: editingId, patch: input })
        : await createArticle.mutateAsync(input);
      if (activeArticle?.id === editingId) setActiveArticle(saved);
      setEditingId(null);
      setUnsaved(false);
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createArticle');
    }

    setIsWriting(false);
    setDraftTitle('');
    setDraftSubtitle('');
    setDraftShortVersion('');
    setDraftContent('');
    setDraftCommentary('');
    setDraftTags('');
    setDraftSourceUrl('');
  };

  // Render prose paragraphs with basic markdown headers and blockquotes
  const renderProse = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx}>{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('> ')) {
        return <blockquote key={idx}>{trimmed.replace('> ', '')}</blockquote>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('1. ')) {
        const items = trimmed.split('\n');
        return (
          <ul key={idx}>
            {items.map((it, i) => (
              <li key={i}>{it.replace(/^[-*]|\d+\.\s*/, '').trim()}</li>
            ))}
          </ul>
        );
      }
      return <p key={idx}>{trimmed}</p>;
    });
  };

  if (loadFailed) return <div role="alert">Could not load this space. <button type="button" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {[createArticle, updateArticle].some(mutation => mutation.isError) && <p role="alert">The change could not be saved. Your input is retained; retry the action.</p>}
      {/* Editorial Header */}
      {!activeArticle && (
        <header className={styles.header}>
          <div className={styles.eyebrow}>
            <svg
              className={styles.eyebrowIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span>Wood, warmth & quiet prose</span>
          </div>

          <h1 className={styles.title}>The Writing Room</h1>
          <p className={styles.description}>
            Essays, architectural reflections, and personal perspectives. A calm space dedicated to
            deliberate long-form thinking, free from algorithmic feeds and distractions.
          </p>
        </header>
      )}

      {/* Reader Mode (when an article is selected) */}
      {activeArticle ? (
        <article className={styles.readerContainer}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setActiveArticle(null)}
            aria-label="Back to all articles"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>All articles</span>
          </button>

          <button type="button" className={styles.backBtn} onClick={() => editArticle(activeArticle)}>Edit piece</button>
          {/* Dateline Banner */}
          <div className={styles.datelineBanner}>
            <span>
              {activeArticle.status === 'draft' ? 'Draft saved' : 'Published'}{' '}
              {new Date(activeArticle.publishedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className={styles.datelineDot}>·</span>
            <span>By {activeArticle.authorName}</span>
            <span className={styles.datelineDot}>·</span>
            <span>{activeArticle.readingTimeMinutes} min read</span>
            <span className={styles.datelineDot}>·</span>
            <span style={{ textTransform: 'capitalize' }}>
              {activeArticle.category.replace(/_/g, ' ')}
            </span>
          </div>

          <h1 className={styles.readerTitle}>{activeArticle.title}</h1>
          {activeArticle.subtitle && (
            <p className={styles.readerSubtitle}>{activeArticle.subtitle}</p>
          )}

          {/* "The short version" executive answer box */}
          {activeArticle.shortVersion && (
            <div className={styles.shortVersionBox}>
              <h2 className={styles.shortVersionHeading}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>The short version</span>
              </h2>
              <p className={styles.shortVersionText}>{activeArticle.shortVersion}</p>
            </div>
          )}

          {/* Hiep's Commentary Callout (for saved articles) */}
          {activeArticle.commentary && (
            <div className={styles.commentaryBox}>
              <h2 className={styles.commentaryHeading}>
                <span>Hiep&apos;s commentary & takeaways</span>
              </h2>
              <p className={styles.commentaryText}>{activeArticle.commentary}</p>
            </div>
          )}

          {activeArticle.originalSourceUrl && /^https?:\/\//i.test(activeArticle.originalSourceUrl) && (
            <a href={activeArticle.originalSourceUrl} target="_blank" rel="noopener noreferrer">Original source</a>
          )}
          {/* Full Prose Body */}
          <div className={styles.proseContent}>{renderProse(activeArticle.content)}</div>

          {/* Sources and References List */}
          {activeArticle.sources && activeArticle.sources.length > 0 && (
            <footer className={styles.sourcesSection}>
              <h2 className={styles.sourcesTitle}>Sources & references</h2>
              <div className={styles.sourceList}>
                {activeArticle.sources.map((src, i) => (
                  <div key={i} className={styles.sourceItem}>
                    <span>[{i + 1}] </span>
                    {src.url ? (
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
        </article>
      ) : (
        /* Overview Mode */
        <>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
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

            <button
              type="button"
              className={styles.writeActionBtn}
              onClick={startNewPiece}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Write new piece</span>
            </button>
          </div>

          {/* Filter Chips */}
          <div className={styles.filterRow} role="radiogroup" aria-label="Category filter">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.filterBtn} ${selectedCategory === cat.value ? styles.filterBtnActive : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
                role="radio"
                aria-checked={selectedCategory === cat.value}
              >
                {cat.label}
              </button>
            ))}

            <span style={{ color: 'var(--ws-border)', margin: '0 4px' }}>|</span>

            {AUTHORSHIP_FILTERS.map((author) => (
              <button
                key={author.value}
                type="button"
                className={`${styles.filterBtn} ${selectedAuthorship === author.value ? styles.filterBtnActive : ''}`}
                onClick={() => setSelectedAuthorship(author.value)}
                role="radio"
                aria-checked={selectedAuthorship === author.value}
              >
                {author.label}
              </button>
            ))}
          </div>

          {/* Topic Tags Bar */}
          <div className={styles.filterRow} aria-label="Topic tags">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
              Topics:
            </span>
            <button
              type="button"
              className={`${styles.filterBtn} ${selectedTag === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedTag('all')}
            >
              All topics
            </button>
            {TOPIC_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.filterBtn} ${selectedTag === tag ? styles.filterBtnActive : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <section aria-labelledby="articles-heading">
            <h2 id="articles-heading" className="sr-only">
              Articles and essays
            </h2>

            {isLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                Opening the writing archives...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
                No articles match your current criteria.
              </div>
            ) : (
              <div className={styles.articlesGrid}>
                {filteredArticles.map((article) => (
                  <article role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); (() => setActiveArticle(article))(); } }}
                    key={article.id}
                    className={styles.articleCard}
                    onClick={() => setActiveArticle(article)}
                  >
                    <div>
                      <div className={styles.cardHeaderLine}>
                        <span className={styles.categoryBadge}>
                          {article.category === 'personal_stories'
                            ? 'Personal story'
                            : 'Ideas & perspectives'}
                        </span>
                        <span>{article.readingTimeMinutes} min read</span>
                      </div>

                      <h3 className={styles.cardTitle}>{article.title}</h3>
                      {article.status === 'draft' && <span>Draft</span>}
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

      {/* Write / Draft Modal */}
      {isWriting && (
        <Dialog open portal title={editingId ? "Edit piece" : "Draft a new piece"} className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={closeWriting}>
{[createArticle, updateArticle].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>

              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={closeWriting}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onChange={() => setUnsaved(true)} onSubmit={handleSaveDraft} className={styles.editorBody}>
              <div className={styles.formGroup}>
                <label htmlFor={titleInputId} className={styles.formLabel}>
                  Title
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., The Architecture of Habit Loops"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
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
                  value={draftSubtitle}
                  onChange={(e) => setDraftSubtitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor={categorySelectId} className={styles.formLabel}>
                    Category
                  </label>
                  <select
                    id={categorySelectId}
                    className={styles.selectField}
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value as BlogCategory)}
                  >
                    <option value="ideas_and_perspectives">Ideas & perspectives</option>
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
                    value={draftAuthorship}
                    onChange={(e) => setDraftAuthorship(e.target.value as BlogAuthorship)}
                  >
                    <option value="by_hiep">By Hiep</option>
                    <option value="saved_from_others">Saved from others</option>
                  </select>
                </div>
              </div>

              {draftAuthorship === 'saved_from_others' && (
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
                      value={draftAuthorName}
                      onChange={(e) => setDraftAuthorName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={commentaryInputId} className={styles.formLabel}>
                      Hiep&apos;s personal commentary
                    </label>
                    <input
                      id={commentaryInputId}
                      type="text"
                      className={styles.inputField}
                      placeholder="Why did this piece resonate with you?"
                      value={draftCommentary}
                      onChange={(e) => setDraftCommentary(e.target.value)}
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
                  className={styles.inputField}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="A concise 2-sentence executive summary..."
                  value={draftShortVersion}
                  onChange={(e) => setDraftShortVersion(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={contentInputId} className={styles.formLabel}>
                  Prose essay (Markdown supported)
                </label>
                <textarea
                  id={contentInputId}
                  required
                  className={styles.textareaField}
                  placeholder="Write your reflection here. Use ### for section headings and > for quotes..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
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
                  value={draftTags}
                  onChange={(e) => setDraftTags(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={sourceInputId} className={styles.formLabel}>Original source URL (optional)</label>
                <input id={sourceInputId} type="url" className={styles.inputField} value={draftSourceUrl} onChange={event => setDraftSourceUrl(event.target.value)} />
              </div>
              <p>Save drafts and publish locally in this Writing Room.</p>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeWriting}
                >
                  Close
                </button>
                <button type="button" className={styles.cancelBtn} disabled={createArticle.isPending || updateArticle.isPending}
                  onClick={(event) => void handleSaveDraft(event, 'draft')}>Save draft</button>
                <button
                  type="submit"
                  className={styles.publishBtn}
                  disabled={createArticle.isPending || updateArticle.isPending}
                >
                  {createArticle.isPending || updateArticle.isPending ? 'Saving...' : 'Publish to Writing Room'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

