"use client";

import Link from "next/link";

import {
  useRef,
  useState,
} from "react";


const QUICK_QUESTIONS = [
  {
    label: "Fantasy",
    query:
      "Recommend me an immersive fantasy book",
    style:
      "bg-[#C9E265] text-[#24271c]",
  },

  {
    label: "Popular books",
    query:
      "Recommend me popular books worth reading",
    style:
      "bg-[#333337] text-white",
  },

  {
    label: "Mysticism",
    query:
      "Books with elements of mysticism",
    style:
      "bg-[#7B4560] text-white",
  },

  {
    label: "Something emotional",
    query:
      "Recommend me an emotional and moving book",
    style:
      "bg-[#F2EFE7] text-[#242426]",
  },

  {
    label: "Short reads",
    query:
      "Recommend me a short book",
    style:
      "bg-[#322F7A] text-white",
  },

  {
    label: "Surprise me",
    query:
      "Surprise me with a great book",
    style:
      "bg-[#333337] text-white",
  },
];


function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}


function SparkleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 3c.7 5 3 7.3 8 8-5 .7-7.3 3-8 8-.7-5-3-7.3-8-8 5-.7 7.3-3 8-8Z" />
    </svg>
  );
}


function BookCard({
  book,
}) {
  return (
    <div className="group min-w-[116px] max-w-[116px]">

      <div className="relative aspect-[2/3] overflow-hidden rounded-[10px] bg-[#29292d] shadow-[0_12px_25px_rgba(0,0,0,.3)]">

        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#322F7A] p-3 text-center">

            <span className="text-xs font-semibold leading-tight">
              {book.title}
            </span>

          </div>
        )}

      </div>


      <p className="mt-3 line-clamp-2 text-[12px] font-semibold leading-[16px] text-white">
        {book.title}
      </p>


      <p className="mt-1 line-clamp-1 text-[10px] text-white/35">
        {book.author || "Unknown author"}
      </p>

    </div>
  );
}


