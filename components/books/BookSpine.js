"use client";

import {
  useEffect,
  useState,
} from "react";


const FALLBACK_COLORS = [
  "#59609A",
  "#6F9682",
  "#D67A67",
  "#E2B84F",
  "#BD7696",
  "#6487A4",
  "#C45F61",
  "#8974A6",
  "#D89150",
  "#527F78",
  "#B69A80",
  "#98AE74",
  "#CE7188",
  "#6967A0",
];


const colorCache =
  new Map();


/* ========================================
   HASH
======================================== */

function hashString(
  value = ""
) {
  let hash = 0;

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    hash =
      value.charCodeAt(i) +
      ((hash << 5) -
        hash);
  }

  return Math.abs(hash);
}


/* ========================================
   URL
======================================== */

function normalizeCoverUrl(
  url
) {
  if (!url) {
    return "";
  }

  return String(
    url
  ).replace(
    /^http:\/\//i,
    "https://"
  );
}


function getProxyUrl(url) {
  const normalized =
    normalizeCoverUrl(url);

  if (!normalized) {
    return "";
  }

  return `/api/book-cover?url=${encodeURIComponent(
    normalized
  )}`;
}


/* ========================================
   COLOR HELPERS
======================================== */

function rgbToHex(
  r,
  g,
  b
) {
  return (
    "#" +
    [r, g, b]
      .map((value) =>
        Math.max(
          0,
          Math.min(
            255,
            Math.round(
              value
            )
          )
        )
          .toString(16)
          .padStart(
            2,
            "0"
          )
      )
      .join("")
  );
}


function hexToRgb(hex) {
  const clean =
    String(hex)
      .replace(
        "#",
        ""
      )
      .trim();

  if (
    clean.length !== 6
  ) {
    return {
      r: 80,
      g: 80,
      b: 80,
    };
  }

  return {
    r: parseInt(
      clean.slice(
        0,
        2
      ),
      16
    ),

    g: parseInt(
      clean.slice(
        2,
        4
      ),
      16
    ),

    b: parseInt(
      clean.slice(
        4,
        6
      ),
      16
    ),
  };
}


function getContrastColor(
  hex
) {
  const { r, g, b } =
    hexToRgb(hex);

  const luminance =
    0.299 * r +
    0.587 * g +
    0.114 * b;

  return luminance > 160
    ? "#272625"
    : "#FFFFFF";
}


function darkenColor(
  hex,
  amount = 0.18
) {
  const { r, g, b } =
    hexToRgb(hex);

  return rgbToHex(
    r *
      (1 - amount),

    g *
      (1 - amount),

    b *
      (1 - amount)
  );
}


/* ========================================
   COLOR NORMALIZATION
======================================== */

function normalizeDominantColor(
  r,
  g,
  b
) {
  const brightness =
    0.299 * r +
    0.587 * g +
    0.114 * b;

  /*
   * Si queda demasiado oscuro,
   * aclaramos conservando el tono.
   */

  if (
    brightness < 55
  ) {
    const factor =
      1.5;

    return rgbToHex(
      Math.min(
        255,
        r * factor
      ),

      Math.min(
        255,
        g * factor
      ),

      Math.min(
        255,
        b * factor
      )
    );
  }

  /*
   * Si es demasiado claro,
   * lo oscurecemos un poco.
   */

  if (
    brightness > 215
  ) {
    const factor =
      0.76;

    return rgbToHex(
      r * factor,
      g * factor,
      b * factor
    );
  }

  return rgbToHex(
    r,
    g,
    b
  );
}


/* ========================================
   DETECT DOMINANT COLOR
======================================== */

