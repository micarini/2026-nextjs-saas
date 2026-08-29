function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export default function NotesList({ notes, addNoteAction, deleteNoteAction }) {
  return (
    <div className="mt-3 grid gap-3">
      <form action={addNoteAction} className="grid gap-2 rounded-md border border-[#e7dfcf] bg-white p-3">
        <textarea
          name="text"
          placeholder="Write a note..."
          className="min-h-20 resize-y rounded-md border border-[#e7dfcf] px-3 py-2 text-sm outline-none focus:border-[#c96a1f]"
          required
        />
        <div className="flex items-center gap-2">
          <input
            name="page"
            type="number"
            min="0"
            placeholder="Page (optional)"
            className="h-10 w-32 rounded-md border border-[#e7dfcf] px-3 text-sm outline-none focus:border-[#c96a1f]"
          />
          <button type="submit" className="h-10 flex-1 rounded-md bg-[#20180f] text-sm font-semibold text-white">
            Add note
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">No notes yet.</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="rounded-md border border-[#e7dfcf] bg-white p-3">
            <p className="whitespace-pre-wrap text-sm text-[#20180f]">{note.text}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#a89a7f]">
              <span>
                {formatDate(note.createdAt)}
                {note.page !== null ? ` · p. ${note.page}` : ""}
              </span>
              <form action={deleteNoteAction.bind(null, note.id)}>
                <button type="submit" className="text-red-700 underline">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
