const ALLOWED_HOSTS = [
  "books.google.com",
  "books.googleusercontent.com",
  "covers.openlibrary.org",
  "static01.nyt.com",
  "firebasestorage.googleapis.com",
];

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.some(
    (allowed) =>
      hostname === allowed ||
      hostname.endsWith(`.${allowed}`)
  );
}

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const imageUrl =
      searchParams.get("url");

    if (!imageUrl) {
      return new Response(
        "Missing image URL",
        {
          status: 400,
        }
      );
    }

    let parsedUrl;

    try {
      parsedUrl =
        new URL(imageUrl);
    } catch {
      return new Response(
        "Invalid URL",
        {
          status: 400,
        }
      );
    }

    if (
      parsedUrl.protocol !==
      "https:"
    ) {
      return new Response(
        "Only HTTPS images are allowed",
        {
          status: 400,
        }
      );
    }

    if (
      !isAllowedHost(
        parsedUrl.hostname
      )
    ) {
      console.warn(
        "Blocked cover host:",
        parsedUrl.hostname
      );

      return new Response(
        `Cover host not allowed: ${parsedUrl.hostname}`,
        {
          status: 403,
        }
      );
    }

    const response =
      await fetch(
        parsedUrl.toString(),
        {
          headers: {
            Accept:
              "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",

            "User-Agent":
              "Mozilla/5.0",
          },

          cache: "force-cache",
        }
      );

    if (!response.ok) {
      return new Response(
        "Could not fetch image",
        {
          status:
            response.status,
        }
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/jpeg";

    if (
      !contentType.startsWith(
        "image/"
      )
    ) {
      return new Response(
        "URL is not an image",
        {
          status: 400,
        }
      );
    }

    const buffer =
      await response.arrayBuffer();

    return new Response(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Cache-Control":
            "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        },
      }
    );
  } catch (error) {
    console.error(
      "Book cover proxy error:",
      error
    );

    return new Response(
      "Image proxy error",
      {
        status: 500,
      }
    );
  }
}