function extractDominantColor(
  image
) {
  const width = 60;
  const height = 90;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    width;

  canvas.height =
    height;

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      }
    );

  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const {
    data,
  } =
    ctx.getImageData(
      0,
      0,
      width,
      height
    );

  const buckets =
    new Map();

  /*
   * Saltamos algunos píxeles.
   *
   * No necesitamos analizar absolutamente
   * todos para encontrar el tono general.
   */

  for (
    let i = 0;
    i < data.length;
    i += 8
  ) {
    const r =
      data[i];

    const g =
      data[i + 1];

    const b =
      data[i + 2];

    const alpha =
      data[i + 3];

    if (
      alpha < 180
    ) {
      continue;
    }

    const brightness =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    /*
     * No dejamos que blanco o negro
     * puro dominen simplemente porque
     * hay mucho texto/fondo.
     */

    if (
      brightness > 242 ||
      brightness < 18
    ) {
      continue;
    }

    const max =
      Math.max(
        r,
        g,
        b
      );

    const min =
      Math.min(
        r,
        g,
        b
      );

    const saturation =
      max - min;

    /*
     * Colores demasiado grises reciben
     * menos peso.
     */

    let saturationWeight =
      1 +
      saturation / 120;

    if (
      saturation < 18
    ) {
      saturationWeight *=
        0.45;
    }

    /*
     * Quantization.
     *
     * Agrupa azules parecidos,
     * rojos parecidos, etc.
     */

    const step = 28;

    const qr =
      Math.min(
        255,
        Math.round(
          r / step
        ) * step
      );

    const qg =
      Math.min(
        255,
        Math.round(
          g / step
        ) * step
      );

    const qb =
      Math.min(
        255,
        Math.round(
          b / step
        ) * step
      );

    const key =
      `${qr}-${qg}-${qb}`;

    const bucket =
      buckets.get(
        key
      ) || {
        score: 0,
        r: 0,
        g: 0,
        b: 0,
        count: 0,
      };

    bucket.score +=
      saturationWeight;

    bucket.r += r;
    bucket.g += g;
    bucket.b += b;

    bucket.count +=
      1;

    buckets.set(
      key,
      bucket
    );
  }

  if (
    buckets.size === 0
  ) {
    return null;
  }

  let winner =
    null;

  buckets.forEach(
    (bucket) => {
      if (
        !winner ||
        bucket.score >
          winner.score
      ) {
        winner =
          bucket;
      }
    }
  );

  if (
    !winner ||
    !winner.count
  ) {
    return null;
  }

  const r =
    winner.r /
    winner.count;

  const g =
    winner.g /
    winner.count;

  const b =
    winner.b /
    winner.count;

  return normalizeDominantColor(
    r,
    g,
    b
  );
}


/* ========================================
   COVER COLOR HOOK
======================================== */

function useCoverColor(
  coverUrl,
  fallbackColor
) {
  const originalUrl =
    normalizeCoverUrl(
      coverUrl
    );

  const proxyUrl =
    getProxyUrl(
      coverUrl
    );

  const [
    detected,
    setDetected,
  ] = useState({
    url: null,
    color: null,
  });


  let currentColor =
    fallbackColor;


  if (
    originalUrl &&
    colorCache.has(
      originalUrl
    )
  ) {
    currentColor =
      colorCache.get(
        originalUrl
      );
  } else if (
    detected.url ===
      originalUrl &&
    detected.color
  ) {
    currentColor =
      detected.color;
  }


  useEffect(() => {
    if (
      !originalUrl ||
      !proxyUrl
    ) {
      return;
    }

    if (
      colorCache.has(
        originalUrl
      )
    ) {
      return;
    }

    let cancelled =
      false;

    const image =
      new Image();

    /*
     * IMPORTANTE:
     *
     * Ya NO usamos:
     *
     * image.crossOrigin = "anonymous"
     *
     * porque ahora la imagen viene
     * de nuestro propio /api/book-cover.
     */

    image.onload = () => {
      if (
        cancelled
      ) {
        return;
      }

      try {
        const dominant =
          extractDominantColor(
            image
          );

        if (!dominant) {
          return;
        }

        colorCache.set(
          originalUrl,
          dominant
        );

        setDetected({
          url:
            originalUrl,

          color:
            dominant,
        });
      } catch (error) {
        console.warn(
          "Could not analyse book cover:",
          originalUrl,
          error
        );
      }
    };


    image.onerror =
      () => {
        /*
         * Si la API no consigue descargar
         * la portada simplemente dejamos
         * el fallback.
         */
      };


    /*
     * ESTA ES LA PARTE IMPORTANTE.
     *
     * El navegador ya no habla directamente
     * con Google Books / NYT.
     */

    image.src =
      proxyUrl;


    return () => {
      cancelled =
        true;
    };
  }, [
    originalUrl,
    proxyUrl,
  ]);


  return currentColor;
}


/* ========================================
   BOOK SPINE
======================================== */

