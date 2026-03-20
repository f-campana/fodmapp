"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";

import { Button } from "@fodmapp/ui/button";
import { Input } from "@fodmapp/ui/input";

import { landingCopy } from "../content/landing";

type SuccessWaitlistResult = {
  ok: true;
};

type ErrorWaitlistResult = {
  ok: false;
  code: "bad_request" | "invalid_email" | "server_error";
};

type WaitlistResult = SuccessWaitlistResult | ErrorWaitlistResult;

const errorMessages: Record<ErrorWaitlistResult["code"], string> = {
  invalid_email: landingCopy.waitlist.invalidEmailMessage,
  server_error: landingCopy.waitlist.serverErrorMessage,
  bad_request: landingCopy.waitlist.invalidEmailMessage,
};

type FormState = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

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
        data-waitlist-state="success"
        data-waitlist-panel="success"
        className="marketing-waitlist-success rounded-[var(--fd-base-radius-lg)] border border-[var(--fd-semantic-color-border-subtle)] bg-[var(--fd-semantic-color-surface-muted)] px-4 py-3 text-[var(--fd-semantic-color-text-primary)]"
      >
        {landingCopy.waitlist.successMessage}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="marketing-waitlist-form mt-4 grid gap-3"
      data-waitlist-state={status}
    >
      <label
        htmlFor="waitlist-email"
        className="marketing-label"
        data-waitlist-label="true"
      >
        {landingCopy.waitlist.emailLabel}
      </label>
      <div className="marketing-inline-form" data-waitlist-controls="true">
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setEmail(event.currentTarget.value)
          }
          placeholder="prenom.nom@exemple.com"
          aria-invalid={status === "error" && error ? "true" : "false"}
          className="marketing-email-input h-11"
          data-waitlist-input="true"
          required
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
          role="alert"
          className="marketing-waitlist-error text-sm text-[var(--fd-semantic-color-validation-error-text)]"
          data-waitlist-feedback="error"
        >
          {error}
        </p>
      ) : null}
      <p className="marketing-privacy-note" data-waitlist-note="true">
        {landingCopy.waitlist.note}
      </p>
    </form>
  );
}
