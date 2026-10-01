// Maps the free-text genre tags that book providers return ("Historical
// Fiction", "Dark Academia", "Juvenile Fiction"...) onto the twelve
// canonical genres in genres.js.
//
// Two rules that matter:
//
// 1. Provider order wins. Hardcover/Google Books list tags roughly by
//    relevance, so the first tag that maps is the best answer — matching
//    against the canonical list in its own order instead would make
//    "Classics, Romance, ..." come back as Romance just because romance
//    sits earlier in genres.js.
//
// 2. More specific patterns are checked first. "Science Fiction" has to
//    resolve to science_fiction before the bare "science" → non_fiction
//    rule gets a chance at it.

const PATTERNS = [
  ["science_fiction", ["science fiction", "sci-fi", "scifi", "dystopian", "space opera"]],
  ["historical", ["historical", "history"]],
  ["young_adult", ["young adult", "juvenile", "middle grade"]],
  ["mystery_thriller", ["mystery", "thriller", "crime", "detective", "suspense", "noir"]],
  ["fantasy", ["fantasy", "magic"]],
  ["romance", ["romance", "romantic"]],
  ["horror", ["horror", "gothic"]],
  ["classic", ["classic", "literary fiction"]],
  ["biography", ["biography", "memoir", "autobiography"]],
  ["poetry", ["poetry", "poems", "verse"]],
  ["self_help", ["self-help", "self help", "personal development", "productivity"]],
  ["non_fiction", [
    "non-fiction",
    "nonfiction",
    "science",
    "philosophy",
    "psychology",
    "anthropology",
    "essays",
    "politics",
    "economics",
    "business",
    "travel",
  ]],
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchOne(rawGenre) {
  const text = normalize(rawGenre);

  if (!text) {
    return null;
  }

  for (const [canonical, patterns] of PATTERNS) {
    if (patterns.some((pattern) => text.includes(normalize(pattern)))) {
      return canonical;
    }
  }

  return null;
}

// Accepts either an array of tags or a comma-separated string (the shape
// the preview page receives through the URL). Returns a canonical genre
// value, or null when nothing recognisable came back — callers decide
// what to do with that rather than getting a misleading default.
export function matchGenre(genres) {
  const list = Array.isArray(genres)
    ? genres
    : String(genres || "").split(",");

  for (const raw of list) {
    const match = matchOne(raw);

    if (match) {
      return match;
    }
  }

  return null;
}
