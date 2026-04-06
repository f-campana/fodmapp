import { useMemo, useState } from "react";

import { useSignIn } from "@clerk/expo";

import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "../auth/useAuth";
import { Card, Screen, StateView } from "../components/ui";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    actions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    helper: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 22,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 17,
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputGroup: {
      gap: theme.spacing.xs,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    linkRow: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
    },
    linkText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    linkTextAccent: {
      color: colors.accentStrong,
      fontSize: 15,
      fontWeight: "700",
    },
    primaryAction: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: theme.radius.sm,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    primaryActionDisabled: {
      opacity: 0.5,
    },
    primaryActionLabel: {
      color: colors.accentFg,
      fontSize: 18,
      fontWeight: "700",
    },
    secondaryAction: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    secondaryActionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    status: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
    },
  });
}

export function SignInScreen({ onOpenSignUp }: { onOpenSignUp: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { configurationError } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const globalErrorMessage = errors.global?.[0]?.message ?? null;

  if (configurationError) {
    return <StateView message={configurationError} />;
  }

  const isBusy = fetchStatus === "fetching";
  const needsClientTrust = signIn.status === "needs_client_trust";

  const finalize = async () => {
    const { error } = await signIn.finalize();

    if (error) {
      setStatusMessage(error.message || "Could not finalize sign-in.");
      return;
    }

    setStatusMessage(null);
  };

  const handleSignIn = async () => {
    setStatusMessage(null);

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      setStatusMessage(error.message || "Could not sign in.");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const codeResult = await signIn.mfa.sendEmailCode();
      if (codeResult.error) {
        setStatusMessage(
          codeResult.error.message || "Could not send verification code.",
        );
        return;
      }

      setStatusMessage(
        "We sent a verification code to your email to confirm this device.",
      );
      return;
    }

    setStatusMessage("This account needs an additional sign-in step.");
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setStatusMessage(error.message || "Could not verify the code.");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
      return;
    }

    setStatusMessage(
      "Verification completed, but the session is not active yet.",
    );
  };

  return (
    <Screen
      title={needsClientTrust ? "Verify account" : "Sign in"}
      subtitle={
        needsClientTrust
          ? "Confirm this device to finish signing in."
          : "Use your Clerk account to unlock protected mobile routes."
      }
      scroll
    >
      <Card>
        {needsClientTrust ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="number-pad"
              onChangeText={setCode}
              placeholder="Enter the email code"
              placeholderTextColor={colors.textMuted}
              value={code}
            />
            <Text style={styles.helper}>
              Clerk requested email verification for this client binding.
            </Text>
            <View style={styles.actions}>
              <Pressable
                disabled={!code || isBusy}
                onPress={() => {
                  void handleVerify();
                }}
                style={({ pressed }) => [
                  styles.primaryAction,
                  (!code || isBusy) && styles.primaryActionDisabled,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.primaryActionLabel}>Verify</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void signIn.mfa.sendEmailCode();
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.secondaryActionLabel}>Send a new code</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void signIn.reset();
                  setCode("");
                  setStatusMessage(null);
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.secondaryActionLabel}>Start over</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmailAddress}
              placeholder="Enter email"
              placeholderTextColor={colors.textMuted}
              value={emailAddress}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
            />
            <Text style={styles.helper}>
              Protected mobile requests will start attaching your bearer token
              automatically after sign-in.
            </Text>
            <Pressable
              disabled={!emailAddress || !password || isBusy}
              onPress={() => {
                void handleSignIn();
              }}
              style={({ pressed }) => [
                styles.primaryAction,
                (!emailAddress || !password || isBusy) &&
                  styles.primaryActionDisabled,
                pressed ? { opacity: 0.8 } : null,
              ]}
            >
              <Text style={styles.primaryActionLabel}>Sign in</Text>
            </Pressable>
          </View>
        )}
      </Card>

      {statusMessage ? (
        <Text style={styles.status}>{statusMessage}</Text>
      ) : null}
      {globalErrorMessage ? (
        <Text style={styles.status}>{globalErrorMessage}</Text>
      ) : null}

      {!needsClientTrust ? (
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Need an account?</Text>
          <Pressable
            onPress={onOpenSignUp}
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
          >
            <Text style={styles.linkTextAccent}>Sign up</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
