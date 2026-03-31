type ResolveHomepageLinkArgs = {
  href: string;
  requiresAuth?: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
};

export type ResolvedHomepageLink = {
  href: string;
  isDisabled: boolean;
  showsProtectedIndicator: boolean;
};

export function resolveHomepageLink({
  href,
  requiresAuth,
  isAuthenticated,
  isAuthLoading,
}: ResolveHomepageLinkArgs): ResolvedHomepageLink {
  if (isAuthLoading) {
    return {
      href,
      isDisabled: true,
      showsProtectedIndicator: Boolean(requiresAuth),
    };
  }

  if (requiresAuth && !isAuthenticated) {
    return {
      href: `/public-pages/auth?redirectTo=${encodeURIComponent(href)}`,
      isDisabled: false,
      showsProtectedIndicator: true,
    };
  }

  return {
    href,
    isDisabled: false,
    showsProtectedIndicator: Boolean(requiresAuth),
  };
}

