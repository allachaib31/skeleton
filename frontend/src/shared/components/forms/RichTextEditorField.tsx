import { useEffect } from 'react';
import { Bold as BoldIcon, Heading2, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import UnderlineExtension from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import History from '@tiptap/extension-history';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';

interface RichTextEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  toolbarLabels: {
    bold: string;
    italic: string;
    underline: string;
    heading: string;
    bulletList: string;
    orderedList: string;
    undo: string;
    redo: string;
  };
}

const toolbarButtonClass = (active = false) =>
  [
    'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-white/10 bg-white/5 text-foreground hover:border-primary/50 hover:bg-primary/10',
  ].join(' ');

export function RichTextEditorField({ label, value, onChange, required, toolbarLabels }: RichTextEditorFieldProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Heading.configure({ levels: [2, 3] }),
      Bold,
      ItalicExtension,
      UnderlineExtension,
      BulletList,
      OrderedList,
      ListItem,
      History,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-40 w-full rounded-b-lg bg-white px-4 py-3 text-sm text-slate-950 outline-none [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </label>
      {editor && (
        <RichTextProvider editor={editor} dark>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-secondary">
            <div className="flex flex-wrap gap-2 border-b border-white/10 bg-white/5 p-2">
              <button type="button" className={toolbarButtonClass(editor.isActive('bold'))} title={toolbarLabels.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
                <BoldIcon size={16} />
              </button>
              <button type="button" className={toolbarButtonClass(editor.isActive('italic'))} title={toolbarLabels.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={16} />
              </button>
              <button type="button" className={toolbarButtonClass(editor.isActive('underline'))} title={toolbarLabels.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <Underline size={16} />
              </button>
              <button type="button" className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))} title={toolbarLabels.heading} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 size={16} />
              </button>
              <button type="button" className={toolbarButtonClass(editor.isActive('bulletList'))} title={toolbarLabels.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List size={16} />
              </button>
              <button type="button" className={toolbarButtonClass(editor.isActive('orderedList'))} title={toolbarLabels.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={16} />
              </button>
              <button type="button" className={toolbarButtonClass()} title={toolbarLabels.undo} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo2 size={16} />
              </button>
              <button type="button" className={toolbarButtonClass()} title={toolbarLabels.redo} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo2 size={16} />
              </button>
            </div>
            <EditorContent editor={editor} />
          </div>
        </RichTextProvider>
      )}
    </div>
  );
}
