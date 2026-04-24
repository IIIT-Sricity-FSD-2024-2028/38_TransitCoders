// ODDT-210 — Role enum
// Used in @Roles() decorator throughout all controllers.
// Import this — never use raw role strings.
export enum Role {
  SUPER_USER = 'super_user',
  HUB_MANAGER = 'hub_manager',
  MERCHANT = 'merchant',
  DELIVERY_AGENT = 'delivery_agent',
  CUSTOMER = 'customer',
}
