"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MessageSquare, 
  MessageSquarePlus, 
  MessageCircle,
  MessageSquareCode,
  Speech,
  SearchX,
  PanelTop,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { knowledgeBaseService, KnowledgeMatch } from "@/services/knowledgeBase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type: "text" | "math" | "chart" | "knowledge";
  confidence?: number;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  chartData?: any;
  mathSteps?: Array<{
    step: string;
    formula: string;
    result: string;
  }>;
  knowledgeMatch?: KnowledgeMatch;
  feedbackGiven?: boolean;
}

interface Choice {
  id: string;
  text: string;
  confidence?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastModified: Date;
}

export default function ChatWorkspace() {
  const [conversation, setConversation] = useState<Conversation>({
    id: "default",
    title: "New Conversation",
    messages: [],
    createdAt: new Date(),
    lastModified: new Date()
  });
  
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showContextPane, setShowContextPane] = useState(true);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSources, setShowSources] = useState(true);
  const [autonomousSearch, setAutonomousSearch] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversation.messages]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleNewConversation = useCallback(() => {
    setConversation({
      id: generateId(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      lastModified: new Date()
    });
    setChoices([]);
    setSearchResults([]);
    setSelectedMessageId(null);
    setCurrentInput("");
    toast.success("Started new conversation");
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: currentInput.trim(),
      timestamp: new Date(),
      type: "text"
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      lastModified: new Date()
    }));

    const input = currentInput.trim();
    setCurrentInput("");
    setIsLoading(true);
    setChoices([]);

    try {
      // First, try to find a knowledge base match
      if (knowledgeEnabled) {
        const knowledgeMatch = await knowledgeBaseService.findBestMatch(input);
        
        if (knowledgeMatch) {
          await handleKnowledgeResponse(input, knowledgeMatch);
          return;
        }
      }

      // Detect command type if no knowledge match
      const isSearch = input.startsWith("/search") || input.toLowerCase().includes("search");
      const isCalc = input.startsWith("/calc") || input.toLowerCase().includes("calculate");
      const isChart = input.startsWith("/chart") || input.toLowerCase().includes("chart");

      if (isSearch) {
        await handleSearch(input.replace("/search", "").trim() || input);
      } else if (isCalc) {
        await handleCalculation(input.replace("/calc", "").trim() || input);
      } else if (isChart) {
        await handleChart(input.replace("/chart", "").trim() || input);
      } else {
        await handleTextResponse(input);
      }
    } catch (error) {
      toast.error("Failed to process message");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, isLoading, knowledgeEnabled]);

  const handleKnowledgeResponse = async (input: string, knowledgeMatch: KnowledgeMatch) => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: knowledgeMatch.pair.answer,
      timestamp: new Date(),
      type: "knowledge",
      confidence: knowledgeMatch.confidence,
      knowledgeMatch,
      feedbackGiven: false
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
      lastModified: new Date()
    }));

    // Show feedback choices for knowledge responses
    if (knowledgeMatch.confidence < 0.95) {
      setChoices([
        { 
          id: "feedback_positive", 
          text: "This answer was helpful", 
          confidence: Math.round(knowledgeMatch.confidence * 100) 
        },
        { 
          id: "feedback_negative", 
          text: "This wasn't what I was looking for", 
          confidence: Math.round((1 - knowledgeMatch.confidence) * 100) 
        },
        { 
          id: "more_info", 
          text: "Tell me more about this", 
          confidence: 85 
        }
      ]);
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchResults([]);

    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults: SearchResult[] = [
        {
          title: "Understanding Machine Learning",
          url: "https://example.com/ml-guide",
          snippet: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
        },
        {
          title: "Neural Networks Explained",
          url: "https://example.com/neural-networks",
          snippet: "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes that process information."
        }
      ];

      setSearchResults(mockResults);

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `I found ${mockResults.length} relevant results for "${query}". The search covers key concepts in machine learning and neural networks.`,
        timestamp: new Date(),
        type: "text",
        confidence: 0.92,
        sources: mockResults
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        lastModified: new Date()
      }));

    } finally {
      setIsSearching(false);
    }
  };

  const handleCalculation = async (expression: string) => {
    try {
      // Try to find a math answer in knowledge base first
      if (knowledgeEnabled) {
        const knowledgeMatch = await knowledgeBaseService.findBestMatch(expression);
        if (knowledgeMatch && knowledgeMatch.pair.category === 'mathematics') {
          await handleKnowledgeResponse(expression, knowledgeMatch);
          return;
        }
      }

      // Simulate math calculation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockSteps = [
        { step: "Parse expression", formula: "f(x) = ax² + bx + c", result: "Quadratic function identified" },
        { step: "Apply quadratic formula", formula: "x = (-b ± √(b²-4ac)) / 2a", result: "x = 2, x = -1" },
        { step: "Verify solutions", formula: "f(2) = 0, f(-1) = 0", result: "Solutions verified" }
      ];

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `Solution for: ${expression}\n\nThe quadratic equation has two real solutions: x = 2 and x = -1`,
        timestamp: new Date(),
        type: "math",
        confidence: 0.98,
        mathSteps: mockSteps
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        lastModified: new Date()
      }));

    } catch (error) {
      toast.error("Calculation failed");
    }
  };

  const handleChart = async (request: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockChartData = {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [{
            label: "Sample Data",
            data: [12, 19, 3, 5, 2],
            borderColor: "rgb(155, 140, 255)",
            backgroundColor: "rgba(155, 140, 255, 0.2)"
          }]
        }
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `Generated chart for: ${request}`,
        timestamp: new Date(),
        type: "chart",
        confidence: 0.85,
        chartData: mockChartData
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        lastModified: new Date()
      }));

    } catch (error) {
      toast.error("Chart generation failed");
    }
  };

  const handleTextResponse = async (input: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `I understand you're asking about "${input}". This is a sample response that would typically contain relevant information based on your query. For more accurate answers, try asking specific questions or enable the knowledge base feature.`,
        timestamp: new Date(),
        type: "text",
        confidence: 0.89
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        lastModified: new Date()
      }));

      // Simulate choices
      if (Math.random() > 0.5) {
        setChoices([
          { id: "1", text: "Tell me more about this topic", confidence: 85 },
          { id: "2", text: "Show me related examples", confidence: 78 },
          { id: "3", text: "Explain in simpler terms", confidence: 92 }
        ]);
      }

    } catch (error) {
      toast.error("Failed to generate response");
    }
  };

  const handleChoiceSelect = useCallback((choice: Choice) => {
    if (choice.id.startsWith("feedback_")) {
      handleFeedback(choice.id, choice.text);
      return;
    }

    setCurrentInput(choice.text);
    setChoices([]);
    setTimeout(() => handleSendMessage(), 100);
  }, [handleSendMessage]);

  const handleFeedback = useCallback((feedbackType: string, feedbackText: string) => {
    const selectedMessage = conversation.messages.find(m => m.id === selectedMessageId);
    
    if (selectedMessage?.knowledgeMatch) {
      const feedback = feedbackType === "feedback_positive" ? "positive" : 
                      feedbackType === "feedback_negative" ? "negative" : "neutral";
      
      knowledgeBaseService.learnFromFeedback({
        question: selectedMessage.knowledgeMatch.pair.question,
        selectedAnswer: selectedMessage.knowledgeMatch.pair.answer,
        rejectedAnswers: [],
        feedback
      });

      // Update message to mark feedback as given
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.map(m => 
          m.id === selectedMessage.id ? { ...m, feedbackGiven: true } : m
        )
      }));

      toast.success(
        feedback === "positive" ? "Thanks for the positive feedback!" : 
        feedback === "negative" ? "Thanks for the feedback. I'll learn from this." :
        "Feedback received"
      );
    }

    setChoices([]);
  }, [conversation.messages, selectedMessageId]);

  const handleVoiceToggle = useCallback(async () => {
    if (!voiceEnabled) {
      toast.error("Voice features disabled. Enable in settings.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.start();
        setIsRecording(true);
        
        mediaRecorder.ondataavailable = (event) => {
          // Handle audio data
          console.log("Audio data available:", event.data);
        };
        
        mediaRecorder.onstop = () => {
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
          toast.success("Voice recording completed");
        };
      } catch (error) {
        toast.error("Microphone access denied");
        console.error(error);
      }
    }
  }, [voiceEnabled, isRecording]);

  const handleExport = useCallback(() => {
    const exportData = {
      conversation,
      exportedAt: new Date().toISOString(),
      creator: "Ntare Shema Prince",
      knowledgeBaseStats: knowledgeBaseService.getStats()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Conversation exported successfully");
  }, [conversation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape" && isRecording) {
      handleVoiceToggle();
    }
  };

  const renderMessage = (message: Message) => {
    const isSelected = selectedMessageId === message.id;
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 rounded-lg transition-colors ${
          isSelected ? "bg-accent/10" : "hover:bg-muted/50"
        } ${message.role === "assistant" ? "bg-card/50" : ""}`}
        onClick={() => setSelectedMessageId(message.id)}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          {message.type === "knowledge" ? (
            <Brain className="w-4 h-4 text-primary" />
          ) : (
            <MessageCircle className="w-4 h-4 text-primary" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {message.role === "user" ? "You" : "Assistant"}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.confidence && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(message.confidence * 100)}% confidence
              </Badge>
            )}
            {message.type === "knowledge" && (
              <Badge variant="outline" className="text-xs">
                <Lightbulb className="w-3 h-3 mr-1" />
                Knowledge Base
              </Badge>
            )}
            {message.knowledgeMatch && (
              <Badge variant="outline" className="text-xs">
                {message.knowledgeMatch.matchType} match
              </Badge>
            )}
            {message.sources && showSources && (
              <Badge variant="outline" className="text-xs">
                {message.sources.length} sources
              </Badge>
            )}
          </div>
          
          <div className="text-sm leading-relaxed">
            {message.type === "math" ? (
              <div className="font-mono bg-muted/30 p-3 rounded border">
                {message.content}
              </div>
            ) : message.type === "chart" ? (
              <div className="bg-muted/30 p-4 rounded border">
                <div className="text-center text-muted-foreground">
                  [Chart Visualization]
                </div>
                <div className="text-xs text-right mt-2 opacity-60">
                  creator: Ntare Shema Prince
                </div>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
          </div>

          {message.knowledgeMatch && !message.feedbackGiven && message.role === "assistant" && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("feedback_positive", "Helpful response")}
                className="text-xs h-7"
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                Helpful
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback("feedback_negative", "Not helpful")}
                className="text-xs h-7"
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                Not helpful
              </Button>
            </div>
          )}

          {message.mathSteps && (
            <Collapsible className="mt-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  Show Steps
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {message.mathSteps.map((step, idx) => (
                  <div key={idx} className="bg-muted/20 p-2 rounded text-xs">
                    <div className="font-medium">{step.step}</div>
                    <div className="font-mono text-muted-foreground">{step.formula}</div>
                    <div>{step.result}</div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    );
  };

  const renderContextPane = () => {
    const selectedMessage = conversation.messages.find(m => m.id === selectedMessageId);
    
    if (!selectedMessage) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <MessageSquareCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a message to view details</p>
          
          {/* Knowledge Base Stats */}
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" />
              <span className="font-medium text-sm">Knowledge Base</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Total Q&A pairs:</span>
                <span>{knowledgeBaseService.getStats().totalPairs}</span>
              </div>
              <div className="flex justify-between">
                <span>Categories:</span>
                <span>{Object.keys(knowledgeBaseService.getStats().categories).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={knowledgeEnabled ? "default" : "outline"} className="text-xs">
                  {knowledgeEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Message Details</h3>
          <Badge variant="outline" className="text-xs">
            {selectedMessage.type}
          </Badge>
        </div>

        {selectedMessage.confidence && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Confidence</span>
              <span>{Math.round(selectedMessage.confidence * 100)}%</span>
            </div>
            <Progress value={selectedMessage.confidence * 100} className="h-1" />
          </div>
        )}

        {selectedMessage.knowledgeMatch && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Knowledge Match</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Match Type:</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedMessage.knowledgeMatch.matchType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span>{Math.round(selectedMessage.knowledgeMatch.score)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="capitalize">{selectedMessage.knowledgeMatch.pair.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage Count:</span>
                <span>{selectedMessage.knowledgeMatch.pair.useCount}</span>
              </div>
            </div>
          </div>
        )}

        {selectedMessage.sources && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Sources</h4>
            {selectedMessage.sources.map((source, idx) => (
              <Card key={idx} className="p-3">
                <div className="text-xs font-medium text-primary truncate">
                  {source.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {source.snippet}
                </div>
              </Card>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Live Search</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SearchX className="w-4 h-4 animate-pulse" />
              Searching...
            </div>
          </div>
        )}

        {searchResults.length > 0 && !selectedMessage.sources && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Search Results</h4>
            <ScrollArea className="h-40">
              {searchResults.map((result, idx) => (
                <Card key={idx} className="p-3 mb-2">
                  <div className="text-xs font-medium text-primary truncate">
                    {result.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.snippet}
                  </div>
                </Card>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-card rounded-lg border shadow-lg overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-card/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-heading font-semibold text-lg truncate">
                {conversation.title}
              </h2>
              <Badge 
                variant={autosaveStatus === "saved" ? "secondary" : "outline"}
                className="text-xs"
              >
                {autosaveStatus === "saving" ? "Saving..." : 
                 autosaveStatus === "error" ? "Save Error" : "Saved"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="text-xs"
              >
                <MessageSquarePlus className="w-3 h-3 mr-1" />
                New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-xs"
              >
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContextPane(!showContextPane)}
                className="md:hidden"
              >
                <PanelTop className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Created by Ntare Shema Prince
            </Badge>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{conversation.messages.length} messages</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <Switch
                  checked={knowledgeEnabled}
                  onCheckedChange={setKnowledgeEnabled}
                  className="scale-75"
                />
                Knowledge base
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <Switch
                  checked={showSources}
                  onCheckedChange={setShowSources}
                  className="scale-75"
                />
                Cite sources
              </label>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {conversation.messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                    Ask questions, request searches with /search, perform calculations with /calc, 
                    or create charts with /chart.
                  </p>
                  {knowledgeEnabled && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Brain className="w-4 h-4" />
                      <span>Knowledge base active with {knowledgeBaseService.getStats().totalPairs} trained responses</span>
                    </div>
                  )}
                </div>
              ) : (
                conversation.messages.map(renderMessage)
              )}
              
              {isLoading && (
                <div className="flex gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">Assistant</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-75" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-150" />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {knowledgeEnabled ? "Searching knowledge base..." : "Thinking..."}
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Choices */}
        {choices.length > 0 && (
          <div className="border-t p-4 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-3">Choose a response:</div>
            <div className="flex flex-wrap gap-2">
              {choices.map(choice => (
                <Button
                  key={choice.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleChoiceSelect(choice)}
                  className="text-xs h-8"
                >
                  {choice.text}
                  {choice.confidence && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {choice.confidence}%
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4 bg-card/50">
          <div className="flex gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentInput(currentInput + "/search ")}
              className="text-xs"
            >
              /search
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentInput(currentInput + "/calc ")}
              className="text-xs"
            >
              /calc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentInput(currentInput + "/chart ")}
              className="text-xs"
            >
              /chart
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything... (Ctrl+Enter to send)"
                className="resize-none min-h-[44px] max-h-32 pr-20"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={`w-8 h-8 p-0 ${
                    isRecording ? "text-destructive bg-destructive/10" : ""
                  }`}
                  disabled={!voiceEnabled}
                >
                  <Speech className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isLoading}
              className="px-6"
            >
              Send
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Ctrl+Enter to send • Esc to stop recording</span>
              {isRecording && (
                <span className="text-destructive animate-pulse">● Recording</span>
              )}
              {knowledgeEnabled && (
                <span className="text-primary">🧠 Knowledge base active</span>
              )}
            </div>
            <label className="flex items-center gap-1 cursor-pointer">
              <Switch
                checked={autonomousSearch}
                onCheckedChange={setAutonomousSearch}
                className="scale-75"
              />
              Auto search
            </label>
          </div>
        </div>
      </div>

      {/* Context Pane */}
      {showContextPane && (
        <>
          <Separator orientation="vertical" />
          <div className="w-80 bg-card/30 border-l hidden md:block">
            {renderContextPane()}
          </div>
        </>
      )}
    </div>
  );
}