import React from 'react';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = async (html: string): Promise<string> => {
  try {
    // Dynamically import DOMPurify only when needed
    const { default: DOMPurify } = await import('dompurify');

    // Configure DOMPurify to be more restrictive for user content
    return DOMPurify.sanitize(html, {
      // Allow only basic formatting tags
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      // Ensure links are safe
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'],
    });
  } catch (error) {
    console.warn('Failed to load DOMPurify, using basic sanitization', error);
    // Basic fallback sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
  }
};

/**
 * Component for safely rendering HTML content
 */
export interface SafeHTMLProps {
  html: string;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

/**
 * Safe HTML component that sanitizes content before rendering
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  className = '',
  tag = 'div'
}) => {
  const [sanitizedHtml, setSanitizedHtml] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const sanitizeAndSetHtml = async () => {
      setIsLoading(true);
      try {
        const sanitized = await sanitizeHtml(html);
        setSanitizedHtml(sanitized);
      } catch (error) {
        console.error('Failed to sanitize HTML:', error);
        // Fallback to plain text
        setSanitizedHtml(html.replace(/<[^>]*>/g, ''));
      } finally {
        setIsLoading(false);
      }
    };

    sanitizeAndSetHtml();
  }, [html]);

  if (isLoading) {
    return React.createElement(tag, {
      className,
      children: 'Loading...'
    });
  }

  return React.createElement(tag, {
    className,
    dangerouslySetInnerHTML: { __html: sanitizedHtml }
  });
};

export default SafeHTML;