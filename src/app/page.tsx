"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageSquarePlus, X } from "lucide-react";
import { Toaster } from "sonner";
import NeuralBackground from "@/components/NeuralBackground";
import ChatWorkspace from "@/components/ChatWorkspace";
import SidebarPanel from "@/components/SidebarPanel";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNewConversation = useCallback(() => {
    // This would be handled by the ChatWorkspace component
    console.log("New conversation triggered from topbar");
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, handleNewConversation]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralBackground 
        enableAnimation={true}
        darkOverlay={true}
        className="opacity-60"
      />

      {/* Main Layout Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-heading font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <div className="text-xs text-muted-foreground hidden sm:block">
                by Ntare Shema Prince
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewConversation}
                className="hidden sm:flex"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                New Chat
              </Button>

              {/* Mobile Sidebar Toggle */}
              {isMobile ? (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                    <div className="p-6 overflow-y-auto h-full">
                      <SidebarPanel />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                >
                  {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="h-full max-w-7xl mx-auto">
            {/* Desktop Layout: Two Column Grid */}
            <div className={`grid h-full gap-6 transition-all duration-300 ${
              isMobile 
                ? "grid-cols-1" 
                : sidebarOpen 
                  ? "grid-cols-[1fr_320px]" 
                  : "grid-cols-1"
            }`}>
              {/* Primary Workspace - Chat Area */}
              <div className="min-h-[calc(100vh-8rem)] rounded-lg overflow-hidden">
                <div className="h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg">
                  <ChatWorkspace />
                </div>
              </div>

              {/* Desktop Sidebar */}
              {!isMobile && sidebarOpen && (
                <div className="h-[calc(100vh-8rem)] overflow-hidden">
                  <div className="h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg overflow-y-auto">
                    <div className="p-6">
                      <SidebarPanel />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--card-foreground))',
          },
        }}
      />
    </div>
  );
}