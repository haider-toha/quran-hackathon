import type { ReactNode, SVGProps } from "react";

export type IconProps = {
  size?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox">;

function makeIcon(paths: ReactNode) {
  function IconComponent({ size = 16, className, ...rest }: IconProps) {
    const hasLabel = typeof rest["aria-label"] === "string" && rest["aria-label"].length > 0;
    return (
      <svg
        {...rest}
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden={hasLabel ? undefined : true}
        role={hasLabel ? "img" : undefined}
      >
        {paths}
      </svg>
    );
  }
  return IconComponent;
}

export const BookIcon = makeIcon(
  <>
    <path d="M2.5 2.5h6.5a3 3 0 0 1 3 3v8a2 2 0 0 0-2-2H2.5z" />
    <path d="M13.5 2.5H7a3 3 0 0 0-3 3v8a2 2 0 0 1 2-2h7.5z" />
  </>,
);

export const SparkleIcon = makeIcon(
  <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2" />,
);

export const PenIcon = makeIcon(
  <>
    <path d="M12.5 2.5l1 1L5 12l-2.5.5L3 10z" />
    <path d="M11 4l1 1" />
  </>,
);

export const LibraryIcon = makeIcon(
  <>
    <rect x="2.5" y="2.5" width="2" height="11" />
    <rect x="6" y="2.5" width="2" height="11" />
    <path d="M10.5 3l3 .8-2.4 9.5-3-.8z" />
  </>,
);

export const CompassIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M10.5 5.5L9 9l-3.5 1.5L7 7z" />
  </>,
);

export const SourceIcon = makeIcon(
  <>
    <ellipse cx="8" cy="3.5" rx="5.5" ry="1.5" />
    <path d="M2.5 3.5v9c0 .8 2.5 1.5 5.5 1.5s5.5-.7 5.5-1.5v-9" />
    <path d="M2.5 8c0 .8 2.5 1.5 5.5 1.5s5.5-.7 5.5-1.5" />
  </>,
);

export const SettingsIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M1 8h2M13 8h2M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" />
  </>,
);

export const SearchIcon = makeIcon(
  <>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L13.5 13.5" />
  </>,
);

export const ChevronDownIcon = makeIcon(<path d="M4 6l4 4 4-4" />);
export const ChevronRightIcon = makeIcon(<path d="M6 4l4 4-4 4" />);
export const ChevronLeftIcon = makeIcon(<path d="M10 4l-4 4 4 4" />);

export const SidebarIcon = makeIcon(
  <>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />
  </>,
);

export const XIcon = makeIcon(<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />);
export const PlusIcon = makeIcon(<path d="M8 3v10M3 8h10" />);
export const CheckIcon = makeIcon(<path d="M3 8.5L6.5 12 13 4.5" />);

export const PlayIcon = makeIcon(<path d="M5 3.5l7 4.5-7 4.5z" fill="currentColor" />);

export const PauseIcon = makeIcon(
  <>
    <rect x="4" y="3" width="3" height="10" fill="currentColor" stroke="none" />
    <rect x="9" y="3" width="3" height="10" fill="currentColor" stroke="none" />
  </>,
);

export const BookmarkIcon = makeIcon(<path d="M4 2.5h8v11l-4-2.5L4 13.5z" />);

export const SaveIcon = makeIcon(
  <>
    <path d="M3 2.5h8.5L13.5 4.5v9h-11z" />
    <path d="M5 2.5v3h6v-3M5 13.5v-4h6v4" />
  </>,
);

export const CopyIcon = makeIcon(
  <>
    <rect x="5" y="5" width="9" height="9" rx="1" />
    <path d="M5 11H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2" />
  </>,
);

export const LinkIcon = makeIcon(
  <>
    <path d="M6.5 9.5L9.5 6.5" />
    <path d="M7 4l1.5-1.5a3 3 0 0 1 4 4L11 8" />
    <path d="M9 12l-1.5 1.5a3 3 0 0 1-4-4L5 8" />
  </>,
);

