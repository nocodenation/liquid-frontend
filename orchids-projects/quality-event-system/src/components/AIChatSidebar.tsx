"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  AlertTriangle,
  Shield,
  Info,
  Sparkles,
  ChevronRight,
  XCircle,
  AlertCircle,
  HelpCircle,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EvaluationType = "ambiguity" | "risk" | "missing";

interface Evaluation {
  id: string;
  type: EvaluationType;
  title: string;
  description: string;
  field?: string;
  suggestion?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  evaluations?: Evaluation[];
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  context: {
    phase: "intake" | "triage" | "resolution";
    data: Record<string, unknown>;
  };
}

const evaluationIcons: Record<EvaluationType, React.ReactNode> = {
  ambiguity: <AlertCircle className="w-4 h-4 text-amber-500" />,
  risk: <AlertTriangle className="w-4 h-4 text-red-500" />,
  missing: <HelpCircle className="w-4 h-4 text-blue-500" />,
};

const evaluationColors: Record<EvaluationType, string> = {
  ambiguity: "border-amber-500/30 bg-amber-500/5",
  risk: "border-red-500/30 bg-red-500/5",
  missing: "border-blue-500/30 bg-blue-500/5",
};

const evaluationBadgeColors: Record<EvaluationType, string> = {
  ambiguity: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  risk: "bg-red-500/10 text-red-600 border-red-500/20",
  missing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

function generateEvaluations(
  context: AIChatSidebarProps["context"],
  userMessage: string
): Evaluation[] {
  const evaluations: Evaluation[] = [];
  const { phase, data } = context;

  if (phase === "intake") {
    const locate = data.locate as { what?: string; where?: string; when?: string } | undefined;
    const stateGap = data.stateGap as { expected?: string; actual?: string } | undefined;
    const explainImpact = data.explainImpact as { impactType?: string } | undefined;
    const revealMechanism = data.revealMechanism as { description?: string } | undefined;
    
    if (locate?.what && locate.what.length < 30) {
      evaluations.push({
        id: "amb-1",
        type: "ambiguity",
        title: "Vague Problem Description",
        description: "The 'What was observed' field lacks specificity. Consider adding measurable details.",
        field: "What was observed",
        suggestion: "Include specific quantities, measurements, or observable conditions (e.g., 'Widget dimension was 12.3mm instead of 12.0mm ± 0.1mm').",
      });
    }

    if (locate?.where && !locate.where.includes(" ") && locate.where.length < 15) {
      evaluations.push({
        id: "miss-1",
        type: "missing",
        title: "Location Needs More Detail",
        description: "The location field may need additional context for traceability.",
        field: "Where did it occur",
        suggestion: "Specify the exact area, equipment ID, or production line number.",
      });
    }

    if (stateGap?.expected && stateGap.expected.length > 10 && !stateGap.expected.match(/\d/)) {
      evaluations.push({
        id: "amb-2",
        type: "ambiguity",
        title: "Expected Behavior Lacks Specifics",
        description: "The expected behavior should reference specific requirements or tolerances.",
        field: "Expected Behavior",
        suggestion: "Include numerical specifications, document references, or acceptance criteria.",
      });
    }

    if (stateGap?.actual && stateGap.actual.length > 10 && !stateGap.actual.match(/\d/)) {
      evaluations.push({
        id: "amb-3",
        type: "ambiguity",
        title: "Actual Behavior Lacks Measurement",
        description: "The actual observation should include measurable data where applicable.",
        field: "Actual Behavior",
        suggestion: "Quantify the deviation with specific measurements or counts.",
      });
    }

    if (explainImpact?.impactType === "patient-safety" && revealMechanism?.description && revealMechanism.description.length < 50) {
      evaluations.push({
        id: "risk-1",
        type: "risk",
        title: "Patient Safety Impact Needs Detail",
        description: "Patient safety impacts require thorough documentation for regulatory compliance.",
        field: "Impact Type",
        suggestion: "Document the potential harm pathway and any affected product lots.",
      });
    }
  }

  if (phase === "triage") {
    const isNC = data.isNC as boolean | undefined;
    const severity = data.severity as number | undefined;
    const occurrence = data.occurrence as number | undefined;
    const rationale = data.rationale as string | undefined;

    if (isNC === true && severity && occurrence) {
      const riskScore = severity * occurrence;
      if (riskScore <= 8 && riskScore > 4) {
        evaluations.push({
          id: "risk-2",
          type: "risk",
          title: "Borderline Risk Assessment",
          description: "The risk score is near the threshold. Ensure assessment is conservative for patient safety.",
          suggestion: "Consider if the severity or occurrence could be higher under worst-case scenarios.",
        });
      }
    }

    if (rationale && rationale.length > 0 && rationale.length < 50) {
      evaluations.push({
        id: "miss-2",
        type: "missing",
        title: "Rationale Insufficient",
        description: "The rationale for bypassing CAPA needs more justification for audit trail.",
        field: "Rationale Statement",
        suggestion: "Include reference to similar historical events, risk assessment data, and control measures in place.",
      });
    }
  }

  if (phase === "resolution") {
    const correction = data.correction as string | undefined;
    const containment = data.containment as { applicable?: boolean; measures?: string } | undefined;
    const verification = data.verification as { fixEffective?: boolean; noNewRisks?: boolean; documentsUpdated?: boolean } | undefined;

    if (correction && correction.length < 40) {
      evaluations.push({
        id: "miss-3",
        type: "missing",
        title: "Correction Lacks Detail",
        description: "The correction description should be detailed enough for someone else to verify.",
        field: "Immediate Correction",
        suggestion: "Include who performed the action, when, what specific steps were taken, and evidence of completion.",
      });
    }

    if (containment?.applicable && containment.measures && containment.measures.length < 30) {
      evaluations.push({
        id: "risk-3",
        type: "risk",
        title: "Containment May Be Incomplete",
        description: "Containment measures should cover all potentially affected items.",
        field: "Containment",
        suggestion: "Confirm all affected lots, locations, and downstream impacts have been addressed.",
      });
    }

    if (verification?.fixEffective && !verification.noNewRisks) {
      evaluations.push({
        id: "miss-4",
        type: "missing",
        title: "Risk Assessment Incomplete",
        description: "Fix effectiveness was verified but new risk assessment is pending.",
        suggestion: "Complete the verification that no new risks were introduced before closing.",
      });
    }
  }

  return evaluations;
}

export function AIChatSidebar({ isOpen, onToggle, context }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Quality Assistant. I'll help evaluate your documentation for ambiguity, regulatory risk, and completeness. Ask me anything or click 'Evaluate Now' to analyze your current entries.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEvaluate = () => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: "Please evaluate my current entries for issues.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const evaluations = generateEvaluations(context, "");
      
      let responseContent: string;
      if (evaluations.length === 0) {
        responseContent = "Great work! Your current entries look well-documented. I don't see any immediate issues with ambiguity, regulatory risk, or missing information. Keep up the thorough documentation!";
      } else {
        responseContent = `I've analyzed your current entries and found ${evaluations.length} item${evaluations.length > 1 ? "s" : ""} that may need attention:`;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        evaluations: evaluations.length > 0 ? evaluations : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response: string;

      if (lowerInput.includes("ambig") || lowerInput.includes("vague")) {
        response = "Ambiguous language in quality records can lead to misinterpretation during audits. Key areas to watch:\n\n• Use specific measurements instead of 'approximately' or 'about'\n• Replace 'some' or 'several' with exact quantities\n• Avoid relative terms like 'soon' or 'quickly' - use dates/times\n• Reference specific document numbers, not just document types";
      } else if (lowerInput.includes("risk") || lowerInput.includes("regulatory")) {
        response = "Regulatory risk in documentation typically stems from:\n\n• Insufficient detail for traceability (21 CFR Part 820, ISO 13485)\n• Missing signatures or approval timestamps\n• Unclear connection between NC and corrective action\n• Lack of objective evidence for decisions\n• Undocumented rationale for risk acceptance";
      } else if (lowerInput.includes("missing") || lowerInput.includes("complete")) {
        response = "For complete quality records, ensure you have:\n\n• Clear problem statement with 5W (What, Where, When, Who, Why)\n• Objective evidence (photos, data, test results)\n• Reference to controlling documents\n• Risk assessment justification\n• Verification of effectiveness\n• Proper approval chain";
      } else if (lowerInput.includes("help") || lowerInput.includes("what can")) {
        response = "I can help you with:\n\n• **Evaluate** - Analyze your entries for potential issues\n• **Ambiguity** - Identify vague or unclear language\n• **Risk** - Flag regulatory compliance concerns\n• **Completeness** - Check for missing required information\n\nJust ask a question or click 'Evaluate Now' to analyze your current work!";
      } else {
        response = "I understand you're asking about quality documentation. For specific guidance, try asking about:\n\n• Ambiguous language concerns\n• Regulatory risk areas\n• Missing information requirements\n\nOr click 'Evaluate Now' to get a detailed analysis of your current entries.";
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#8b5cf6] text-white px-3 py-4 rounded-r-xl shadow-lg hover:px-4 transition-all"
      >
        <div className="flex flex-col items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="text-xs font-medium [writing-mode:vertical-lr] rotate-180">AI Assist</span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r shadow-2xl z-50 flex flex-col",
        isMinimized ? "w-16" : "w-80"
      )}
    >
      <div className="p-4 border-b bg-[#8b5cf6] text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            {!isMinimized && (
              <div>
                <h3 className="font-semibold text-sm">AI Quality Assistant</h3>
                <p className="text-xs text-white/70">Document Evaluation</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      message.role === "assistant"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 rounded-xl p-3 text-sm",
                      message.role === "assistant"
                        ? "bg-muted/50"
                        : "bg-primary/10"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.evaluations && message.evaluations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.evaluations.map((evaluation) => (
                          <div
                            key={evaluation.id}
                            className={cn(
                              "p-3 rounded-lg border",
                              evaluationColors[evaluation.type]
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {evaluationIcons[evaluation.type]}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-xs">
                                    {evaluation.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-1.5 py-0",
                                      evaluationBadgeColors[evaluation.type]
                                    )}
                                  >
                                    {evaluation.type === "ambiguity" && "Ambiguous"}
                                    {evaluation.type === "risk" && "Risk"}
                                    {evaluation.type === "missing" && "Missing"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {evaluation.description}
                                </p>
                                {evaluation.field && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    <span className="font-medium">Field:</span> {evaluation.field}
                                  </p>
                                )}
                                {evaluation.suggestion && (
                                  <div className="mt-2 p-2 rounded bg-background/50 border border-dashed">
                                    <p className="text-[10px] text-muted-foreground">
                                      <span className="font-medium text-foreground">Suggestion:</span>{" "}
                                      {evaluation.suggestion}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 border-t space-y-3">
            <Button
              onClick={handleEvaluate}
              className="w-full gap-2 bg-[#8b5cf6] hover:bg-[#7c4fe0]"
              disabled={isTyping}
            >
              <Sparkles className="w-4 h-4" />
              Evaluate Now
            </Button>
            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about your documentation..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 text-sm"
                disabled={isTyping}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                variant="outline"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {["Ambiguity", "Risk", "Completeness"].map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setInput(`Tell me about ${topic.toLowerCase()} concerns`);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isMinimized && (
        <div className="flex-1 flex flex-col items-center pt-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEvaluate}
            className="w-10 h-10"
            disabled={isTyping}
          >
            <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(false)}
            className="w-10 h-10"
          >
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}