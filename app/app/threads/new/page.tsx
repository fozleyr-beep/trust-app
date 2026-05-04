import { createThread } from "@/app/actions/threads";

export default function NewThreadPage() {
  return (
    <main className="mx-auto max-w-[40ch] px-6 py-20">
      <h1 className="font-serif text-[2rem] leading-[1.1]">New thread</h1>
      <p className="mt-4 text-[var(--color-ink-soft)]">
        Enter the email of someone who has already signed up. Add more
        addresses (comma- or newline-separated) for a group thread, up to 9
        recipients.
      </p>

      <form action={createThread} className="mt-10 space-y-6">
        <label className="block">
          <span className="block font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
            Recipient emails
          </span>
          <textarea
            name="recipientEmails"
            required
            autoComplete="off"
            rows={3}
            placeholder="alice@example.com, bob@example.com"
            className="mt-2 block w-full resize-none border border-[var(--color-ink)] bg-transparent px-4 py-3 text-[1.05rem] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <button
          type="submit"
          className="font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[var(--color-paper)] bg-[var(--color-ink)] px-5 py-3 hover:bg-[var(--color-accent)]"
        >
          Start thread
        </button>
      </form>
    </main>
  );
}
