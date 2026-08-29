export const GENRES = [
  { value: "fantasy", label: "Fantasy" },
  { value: "romance", label: "Romance" },
  { value: "mystery_thriller", label: "Mystery & Thriller" },
  { value: "horror", label: "Horror" },
  { value: "science_fiction", label: "Science Fiction" },
  { value: "classic", label: "Classic" },
  { value: "historical", label: "Historical" },
  { value: "non_fiction", label: "Non-fiction" },
  { value: "biography", label: "Biography" },
  { value: "poetry", label: "Poetry" },
  { value: "young_adult", label: "Young Adult" },
  { value: "self_help", label: "Self-help" },
];

export function genreLabel(value) {
  return GENRES.find((genre) => genre.value === value)?.label || GENRES[0].label;
}
