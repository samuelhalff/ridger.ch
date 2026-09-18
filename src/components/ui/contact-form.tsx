"use client";

import { FC, useMemo } from "react";
import { cn } from "@/src/lib/utils";
import { getGaClientId, trackEvent } from "@/src/lib/analytics";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Textarea } from "@/src/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import React from "react";
import { CaretDown as ChevronDownIcon, CircleNotch } from "@phosphor-icons/react";

// We keep the types and defaults outside the component
type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const defaultValues = {
  firstName: "",
  email: "",
  message: "",
  consent: false,
  companyName: "",
  phone: "",
  subject: "",
};

// Build the schema from provided error messages (server-supplied)
const createFormSchema = (errors: {
  required: string;
  invalidEmail: string;
  maxLength: string;
  consent: string;
}) =>
  z.object({
    firstName: z.string().min(1, { message: errors.required }),
    email: z.string().email({ message: errors.invalidEmail }),
    companyName: z.string().optional(),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z
      .string()
      .min(1, { message: errors.required })
      .max(500, { message: errors.maxLength }),
    consent: z.boolean().refine((val) => val === true, {
      message: errors.consent,
    }),
  });

interface ContactFormProps {
  showTitle?: boolean;
  showSubtitle?: boolean;
  strings: {
    title: string;
    subtitle: string;
    labels: {
      name: string;
      companyName: string;
      phone: string;
      subject?: string;
      email: string;
      message: string;
      consent: string;
      submit: string;
      sending: string;
    };
    placeholders: {
      name: string;
      companyName: string;
      phone: string;
      subject?: string;
      email: string;
      message: string;
    };
    errors: {
      required: string;
      invalidEmail: string;
      maxLength: string;
      consent: string;
    };
    toasts: {
      success: string;
      error: string;
    };
    subjects?: Array<{ label: string; value: string }>;
  };
  redirectPath?: string; // locale-aware redirect after success
  /** Additional classes merged into the inner Card element */
  cardClassName?: string;
}

