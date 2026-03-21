const FALLBACK_TENANT_ID = "000000000000000000000000";

const normalizeTenantId = (tenantRef) => {
  if (!tenantRef) return FALLBACK_TENANT_ID;
  if (tenantRef._id) return tenantRef._id.toString();
  return tenantRef.toString();
};

const getTenantIdFromUser = (user) => normalizeTenantId(user?.tenant_id);

module.exports = {
  FALLBACK_TENANT_ID,
  normalizeTenantId,
  getTenantIdFromUser,
};