export default function BookSpine({
  book,
  index = 0,
  size = "large",
  isOpen = false,
  onToggle,
}) {
  const identifier =
    String(
      book.id || ""
    ) +
    String(
      book.title || ""
    );


  const hash =
    hashString(
      identifier
    );


  const fallbackColor =
    FALLBACK_COLORS[
      hash %
        FALLBACK_COLORS.length
    ];


  /*
   * COLOR DEL LOMO
   *
   * Ahora debería salir directamente
   * de la portada.
   */

  const spineColor =
    useCoverColor(
      book.coverUrl,
      fallbackColor
    );


  const textColor =
    getContrastColor(
      spineColor
    );


  const edgeColor =
    darkenColor(
      spineColor
    );


  const isLarge =
    size ===
    "large";


  const largeWidths = [
    30,
    34,
    27,
    38,
    31,
    35,
    29,
    40,
    33,
    28,
  ];


  const smallWidths = [
    22,
    25,
    20,
    28,
    23,
    26,
    21,
    27,
  ];


  const largeHeights = [
    150,
    166,
    143,
    174,
    157,
    169,
    146,
    178,
  ];


  const smallHeights = [
    92,
    104,
    88,
    108,
    96,
    102,
    90,
    106,
  ];


  const spineWidths =
    isLarge
      ? largeWidths
      : smallWidths;


  const heights =
    isLarge
      ? largeHeights
      : smallHeights;


  const spineWidth =
    spineWidths[
      index %
        spineWidths.length
    ];


  const height =
    heights[
      index %
        heights.length
    ];


  /*
   * La portada es bastante más ancha
   * que el lomo.
   */

  const coverWidth =
    Math.round(
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
    tilts[
      hash %
        tilts.length
    ];


  const originalCoverUrl =
    normalizeCoverUrl(
      book.coverUrl
    );


  /*
   * También usamos el proxy para mostrar
   * la portada.

   * Así evitamos que NYT / Google nos den
   * problemas de hotlinking o CORS.
   */

  const displayedCoverUrl =
    getProxyUrl(
      originalCoverUrl
    );


  return (
    <div
      className="
        relative
        shrink-0
        self-end
      "
      style={{
        width:
          isOpen
            ? `${coverWidth + 10}px`
            : `${spineWidth}px`,

        height:
          `${height}px`,

        transition:
          "width 520ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >

      <button
        type="button"

        onClick={() =>
          onToggle?.(
            book.id
          )
        }

        aria-pressed={
          isOpen
        }

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
          width:
            isOpen
              ? `${coverWidth}px`
              : `${spineWidth}px`,

          height:
            `${height}px`,

          perspective:
            "900px",

          transform:
            isOpen
              ? "rotate(0deg)"
              : `rotate(${tilt}deg)`,

          transformOrigin:
            "bottom center",

          transition:
            "width 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >

        {/* ==========================
            LOMO
        =========================== */}

        <div
          className="
            absolute
            inset-y-0
            left-0
            overflow-hidden
            rounded-[3px_3px_1px_1px]
          "

          style={{
            width:
              `${spineWidth}px`,

            backgroundColor:
              spineColor,

            border:
              `1px solid ${edgeColor}`,

            opacity:
              isOpen
                ? 0
                : 1,

            transform:
              isOpen
                ? "rotateY(88deg) translateX(-8px)"
                : "rotateY(0deg)",

            transformOrigin:
              "left center",

            transition:
              "background-color 700ms ease, border-color 700ms ease, opacity 180ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",

            boxShadow:
              "2px 4px 8px rgba(35,32,50,0.18)",
          }}
        >

          {/* volumen */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
            "

            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,.18), transparent 22%, transparent 73%, rgba(255,255,255,.16))",
            }}
          />


          {/* línea superior */}

          <div
            className="
              absolute
              left-[4px]
              right-[4px]
              top-[5px]
              h-px
              opacity-30
            "

            style={{
              backgroundColor:
                textColor,
            }}
          />


          {/* TÍTULO */}

          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              px-[4px]
              py-3
            "
          >

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
                writingMode:
                  "vertical-rl",

                transform:
                  "rotate(180deg)",

                color:
                  textColor,

                maxHeight:
                  "88%",

                whiteSpace:
                  "nowrap",

                textOverflow:
                  "ellipsis",

                textShadow:
                  textColor ===
                  "#FFFFFF"
                    ? "0 1px 2px rgba(0,0,0,.25)"
                    : "none",
              }}
            >
              {book.title}
            </span>

          </div>


          {/* línea inferior */}

          <div
            className="
              absolute
              bottom-[6px]
              left-[5px]
              right-[5px]
              h-px
              opacity-30
            "

            style={{
              backgroundColor:
                textColor,
            }}
          />

        </div>


        {/* ==========================
            PORTADA
        =========================== */}

        <div
          className="
            absolute
            bottom-0
            left-0
            overflow-hidden
            rounded-[4px]
          "

          style={{
            width:
              `${coverWidth}px`,

            height:
              `${height}px`,

            opacity:
              isOpen
                ? 1
                : 0,

            transform:
              isOpen
                ? "rotateY(0deg) translateX(0)"
                : "rotateY(-82deg) translateX(-15px)",

            transformOrigin:
              "left center",

            transition:
              "opacity 220ms ease 90ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",

            boxShadow:
              isOpen
                ? "8px 14px 28px rgba(33,31,53,0.28)"
                : "none",

            backgroundColor:
              spineColor,

            backfaceVisibility:
              "hidden",
          }}
        >

          {displayedCoverUrl ? (

            // eslint-disable-next-line @next/next/no-img-element

            <img
              src={
                displayedCoverUrl
              }

              alt={
                book.title ||
                "Book cover"
              }

              draggable="false"

              className="
                h-full
                w-full
                select-none
                object-cover
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
                backgroundColor:
                  spineColor,

                color:
                  textColor,
              }}
            >

              <span className="text-sm font-semibold leading-tight">
                {book.title}
              </span>

            </div>

          )}


          {/* luz portada */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-r
              from-white/10
              via-transparent
              to-black/5
            "
          />

        </div>

      </button>

    </div>
  );
}