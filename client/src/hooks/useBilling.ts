import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { addBreadcrumb, captureError } from '@/utils/sentry';
import { performanceMonitor } from '@/utils/performance';

interface BillingInfo {
  hasPaymentMethod: boolean;
  customer: {
    id: string;
    email: string;
    created: number;
  } | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    plan: {
      id: string;
      amount: number;
      currency: string;
      interval: string;
    } | null;
  } | null;
}

export const useBilling = () => {
  // Get billing information
  const { data: billingInfo, isLoading: isBillingLoading, error: billingError } = useQuery({
    queryKey: ['/api/billing-info'],
    queryFn: async (): Promise<BillingInfo> => {
      performanceMonitor.startMark('billing-info-fetch');
      
      try {
        const response = await apiRequest('GET', '/api/billing-info');
        
        if (!response.ok) {
          throw new Error('Failed to fetch billing information');
        }

        const data = await response.json();
        addBreadcrumb('Billing info fetched', 'billing', {
          hasSubscription: !!data.subscription
        });

        return data;
      } catch (error) {
        captureError(error as Error, { context: 'billing-info-fetch' });
        throw error;
      } finally {
        performanceMonitor.endMark('billing-info-fetch');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create billing portal session
  const manageBilling = useMutation({
    mutationFn: async (stripeCustomerId?: string) => {
      performanceMonitor.startMark('billing-portal-create');
      addBreadcrumb('Creating billing portal session', 'billing', {
        hasCustomerId: !!stripeCustomerId
      });

      try {
        const response = await apiRequest('POST', '/api/billing-portal', {
          stripeCustomerId
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create billing portal session');
        }

        const data = await response.json();
        
        addBreadcrumb('Billing portal session created', 'billing', {
          customerId: data.customerId
        });

        return data;
      } catch (error) {
        captureError(error as Error, {
          context: 'billing-portal-create',
          stripeCustomerId
        });
        throw error;
      } finally {
        performanceMonitor.endMark('billing-portal-create');
      }
    },
    onSuccess: (data) => {
      // Redirect to billing portal
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      console.error('Failed to create billing portal session:', error.message);
    }
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      performanceMonitor.startMark('subscription-cancel');
      addBreadcrumb('Canceling subscription', 'billing');

      try {
        const response = await apiRequest('POST', '/api/cancel-subscription');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel subscription');
        }

        const data = await response.json();
        
        addBreadcrumb('Subscription canceled', 'billing', {
          subscriptionId: data.subscription?.id
        });

        return data;
      } catch (error) {
        captureError(error as Error, { context: 'subscription-cancel' });
        throw error;
      } finally {
        performanceMonitor.endMark('subscription-cancel');
      }
    },
    onSuccess: () => {
      // Invalidate billing info to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/billing-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/premium-status'] });
    },
    onError: (error: Error) => {
      console.error('Failed to cancel subscription:', error.message);
    }
  });

  // Helper function to handle manage billing click
  const handleManageBilling = () => {
    const customerId = billingInfo?.customer?.id;
    manageBilling.mutate(customerId);
  };

  // Helper function to format subscription status
  const getSubscriptionStatusDisplay = () => {
    if (!billingInfo?.subscription) return 'No subscription';
    
    const { status, cancelAtPeriodEnd } = billingInfo.subscription;
    
    if (cancelAtPeriodEnd) {
      return 'Canceling at period end';
    }
    
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Free trial';
      case 'past_due':
        return 'Past due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status;
    }
  };

  // Helper function to format plan display
  const getPlanDisplay = () => {
    const plan = billingInfo?.subscription?.plan;
    if (!plan) return 'No plan';
    
    const amount = (plan.amount / 100).toFixed(2);
    const currency = plan.currency.toUpperCase();
    const interval = plan.interval;
    
    return `$${amount} ${currency}/${interval}`;
  };

  return {
    billingInfo,
    isBillingLoading,
    billingError,
    manageBilling: {
      mutate: handleManageBilling,
      isPending: manageBilling.isPending,
      error: manageBilling.error
    },
    cancelSubscription: {
      mutate: cancelSubscription.mutate,
      isPending: cancelSubscription.isPending,
      error: cancelSubscription.error
    },
    helpers: {
      getSubscriptionStatusDisplay,
      getPlanDisplay,
      hasActiveSubscription: billingInfo?.subscription?.status === 'active',
      isTrialing: billingInfo?.subscription?.status === 'trialing'
    }
  };
};