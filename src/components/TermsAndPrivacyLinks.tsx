import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndPrivacyLinks: React.FC = () => {
  return (
    <span>
      By submitting this booking, I agree to the{' '}
      <Link
        to="/terms"
        className="text-studio-green underline hover:no-underline"
      >
        Terms
      </Link>{' '}
      and{' '}
      <Link
        to="/privacy"
        className="text-studio-green underline hover:no-underline"
      >
        Privacy Policy
      </Link>
      , and authorize transactional email communications related to my booking.
    </span>
  );
};

export default TermsAndPrivacyLinks;