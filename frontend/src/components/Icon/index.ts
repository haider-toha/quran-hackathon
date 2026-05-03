export type { IconProps } from "./Icon";
export {
  BookIcon,
  SparkleIcon,
  PenIcon,
  LibraryIcon,
  CompassIcon,
  SourceIcon,
  SettingsIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SidebarIcon,
  XIcon,
  PlusIcon,
  CheckIcon,
  PlayIcon,
  PauseIcon,
  BookmarkIcon,
  SaveIcon,
  CopyIcon,
  LinkIcon,
  ExternalIcon,
  AlertWarnIcon,
  AlertInfoIcon,
  SunIcon,
  MoonIcon,
  TypeIcon,
  Heading1Icon,
  Heading2Icon,
  BoldIcon,
  ItalicIcon,
  QuoteIcon,
  TagIcon,
  FolderIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  HeadphonesIcon,
  VideoIcon,
  ArticleIcon,
  ArrowRightIcon,
  ReflectIcon,
  ShieldIcon,
  EyeIcon,
  NoteIcon,
  WandIcon,
  InsertIcon,
  TableIcon,
  MoreIcon,
  SendIcon,
  StopIcon,
  AdjustIcon,
  QuestionIcon,
  TimeIcon,
  LayersIcon,
  ColumnsIcon,
  AlignLeftIcon,
  BellIcon,
  LockIcon,
} from "./Icon";

// String-keyed catalog so registries (templates, slash commands) can store
// an icon by name without dragging a React component into a constant.
// Consumers look up a component via this map at render time. Keep this in
// sync with the named exports above.
export type IconName =
  | "book"
  | "sparkle"
  | "pen"
  | "library"
  | "compass"
  | "source"
  | "settings"
  | "search"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "sidebar"
  | "x"
  | "plus"
  | "check"
  | "play"
  | "pause"
  | "bookmark"
  | "save"
  | "copy"
  | "link"
  | "external"
  | "alert-warn"
  | "alert-info"
  | "sun"
  | "moon"
  | "type"
  | "heading-1"
  | "heading-2"
  | "bold"
  | "italic"
  | "quote"
  | "tag"
  | "folder"
  | "filter"
  | "grid"
  | "list"
  | "headphones"
  | "video"
  | "article"
  | "arrow-right"
  | "reflect"
  | "shield"
  | "eye"
  | "note"
  | "wand"
  | "insert"
  | "table"
  | "more"
  | "send"
  | "stop"
  | "adjust"
  | "question"
  | "time"
  | "layers"
  | "columns"
  | "align-left"
  | "bell"
  | "lock";
