import SelectSearchResultForm from "@/components/books/SelectSearchResultForm";

export default function BookSearchResults({ results }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {results.map((result, index) => (
        <SelectSearchResultForm
          key={`${result.source}-${result.isbn || result.title}-${index}`}
          result={result}
        >
          <button type="submit" className="w-full text-left">
            <div className="aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0]">
              {result.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.coverUrl}
                  alt={result.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-tight text-[#20180f]">
              {result.title}
            </p>
            <p className="text-[11px] text-[#a89a7f]">{result.author}</p>
          </button>
        </SelectSearchResultForm>
      ))}
    </div>
  );
}
