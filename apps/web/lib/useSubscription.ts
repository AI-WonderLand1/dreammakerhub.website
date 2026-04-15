import { useState, useEffect } from 'react';
import { getAuthUser } from '@/lib/auth';

type SubscriptionStatus = {
  isPaid: boolean;
  plan: string | null;
  isLoading: boolean;
  error: string | null;
};

export function useSubscription(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isPaid: false,
    plan: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const user = await getAuthUser();
        
        if (!user) {
          setStatus({
            isPaid: false,
            plan: null,
            isLoading: false,
            error: 'Not authenticated',
          });
          return;
        }

        // Check for smoke mode (testing)
        const isSmokeMode = process.env.NEXT_PUBLIC_SMOKE_MODE === 'true';
        
        setStatus({
          isPaid: user.isPaid || isSmokeMode,
          plan: user.plan,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Failed to check subscription:', error);
        setStatus({
          isPaid: false,
          plan: null,
          isLoading: false,
          error: 'Failed to check subscription status',
        });
      }
    };

    checkSubscription();
  }, []);

  return status;
}

// Helper hook for feature gating
export function useFeatureGate(feature: 'agents' | 'runners' | 'ai' | 'unlimited') {
  const { isPaid, plan, isLoading } = useSubscription();
  
  const getFeatureAccess = () => {
    if (isLoading) return { allowed: false, reason: 'Checking subscription...' };
    
    switch (feature) {
      case 'ai':
        return { allowed: isPaid, reason: isPaid ? '' : 'AI requires Pro plan' };
      
      case 'agents':
        return { 
          allowed: isPaid, 
          reason: isPaid ? '' : 'Agents require Pro plan' 
        };
      
      case 'runners':
        return { 
          allowed: isPaid, 
          reason: isPaid ? '' : 'Runners require Pro plan' 
        };
      
      case 'unlimited':
        return { 
          allowed: plan === 'pro' || plan === 'enterprise', 
          reason: plan === 'pro' || plan === 'enterprise' ? '' : 'Unlimited features require Pro plan' 
        };
      
      default:
        return { allowed: false, reason: 'Unknown feature' };
    }
  };

  return {
    ...getFeatureAccess(),
    isPaid,
    plan,
    isLoading,
  };
}