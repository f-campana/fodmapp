import { useMemo, useState } from "react";

import { useSignUp } from "@clerk/expo";

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
    captchaHost: {
      minHeight: 2,
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

export function SignUpScreen({ onOpenSignIn }: { onOpenSignIn: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { configurationError } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const globalErrorMessage = errors.global?.[0]?.message ?? null;

  if (configurationError) {
    return <StateView message={configurationError} />;
  }

  const isBusy = fetchStatus === "fetching";
  const needsVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const finalize = async () => {
    const { error } = await signUp.finalize();

    if (error) {
      setStatusMessage(error.message || "Could not finalize sign-up.");
      return;
    }

    setStatusMessage(null);
  };

  const handleSignUp = async () => {
    setStatusMessage(null);

    const { error } = await signUp.password({
      emailAddress,
      password,
    });

    if (error) {
      setStatusMessage(error.message || "Could not create the account.");
      return;
    }

    const verification = await signUp.verifications.sendEmailCode();
    if (verification.error) {
      setStatusMessage(
        verification.error.message || "Could not send verification code.",
      );
      return;
    }

    setStatusMessage("We sent a verification code to your email.");
  };

  const handleVerify = async () => {
    setStatusMessage(null);

    const { error } = await signUp.verifications.verifyEmailCode({
      code,
    });

    if (error) {
      setStatusMessage(error.message || "Could not verify the code.");
      return;
    }

    if (signUp.status === "complete") {
      await finalize();
      return;
    }

    setStatusMessage(
      "Verification completed, but the account is not ready yet.",
    );
  };

  return (
    <Screen
      title={needsVerification ? "Verify account" : "Sign up"}
      subtitle={
        needsVerification
          ? "Confirm your email to finish creating the session."
          : "Create the minimal Clerk account needed for protected mobile routes."
      }
      scroll
    >
      <Card>
        {needsVerification ? (
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
              Clerk requires email verification before activating the first
              mobile session.
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
                  void signUp.verifications.sendEmailCode();
                }}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.secondaryActionLabel}>Send a new code</Text>
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
              placeholder="Choose password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
            />
            <Text style={styles.helper}>
              This lane stays Expo Go compatible and only uses Clerk&apos;s
              email/password flow.
            </Text>
            <Pressable
              disabled={!emailAddress || !password || isBusy}
              onPress={() => {
                void handleSignUp();
              }}
              style={({ pressed }) => [
                styles.primaryAction,
                (!emailAddress || !password || isBusy) &&
                  styles.primaryActionDisabled,
                pressed ? { opacity: 0.8 } : null,
              ]}
            >
              <Text style={styles.primaryActionLabel}>Create account</Text>
            </Pressable>
            <View nativeID="clerk-captcha" style={styles.captchaHost} />
          </View>
        )}
      </Card>

      {statusMessage ? (
        <Text style={styles.status}>{statusMessage}</Text>
      ) : null}
      {globalErrorMessage ? (
        <Text style={styles.status}>{globalErrorMessage}</Text>
      ) : null}

      {!needsVerification ? (
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account?</Text>
          <Pressable
            onPress={onOpenSignIn}
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
          >
            <Text style={styles.linkTextAccent}>Sign in</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
