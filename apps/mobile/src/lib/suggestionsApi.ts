import { supabase } from "./supabaseClient";

export type SubmitSuggestionInput = {
  message: string;
  category?: string;
  contact?: string;
  appVersion?: string;
  device?: string;
};

export async function submitSuggestion(input: SubmitSuggestionInput): Promise<void> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message is required.");
  }
  if (message.length > 2000) {
    throw new Error("Message exceeds max length.");
  }

  const category = input.category?.trim();
  const contact = input.contact?.trim();
  const appVersion = input.appVersion?.trim();
  const device = input.device?.trim();

  const { error } = await supabase.from("suggestions").insert({
    message,
    category: category ? category : null,
    contact: contact ? contact : null,
    app_version: appVersion ? appVersion : null,
    device: device ? device : null,
  });

  if (error) {
    throw new Error("Failed to submit suggestion.");
  }
}
