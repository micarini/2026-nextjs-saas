// One-off asset builder for the onboarding cover wall.
//
//   node scripts/fetch-onboarding-covers.mjs
//
// Resolves each title below to an Open Library cover, downloads the
// medium jpg, shrinks it with `sips` (macOS built-in), and writes
// public/onboarding/covers/NN.jpg plus a covers.data.json manifest next
// to the hero component. Output is committed; this script is kept only
// for reproducibility.

import { execFile } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);

const BOOKS = [
  ["Pride and Prejudice", "Jane Austen"],
  ["Home Fire", "Kamila Shamsie"],
  ["The Tiger's Wife", "Tea Obreht"],
  ["Eyes Wide Open", "Isaac Lidsky"],
  ["Wild Flowers", "Peggy Frew"],
  ["Normal People", "Sally Rooney"],
  ["The Overstory", "Richard Powers"],
  ["Circe", "Madeline Miller"],
  ["The Song of Achilles", "Madeline Miller"],
  ["Klara and the Sun", "Kazuo Ishiguro"],
  ["Never Let Me Go", "Kazuo Ishiguro"],
  ["A Little Life", "Hanya Yanagihara"],
  ["The Secret History", "Donna Tartt"],
  ["The Goldfinch", "Donna Tartt"],
  ["Beloved", "Toni Morrison"],
  ["The Namesake", "Jhumpa Lahiri"],
  ["Interpreter of Maladies", "Jhumpa Lahiri"],
  ["The Road", "Cormac McCarthy"],
  ["Station Eleven", "Emily St. John Mandel"],
  ["The Left Hand of Darkness", "Ursula K. Le Guin"],
  ["A Wizard of Earthsea", "Ursula K. Le Guin"],
  ["The Handmaid's Tale", "Margaret Atwood"],
  ["Oryx and Crake", "Margaret Atwood"],
  ["Cloud Atlas", "David Mitchell"],
  ["The Wind-Up Bird Chronicle", "Haruki Murakami"],
  ["Norwegian Wood", "Haruki Murakami"],
  ["Kafka on the Shore", "Haruki Murakami"],
  ["The Vegetarian", "Han Kang"],
  ["Pachinko", "Min Jin Lee"],
  ["Half of a Yellow Sun", "Chimamanda Ngozi Adichie"],
  ["Americanah", "Chimamanda Ngozi Adichie"],
  ["The Poisonwood Bible", "Barbara Kingsolver"],
  ["Life of Pi", "Yann Martel"],
  ["The Night Circus", "Erin Morgenstern"],
  ["Piranesi", "Susanna Clarke"],
  ["The Shadow of the Wind", "Carlos Ruiz Zafon"],
  ["Wuthering Heights", "Emily Bronte"],
  ["Jane Eyre", "Charlotte Bronte"],
  ["Mrs Dalloway", "Virginia Woolf"],
  ["The Bell Jar", "Sylvia Plath"],
  ["Middlesex", "Jeffrey Eugenides"],
  ["The Corrections", "Jonathan Franzen"],
  ["White Teeth", "Zadie Smith"],
  ["On Beauty", "Zadie Smith"],
  ["Atonement", "Ian McEwan"],
  ["The Remains of the Day", "Kazuo Ishiguro"],
  ["Lincoln in the Bardo", "George Saunders"],
  ["The Underground Railroad", "Colson Whitehead"],
  ["Homegoing", "Yaa Gyasi"],
  ["Exit West", "Mohsin Hamid"],
];

const OUT_DIR = path.resolve("public/onboarding/covers");
const MANIFEST = path.resolve(
  "components/onboarding/hero/covers.data.json"
);

async function fetchRetry(url, opts, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, opts);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  throw lastErr;
}

async function coverId(title, author) {
  const url =
    "https://openlibrary.org/search.json?limit=3&title=" +
    encodeURIComponent(title) +
    "&author=" +
    encodeURIComponent(author);
  const res = await fetchRetry(url, { headers: { "User-Agent": "quire-tp" } });
  const data = await res.json();
  for (const doc of data?.docs ?? []) {
    if (doc.cover_i) return doc.cover_i;
  }
  return null;
}

async function download(id, dest) {
  const res = await fetchRetry(
    `https://covers.openlibrary.org/b/id/${id}-M.jpg`
  );
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1500) throw new Error(`cover ${id}: too small, likely blank`);
  await writeFile(dest, buf);
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];
  let n = 0;

  for (const [title, author] of BOOKS) {
    try {
      const id = await coverId(title, author);
      if (!id) {
        console.warn(`skip  ${title} — no cover`);
        continue;
      }
      n += 1;
      const file = `${String(n).padStart(2, "0")}.jpg`;
      const dest = path.join(OUT_DIR, file);
      await download(id, dest);
      await run("sips", [
        "-Z",
        "220",
        "-s",
        "formatOptions",
        "62",
        dest,
        "--out",
        dest,
      ]);
      manifest.push({ src: `/onboarding/covers/${file}`, title, author });
      console.log(`ok    ${file}  ${title}`);
    } catch (err) {
      console.warn(`skip  ${title} — ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n${manifest.length} covers -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
