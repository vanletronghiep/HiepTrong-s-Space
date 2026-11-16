'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import { Bold as BoldIcon, List as BulletListIcon } from 'lucide-react';
import {
  noteMarkdownToProseMirrorJson,
  proseMirrorJsonToNoteMarkdown,
  type ProseMirrorNodeJson,
} from '@/domain/note-format';
import { cn } from './cn';

export interface RichNoteEditorProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  maxLength?: number;
  minHeightClassName?: string;
  error?: boolean;
  className?: string;
}

export function RichNoteEditor({
  id,
  value,
  onChange,
  placeholder = 'Write formatted notes...',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  disabled = false,
  maxLength,
  minHeightClassName = 'min-h-[112px]',
  error = false,
  className,
}: RichNoteEditorProps) {
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const lastSyncedMarkdownRef = useRef<string>(value);
  const isReadyRef = useRef<boolean>(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [formatState, setFormatState] = useState({
    bold: false,
    bulletList: false,
    isEmpty: value.trim().length === 0,
  });

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      BulletList,
      ListItem,
      HardBreak,
      History,
    ],
    content: noteMarkdownToProseMirrorJson(value) as JSONContent,
    editorProps: {
      attributes: {
        id: editorId,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
        ...(error ? { 'aria-invalid': 'true' } : {}),
        class: cn(
          'outline-none w-full px-3 py-2.5 text-[length:var(--fs-small)] leading-[var(--lh-body)] text-ws-text',
          '[&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul+p]:mt-2 [&_p+ul]:mt-2 [&_strong]:font-semibold',
          minHeightClassName,
        ),
      },
    },
    onCreate: () => {
      lastSyncedMarkdownRef.current = value;
      queueMicrotask(() => {
        isReadyRef.current = true;
      });
    },
    onUpdate: ({ editor: activeEditor, transaction }) => {
      if (!isReadyRef.current || !transaction.docChanged) {
        return;
      }
      const markdown = proseMirrorJsonToNoteMarkdown(
        activeEditor.getJSON() as ProseMirrorNodeJson,
      );
      if (markdown === lastSyncedMarkdownRef.current) {
        return;
      }
      lastSyncedMarkdownRef.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const syncToolbarState = () => {
      setFormatState({
        bold: editor.isActive('bold'),
        bulletList: editor.isActive('bulletList'),
        isEmpty: editor.isEmpty,
      });
    };

    syncToolbarState();
    editor.on('transaction', syncToolbarState);
    editor.on('selectionUpdate', syncToolbarState);

    return () => {
      editor.off('transaction', syncToolbarState);
      editor.off('selectionUpdate', syncToolbarState);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.view.composing) {
      return;
    }
    if (value === lastSyncedMarkdownRef.current) {
      return;
    }
    lastSyncedMarkdownRef.current = value;
    editor.commands.setContent(noteMarkdownToProseMirrorJson(value) as JSONContent, {
      emitUpdate: false,
    });
    setFormatState({
      bold: editor.isActive('bold'),
      bulletList: editor.isActive('bulletList'),
      isEmpty: value.trim().length === 0,
    });
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const dom = editor.view.dom as HTMLElement;
    let pendingDomValue: string | null = null;
    Object.defineProperty(dom, 'value', {
      configurable: true,
      get: () => pendingDomValue ?? lastSyncedMarkdownRef.current,
      set: (nextValue: unknown) => {
        pendingDomValue = typeof nextValue === 'string' ? nextValue : String(nextValue ?? '');
      },
    });
    const handleDomValueEvent = () => {
      if (pendingDomValue === null) {
        return;
      }
      const normalized = pendingDomValue;
      pendingDomValue = null;
      lastSyncedMarkdownRef.current = normalized;
      isReadyRef.current = true;
      editor.commands.setContent(noteMarkdownToProseMirrorJson(normalized) as JSONContent, {
        emitUpdate: false,
      });
      setFormatState({
        bold: editor.isActive('bold'),
        bulletList: editor.isActive('bulletList'),
        isEmpty: normalized.trim().length === 0,
      });
      onChangeRef.current(normalized);
    };
    dom.addEventListener('change', handleDomValueEvent);
    dom.addEventListener('input', handleDomValueEvent);
    return () => {
      dom.removeEventListener('change', handleDomValueEvent);
      dom.removeEventListener('input', handleDomValueEvent);
    };
  }, [editor]);

  const nearLimit =
    typeof maxLength === 'number' && maxLength > 0 && value.length > Math.floor(maxLength * 0.85);
  const overLimit = typeof maxLength === 'number' && maxLength > 0 && value.length > maxLength;

  return (
    <div
      className={cn(
        'rounded-item border bg-ws-surface transition-[border-color,box-shadow] duration-[var(--dur-fast)]',
        error || overLimit
          ? 'border-tint-overdue-border focus-within:ring-2 focus-within:ring-[var(--status-overdue)]'
          : 'border-ws-border focus-within:border-ws-accent',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Note formatting"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-ws-border px-2.5 py-1.5 bg-[color-mix(in_srgb,var(--ws-bg)_48%,var(--ws-surface))] rounded-t-item"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || !editor}
            aria-label="Bold"
            aria-pressed={formatState.bold}
            title="Bold (Ctrl/Cmd+B)"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              'inline-flex h-8 min-w-[32px] items-center justify-center rounded-sm px-2 text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-fast)]',
              formatState.bold
                ? 'bg-ws-accent-soft text-ws-text border border-ws-accent'
                : 'text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text border border-transparent',
            )}
          >
            <BoldIcon size={14} aria-hidden="true" />
            <span className="ml-1.5">Bold</span>
          </button>

          <button
            type="button"
            disabled={disabled || !editor}
            aria-label="Bullet list"
            aria-pressed={formatState.bulletList}
            title="Bullet list (- )"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={cn(
              'inline-flex h-8 min-w-[32px] items-center justify-center rounded-sm px-2 text-[length:var(--fs-small)] font-medium cursor-pointer transition-colors duration-[var(--dur-fast)]',
              formatState.bulletList
                ? 'bg-ws-accent-soft text-ws-text border border-ws-accent'
                : 'text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text border border-transparent',
            )}
          >
            <BulletListIcon size={14} aria-hidden="true" />
            <span className="ml-1.5">Bullets</span>
          </button>
        </div>

        <span className="text-[length:var(--fs-micro)] text-ws-text-muted">
          {nearLimit && maxLength ? (
            <span className={overLimit ? 'text-text-overdue font-medium' : undefined}>
              {value.length}/{maxLength}
            </span>
          ) : (
            'Bold · Lists'
          )}
        </span>
      </div>

      <div className="relative">
        {formatState.isEmpty && value.length === 0 ? (
          <p
            aria-hidden="true"
            className="pointer-events-none absolute top-2.5 left-3 right-3 m-0 text-[length:var(--fs-small)] leading-[var(--lh-body)] text-ws-text-muted opacity-75 select-none"
          >
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
