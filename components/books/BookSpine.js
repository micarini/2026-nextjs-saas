"use client";

const BOOK_COLORS = [
  { bg: "#59609A", text: "#FFFFFF", edge: "#444A80" },
  { bg: "#C8E75B", text: "#303427", edge: "#AFCB48" },
  { bg: "#D67A67", text: "#FFFFFF", edge: "#BC6252" },
  { bg: "#E2B84F", text: "#352E20", edge: "#C99F39" },
  { bg: "#6F9682", text: "#FFFFFF", edge: "#587C69" },
  { bg: "#BD7696", text: "#FFFFFF", edge: "#A5607E" },
  { bg: "#6487A4", text: "#FFFFFF", edge: "#4E718D" },
  { bg: "#C45F61", text: "#FFFFFF", edge: "#AA4C4E" },
  { bg: "#8974A6", text: "#FFFFFF", edge: "#715E8E" },
  { bg: "#D89150", text: "#37291D", edge: "#BC763C" },
  { bg: "#527F78", text: "#FFFFFF", edge: "#3F6963" },
  { bg: "#B69A80", text: "#312923", edge: "#9C826A" },
  { bg: "#55596C", text: "#FFFFFF", edge: "#414555" },
  { bg: "#98AE74", text: "#2E3326", edge: "#80975D" },
  { bg: "#CE7188", text: "#FFFFFF", edge: "#B65A72" },
  { bg: "#6967A0", text: "#FFFFFF", edge: "#535184" },
];

function hashString(value = "") {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash =
      value.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export default function BookSpine({
  book,
  index = 0,
  size = "large",
  isOpen = false,
  onToggle,
}) {
  const identifier =
    String(book.id || "") +
    String(book.title || "");

  const hash = hashString(identifier);

  const color =
    BOOK_COLORS[hash % BOOK_COLORS.length];

  const isLarge = size === "large";

  const spineWidths = isLarge
    ? [30, 34, 27, 38, 31, 35, 29, 40, 33, 28]
    : [22, 25, 20, 28, 23, 26, 21, 27];

  const heights = isLarge
    ? [150, 166, 143, 174, 157, 169, 146, 178]
    : [92, 104, 88, 108, 96, 102, 90, 106];

  const spineWidth =
    spineWidths[index % spineWidths.length];

  const height =
    heights[index % heights.length];

  const coverWidth = Math.round(
    height * 0.66
  );

  const tilts = [
    -1.5,
    0,
    1,
    -0.7,
    1.4,
    0,
    -1,
    0.5,
  ];

  const tilt =
    tilts[hash % tilts.length];

  return (
    <div
      className="
        relative
        shrink-0
        self-end
      "
      style={{
        width: isOpen
          ? `${coverWidth + 10}px`
          : `${spineWidth}px`,

        height: `${height}px`,

        transition:
          "width 520ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle?.(book.id)}
        aria-pressed={isOpen}
        aria-label={
          isOpen
            ? `Close ${book.title}`
            : `Show cover of ${book.title}`
        }
        className="
          absolute
          bottom-0
          left-0
          border-0
          bg-transparent
          p-0
          text-left
          focus:outline-none
        "
        style={{
          width: isOpen
            ? `${coverWidth}px`
            : `${spineWidth}px`,

          height: `${height}px`,

          perspective: "900px",

          transform: isOpen
            ? "rotate(0deg)"
            : `rotate(${tilt}deg)`,

          transformOrigin: "bottom center",

          transition:
            "width 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* =========================
            LOMO
        ========================== */}

        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-[3px_3px_1px_1px]"
          style={{
            width: `${spineWidth}px`,

            backgroundColor: color.bg,

            border: `1px solid ${color.edge}`,

            opacity: isOpen ? 0 : 1,

            transform: isOpen
              ? "rotateY(88deg) translateX(-8px)"
              : "rotateY(0deg)",

            transformOrigin: "left center",

            transition:
              "opacity 180ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",

            boxShadow:
              "2px 4px 8px rgba(35,32,50,0.18)",
          }}
        >
          {/* sombra del lomo */}

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,.13), transparent 25%, transparent 72%, rgba(255,255,255,.12))",
            }}
          />

          {/* línea superior */}

          <div
            className="absolute left-[4px] right-[4px] top-[5px] h-px opacity-30"
            style={{
              backgroundColor: color.text,
            }}
          />

          {/* TITULO VERTICAL */}

          <div className="absolute inset-0 flex items-center justify-center px-[4px] py-3">
            <span
              className={`
                block
                overflow-hidden
                font-semibold
                uppercase
                tracking-[0.08em]
                ${
                  isLarge
                    ? "text-[8px]"
                    : "text-[6px]"
                }
              `}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                color: color.text,
                maxHeight: "90%",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {book.title}
            </span>
          </div>

          {/* detalle abajo */}

          <div
            className="absolute bottom-[6px] left-[5px] right-[5px] h-px opacity-30"
            style={{
              backgroundColor: color.text,
            }}
          />
        </div>

        {/* =========================
            PORTADA
        ========================== */}

        <div
          className="
            absolute
            bottom-0
            left-0
            overflow-hidden
            rounded-[4px]
          "
          style={{
            width: `${coverWidth}px`,
            height: `${height}px`,

            opacity: isOpen ? 1 : 0,

            transform: isOpen
              ? "rotateY(0deg) translateX(0)"
              : "rotateY(-82deg) translateX(-15px)",

            transformOrigin: "left center",

            transition:
              "opacity 220ms ease 90ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",

            boxShadow: isOpen
              ? "8px 14px 28px rgba(33,31,53,0.28)"
              : "none",

            backgroundColor: color.bg,

            backfaceVisibility: "hidden",
          }}
        >
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title || "Book cover"}
              draggable="false"
              className="
                h-full
                w-full
                object-cover
                select-none
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                p-4
                text-center
              "
              style={{
                backgroundColor: color.bg,
                color: color.text,
              }}
            >
              <span className="text-sm font-semibold leading-tight">
                {book.title}
              </span>
            </div>
          )}

          {/* pequeña luz sobre portada */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/5" />
        </div>
      </button>
    </div>
  );
}