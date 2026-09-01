"use client";

import { useState } from "react";

export default function UsernameForm({
  action,
  currentUsername,
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(
        err.message || "Could not save the username."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
    >
      <div>
        <label
          htmlFor="username"
          className="text-sm font-medium text-[#2c3025]"
        >
          Public username
        </label>

        <p className="mt-1 text-xs text-[#858178]">
          This is how people will find your public profile.
        </p>

        <div className="relative mt-3">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#99958c]">
            @
          </span>

          <input
            id="username"
            name="username"
            defaultValue={currentUsername || ""}
            placeholder="mia_reads"
            disabled={loading}
            autoComplete="username"
            className="h-12 w-full rounded-2xl border border-[#e2ded5] bg-[#faf9f6] pl-9 pr-4 text-sm text-[#2c3025] outline-none transition placeholder:text-[#aaa69d] focus:border-[#59634f] focus:ring-2 focus:ring-[#59634f]/10 disabled:opacity-60"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-2xl bg-[#4f6549] text-sm font-medium text-white transition hover:bg-[#42563d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save username"}
      </button>

      {error ? (
        <p className="rounded-xl bg-[#fbefed] px-3 py-2 text-sm text-[#9a4f43]">
          {error}
        </p>
      ) : null}
    </form>
  );
}