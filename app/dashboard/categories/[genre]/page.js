import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";


import CategoryBookList from "@/components/books/CategoryBookList";
import BottomNav from "@/components/nav/BottomNav";


import {
  listUserBooks,
} from "@/lib/books/books";


import {
  getCategoryBooks,
  getCategoryConfig,
} from "@/lib/discovery/categories";


import {
  getCurrentUser,
} from "@/lib/firebase/session";


export const dynamic =
  "force-dynamic";


function BackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}


export default async function CategoryPage({
  params,
}) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/login");
  }


  const {
    genre,
  } =
    await params;


  const category =
    getCategoryConfig(
      genre
    );


  if (!category) {
    notFound();
  }


  const [
    books,
    userBooks,
  ] =
    await Promise.all([
      getCategoryBooks(
        genre,
        40
      ),

      listUserBooks(
        user.uid
      ),
    ]);


  return (
    <main className="min-h-screen bg-[#f5f3eb] pb-28 text-[#34343b]">

      {/* =====================================
          HEADER
      ====================================== */}

      <header
        className="
          sticky
          top-0
          z-30
          bg-[#36366f]
          px-5
          pb-5
          pt-5
          text-white
          shadow-[0_12px_30px_rgba(54,54,111,.14)]
        "
      >

        <div className="mx-auto max-w-2xl">

          <div className="grid grid-cols-[40px_1fr_40px] items-center">

            <Link
              href="/dashboard"
              aria-label="Back"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-white/[0.10]
                text-white
                transition
                hover:bg-white/[0.16]
                active:scale-95
              "
            >
              <BackIcon />
            </Link>


            <div className="px-3 text-center">

              <p
                className="
                  font-mono
                  text-[7px]
                  uppercase
                  tracking-[0.22em]
                  text-white/45
                "
              >
                Discover
              </p>


              <h1
                className="
                  mt-0.5
                  text-[21px]
                  font-semibold
                  tracking-[-0.035em]
                  text-white
                "
              >
                {
                  category.label
                }
              </h1>

            </div>


            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#c8e75b]
                font-mono
                text-[9px]
                font-semibold
                text-[#303427]
              "
            >
              {
                books.length
              }
            </div>

          </div>

        </div>

      </header>


      {/* =====================================
          INTRO
      ====================================== */}

      <section className="mx-auto max-w-2xl px-5 pb-5 pt-6">

        <div
          className="
            rounded-[24px]
            border
            border-[#e0ddd3]
            bg-[#fffefa]
            p-4
          "
        >

          <p
            className="
              font-mono
              text-[8px]
              uppercase
              tracking-[0.18em]
              text-[#88858d]
            "
          >
            {category.label} shelf
          </p>


          <p
            className="
              mt-1
              max-w-md
              text-[12px]
              leading-5
              text-[#68666e]
            "
          >
            Choose a reading status directly from the list. Your library updates without leaving this page.
          </p>

        </div>

      </section>


      {/* =====================================
          BOOKS
      ====================================== */}

      <section className="mx-auto max-w-2xl px-5">

        {books.length ? (

          <CategoryBookList
            books={
              books
            }

            userBooks={
              userBooks
            }

            categorySlug={
              genre
            }
          />

        ) : (

          <div
            className="
              rounded-[28px]
              border
              border-[#dedbd2]
              bg-[#fffefa]
              p-8
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-[#c8e75b]
                text-[#36366f]
              "
            >
              ✦
            </div>


            <h2 className="mt-4 text-lg font-semibold text-[#36366f]">
              No books found
            </h2>


            <p className="mt-1 text-xs text-[#88858d]">
              This shelf is unavailable right now.
            </p>

          </div>

        )}

      </section>


      <BottomNav
        active="home"
      />

    </main>
  );
}