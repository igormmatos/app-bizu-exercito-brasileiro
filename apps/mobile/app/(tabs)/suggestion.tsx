import Constants from "expo-constants";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { submitSuggestion } from "@/src/lib/suggestionsApi";
import { colors } from "@/src/theme/tokens";

const MESSAGE_MAX = 2000;
const CATEGORY_OPTIONS = ["Conteudo", "Bug", "UX", "Outro"] as const;

type SubmitState = "idle" | "loading" | "sent" | "error";

export default function SuggestionScreen() {
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const messageLength = message.length;
  const isMessageValid = message.trim().length > 0 && messageLength <= MESSAGE_MAX;
  const isSubmitting = submitState === "loading";

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
      setErrorMessage("Mensagem obrigatoria.");
      return;
    }
    if (trimmedMessage.length > MESSAGE_MAX) {
      setSubmitState("error");
      setErrorMessage("A mensagem pode ter no maximo 2000 caracteres.");
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
      setErrorMessage("Nao foi possivel enviar. Verifique sua conexao.");
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
    <View style={styles.container}>
      <Text style={styles.title}>Sugestao</Text>
      <Text style={styles.subtitle}>Envie sugestoes para melhorar conteudo e experiencia.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Categoria (opcional)</Text>
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

        <Text style={styles.label}>Email (opcional)</Text>
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

        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          value={message}
          onChangeText={handleChangeMessage}
          placeholder="Digite sua sugestao"
          placeholderTextColor={colors.gray500}
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
          maxLength={MESSAGE_MAX}
        />
        <Text style={styles.counter}>
          {messageLength}/{MESSAGE_MAX}
        </Text>

        <Pressable
          style={[styles.button, !isMessageValid || isSubmitting ? styles.buttonDisabled : null]}
          onPress={() => void handleSubmit()}
          disabled={!isMessageValid || isSubmitting}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Enviando..." : "Enviar"}</Text>
        </Pressable>
      </View>

      {submitState === "sent" ? (
        <View style={styles.success}>
          <Text style={styles.successText}>Sugestao enviada com sucesso.</Text>
        </View>
      ) : null}

      {submitState === "error" ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: colors.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray700,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: 12,
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: colors.gray700,
    fontWeight: "600",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: colors.gray100,
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
    fontSize: 13,
    fontWeight: "600",
  },
  categoryButtonTextSelected: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 8,
    color: colors.gray900,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  counter: {
    textAlign: "right",
    fontSize: 12,
    color: colors.gray500,
  },
  button: {
    backgroundColor: colors.army600,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.gray500,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
  },
  success: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: 12,
  },
  successText: {
    color: colors.gray700,
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.pdfPrimary,
    padding: 12,
  },
  errorText: {
    color: colors.pdfPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
