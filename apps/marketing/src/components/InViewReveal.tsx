"use client";

import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";

type InViewRevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  threshold?: number;
};

export function InViewReveal({
  children,
  className,
  threshold = 0.2,
  ...props
}: InViewRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    element.dataset.revealMounted = "true";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches || typeof IntersectionObserver === "undefined") {
      element.dataset.inView = "true";
      return;
    }

    const rect = element.getBoundingClientRect();
    const initiallyInView = rect.top < window.innerHeight && rect.bottom > 0;

    if (initiallyInView) {
      element.dataset.inView = "true";
      return;
    }

    element.dataset.inView = "false";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.dataset.inView = "true";
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div {...props} ref={ref} className={className}>
      {children}
    </div>
  );
}
