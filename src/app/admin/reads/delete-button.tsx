"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRead } from "./actions";

/**
 * Hard delete has no restrictions and no undo (ui-specification.md
 * §2.8), unlike every other admin action in this app, which is
 * "immediate, no confirmation" by design (workflows.md §5.4's
 * low-stakes reasoning doesn't really apply to an irreversible
 * delete) — a native confirm() is a pragmatic, low-complexity safety
 * net here specifically.
 */
export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this read permanently? This cannot be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteRead(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="destructive-button"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
