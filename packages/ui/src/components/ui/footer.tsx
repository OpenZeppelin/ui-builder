import { JSX } from 'react';

import { cn } from '@openzeppelin/ui-builder-utils';

/**
 * Props for the Footer component
 */
export interface FooterProps {
  /**
   * Company or organization name for the copyright notice
   * @default 'OpenZeppelin'
   */
  companyName?: string;

  /**
   * Copyright year to display
   * @default Current year
   */
  copyrightYear?: number;

  /**
   * URL for the privacy policy link
   * @default 'https://www.openzeppelin.com/privacy'
   */
  privacyPolicyUrl?: string;

  /**
   * Text for the privacy policy link
   * @default 'Privacy Policy'
   */
  privacyPolicyText?: string;

  /**
   * URL for the terms of service link
   * @default 'https://www.openzeppelin.com/tos'
   */
  termsOfServiceUrl?: string;

  /**
   * Text for the terms of service link
   * @default 'Terms of Service'
   */
  termsOfServiceText?: string;

  /**
   * Whether to show the privacy policy link
   * @default true
   */
  showPrivacyPolicy?: boolean;

  /**
   * Whether to show the terms of service link
   * @default true
   */
  showTermsOfService?: boolean;

  /**
   * Additional CSS classes for the footer container
   */
  className?: string;
}

/**
 * Application footer component with customizable legal links and branding.
 *
 * This component provides a consistent footer layout with customizable:
 * - Company name and copyright year
 * - Privacy policy and terms of service links and text
 * - Optional visibility controls for legal links
 * - Custom styling support
 */
export const Footer = ({
  companyName = 'OpenZeppelin',
  copyrightYear = new Date().getFullYear(),
  privacyPolicyUrl = 'https://www.openzeppelin.com/privacy',
  privacyPolicyText = 'Privacy Policy',
  termsOfServiceUrl = 'https://www.openzeppelin.com/tos',
  termsOfServiceText = 'Terms of Service',
  showPrivacyPolicy = true,
  showTermsOfService = true,
  className,
}: FooterProps = {}): JSX.Element => {
  const hasLegalLinks = showPrivacyPolicy || showTermsOfService;

  return (
    <footer className={cn('border-t bg-background border-[#F5F5F5]', className)}>
      <div className="px-6 py-4 sm:h-12">
        <div className="text-sm text-muted-foreground flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {copyrightYear} {companyName}
          </span>
          {hasLegalLinks && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              {showPrivacyPolicy && (
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {privacyPolicyText}
                </a>
              )}
              {showTermsOfService && (
                <a
                  href={termsOfServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {termsOfServiceText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
