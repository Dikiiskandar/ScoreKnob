import * as React from "react";

/** Hidden file input behind any clickable content (label/row/button). */
const MediaInput: React.FC<{
  onFile: (file: File) => void;
  accept?: string;
  /** Ask the device for its camera/recorder instead of the file browser. */
  capture?: boolean | "user" | "environment";
  className?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ onFile, accept = "image/*", capture, className = "", title, children }) => (
  <label className={`cursor-pointer ${className}`} title={title}>
    <input
      type="file"
      accept={accept}
      capture={capture}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
    />
    {children}
  </label>
);

export default MediaInput;
