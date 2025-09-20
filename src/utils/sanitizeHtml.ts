import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
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
  const sanitizedHtml = sanitizeHtml(html);

  return React.createElement(tag, {
    className,
    dangerouslySetInnerHTML: { __html: sanitizedHtml }
  });
};

export default SafeHTML;