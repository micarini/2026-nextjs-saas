// Shared between the onboarding genre picker (components/onboarding/OnboardingFlow.js)
// and the personalized Discover shelves on the dashboard. Deliberately not the
// same taxonomy as lib/books/genres.js (which drives the formal genre field
// on a book) — this is a looser "what do you like" list, and each entry also
// carries the Open Library subject slug + shelf accent color used to build a
// dashboard shelf out of that pick.
export const TASTE_TAGS = [
  { label: "Fantasy", subject: "fantasy", accentColor: "rgba(157, 111, 224, 0.8)" },
  { label: "Literary", subject: "literary_fiction", accentColor: "rgba(108, 99, 255, 0.8)" },
  { label: "Romance", subject: "romance", accentColor: "rgba(232, 85, 143, 0.8)" },
  { label: "Mystery", subject: "mystery", accentColor: "rgba(76, 111, 176, 0.8)" },
  { label: "Horror", subject: "horror", accentColor: "rgba(168, 50, 70, 0.8)" },
  { label: "Sci-fi", subject: "science_fiction", accentColor: "rgba(67, 184, 147, 0.8)" },
  { label: "Classic", subject: "classics", accentColor: "rgba(217, 138, 78, 0.8)" },
  { label: "Historical", subject: "historical_fiction", accentColor: "rgba(199, 148, 60, 0.8)" },
  { label: "Non-fiction", subject: "nonfiction", accentColor: "rgba(107, 122, 153, 0.8)" },
  { label: "Poetry", subject: "poetry", accentColor: "rgba(232, 93, 76, 0.8)" },
  { label: "YA", subject: "young_adult_fiction", accentColor: "rgba(232, 138, 158, 0.8)" },
  { label: "Self-help", subject: "self-help", accentColor: "rgba(122, 155, 118, 0.8)" },
];

// Used on the dashboard when the user skipped the genre step (or somehow
// has none saved) — a small, varied starter set rather than nothing.
export const DEFAULT_TASTE_LABELS = ["Fantasy", "Romance", "Classic", "Sci-fi", "Non-fiction", "YA"];

export function tasteTagsFor(labels) {
  const wanted = labels && labels.length ? labels : DEFAULT_TASTE_LABELS;

  return wanted
    .map((label) => TASTE_TAGS.find((tag) => tag.label === label))
    .filter(Boolean);
}
