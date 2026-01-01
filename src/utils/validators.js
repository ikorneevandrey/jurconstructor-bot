export function validatePhone(phone) {
  if (typeof phone !== 'string') return false;
  
  // Российские номера
  const ruRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  
  // Международный формат
  const intlRegex = /^\+\d{10,15}$/;
  
  return ruRegex.test(phone) || intlRegex.test(phone);
}

export function validateUsername(username) {
  if (typeof username !== 'string') return false;
  
  // Ограничение длины и символов
  if (username.length < 3 || username.length > 20) return false;
  
  // Только буквы, цифры, подчеркивания
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  
  return usernameRegex.test(username);
}

export function validateUserId(userId) {
  return Number.isInteger(userId) && userId > 0;
}

export function sanitizeInput(input, maxLength = 100) {
  if (typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Защита от XSS
    .trim();
}