import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MainContent } from "@/app/main-content";

// Mock resizable panels (not supported in jsdom)
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel-group">{children}</div>
  ),
  ResizablePanel: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="panel">{children}</div>,
  ResizableHandle: () => <div data-testid="resize-handle" />,
}));

// Mock context providers (passthrough wrappers)
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useFileSystem: vi.fn(),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useChat: vi.fn(),
}));

// Mock heavy leaf components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MainContent toggle buttons", () => {
  test("shows preview view by default", () => {
    render(<MainContent />);

    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
    expect(screen.queryByTestId("file-tree")).not.toBeInTheDocument();
  });

  test("switches to code view when Code tab is clicked", () => {
    render(<MainContent />);

    const codeTab = screen.getByRole("tab", { name: "Code" });
    fireEvent.click(codeTab);

    expect(screen.queryByTestId("preview-frame")).not.toBeInTheDocument();
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
    expect(screen.getByTestId("file-tree")).toBeInTheDocument();
  });

  test("switches back to preview view when Preview tab is clicked", () => {
    render(<MainContent />);

    // Switch to code view first
    const codeTab = screen.getByRole("tab", { name: "Code" });
    fireEvent.click(codeTab);

    // Now switch back to preview
    const previewTab = screen.getByRole("tab", { name: "Preview" });
    fireEvent.click(previewTab);

    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
    expect(screen.queryByTestId("file-tree")).not.toBeInTheDocument();
  });

  test("Preview tab is active by default", () => {
    render(<MainContent />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const codeTab = screen.getByRole("tab", { name: "Code" });

    expect(previewTab).toHaveAttribute("data-state", "active");
    expect(codeTab).toHaveAttribute("data-state", "inactive");
  });

  test("Code tab becomes active after clicking it", () => {
    render(<MainContent />);

    const codeTab = screen.getByRole("tab", { name: "Code" });
    fireEvent.click(codeTab);

    const previewTab = screen.getByRole("tab", { name: "Preview" });

    expect(codeTab).toHaveAttribute("data-state", "active");
    expect(previewTab).toHaveAttribute("data-state", "inactive");
  });

  test("can toggle back and forth multiple times", () => {
    render(<MainContent />);

    const codeTab = screen.getByRole("tab", { name: "Code" });
    const previewTab = screen.getByRole("tab", { name: "Preview" });

    // Toggle to code
    fireEvent.click(codeTab);
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();

    // Toggle back to preview
    fireEvent.click(previewTab);
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();

    // Toggle to code again
    fireEvent.click(codeTab);
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();

    // Toggle back to preview again
    fireEvent.click(previewTab);
    expect(screen.getByTestId("preview-frame")).toBeInTheDocument();
  });
});
