import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownMessage({ text }) {
  return (
    <div
      style={{
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code
                style={{
                  background: "#eee",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  background: "#111",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: "10px",
                  overflowX: "auto",
                }}
              >
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessage;