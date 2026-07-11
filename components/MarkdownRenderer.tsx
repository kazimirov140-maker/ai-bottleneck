import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all" {...props} />,
        strong: ({ node, ...props }) => <strong className="text-foreground font-bold" {...props} />,
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline ? (
            <div className="bg-slate-900 rounded-md p-4 overflow-x-auto my-2 border border-slate-700">
              <code className={className} {...props}>
                {children}
              </code>
            </div>
          ) : (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-primary" {...props}>
              {children}
            </code>
          );
        },
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-border border border-border rounded-lg" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => <th className="px-4 py-2 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props} />,
        td: ({ node, ...props }) => <td className="px-4 py-2 whitespace-nowrap text-sm border-t border-border" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
