import { DEFAULT_SUBSCRIPTION_PLANS, subscriptionService } from '../lib/services/subscription.service';

export function runSubscriptionEngineTests() {
  console.log('=== TEST SUITE: CARDRIVE SUBSCRIPTION MONETIZATION ENGINE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // --- 1. TIER CAPACITY PLANS ---
  console.log('--- 1. Paliers de Capacité Flotte ---');
  assert(DEFAULT_SUBSCRIPTION_PLANS.length === 4, '4 forfaits standards configurés');

  const starter = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.slug === 'starter');
  assert(starter !== undefined, 'Forfait Starter existe');
  assert(starter?.max_vehicles === 5, 'Starter max 5 véhicules');
  assert(starter?.price_monthly === 490, 'Starter 490 MAD / mois');

  const pro = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.slug === 'pro');
  assert(pro?.max_vehicles === 15, 'Pro max 15 véhicules');
  assert(pro?.price_monthly === 990, 'Pro 990 MAD / mois');

  const business = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.slug === 'business');
  assert(business?.max_vehicles === 30, 'Business max 30 véhicules');
  assert(business?.price_monthly === 1790, 'Business 1 790 MAD / mois');

  const unlimited = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.slug === 'unlimited');
  assert(unlimited?.max_vehicles === null, 'Illimité pas de plafond (null)');
  assert(unlimited?.price_monthly === 2990, 'Illimité 2 990 MAD / mois');

  // --- 2. AUTOMATIC TIER DETERMINATION ---
  console.log('\n--- 2. Attribution Automatique de Palier ---');
  assert(subscriptionService.findPlanForCount(3).slug === 'starter', '3 véhicules -> Starter');
  assert(subscriptionService.findPlanForCount(5).slug === 'starter', '5 véhicules -> Starter');
  assert(subscriptionService.findPlanForCount(6).slug === 'pro', '6 véhicules -> Pro');
  assert(subscriptionService.findPlanForCount(15).slug === 'pro', '15 véhicules -> Pro');
  assert(subscriptionService.findPlanForCount(16).slug === 'business', '16 véhicules -> Business');
  assert(subscriptionService.findPlanForCount(30).slug === 'business', '30 véhicules -> Business');
  assert(subscriptionService.findPlanForCount(31).slug === 'unlimited', '31 véhicules -> Unlimited');
  assert(subscriptionService.findPlanForCount(100).slug === 'unlimited', '100 véhicules -> Unlimited');

  console.log(`\n========================================`);
  console.log(`RÉSULTAT: ${passed} passés, ${failed} échoués`);
  console.log(`========================================\n`);

  return failed === 0;
}

runSubscriptionEngineTests();
