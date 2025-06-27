import { Router } from 'express';

const router = Router();

// Feature flags configuration
const FEATURE_FLAGS = {
  // Core features
  'voice-journaling': true,
  'ai-insights': true,
  'premium-features': true,
  'offline-mode': true,
  
  // Experimental features (can be toggled)
  'advanced-analytics': process.env.NODE_ENV === 'development',
  'community-features': false,
  'dream-analysis': false,
  'social-sharing': false,
  
  // UI experiments
  'new-onboarding': false,
  'enhanced-editor': true,
  'dark-mode-v2': false,
  'mobile-gestures': true,
  
  // Performance features
  'lazy-loading': true,
  'service-worker': true,
  'background-sync': true,
  'push-notifications': process.env.NODE_ENV === 'production'
};

// A/B test configurations
const AB_TESTS = {
  'pricing-page-v2': {
    enabled: true,
    variants: ['control', 'variant-a', 'variant-b'],
    traffic: 33 // percentage for each variant
  },
  'onboarding-flow': {
    enabled: false,
    variants: ['current', 'simplified'],
    traffic: 50
  }
};

// Get all feature flags
router.get('/api/feature-flags', (req, res) => {
  try {
    // Basic flags available to all users
    let flags = { ...FEATURE_FLAGS };
    
    // Add user-specific flags if authenticated
    if (req.session?.user) {
      const userId = req.session.user.id;
      
      // Premium users get additional features
      if (req.session.user.isPremium) {
        flags['advanced-analytics'] = true;
        flags['community-features'] = true;
        flags['dream-analysis'] = true;
      }
      
      // Beta users get experimental features
      if (req.session.user.isBeta) {
        flags['new-onboarding'] = true;
        flags['enhanced-editor'] = true;
        flags['social-sharing'] = true;
      }
      
      // A/B test assignments
      flags = { ...flags, ...getABTestAssignments(userId) };
    }
    
    res.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.json(FEATURE_FLAGS); // Return defaults on error
  }
});

// Get specific feature flag
router.get('/api/feature-flags/:flagName', (req, res) => {
  try {
    const { flagName } = req.params;
    const flags = FEATURE_FLAGS;
    
    if (flagName in flags) {
      res.json({ [flagName]: flags[flagName] });
    } else {
      res.status(404).json({ error: 'Feature flag not found' });
    }
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to toggle feature flags (requires authentication)
router.post('/api/admin/feature-flags/:flagName', isAuthenticated, (req, res) => {
  try {
    const { flagName } = req.params;
    const { enabled } = req.body;
    
    // Check if user is admin
    if (!req.session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (flagName in FEATURE_FLAGS) {
      FEATURE_FLAGS[flagName] = enabled;
      
      // Log the change
      console.log(`Feature flag '${flagName}' ${enabled ? 'enabled' : 'disabled'} by admin ${req.session.user.id}`);
      
      res.json({ [flagName]: enabled, updated: true });
    } else {
      res.status(404).json({ error: 'Feature flag not found' });
    }
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get A/B test assignment
router.get('/api/ab-test/:testName', (req, res) => {
  try {
    const { testName } = req.params;
    const userId = req.session?.user?.id || req.ip;
    
    if (testName in AB_TESTS) {
      const test = AB_TESTS[testName];
      
      if (!test.enabled) {
        return res.json({ variant: 'control', test: testName });
      }
      
      const variant = getABTestVariant(userId, testName, test);
      res.json({ variant, test: testName });
    } else {
      res.status(404).json({ error: 'A/B test not found' });
    }
  } catch (error) {
    console.error('Error getting A/B test assignment:', error);
    res.json({ variant: 'control' }); // Default to control on error
  }
});

// Helper functions
function getABTestAssignments(userId) {
  const assignments = {};
  
  Object.entries(AB_TESTS).forEach(([testName, config]) => {
    if (config.enabled) {
      const variant = getABTestVariant(userId, testName, config);
      assignments[`ab-${testName}`] = variant;
    }
  });
  
  return assignments;
}

function getABTestVariant(userId, testName, config) {
  // Generate consistent hash for user + test
  const hash = simpleHash(userId + testName);
  const variantIndex = hash % config.variants.length;
  
  // Check if user should be in the test based on traffic allocation
  const trafficHash = hash % 100;
  if (trafficHash >= config.traffic * config.variants.length) {
    return 'control';
  }
  
  return config.variants[variantIndex];
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default router;