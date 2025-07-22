"use client";

import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
}

const FallbackTextEditor: React.FC<Props> = ({
  value,
  onChange,
  onBlur,
  placeholder = "Write your answer here...",
  className = "",
  showToolbar = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState("");

  // Handle text selection for toolbar actions
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = value.substring(start, end);
      setSelectedText(selected);
    }
  };

  // Insert text at cursor position
  const insertText = (before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos =
          start + before.length + selectedText.length + after.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Toolbar actions
  const makeBold = () => insertText("**", "**");
  const makeItalic = () => insertText("*", "*");
  const makeList = () => {
    const lines = value.split("\n");
    const start = textareaRef.current?.selectionStart || 0;
    const currentLineIndex = value.substring(0, start).split("\n").length - 1;

    if (lines[currentLineIndex] && !lines[currentLineIndex].startsWith("- ")) {
      lines[currentLineIndex] = "- " + lines[currentLineIndex];
      onChange(lines.join("\n"));
    }
  };

  const makeNumberedList = () => {
    const lines = value.split("\n");
    const start = textareaRef.current?.selectionStart || 0;
    const currentLineIndex = value.substring(0, start).split("\n").length - 1;

    if (lines[currentLineIndex] && !lines[currentLineIndex].match(/^\d+\. /)) {
      lines[currentLineIndex] = "1. " + lines[currentLineIndex];
      onChange(lines.join("\n"));
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const linkText = selectedText || "link text";
      insertText(`[${linkText}](${url})`);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showToolbar && (
        <div className="mb-2 flex flex-wrap gap-2 rounded-t-md border border-b-0 border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={makeBold}
            className="h-8 px-2 text-xs"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={makeItalic}
            className="h-8 px-2 text-xs italic"
            title="Italic (Ctrl+I)"
          >
            I
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={makeList}
            className="h-8 px-2 text-xs"
            title="Bullet List"
          >
            • List
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={makeNumberedList}
            className="h-8 px-2 text-xs"
            title="Numbered List"
          >
            1. List
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertLink}
            className="h-8 px-2 text-xs"
            title="Insert Link"
          >
            🔗 Link
          </Button>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onSelect={handleTextSelection}
        placeholder={placeholder}
        className={`min-h-[500px] resize-none ${showToolbar ? "rounded-t-none" : ""}`}
      />

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <p>
          <strong>Formatting tips:</strong> Use **bold**, *italic*, - for bullet
          lists, 1. for numbered lists, [text](url) for links
        </p>
      </div>
    </div>
  );
};

export default FallbackTextEditor;
