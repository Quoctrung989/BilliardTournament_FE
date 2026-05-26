export const anonymizeEmail = (email) => {
  const [localPart, domain] = email.split("@");
  const lengthToHide = Math.min(6, localPart.length);
  const visiblePart = localPart.slice(0, localPart.length - lengthToHide);
  const hiddenPart = "*".repeat(lengthToHide);
  return visiblePart + hiddenPart + "@" + domain;
};
