import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Personalizar componentes para mantener el estilo del chat
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),
          
          // Tablas con estilos optimizados para chat
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 max-w-full">
              <table className="w-full border border-border rounded-lg overflow-hidden table-auto">
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),

          tbody: ({ children }) => (
            <tbody className="divide-y divide-muted">
              {children}
            </tbody>
          ),

          tr: ({ children }) => (
            <tr className="hover:bg-muted transition-colors">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border min-w-0">
              <div className="truncate">
                {children}
              </div>
            </th>
          ),
          
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-foreground min-w-0 align-top">
              <div className="break-words hyphens-auto overflow-wrap-anywhere">
                {children}
              </div>
            </td>
          ),
          
          // Encabezados con tamaños apropiados para chat
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h3>
          ),
          
          // Listas con espaciado apropiado
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 ml-3">
              {children}
            </ul>
          ),
          
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 ml-3">
              {children}
            </ol>
          ),
          
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          
          // Código inline y bloques
          code: ({ node, className, children, ...props }) => {
            const isInline = !className?.includes('language-');

            if (isInline) {
              return (
                <code
                  className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-2"
                {...props}
              >
                {children}
              </code>
            );
          },

          pre: ({ children }) => children,

          // Enlaces
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Texto en negrita y cursiva
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),

          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border pl-4 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Separadores
          hr: () => (
            <hr className="border-border my-4" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 