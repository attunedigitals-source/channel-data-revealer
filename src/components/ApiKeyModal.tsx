import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { validateApiKey } from "@/lib/youtube.functions";

export const API_KEY_STORAGE_KEY = "channel_sheet_yt_api_key";
export const AI_KEY_STORAGE_KEY = "channel_sheet_ai_api_key";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  aiApiKey?: string;
  onSaveKey: (key: string) => void;
  onSaveAiKey?: (key: string) => void;
  onClearKey: () => void;
  hasServerKey?: boolean;
}

export function ApiKeyModal({
  open,
  onOpenChange,
  apiKey,
  aiApiKey = "",
  onSaveKey,
  onSaveAiKey,
  onClearKey,
  hasServerKey = false,
}: ApiKeyModalProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [aiInputValue, setAiInputValue] = useState(aiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [showInstructions, setShowInstructions] = useState(false);

  const runValidate = useServerFn(validateApiKey);

  useEffect(() => {
    if (open) {
      setInputValue(apiKey);
      setAiInputValue(aiApiKey);
      setValidationResult({ status: "idle", message: "" });
    }
  }, [open, apiKey, aiApiKey]);

  async function handleSaveAndTest() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setValidationResult({ status: "error", message: "Please enter an API key" });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: "idle", message: "" });

    try {
      const res = await runValidate({ data: { apiKey: trimmed } });
      if (res.valid) {
        setValidationResult({
          status: "success",
          message: "API key is valid and connected to YouTube Data API v3!",
        });
        onSaveKey(trimmed);
        if (onSaveAiKey) onSaveAiKey(aiInputValue.trim());
        setTimeout(() => {
          onOpenChange(false);
        }, 1200);
      } else {
        setValidationResult({
          status: "error",
          message: res.message || "Invalid API key. Please check your credentials.",
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: "error",
        message: err.message || "Failed to validate key. Check your network.",
      });
    } finally {
      setIsValidating(false);
    }
  }

  function handleDirectSave() {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSaveKey(trimmed);
      if (onSaveAiKey) onSaveAiKey(aiInputValue.trim());
      onOpenChange(false);
    }
  }

  function handleClear() {
    setInputValue("");
    setAiInputValue("");
    setValidationResult({ status: "idle", message: "" });
    onClearKey();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">API Configuration</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Connect your YouTube and optional AI keys for complete channel analytics
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {hasServerKey && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>A server-level environment key is active.</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">
                Server Active
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="youtube-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                YouTube Data API v3 Key <span className="text-destructive">*</span>
              </Label>
              {apiKey && (
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Saved locally
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                id="youtube-api-key"
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setValidationResult({ status: "idle", message: "" });
                }}
                className="pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI API Key <span className="text-muted-foreground font-normal">(Optional — Gemini / OpenAI)</span>
              </Label>
              {aiApiKey && (
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                id="ai-api-key"
                type={showAiKey ? "text" : "password"}
                placeholder="AIzaSy... or sk-..."
                value={aiInputValue}
                onChange={(e) => setAiInputValue(e.target.value)}
                className="pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowAiKey(!showAiKey)}
                aria-label={showAiKey ? "Hide AI API key" : "Show AI API key"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Optional. If left blank, our smart semantic classifier automatically categorizes niche &amp; style from channel topics and video titles.
            </p>
          </div>

          {/* Validation Feedback */}
          {validationResult.status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationResult.message}</span>
            </div>
          )}

          {validationResult.status === "success" && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationResult.message}</span>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-foreground">Stored Securely:</strong> Your key is saved strictly in your browser&apos;s local storage. It is never logged or stored in external databases.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center pt-1">
            {apiKey ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove Key
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDirectSave}
                disabled={!inputValue.trim() || isValidating}
                className="h-9 text-xs"
              >
                Save Without Testing
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndTest}
                disabled={!inputValue.trim() || isValidating}
                className="h-9 text-xs"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Testing Key...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Test &amp; Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Tutorial */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>How to get a free YouTube API key?</span>
              {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showInstructions && (
              <div className="mt-2.5 space-y-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Visit the{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                    >
                      Google Cloud Credentials Console
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </li>
                  <li>Create a project (or select an existing one).</li>
                  <li>Enable the <strong>YouTube Data API v3</strong> in the API Library.</li>
                  <li>Click <strong>Create Credentials &rarr; API Key</strong>.</li>
                  <li>Copy and paste your generated key above.</li>
                </ol>
                <p className="text-[11px] text-muted-foreground/80 pt-1">
                  YouTube provides a free daily quota (10,000 units/day), which is more than enough for daily channel research.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
