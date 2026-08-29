export default function RatingStars({ rating }) {
  if (rating === null || rating === undefined) {
    return null;
  }

  return (
    <span className="text-[10px] tracking-wide text-[#c96a1f]">
      {"★".repeat(Math.round(rating))} {rating.toFixed(1)}
    </span>
  );
}
