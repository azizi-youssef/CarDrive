import assert from 'node:assert/strict';
import {
  agencyArchiveSchema,
  agencyCustomerQuerySchema,
  agencyInputSchema,
  agencyInviteSchema,
  agencyMemberRoleUpdateSchema,
} from '../lib/validations/agency-access';
import { reviewInputSchema } from '../lib/validations/reviews';

function runTests() {
  const validAgency = {
    name: 'Nador Auto Rent',
    slug: 'nador-auto-rent',
    phone: '+212536601122',
    whatsapp: '+212661234567',
    email: 'contact@example.ma',
    address: 'Boulevard Mohammed V, Nador',
    city: 'Nador',
  };
  assert.equal(agencyInputSchema.safeParse(validAgency).success, true);
  assert.equal(agencyInputSchema.safeParse({ ...validAgency, slug: 'Invalid Slug' }).success, false);
  assert.equal(agencyInputSchema.safeParse({ ...validAgency, email: 'invalid' }).success, false);

  for (const role of ['agency_admin', 'agency_manager', 'agency_agent', 'viewer']) {
    assert.equal(agencyInviteSchema.safeParse({ email: 'agent@example.ma', role }).success, true);
  }
  assert.equal(agencyInviteSchema.safeParse({ email: 'agent@example.ma', role: 'super_admin' }).success, false);
  assert.equal(agencyMemberRoleUpdateSchema.safeParse({ role: 'SUPER_ADMIN' }).success, false);
  assert.equal(agencyArchiveSchema.safeParse({ confirmationName: 'Nador Auto Rent' }).success, true);
  assert.equal(agencyArchiveSchema.safeParse({ confirmationName: '' }).success, false);

  assert.equal(agencyCustomerQuerySchema.safeParse({ page: '1', pageSize: '25', q: '' }).success, true);
  assert.equal(agencyCustomerQuerySchema.safeParse({ page: '0', pageSize: '25' }).success, false);
  assert.equal(agencyCustomerQuerySchema.safeParse({ page: '1', pageSize: '101' }).success, false);
  assert.equal(agencyCustomerQuerySchema.safeParse({ page: '1', status: 'UNKNOWN' }).success, false);
  assert.equal(agencyCustomerQuerySchema.safeParse({ from: '2026-02-31' }).success, false);

  const validReview = {
    booking_id: '10000000-0000-0000-0000-000000000001',
    rating: 5,
    comment: 'Location très satisfaisante.',
  };
  assert.equal(reviewInputSchema.safeParse(validReview).success, true);
  assert.equal(reviewInputSchema.safeParse({ ...validReview, rating: 6 }).success, false);
  assert.equal(reviewInputSchema.safeParse({ ...validReview, comment: 'ok' }).success, false);
  assert.equal(reviewInputSchema.safeParse({ ...validReview, author_name: 'Admin' }).success, false);
}

runTests();
