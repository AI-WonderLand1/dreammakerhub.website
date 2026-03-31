"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { logger } from "@lib/logger";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  primaryColor?: string;
  features: string[];
  plan: "free" | "starter" | "pro" | "enterprise";
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  setTenant: () => {},
  isLoading: true,
});

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export default function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname;
          const subdomain = hostname.split(".")[0];

          if (
            hostname === "localhost" ||
            subdomain === "localhost" ||
            subdomain === "www"
          ) {
            const defaultTenant: Tenant = {
              id: "default",
              name: "AI Wonderland",
              domain: "localhost",
              primaryColor: "#9333ea",
              features: ["wonderbuild", "wonderspace", "ai-generate"],
              plan: "free",
            };
            setTenant(defaultTenant);
          } else {
            const response = await fetch(`/api/tenants/${subdomain}`);
            if (response.ok) {
              const tenantData = await response.json();
              setTenant(tenantData);
            } else {
              setTenant({
                id: "default",
                name: "AI Wonderland",
                domain: "localhost",
                primaryColor: "#9333ea",
                features: ["wonderbuild", "wonderspace", "ai-generate"],
                plan: "free",
              });
            }
          }
        }
      } catch (error) {
        logger.error("Failed to load tenant", { error });
        setTenant({
          id: "default",
          name: "AI Wonderland",
          domain: "localhost",
          primaryColor: "#9333ea",
          features: ["wonderbuild", "wonderspace", "ai-generate"],
          plan: "free",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, setTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}
