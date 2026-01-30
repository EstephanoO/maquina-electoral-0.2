export const logout = async () => {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("logout_failed");
  }
};
