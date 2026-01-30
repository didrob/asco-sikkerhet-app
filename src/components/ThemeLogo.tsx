import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

export function ThemeLogo({ className, alt = "ASCO logo" }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show dark logo as default during SSR/initial load
  if (!mounted) {
    return <img src={logoDark} alt={alt} className={className} />;
  }

  // resolvedTheme handles 'system' and returns 'light' or 'dark'
  const logoSrc = resolvedTheme === 'dark' ? logoLight : logoDark;

  return <img src={logoSrc} alt={alt} className={className} />;
}
