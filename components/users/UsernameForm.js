"use client";

import { useState } from "react";

export default function UsernameForm({ action, currentUsername }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(err.message || "Could not save the username.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-2">
      <label className="text-sm font-medium text-[#20180f]">
        Public username
        <input
          name="username"
          defaultValue={currentUsername || ""}
          placeholder="e.g. mia_reads"
          disabled={loading}
          className="mt-1.5 h-11 w-full rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-[#20180f] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save username"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
