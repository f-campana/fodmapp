"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useMemo,
  useState,
} from "react";

import { Button } from "@fodmapp/ui/button";
import { Input } from "@fodmapp/ui/input";

import { landingCopy } from "../content/landing";

type WaitlistErrorCode = "bad_request" | "invalid_email" | "server_error";

type WaitlistResult = { ok: true } | { ok: false; code: WaitlistErrorCode };

type WaitlistFallbackState = "success" | "invalid_email" | "server_error";

const errorMessages = {
  invalid_email: landingCopy.waitlist.invalidEmailMessage,
  server_error: landingCopy.waitlist.serverErrorMessage,
  bad_request: landingCopy.waitlist.invalidEmailMessage,
} satisfies Record<WaitlistErrorCode, string>;

type FormState = "idle" | "submitting" | "success" | "error";

type WaitlistFormProps = {
  initialResult?: WaitlistFallbackState | null;
};

function initialFormStatus(
  initialResult: WaitlistFallbackState | null,
): FormState {
  if (initialResult === "success") {
    return "success";
  }

  if (initialResult === "invalid_email" || initialResult === "server_error") {
    return "error";
  }

  return "idle";
}

function initialErrorMessage(
  initialResult: WaitlistFallbackState | null,
): string | null {
  if (initialResult === "invalid_email") {
    return landingCopy.waitlist.invalidEmailMessage;
  }

  if (initialResult === "server_error") {
    return landingCopy.waitlist.serverErrorMessage;
  }

  return null;
}

export function WaitlistForm({ initialResult = null }: WaitlistFormProps) {
  const ids = useId();
  const noteId = `${ids}-note`;
  const errorId = `${ids}-error`;
  const invalidEmailAutofocusProps =
    initialResult === "invalid_email" ? { autoFocus: true } : {};
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormState>(() =>
    initialFormStatus(initialResult),
  );
  const [error, setError] = useState<string | null>(() =>
    initialErrorMessage(initialResult),
  );

  const describedBy = useMemo(() => {
    return error ? `${noteId} ${errorId}` : noteId;
  }, [error, errorId, noteId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = (await response.json()) as WaitlistResult;

      if (payload.ok) {
        setStatus("success");
        return;
      }

      setError(errorMessages[payload.code]);
      setStatus("error");
    } catch {
      setError(landingCopy.waitlist.serverErrorMessage);
      setStatus("error");
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(event);
  };

  if (status === "success") {
    return (
      <p
        role="status"
        aria-live="polite"
        data-waitlist-state="success"
        data-waitlist-panel="success"
        className="marketing-waitlist-success rounded-lg border border-border-subtle bg-muted px-4 py-3 text-foreground"
      >
        {landingCopy.waitlist.successMessage}
      </p>
    );
  }

  return (
    <form
      action="/waitlist/submit"
      method="post"
      onSubmit={onSubmit}
      className="mt-4 grid gap-3"
      data-waitlist-state={status}
    >
      <label
        htmlFor="waitlist-email"
        className="w-full text-left text-sm font-normal text-muted-foreground"
        data-waitlist-label="true"
      >
        {landingCopy.waitlist.emailLabel}
      </label>
      <div
        className="flex items-stretch gap-2 max-[35.999rem]:flex-col"
        data-waitlist-controls="true"
      >
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setEmail(event.currentTarget.value);

            if (status !== "idle") {
              setStatus("idle");
            }

            if (error) {
              setError(null);
            }
          }}
          placeholder="prenom.nom@exemple.com"
          aria-invalid={status === "error" && error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-errormessage={error ? errorId : undefined}
          className="marketing-email-input h-11 min-w-0 flex-1"
          data-waitlist-input="true"
          required
          {...invalidEmailAutofocusProps}
        />
        <Button
          type="submit"
          disabled={status === "submitting"}
          className="marketing-submit-button h-full"
          data-waitlist-submit="true"
        >
          {status === "submitting" ? "Envoi..." : landingCopy.waitlist.cta}
        </Button>
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="marketing-waitlist-error text-sm text-validation-error-text"
          data-waitlist-feedback="error"
        >
          {error}
        </p>
      ) : null}
      <p
        id={noteId}
        className="mt-3 text-center text-[0.8125rem] text-muted-foreground italic"
        data-waitlist-note="true"
      >
        {landingCopy.waitlist.note}
      </p>
    </form>
  );
}