const ContactForm: FC<ContactFormProps> = ({
  showTitle = true,
  showSubtitle = true,
  strings,
  redirectPath = "/",
  cardClassName,
}) => {
  const router = useRouter();
  const [sending, setSending] = React.useState(false);
  const [subjectOpen, setSubjectOpen] = React.useState(false);

  // Memoize schema based on provided error strings
  const formSchema = useMemo(
    () => createFormSchema(strings.errors),
    [strings.errors]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onTouched",
  });

  const formStartTracked = React.useRef(false);
  const handleFormFocus = () => {
    if (formStartTracked.current) return;
    formStartTracked.current = true;
    trackEvent("contact_form_start", { form_id: "contact" });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setSending(true);
    let errorType = "network";
    const goHome = () => {
      router.push(redirectPath);
    };
    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...data,
          pageUrl: window.location.href,
          referrer: document.referrer || "",
          gaClientId: getGaClientId() || "",
        }),
      });
      if (!res.ok) {
        errorType = res.status >= 500 ? "http_5xx" : "http_4xx";
        throw new Error("Network response was not ok");
      }
      trackEvent("generate_lead", { method: "contact_form", form_id: "contact" });
      form.reset(defaultValues);
      toast.success(strings.toasts.success, {
        action: { label: "Close", onClick: () => toast.dismiss },
        duration: 5000,
        onAutoClose: goHome,
        onDismiss: goHome,
      });
    } catch (e) {
      trackEvent("form_submit_error", { form_id: "contact", error_type: errorType });
      toast.error(strings.toasts.error || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-[var(--breakpoint-xl)] mx-auto">
      {showTitle && (
        <h2 className="mb-6 text-left text-2xl font-semibold tracking-tight sm:text-3xl">
          {strings.title}
        </h2>
      )}
      {showSubtitle ? (
        <p className="mb-8 w-full text-left text-muted-foreground">
          {strings.subtitle}
        </p>
      ) : null}
      <div className="flex items-center justify-center">
        <Card className={cn("w-full max-w-[1200px] min-w-0 animate-in slide-in-from-bottom-7 duration-500", cardClassName)}>
          <CardContent>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  marginTop: '1rem',
                },
              }}
              expand={true}
              richColors
            />
            <Form {...form}>
              <form
                className="flex flex-col gap-6"
                id="contact-form"
                onSubmit={form.handleSubmit(onSubmit)}
                onFocusCapture={handleFormFocus}
                aria-busy={sending}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-auto">
                        <FormLabel className="form-label">
                          {strings.labels.name}
                          <span className="text-green-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            autoComplete="name"
                            placeholder={strings.placeholders.name}
                            disabled={sending}
                          />
                        </FormControl>
                        <FormMessage className="place-self-start text-primary-red m-1!" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {strings.labels.companyName}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          autoComplete="organization"
                          placeholder={strings.placeholders.companyName}
                          disabled={sending}
                        />
                      </FormControl>
                      <FormMessage className="place-self-start text-primary-red m-1!" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {strings.labels.phone}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          autoComplete="tel"
                          placeholder={strings.placeholders.phone}
                          disabled={sending}
                        />
                      </FormControl>
                      <FormMessage className="place-self-start text-primary-red m-1!" />
                    </FormItem>
                  )}
                />
                {strings.subjects?.length ? (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => {
                      const subjects = strings.subjects || [];
                      const selected = subjects.find(
                        (subject) => subject.value === field.value
                      );
                      return (
                        <FormItem>
                          <FormLabel className="form-label">
                            {strings.labels.subject || "Sujet"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <button
                                type="button"
                                disabled={sending}
                                aria-haspopup="listbox"
                                aria-expanded={subjectOpen}
                                className="flex h-10 w-full items-center justify-between rounded-md bg-surface-warm px-3 py-2 text-left text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(20,16,14,0.06),0_1px_2px_rgba(20,16,14,0.04)] transition-[background-color,box-shadow] hover:bg-surface-warm/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.22)]"
                                onClick={() =>
                                  setSubjectOpen((current) => !current)
                                }
                              >
                                <span
                                  className={cn(
                                    "truncate",
                                    !selected && "text-muted-foreground"
                                  )}
                                >
                                  {selected?.label ||
                                    strings.placeholders.subject ||
                                    "Choisir un sujet"}
                                </span>
                                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                              </button>
                              {subjectOpen ? (
                                <div
                                  role="listbox"
                                  className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-lg"
                                >
                                  {subjects.map((subject) => (
                                    <button
                                      key={subject.value}
                                      type="button"
                                      role="option"
                                      aria-selected={field.value === subject.value}
                                      className={cn(
                                        "flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                        field.value === subject.value &&
                                          "bg-brand-soft text-brand-hover dark:bg-brand/15 dark:text-brand"
                                      )}
                                      onClick={() => {
                                        field.onChange(subject.value);
                                        setSubjectOpen(false);
                                      }}
                                    >
                                      {subject.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </FormControl>
                          <FormMessage className="place-self-start text-primary-red m-1!" />
                        </FormItem>
                      );
                    }}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {strings.labels.email}
                        <span className="text-green-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder={strings.placeholders.email}
                          disabled={sending}
                        />
                      </FormControl>
                      <FormMessage className="place-self-start text-primary-red m-1!" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">
                        {strings.labels.message}
                        <span className="text-green-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={8}
                          placeholder={strings.placeholders.message}
                          disabled={sending}
                        />
                      </FormControl>
                      <FormMessage className="place-self-start text-primary-red m-1!" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <div className="flex flex-row content-center justify-items-start items-center gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={sending}
                            className="h-4 w-4 rounded-sm bg-background text-brand-hover focus-visible:ring-2 focus-visible:ring-brand dark:bg-muted"
                          />
                        </FormControl>
                        <FormLabel className="mt-0! hover:cursor-pointer">
                          {strings.labels.consent}
                          <span className="text-green-600">*</span>
                        </FormLabel>
                      </div>
                      <FormMessage className="text-primary-red m-1! place-self-start" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  name="submit"
                  disabled={sending}
                  style={{ cursor: "pointer" }}
                >
                  {sending ? (
                    <span className="inline-flex items-center gap-2">
                      <CircleNotch className="size-4 animate-spin" aria-hidden />
                      {strings.labels.sending || "Sending..."}
                    </span>
                  ) : (
                    <>{strings.labels.submit}</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactForm;