export const ExternalIcon = makeIcon(<path d="M9 3h4v4M13 3l-6 6M5 4H3v9h9v-2" />);

export const AlertWarnIcon = makeIcon(
  <>
    <path d="M8 1.5l6.5 11.5h-13z" />
    <path d="M8 6v3M8 11v.5" />
  </>,
);

export const AlertInfoIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7v4M8 5v.5" />
  </>,
);

export const SunIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" />
  </>,
);

export const MoonIcon = makeIcon(<path d="M13 9.5A6 6 0 0 1 6.5 3a6 6 0 1 0 6.5 6.5z" />);

export const TypeIcon = makeIcon(<path d="M2.5 4V2.5h11V4M5 13.5h6M8 2.5v11" />);

export const Heading1Icon = makeIcon(<path d="M2 3v10M2 8h6M8 3v10M11 5l1.5-1v9" />);

export const Heading2Icon = makeIcon(
  <path d="M2 3v10M2 8h5M7 3v10M10 6a1.5 1.5 0 0 1 3 0c0 2-3 3-3 5h3" />,
);

export const BoldIcon = makeIcon(
  <path d="M4 3h4a2.5 2.5 0 0 1 0 5H4zM4 8h5a2.5 2.5 0 0 1 0 5H4z" />,
);

export const ItalicIcon = makeIcon(<path d="M6 3h6M4 13h6M9.5 3l-3 10" />);

export const QuoteIcon = makeIcon(
  <path
    d="M3 5a2 2 0 0 1 2-2v2H4v2a2 2 0 0 0 2 2H4v3H3zM9 5a2 2 0 0 1 2-2v2h-1v2a2 2 0 0 0 2 2h-2v3H9z"
    fill="currentColor"
    stroke="none"
  />,
);

export const TagIcon = makeIcon(
  <>
    <path d="M2 7l5-5h6v6l-5 5z" />
    <circle cx="9.5" cy="6.5" r="1" />
  </>,
);

export const FolderIcon = makeIcon(
  <path d="M2 4a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />,
);

export const FilterIcon = makeIcon(<path d="M2 3h12l-4.5 6V13L6.5 11.5V9z" />);

export const GridIcon = makeIcon(
  <>
    <rect x="2.5" y="2.5" width="4.5" height="4.5" />
    <rect x="9" y="2.5" width="4.5" height="4.5" />
    <rect x="2.5" y="9" width="4.5" height="4.5" />
    <rect x="9" y="9" width="4.5" height="4.5" />
  </>,
);

export const ListIcon = makeIcon(<path d="M2.5 4h11M2.5 8h11M2.5 12h11" />);

export const HeadphonesIcon = makeIcon(
  <>
    <path d="M2.5 11V8a5.5 5.5 0 0 1 11 0v3" />
    <path d="M2.5 11a1.5 1.5 0 0 1 1.5-1.5h.5v3.5H4A1.5 1.5 0 0 1 2.5 11.5z" />
    <path d="M11.5 11a1.5 1.5 0 0 1 1.5-1.5h.5v3.5H13a1.5 1.5 0 0 1-1.5-1.5z" />
  </>,
);

export const VideoIcon = makeIcon(
  <>
    <rect x="2" y="4" width="9" height="8" rx="1" />
    <path d="M11 7l3-2v6l-3-2" />
  </>,
);

export const ArticleIcon = makeIcon(
  <>
    <rect x="2.5" y="2" width="9" height="12" rx="1" />
    <path d="M5 5h4M5 8h4M5 11h2.5" />
  </>,
);

export const ArrowRightIcon = makeIcon(<path d="M3 8h10M9 4l4 4-4 4" />);

export const ReflectIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 2.5v11M2.5 8h11" />
  </>,
);

export const ShieldIcon = makeIcon(
  <path d="M8 1.5l5.5 2v4.5c0 3-2.3 5.5-5.5 6.5C4.8 13.5 2.5 11 2.5 8V3.5z" />,
);

