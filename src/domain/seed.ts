import type { DataField, TextTemplate } from './model'
export const TEAM_ID = 'claims'
export const initialFields: DataField[] = [
  { id: 'field-customer-first-name', teamId: TEAM_ID, path: 'customer.firstName', label: 'Customer first name', type: 'string' },
  { id: 'field-payment-amount', teamId: TEAM_ID, path: 'payment.amount', label: 'Payment amount', type: 'number' },
  { id: 'field-has-representative', teamId: TEAM_ID, path: 'case.hasRepresentative', label: 'Has representative', type: 'boolean' },
  { id: 'field-representative-name', teamId: TEAM_ID, path: 'representative.name', label: 'Representative name', type: 'string' },
  { id: 'field-company-name', teamId: TEAM_ID, path: 'company.name', label: 'Company name', type: 'string' },
]
export const initialTexts: TextTemplate[] = [
  { id: 'corporate-footer', teamId: TEAM_ID, name: 'Corporate footer', html: '<p>Kind regards, <doc-variable field-id="field-company-name"></doc-variable></p>' },
  { id: 'representative-information', teamId: TEAM_ID, name: 'Representative information', html: '<p>Your registered representative is <doc-variable field-id="field-representative-name"></doc-variable>.</p><doc-text-ref text-id="corporate-footer"></doc-text-ref>' },
  { id: 'payment-reminder', teamId: TEAM_ID, name: 'Payment reminder', html: '<h2>Payment reminder</h2><p>Hello <doc-variable field-id="field-customer-first-name"></doc-variable>,</p><p>The outstanding amount is <doc-variable field-id="field-payment-amount"></doc-variable>.</p><doc-text-ref text-id="representative-information" condition-field-id="field-has-representative" expected-value="true"></doc-text-ref>' },
]