export default function BookRecommendationBot({
  favoriteGenres = [],
  existingTitles = [],
}) {
  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [conversation, setConversation] =
    useState([]);

  const inputRef =
    useRef(null);


  async function askBot(
    question
  ) {
    const cleanQuestion =
      question.trim();

    if (
      !cleanQuestion ||
      loading
    ) {
      return;
    }


    setMessage("");

    setConversation(
      (current) => [
        ...current,

        {
          id:
            `${Date.now()}-user`,

          role:
            "user",

          text:
            cleanQuestion,
        },
      ]
    );


    setLoading(true);


    try {
      const response =
        await fetch(
          "/api/book-recommendations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  cleanQuestion,

                favoriteGenres,

                existingTitles,
              }),
          }
        );


      if (!response.ok) {
  const errorData =
    await response
      .json()
      .catch(() => null);

  console.error(
    "Recommendation API:",
    errorData
  );

  throw new Error(
    errorData?.error ||
      "Recommendation request failed"
  );
}

      const data =
        await response.json();


      setConversation(
        (current) => [
          ...current,

          {
            id:
              `${Date.now()}-assistant`,

            role:
              "assistant",

            text:
              data.reply,

            books:
              data.books || [],
          },
        ]
      );

    } catch (error) {

      console.error(
        error
      );


      setConversation(
        (current) => [
          ...current,

          {
            id:
              `${Date.now()}-error`,

            role:
              "assistant",

            text:
              "I couldn't find recommendations right now. Try asking me in a different way.",
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  function handleSubmit(
    event
  ) {
    event.preventDefault();

    askBot(message);
  }


  const hasConversation =
    conversation.length > 0;


  return (
    <div className="mx-auto flex min-h-[calc(100dvh-90px)] w-full max-w-3xl flex-col px-5 pb-7 pt-6">


      {/* ========================================
          TOP
      ========================================= */}

      <header className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9E265] text-[#25271e]">

            <SparkleIcon />

          </div>


          <span className="text-sm font-semibold">
            BookBot
          </span>

        </div>


        <Link
          href="/dashboard/library"
          className="rounded-full bg-white/[0.07] px-4 py-2 text-[11px] font-medium text-white/65 transition hover:bg-white/[0.12]"
        >
          View library
          <span className="ml-2">
            →
          </span>
        </Link>

      </header>


      {/* ========================================
          EMPTY / INTRO
      ========================================= */}

      {!hasConversation && (

        <section className="flex flex-1 flex-col justify-center py-12">

          <div className="max-w-[360px]">

            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
              Personal recommendations
            </p>


            <h1 className="text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-[55px]">
              Hi! What can
              <br />
              I recommend
              <br />
              to you?
            </h1>

          </div>


          {/* RECENT QUESTIONS */}

          <div className="mt-11">

            <p className="mb-3 text-[10px] font-medium text-white/35">
              Try asking:
            </p>


            <div className="flex max-w-[390px] flex-wrap gap-2">

              {QUICK_QUESTIONS.map(
                (item) => (

                  <button
                    key={
                      item.label
                    }
                    type="button"
                    onClick={() =>
                      askBot(
                        item.query
                      )
                    }
                    className={`
                      rounded-full
                      px-4
                      py-2.5
                      text-[11px]
                      font-medium
                      transition
                      hover:scale-[1.025]
                      active:scale-[0.98]
                      ${item.style}
                    `}
                  >
                    {item.label}
                  </button>

                )
              )}

            </div>

          </div>


          {/* PERSONALIZATION */}

          {favoriteGenres.length >
            0 && (

            <div className="mt-10">

              <p className="text-[10px] leading-5 text-white/25">
                Based on your library, you seem to enjoy{" "}
                <span className="text-white/55">
                  {favoriteGenres
                    .slice(
                      0,
                      3
                    )
                    .join(
                      ", "
                    )}
                </span>
                .
              </p>

            </div>

          )}

        </section>

      )}


      {/* ========================================
          CONVERSATION
      ========================================= */}

      {hasConversation && (

        <section className="flex-1 space-y-8 py-10">

          {conversation.map(
            (item) => (

              <div
                key={
                  item.id
                }
              >

                {item.role ===
                "user" ? (

                  <div className="ml-auto max-w-[82%]">

                    <div className="rounded-[22px] rounded-br-[6px] bg-[#C9E265] px-4 py-3 text-[13px] leading-5 text-[#25271e]">

                      {item.text}

                    </div>

                  </div>

                ) : (

                  <div>

                    <div className="mb-3 flex items-center gap-2">

                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#322F7A] text-[#C9E265]">

                        <SparkleIcon />

                      </div>


                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                        BookBot
                      </span>

                    </div>


                    <p className="max-w-[380px] text-[14px] leading-6 text-white/80">
                      {item.text}
                    </p>


                    {item.books?.length >
                      0 && (

                      <div className="-mx-5 mt-6 flex gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide">

                        {item.books.map(
                          (
                            book
                          ) => (

                            <BookCard
                              key={
                                book.id
                              }
                              book={
                                book
                              }
                            />

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}

              </div>

            )
          )}


          {/* LOADING */}

          {loading && (

            <div className="flex items-center gap-2 text-white/30">

              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9E265]" />

              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9E265] [animation-delay:120ms]" />

              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9E265] [animation-delay:240ms]" />

            </div>

          )}

        </section>

      )}


      {/* ========================================
          INPUT
      ========================================= */}

      <div className="sticky bottom-[86px] mt-auto pt-5">

        <form
          onSubmit={
            handleSubmit
          }
          className="flex items-center gap-2 rounded-[18px] border border-white/[0.06] bg-[#303034] p-2 shadow-[0_16px_35px_rgba(0,0,0,.28)]"
        >

          <input
            ref={
              inputRef
            }
            value={
              message
            }
            onChange={(
              event
            ) =>
              setMessage(
                event.target
                  .value
              )
            }
            placeholder="Ask BookBot..."
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30"
          />


          <button
            type="submit"
            disabled={
              !message.trim() ||
              loading
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              bg-[#C9E265]
              text-[#25271e]
              transition
              hover:scale-105
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <SendIcon />
          </button>

        </form>


        {hasConversation && (

          <button
            type="button"
            onClick={() => {
              setConversation(
                []
              );

              setTimeout(
                () =>
                  inputRef.current?.focus(),
                50
              );
            }}
            className="mx-auto mt-3 block text-[9px] uppercase tracking-[0.15em] text-white/20 transition hover:text-white/50"
          >
            Start new conversation
          </button>

        )}

      </div>

    </div>
  );
}