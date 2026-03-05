import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, WebContent } from "@/src/components/layout";
import { Card, PrimaryButton } from "@/src/components/ui";
import { submitSuggestion } from "@/src/lib/suggestionsApi";
import { colors } from "@/src/theme/tokens";

const MESSAGE_MAX = 2000;
const CATEGORY_OPTIONS = ["Conteúdo", "Bug", "UX", "Outro"] as const;

type SubmitState = "idle" | "loading" | "sent" | "error";

export default function SuggestionScreen() {
  const params = useLocalSearchParams<{
    prefillMessage?: string | string[];
    prefillCategory?: string | string[];
  }>();
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [prefillApplied, setPrefillApplied] = useState(false);

  const prefillMessage = pickParamValue(params.prefillMessage).trim();
  const prefillCategory = pickParamValue(params.prefillCategory).trim();

  const messageLength = message.length;
  const isMessageValid = message.trim().length > 0 && messageLength <= MESSAGE_MAX;
  const isSubmitting = submitState === "loading";

  useEffect(() => {
    if (prefillApplied) {
      return;
    }

    let hasApplied = false;

    if (prefillMessage && message.trim().length === 0) {
      setMessage(prefillMessage);
      hasApplied = true;
    }

    if (prefillCategory && !category) {
      const matchedCategory = CATEGORY_OPTIONS.find(
        (option) => option.toLowerCase() === prefillCategory.toLowerCase(),
      );
      if (matchedCategory) {
        setCategory(matchedCategory);
        hasApplied = true;
      }
    }

    if (hasApplied || (!prefillMessage && !prefillCategory)) {
      setPrefillApplied(true);
    }
  }, [prefillApplied, prefillMessage, prefillCategory, message, category]);

  function resetFeedback() {
    if (submitState !== "idle") {
      setSubmitState("idle");
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  async function handleSubmit() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitState("error");
      setErrorMessage("Mensagem obrigatória.");
      return;
    }
    if (trimmedMessage.length > MESSAGE_MAX) {
      setSubmitState("error");
      setErrorMessage("A mensagem pode ter no máximo 2000 caracteres.");
      return;
    }

    setSubmitState("loading");
    setErrorMessage("");

    const appVersion = Constants.expoConfig?.version ?? "";
    const device = `${Platform.OS} ${String(Platform.Version)}`;

    try {
      await submitSuggestion({
        message: trimmedMessage,
        category,
        contact,
        appVersion,
        device,
      });
      setCategory("");
      setContact("");
      setMessage("");
      setSubmitState("sent");
    } catch {
      setSubmitState("error");
      setErrorMessage("Não foi possível enviar. Verifique sua conexão.");
    }
  }

  function handleCategoryPress(option: (typeof CATEGORY_OPTIONS)[number]) {
    resetFeedback();
    setCategory((current) => (current === option ? "" : option));
  }

  function handleChangeContact(value: string) {
    resetFeedback();
    setContact(value);
  }

  function handleChangeMessage(value: string) {
    resetFeedback();
    setMessage(value);
  }

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <WebContent style={styles.container}>
        <Card style={styles.formCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbox-outline" size={18} color={colors.army600} />
          </View>
          <Text style={styles.title}>Enviar Sugestão</Text>
          <Text style={styles.subtitle}>Encontrou um erro ou tem uma ideia de bizu? Envie para nós.</Text>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryList}>
            {CATEGORY_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.categoryButton, category === option ? styles.categoryButtonSelected : null]}
                onPress={() => handleCategoryPress(option)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === option ? styles.categoryButtonTextSelected : null,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Seu email (opcional)</Text>
          <TextInput
            value={contact}
            onChangeText={handleChangeContact}
            placeholder="Seu email para retorno"
            placeholderTextColor={colors.gray500}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={200}
          />

          <Text style={styles.label}>Sua sugestão</Text>
          <TextInput
            value={message}
            onChangeText={handleChangeMessage}
            placeholder="Descreva sua sugestão, correção ou novo bizu..."
            placeholderTextColor={colors.gray500}
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            maxLength={MESSAGE_MAX}
          />

          <Text style={styles.counter}>
            {messageLength}/{MESSAGE_MAX}
          </Text>

          <PrimaryButton
            label={isSubmitting ? "Enviando..." : "Enviar Colaboração"}
            onPress={() => void handleSubmit()}
            disabled={!isMessageValid || isSubmitting}
          />

          <Text style={styles.footnote}>Sua sugestão será revisada pela administração antes de ser publicada.</Text>
        </Card>

        {submitState === "sent" ? (
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.army600} />
              <Text style={styles.feedbackText}>Sugestão enviada com sucesso.</Text>
            </View>
          </Card>
        ) : null}

        {submitState === "error" ? (
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackRow}>
              <Ionicons name="alert-circle" size={18} color={colors.pdfPrimary} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </Card>
        ) : null}
        </WebContent>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  container: {
    gap: 12,
    backgroundColor: colors.gray100,
  },
  formCard: {
    gap: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.army100,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.gray900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  categoryButtonSelected: {
    backgroundColor: colors.army600,
    borderColor: colors.army600,
  },
  categoryButtonText: {
    color: colors.gray700,
    fontSize: 12,
    fontWeight: "600",
  },
  categoryButtonTextSelected: {
    color: colors.white,
  },
  input: {
    minHeight: 44,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    color: colors.gray900,
    paddingHorizontal: 12,
  },
  textarea: {
    minHeight: 108,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    color: colors.gray900,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  counter: {
    textAlign: "right",
    fontSize: 12,
    color: colors.gray500,
    marginTop: -4,
  },
  footnote: {
    textAlign: "center",
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  feedbackCard: {
    paddingVertical: 10,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackText: {
    color: colors.gray700,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: colors.pdfPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});

function pickParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
