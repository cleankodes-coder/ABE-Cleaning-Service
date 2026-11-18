import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
}

/**
 * Typographic reproduction of ABE Cleaning's official website wordmark:
 * "ABE" in Navy (#0F1B3D) + "Cleaning" in Gold (#8A6A2C), Poppins bold, tight tracking.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center select-none" aria-label="ABE Cleaning">
        <span className="font-display text-[15px] font-extrabold tracking-[-0.04em] leading-none">
          <span className="text-[#0F1B3D]">ABE</span>
          <span className="text-[#8A6A2C]">.</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline select-none" aria-label="ABE Cleaning">
      <span className="font-display text-[21px] font-bold tracking-[-0.035em] leading-none whitespace-nowrap">
        <span className="text-[#0F1B3D]">ABE</span>{' '}
        <span className="text-[#8A6A2C]">Cleaning</span>
      </span>
    </div>
  );
};
