import {
  Geist,
  Geist_Mono,
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Quire's own type system (used so far only by the new onboarding flow —
// see README-handoff.md). Left as additional variables rather than
// replacing Geist on `body`, so the rest of the app keeps its current look
// until each screen is migrated on its own step.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata = {
  title: "SaaS Starter",
  description: "Next.js server-side boilerplate with Firebase Auth",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        className="min-h-screen bg-zinc-950 text-zinc-100 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
