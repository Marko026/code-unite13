"use client";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/context/ThemeProvider";
import { createAnswer } from "@/lib/actions/answer.actions";
import { useErrorTracking } from "@/lib/hooks/useErrorTracking";
import useRetryStatus from "@/lib/hooks/useRetryStatus";
import { useTinyMCEFallback } from "@/lib/hooks/useTinyMCEFallback";
import { chatGPTAPI } from "@/lib/utils/apiClient";
import { logQuotaError } from "@/lib/utils/errorLogger";
import { AnswerSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@tinymce/tinymce-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { APIErrorBoundary } from "../shared/APIErrorBoundary";
import FallbackTextEditor from "../shared/FallbackTextEditor";
import RetryStatusDisplay from "../shared/RetryStatusDisplay";
import TinyMCEErrorBoundary from "../shared/TinyMCEErrorBoundary";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";

interface Props {
  question: string;
  questionId: string;
  authorId: string;
}

const Answers = ({ question, questionId, authorId }: Props) => {
  const pathname = usePathname();
  const { mode } = useTheme();
  const editorRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [aiSuccess, setAiSuccess] = useState(false);

  // Use the TinyMCE fallback hook
  const {
    useFallback,
    error: editorError,
    handleEditorError,
    clearTinyMCEStorage,
    resetFallback,
    canRetry,
  } = useTinyMCEFallback();

  // Use error tracking hook
  const { trackError, trackAPIError, trackValidationError } =
    useErrorTracking();

  // Use retry status hook for circuit breaker monitoring
  const { canRetry: canRetryAPI, isCircuitBreakerOpen } = useRetryStatus({
    circuitBreakerKey: "chatgpt_api",
  });

  const form = useForm<z.infer<typeof AnswerSchema>>({
    resolver: zodResolver(AnswerSchema),
    defaultValues: {
      answer: "",
    },
  });

  // Clear storage on component mount - handled by the hook
  useEffect(() => {
    clearTinyMCEStorage();
  }, [clearTinyMCEStorage]);

  const handleCreateAnswer = async (values: z.infer<typeof AnswerSchema>) => {
    setIsSubmitting(true);

    try {
      // Validate answer content
      if (!values.answer || values.answer.trim().length < 10) {
        trackValidationError(
          "answer",
          values.answer,
          "Answer must be at least 10 characters long",
        );
        throw new Error("Answer must be at least 10 characters long");
      }

      await createAnswer({
        content: values.answer,
        author: JSON.parse(authorId),
        question: JSON.parse(questionId),
        path: pathname,
      });
      form.reset();
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      trackError("API_ERROR", "Failed to create answer", errorInstance, {
        questionId,
        authorId,
        answerLength: values.answer?.length || 0,
      });
      console.error("Create answer error:", error);
    } finally {
      setIsSubmitting(false);

      if (editorRef.current) {
        const editor = editorRef.current as any;
        editor.setContent("");
      }
    }
  };
  const generateAiAnswer = async () => {
    if (!authorId) return;

    // Debug circuit breaker status
    console.log("=== GENERATE AI ANSWER DEBUG ===");
    console.log("isCircuitBreakerOpen:", isCircuitBreakerOpen);
    console.log("canRetryAPI:", canRetryAPI);
    console.log("isSubmittingAi:", isSubmittingAi);
    console.log("authorId:", authorId);
    console.log("================================");

    if (isCircuitBreakerOpen) {
      console.log("Circuit breaker is open, cannot make API call");
      setAiError(
        "Service temporarily unavailable due to previous failures. Please wait and try again.",
      );
      return;
    }

    setIsSubmittingAi(true);
    setAiError(null);
    setAiSuccess(false);

    try {
      // Use the enhanced API client with advanced retry mechanism
      console.log("=== STARTING API CALL ===");
      console.log("Question:", question.substring(0, 100) + "...");
      console.log("chatGPTAPI object:", chatGPTAPI);
      console.log("About to call chatGPTAPI.generateAnswer...");

      const result = await chatGPTAPI.generateAnswer(question);

      console.log("=== API CALL COMPLETED ===");
      console.log("Result:", result);
      console.log("========================");

      if (!result.success) {
        throw new Error(result.error || "Failed to generate AI answer");
      }

      const data = result.data;

      if (data && data.success && data.reply) {
        // Enhanced formatting for better presentation
        const formatAIResponse = (text: string) => {
          return (
            text
              // Remove excessive line breaks (more than 2 consecutive)
              .replace(/\n{3,}/g, "\n\n")
              // Convert double line breaks to paragraph breaks
              .replace(/\n\n/g, "</p><p>")
              // Convert single line breaks to <br> but avoid in code blocks
              .replace(/\n/g, "<br>")
              // Wrap in paragraph tags
              .replace(/^/, "<p>")
              .replace(/$/, "</p>")
              // Fix empty paragraphs
              .replace(/<p><\/p>/g, "")
              // Better code block formatting
              .replace(
                /```(\w+)?\n([\s\S]*?)```/g,
                '<pre><code class="language-$1">$2</code></pre>',
              )
              // Inline code formatting
              .replace(/`([^`]+)`/g, "<code>$1</code>")
              // Bold text formatting
              .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
              // Italic text formatting
              .replace(/\*([^*]+)\*/g, "<em>$1</em>")
              // Clean up excessive spacing
              .replace(/<br>\s*<br>/g, "<br>")
              // Remove trailing breaks before closing paragraphs
              .replace(/<br><\/p>/g, "</p>")
          );
        };

        if (useFallback) {
          // For fallback textarea, use clean plain text
          const plainTextAnswer = data.reply.replace(/\n{3,}/g, "\n\n").trim();
          form.setValue("answer", plainTextAnswer);
        } else if (editorRef.current) {
          const editor = editorRef.current as any;
          const formattedAnswer = formatAIResponse(data.reply);
          editor.setContent(formattedAnswer);
        }

        // Show success message
        setAiSuccess(true);

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setAiSuccess(false);
        }, 3000);
      } else {
        throw new Error(data?.error || "Failed to generate AI answer");
      }
    } catch (error: any) {
      console.log("=== ERROR CAUGHT ===");
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.log("==================");

      let errorMessage = error.message || "Failed to generate AI answer";

      // Handle specific error types with user-friendly messages
      if (error.message && error.message.includes("quota")) {
        errorMessage =
          "AI service quota exceeded. Please try again later or contact support.";
      } else if (error.message && error.message.includes("429")) {
        errorMessage =
          "AI service is temporarily unavailable due to high usage. Please try again later.";
      } else if (error.message && error.message.includes("invalid_api_key")) {
        errorMessage =
          "AI service configuration error. Please contact support.";
      } else if (error.message && error.message.includes("network")) {
        errorMessage =
          "Network connection error. Please check your internet connection and try again.";
      }

      console.error("Generate AI Answer Error:", error);
      setAiError(errorMessage);

      // Track the error with additional context
      trackAPIError(
        "/api/chatgpt",
        "POST",
        error instanceof Error ? error : new Error(errorMessage),
        undefined,
        { question },
        undefined,
      );

      // The retry logic is now handled by the advanced retry mechanism in fetchWithErrorTracking
    } finally {
      setIsSubmittingAi(false);
    }
  };

  // Retry TinyMCE initialization
  const retryTinyMCE = () => {
    if (canRetry) {
      resetFallback();
      clearTinyMCEStorage();
    }
  };

  // Function to ensure editor is editable - currently unused but kept for potential future use
  // eslint-disable-next-line no-unused-vars
  const ensureEditorEditable = () => {
    if (editorRef.current && !useFallback) {
      try {
        const editor = editorRef.current as any;
        const editorBody = editor.getBody();

        if (editorBody) {
          // Force editable state
          editorBody.setAttribute("contenteditable", "true");
          editorBody.removeAttribute("readonly");
          editorBody.style.pointerEvents = "auto";
          editorBody.style.userSelect = "text";

          // Ensure editor mode is design (editable)
          if (editor.mode && editor.mode.set) {
            editor.mode.set("design");
          }

          // Focus the editor to activate it
          editor.focus();

          console.log("Editor editability ensured");
        }
      } catch (error) {
        console.warn("Failed to ensure editor editability:", error);
      }
    }
  };
  return (
    <APIErrorBoundary
      apiEndpoint="/api/chatgpt"
      retryAction={generateAiAnswer}
      componentName="AnswersForm"
    >
      <div className="mt-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2 ">
        <h4 className="paragraph-semibold text-dark400_light800 ">
          Write your answer here
        </h4>

        <Button
          onClick={() => {
            console.log("=== BUTTON CLICKED ===");
            console.log("isSubmittingAi:", isSubmittingAi);
            console.log("isCircuitBreakerOpen:", isCircuitBreakerOpen);
            console.log(
              "Button disabled:",
              isSubmittingAi || isCircuitBreakerOpen,
            );
            console.log("===================");
            generateAiAnswer();
          }}
          className="btn light-border-2 gap-1.5 rounded-md px-4 py-2.5 text-primary-500 shadow-none"
          disabled={isSubmittingAi || isCircuitBreakerOpen}
          title={
            isCircuitBreakerOpen
              ? "Service temporarily unavailable"
              : "Generate AI answer"
          }
        >
          {isSubmittingAi ? (
            "Generating..."
          ) : (
            <>
              <Image
                src="/assets/icons/stars.svg"
                alt="start"
                width={12}
                height={12}
                className="object-contain"
              />
              Generate Ai Answer
            </>
          )}
        </Button>
      </div>

      {/* AI Success Display */}
      {aiSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="mr-2 size-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="font-medium">AI answer generated successfully!</p>
            </div>
            <button
              onClick={() => setAiSuccess(false)}
              className="ml-4 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enhanced AI Error Display with Retry Status */}
      {aiError && (
        <div className="mt-4">
          <RetryStatusDisplay
            circuitBreakerKey="chatgpt_api"
            error={new Error(aiError)}
            isRetrying={isSubmittingAi}
            onRetry={canRetryAPI ? generateAiAnswer : undefined}
            className="bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
          />
          <button
            onClick={() => setAiError(null)}
            className="absolute right-2 top-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <Form {...form}>
        <form
          action=""
          className="mt-6 flex w-full flex-col gap-10"
          onSubmit={form.handleSubmit(handleCreateAnswer)}
        >
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-3">
                <FormControl className="mt-3.5">
                  <div className="relative">
                    {useFallback ? (
                      // Enhanced fallback editor with toolbar
                      <div>
                        {editorError && (
                          <div className="mb-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <svg
                                  className="mr-2 mt-0.5 size-4 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div>
                                  <p className="font-medium">
                                    Editor Fallback Mode
                                  </p>
                                  <p className="mt-1">{editorError}</p>
                                </div>
                              </div>
                              {canRetry && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={retryTinyMCE}
                                  className="ml-2 h-6 px-2 text-xs"
                                >
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        <FallbackTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Write your answer here..."
                        />
                      </div>
                    ) : (
                      // TinyMCE with error boundary
                      <TinyMCEErrorBoundary
                        fallbackValue={field.value}
                        onFallback={field.onChange}
                        onError={handleEditorError}
                      >
                        <Editor
                          apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                          onInit={(_, editor) => {
                            // @ts-ignore
                            editorRef.current = editor;
                          }}
                          onBlur={field.onBlur}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 500,
                            menubar: false,
                            statusbar: false,
                            branding: false,
                            resize: false,
                            // Explicitly ensure editor is editable
                            readonly: false,
                            disabled: false,
                            editable_root: true,
                            // Minimal plugins to reduce storage usage and prevent quota errors
                            plugins: ["lists", "link", "paste", "textcolor"],
                            toolbar:
                              "undo redo | bold italic underline | forecolor | bullist numlist | link | removeformat",
                            content_style: `
                              body { 
                                font-family: Inter, Arial, sans-serif; 
                                font-size: 16px; 
                                line-height: 1.6; 
                              }
                              p { 
                                margin-bottom: 12px; 
                                margin-top: 0; 
                              }
                              p:last-child { 
                                margin-bottom: 0; 
                              }
                              code { 
                                background-color: #f4f4f4; 
                                padding: 2px 6px; 
                                border-radius: 4px; 
                                font-family: 'Courier New', monospace; 
                                font-size: 14px; 
                              }
                              pre { 
                                background-color: #f8f8f8; 
                                padding: 12px; 
                                border-radius: 6px; 
                                overflow-x: auto; 
                                margin: 12px 0; 
                              }
                              strong { 
                                font-weight: 600; 
                              }
                            `,
                            skin: mode === "dark" ? "oxide-dark" : "oxide",
                            content_css: mode === "dark" ? "dark" : "default",
                            // Ensure paste functionality works properly
                            paste_as_text: false,
                            paste_auto_cleanup_on_paste: true,
                            paste_remove_styles: false,
                            paste_remove_styles_if_webkit: false,
                            // Aggressive caching and storage prevention
                            cache_suffix: "?nocache=" + Date.now(),
                            browser_spellcheck: true, // Use browser spellcheck instead of TinyMCE
                            contextmenu: false,
                            elementpath: false,
                            // Disable all storage mechanisms
                            local_storage: false,
                            // Prevent automatic saves and drafts
                            autosave_ask_before_unload: false,
                            autosave_interval: "0s",
                            autosave_prefix: "",
                            autosave_restore_when_empty: false,
                            autosave_retention: "0m",
                            // Disable image and media caching
                            images_upload_handler: undefined,
                            automatic_uploads: false,
                            // Setup function to clear storage and prevent accumulation
                            setup: (editor: any) => {
                              // Clear any existing storage on initialization
                              editor.on("PreInit", () => {
                                try {
                                  clearTinyMCEStorage();
                                } catch (error) {
                                  console.warn(
                                    "Storage clearing failed:",
                                    error,
                                  );
                                  handleEditorError(error);
                                }
                              });

                              // Prevent any storage operations during editor lifecycle
                              editor.on("init", () => {
                                // Explicitly ensure editor is editable after initialization
                                try {
                                  editor.mode.set("design"); // Ensure design mode (editable)
                                  editor
                                    .getBody()
                                    .setAttribute("contenteditable", "true");

                                  // Remove any readonly attributes that might have been set
                                  const editorBody = editor.getBody();
                                  if (editorBody) {
                                    editorBody.removeAttribute("readonly");
                                    editorBody.style.pointerEvents = "auto";
                                    editorBody.style.userSelect = "text";
                                  }

                                  // Ensure the editor container is not disabled
                                  const container = editor.getContainer();
                                  if (container) {
                                    container.removeAttribute("disabled");
                                    container.style.pointerEvents = "auto";
                                  }
                                } catch (error) {
                                  console.warn(
                                    "Editor editability setup failed:",
                                    error,
                                  );
                                }

                                // Disable editor storage if available
                                if (editor.storage) {
                                  try {
                                    editor.storage.clear();
                                  } catch (error) {
                                    console.warn(
                                      "Editor storage clear failed:",
                                      error,
                                    );
                                  }
                                }
                              });

                              // Add periodic check to ensure editor remains editable
                              editor.on("init", () => {
                                const checkEditability = () => {
                                  try {
                                    const editorBody = editor.getBody();
                                    if (
                                      editorBody &&
                                      editorBody.getAttribute(
                                        "contenteditable",
                                      ) !== "true"
                                    ) {
                                      console.warn(
                                        "Editor became non-editable, fixing...",
                                      );
                                      editorBody.setAttribute(
                                        "contenteditable",
                                        "true",
                                      );
                                      editorBody.removeAttribute("readonly");
                                    }
                                  } catch (error) {
                                    console.warn(
                                      "Editability check failed:",
                                      error,
                                    );
                                  }
                                };

                                // Check editability every 5 seconds
                                const editabilityInterval = setInterval(
                                  checkEditability,
                                  5000,
                                );

                                // Clear interval when editor is removed
                                editor.on("remove", () => {
                                  clearInterval(editabilityInterval);
                                });
                              });

                              // Clear storage on editor destruction
                              editor.on("remove", () => {
                                try {
                                  clearTinyMCEStorage();
                                } catch (error) {
                                  console.warn(
                                    "Storage cleanup on remove failed:",
                                    error,
                                  );
                                }
                              });

                              // Handle quota exceeded errors and initialization failures
                              editor.on("StorageError", (e: any) => {
                                console.error("TinyMCE storage error:", e);
                                handleEditorError(e);
                              });

                              // Handle general initialization errors
                              editor.on("InitError", (e: any) => {
                                console.error(
                                  "TinyMCE initialization error:",
                                  e,
                                );
                                handleEditorError(e);
                              });

                              // Ensure editor responds to user interactions
                              editor.on("focus", () => {
                                try {
                                  const editorBody = editor.getBody();
                                  if (editorBody) {
                                    editorBody.setAttribute(
                                      "contenteditable",
                                      "true",
                                    );
                                    editorBody.style.pointerEvents = "auto";
                                  }
                                } catch (error) {
                                  console.warn(
                                    "Focus editability check failed:",
                                    error,
                                  );
                                }
                              });

                              // Handle click events to ensure editability
                              editor.on("click", () => {
                                try {
                                  const editorBody = editor.getBody();
                                  if (
                                    editorBody &&
                                    editorBody.getAttribute(
                                      "contenteditable",
                                    ) !== "true"
                                  ) {
                                    editorBody.setAttribute(
                                      "contenteditable",
                                      "true",
                                    );
                                    editorBody.focus();
                                  }
                                } catch (error) {
                                  console.warn(
                                    "Click editability check failed:",
                                    error,
                                  );
                                }
                              });

                              // Catch any quota exceeded errors during setup
                              try {
                                // Test storage availability
                                localStorage.setItem("tinymce-test", "test");
                                localStorage.removeItem("tinymce-test");
                              } catch (error) {
                                console.error(
                                  "Storage quota exceeded during setup:",
                                  error,
                                );
                                logQuotaError(
                                  "TinyMCE storage quota exceeded during setup",
                                  "localStorage",
                                  error instanceof Error
                                    ? error
                                    : new Error(String(error)),
                                );
                                handleEditorError(error);
                              }
                            },
                          }}
                        />
                      </TinyMCEErrorBoundary>
                    )}
                  </div>
                </FormControl>

                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className="primary-gradient w-fit text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </APIErrorBoundary>
  );
};

export default Answers;
