"use client";

import { useEffect, useState, useTransition } from "react";
import {
  verifyPasscode,
  submitBorrowRequest,
  cancelRequestByToken,
} from "./borrow-actions";
import { formatQueuePosition } from "@/lib/borrowing/queue-position";

export type BorrowStep = "passcode" | "form" | "confirmation";

type ConfirmationData = {
  requestId: string;
  queuePosition: number;
  managementToken: string;
};

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
export function BorrowFlow({
  bookUuid,
  onStepChange,
  onClose,
}: {
  bookUuid: string;
  onStepChange: (step: BorrowStep) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<BorrowStep>("passcode");
  const [isPending, startTransition] = useTransition();

  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );

  // Deliberately NOT reset when bouncing back to the passcode step —
  // per workflows.md §3.3, already-typed field values are preserved
  // client-side across a token-expiry bounce.
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [realNameError, setRealNameError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    onStepChange(step);
  }, [step, onStepChange]);

  function handlePasscodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasscodeError(null);
    startTransition(async () => {
      const result = await verifyPasscode(passcode);
      if (!result.ok) {
        setPasscodeError(result.error);
        return;
      }
      setVerificationToken(result.verificationToken);
      setStep("form");
    });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setRealNameError(null);
    setNicknameError(null);

    if (!verificationToken) {
      setStep("passcode");
      setPasscodeError("Please re-enter the passcode to continue.");
      return;
    }

    startTransition(async () => {
      const result = await submitBorrowRequest(
        verificationToken,
        realName,
        nickname,
        bookUuid,
      );

      if (result.status === "invalid_token") {
        setVerificationToken(null);
        setStep("passcode");
        setPasscodeError(
          "Your verification expired. Please re-enter the passcode.",
        );
        return;
      }
      if (result.status === "field_errors") {
        setRealNameError(result.realNameError);
        setNicknameError(result.nicknameError);
        return;
      }
      if (result.status === "duplicate") {
        setFormError(
          "You've just submitted a request for this book. Check your confirmation screen or contact the library owner if you've lost your link.",
        );
        return;
      }
      if (result.status === "book_unavailable") {
        setFormError("This book is no longer available in the catalogue.");
        return;
      }
      if (result.status === "error") {
        setFormError(result.message);
        return;
      }

      setConfirmation({
        requestId: result.requestId,
        queuePosition: result.queuePosition,
        managementToken: result.managementToken,
      });
      setStep("confirmation");
    });
  }

  function handleCopyLink() {
    if (!confirmation) return;
    const link = `${window.location.origin}/request/manage/${confirmation.managementToken}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCancel() {
    if (!confirmation) return;
    startTransition(async () => {
      const result = await cancelRequestByToken(confirmation.managementToken);
      if (result.status === "cancelled") {
        setCancelled(true);
        setCancelMessage("Your request has been cancelled.");
      } else if (result.status === "not_pending") {
        setCancelMessage(`This request is already ${result.currentStatus}.`);
      } else {
        setCancelMessage(
          "This request link is invalid or no longer available.",
        );
      }
    });
  }

  if (step === "passcode") {
    return (
      <form onSubmit={handlePasscodeSubmit}>
        <h2 className="text-xl mb-2">Enter the borrow passcode</h2>
        <label htmlFor="passcode" className="sr-only">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          disabled={isPending}
          className="border border-gray-400 px-2 py-1"
        />
        {passcodeError && (
          <p role="alert" className="text-sm mt-1">
            {passcodeError}
          </p>
        )}
        <div className="mt-3">
          <button type="submit" disabled={isPending}>
            {isPending ? "Checking…" : "Submit"}
          </button>
          <button type="button" onClick={onClose} className="ml-2">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (step === "form") {
    return (
      <form onSubmit={handleFormSubmit}>
        <h2 className="text-xl mb-2">Request to borrow</h2>

        <label htmlFor="realName">
          Your name (private, not shown publicly)
        </label>
        <input
          id="realName"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          disabled={isPending}
          className="border border-gray-400 px-2 py-1 block mb-1"
        />
        {realNameError && (
          <p role="alert" className="text-sm mb-2">
            {realNameError}
          </p>
        )}

        <label htmlFor="nickname">
          Nickname (shown publicly while book is on loan)
        </label>
        <input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={isPending}
          className="border border-gray-400 px-2 py-1 block mb-1"
        />
        {nicknameError && (
          <p role="alert" className="text-sm mb-2">
            {nicknameError}
          </p>
        )}

        {formError && (
          <p role="alert" className="text-sm mb-2">
            {formError}
          </p>
        )}

        <div className="mt-3">
          <button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit request"}
          </button>
          <button type="button" onClick={onClose} className="ml-2">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // step === "confirmation"
  if (!confirmation) return null;
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/request/manage/${confirmation.managementToken}`
      : "";

  return (
    <div>
      <h2 className="text-xl mb-2">Request submitted</h2>

      <div role="alert" className="border border-gray-400 p-2 mb-3 text-sm">
        Save this link now — it will not be shown again. If you lose it,
        contact the library owner directly to request a new one.
      </div>

      {cancelled ? (
        <p>{cancelMessage}</p>
      ) : (
        <>
          <p className="mb-2 break-all">{link}</p>
          <button type="button" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy link"}
          </button>

          <p className="mt-3">
            {formatQueuePosition(confirmation.queuePosition)}
          </p>

          {cancelMessage && <p role="alert">{cancelMessage}</p>}

          <button type="button" onClick={handleCancel} disabled={isPending}>
            Cancel request
          </button>
        </>
      )}
    </div>
  );
}