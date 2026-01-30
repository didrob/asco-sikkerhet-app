import { forwardRef } from "react";
import { NavLink as RouterNavLink, NavLinkProps as RouterNavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavLinkProps extends Omit<RouterNavLinkProps, 'className'> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        className={typeof className === 'function' ? className : ({ isActive, isPending }) => cn(className)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