export const EyeIcon = makeIcon(
  <>
    <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="1.8" />
  </>,
);

export const NoteIcon = makeIcon(
  <>
    <path d="M3 2.5h7.5L13 5v8.5H3z" />
    <path d="M10.5 2.5V5H13" />
  </>,
);

export const WandIcon = makeIcon(
  <path d="M3 13l8.5-8.5M11 2l1 1M13 4l1 1M3 6l1.5.5L4 8l-1.5-.5zM10 11l1.5.5L11 13l-1.5-.5z" />,
);

export const InsertIcon = makeIcon(<path d="M8 2v9M5 8l3 3 3-3M2.5 13.5h11" />);

export const TableIcon = makeIcon(
  <>
    <rect x="2" y="3" width="12" height="10" rx="1" />
    <path d="M2 7h12M8 7v6" />
  </>,
);

export const MoreIcon = makeIcon(
  <>
    <circle cx="3.5" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="8" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const SendIcon = makeIcon(<path d="M2 8L14 2L9.5 14L8 9z" />);

export const StopIcon = makeIcon(
  <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" stroke="none" />,
);

export const AdjustIcon = makeIcon(
  <>
    <path d="M3 4h7M12 4h1M3 12h7M12 12h1M3 8h2M7 8h6" />
    <circle cx="11" cy="4" r="1.2" />
    <circle cx="6" cy="8" r="1.2" />
    <circle cx="11" cy="12" r="1.2" />
  </>,
);

export const QuestionIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6.5a2 2 0 0 1 4 0c0 1.5-2 1.5-2 3M8 12v.5" />
  </>,
);

export const TimeIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l2.5 1.5" />
  </>,
);

export const LayersIcon = makeIcon(
  <>
    <path d="M8 2L2 5l6 3 6-3z" />
    <path d="M2 8l6 3 6-3" />
    <path d="M2 11l6 3 6-3" />
  </>,
);

export const ColumnsIcon = makeIcon(
  <>
    <rect x="2.5" y="2.5" width="4.5" height="11" />
    <rect x="9" y="2.5" width="4.5" height="11" />
  </>,
);

export const AlignLeftIcon = makeIcon(<path d="M2.5 4h11M2.5 7.5h7M2.5 11h11M2.5 14.5h6" />);

export const BellIcon = makeIcon(
  <>
    <path d="M3.5 11.5h9c-1-.7-1.5-1.7-1.5-3V7a3.5 3.5 0 0 0-7 0v1.5c0 1.3-.5 2.3-1.5 3z" />
    <path d="M6.5 11.5v.5a1.5 1.5 0 0 0 3 0v-.5" />
  </>,
);

export const LockIcon = makeIcon(
  <>
    <rect x="3.5" y="7.5" width="9" height="6" rx="1" />
    <path d="M5.5 7.5V5.5a2.5 2.5 0 0 1 5 0V7.5" />
  </>,
);

export const DownloadIcon = makeIcon(
  <>
    <path d="M8 2.5v8.5M5 8.5l3 3 3-3" />
    <path d="M2.5 13.5h11" />
  </>,
);

export const ShareIcon = makeIcon(
  <>
    <circle cx="12" cy="3.5" r="1.6" />
    <circle cx="4" cy="8" r="1.6" />
    <circle cx="12" cy="12.5" r="1.6" />
    <path d="M5.4 7.1l5.2-2.7M5.4 8.9l5.2 2.7" />
  </>,
);

// Node-graph icon — a centered hub with three peripheral nodes joined by
// thin radial lines. Mirrors the shape of the Phase 8 Journal map view.
export const MapIcon = makeIcon(
  <>
    <circle cx="8" cy="8" r="1.6" />
    <circle cx="3" cy="4" r="1.4" />
    <circle cx="13" cy="5" r="1.4" />
    <circle cx="9.5" cy="13" r="1.4" />
    <path d="M7 7L4 5M9 7l3-1.5M8.5 9.7L9 11.6" />
  </>,
);
