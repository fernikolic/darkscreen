"use client";

import Image from "next/image";
import { useState } from "react";

interface AppLogoProps {
  slug: string;
  name: string;
  size?: number;
  className?: string;
  rounded?: boolean;
}

export function AppLogo({ slug, name, size = 24, className = "", rounded = false }: AppLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-dark-border text-text-tertiary ${rounded ? "rounded-full" : "rounded"} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={`/logos/${slug}.png`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`shrink-0 ${rounded ? "rounded-full" : "rounded"} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
