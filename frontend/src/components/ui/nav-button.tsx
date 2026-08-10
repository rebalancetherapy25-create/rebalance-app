"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "@/components/ui/button";

interface NavButtonProps extends Omit<ButtonProps, "asChild" | "onClick"> {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ href, children, loading, onClick, ...props }, ref) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      
      if (e.defaultPrevented) return;

      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        window.location.href = href;
      } else {
        startTransition(() => {
          router.push(href);
        });
      }
    };

    return (
      <Button
        ref={ref}
        loading={loading || isPending}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

NavButton.displayName = "NavButton";
