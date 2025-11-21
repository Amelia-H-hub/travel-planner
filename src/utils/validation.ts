export const validatePassword = (value: string) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+[\]{};:,.<>?]+$/;
  return regex.test(value) || "Password must contain at least one letter and one number.";
}

export const validateConfirmPassword = (value: string, password: string) => {
  return value === password || "Passwords do not match";
}