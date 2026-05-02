import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  InsertIcon,
  ItalicIcon,
  LinkIcon,
  MoreIcon,
  QuoteIcon,
  SparkleIcon,
  WandIcon,
} from "@/components/Icon";

export function NoteToolbar() {
  return (
    <div className="note-toolbar">
      <div className="toolbar-group">
        <button type="button" className="iconbtn" aria-label="Heading 1" title="Heading 1">
          <Heading1Icon size={14} />
        </button>
        <button type="button" className="iconbtn" aria-label="Heading 2" title="Heading 2">
          <Heading2Icon size={14} />
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" className="iconbtn" aria-label="Bold" title="Bold">
          <BoldIcon size={14} />
        </button>
        <button type="button" className="iconbtn" aria-label="Italic" title="Italic">
          <ItalicIcon size={14} />
        </button>
        <button type="button" className="iconbtn" aria-label="Quote" title="Quote">
          <QuoteIcon size={14} />
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" className="iconbtn" aria-label="Insert ayah" title="Insert ayah">
          <InsertIcon size={14} />
        </button>
        <button type="button" className="iconbtn" aria-label="Link to note" title="Link to note">
          <LinkIcon size={14} />
        </button>
      </div>

      <div className="toolbar-group ai">
        <button type="button" className="iconbtn" aria-label="AI assist" title="AI assist">
          <WandIcon size={14} />
        </button>
        <button type="button" className="iconbtn" aria-label="Summarize" title="Summarize">
          <SparkleIcon size={14} />
        </button>
      </div>

      <span style={{ flex: 1 }} />

      <button type="button" className="btn ghost sm" aria-label="More options">
        <MoreIcon size={13} />
      </button>
    </div>
  );
}
