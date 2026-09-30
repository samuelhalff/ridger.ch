import { getTranslations, type Locale } from "@/src/lib/i18n";

/** Basic contact-form strings (no select fields), shared by landing pages. */
export async function buildContactFormStrings(
  locale: Locale,
  overrides: { title?: string; subtitle?: string; messagePlaceholder?: string } = {},
) {
  const t = await getTranslations(locale, "contact");
  const s = (key: string, fallback: string) => {
    const value = t(key);
    return typeof value === "string" && value !== key ? value : fallback;
  };
  return {
    title: overrides.title || s("Title", "Get in touch"),
    subtitle: overrides.subtitle || s("Subtitle", ""),
    labels: {
      name: s("Form.Name", "Name"),
      companyName: s("Form.CompanyName", "Company name (optional)"),
      phone: s("Form.Phone", "Phone number (optional)"),
      email: s("Form.Email", "Email"),
      message: s("Form.Message", "Message"),
      consent: s("Form.Consent", "I consent to being contacted"),
      submit: s("Form.Submit", "Submit"),
      sending: s("Form.Sending", "Sending..."),
    },
    placeholders: {
      name: s("Form.Placeholders.Name", "Your name"),
      companyName: s("Form.Placeholders.CompanyName", "Company name"),
      phone: s("Form.Placeholders.Phone", "Phone number"),
      email: s("Form.Placeholders.Email", "email@example.com"),
      message:
        overrides.messagePlaceholder ||
        s("Form.Placeholders.Message", "How can we help?"),
    },
    errors: {
      required: s("Errors.Required", "This field is required"),
      invalidEmail: s("Errors.InvalidEmail", "Invalid email address"),
      maxLength: s("Errors.MaxLength", "Message is too long"),
      consent: s("Errors.Consent", "Please provide consent"),
    },
    toasts: {
      success: s("Form.Success", "Thanks! We'll get back to you soon."),
      error: s("Form.Error", "Something went wrong."),
    },
  };
}
