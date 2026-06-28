import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).trimEnd());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>{language || "code"}</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied
            ? <span className="flex items-center gap-1"><Check size={11} /> Copied</span>
            : <span className="flex items-center gap-1"><Copy size={11} /> Copy</span>
          }
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function MarkdownMessage({ text }) {
  return (
    <div className="markdown-body text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline
              ? <CodeBlock language={match ? match[1] : ""}>{children}</CodeBlock>
              : <code className={className} {...props}>{children}</code>;
          },
          pre({ children }) { return <>{children}</>; },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessage;