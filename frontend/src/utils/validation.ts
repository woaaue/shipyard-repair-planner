export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email обязателен';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Некорректный формат email';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Пароль обязателен';
  if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} обязателен`;
  return null;
};

export const validateFullName = (name: string): string | null => {
  if (!name) return 'ФИО обязательно';
  const nameRegex = /^[а-яА-ЯёЁ\s-]+$/;
  if (!nameRegex.test(name)) return 'ФИО должно содержать только кириллицу, пробелы и дефис';
  return null;
};

export const validateIMO = (imo: string): string | null => {
  if (!imo) return 'IMO обязателен';
  if (!/^\d{7}$/.test(imo)) return 'IMO должен содержать 7 цифр';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  const phoneRegex = /^\+?[\d\s()-]{10,}$/;
  if (!phoneRegex.test(phone)) return 'Некорректный формат телефона';
  return null;
};

export const validateDate = (date: string, fieldName = 'Дата'): string | null => {
  if (!date) return `${fieldName} обязательна`;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Некорректная дата';
  return null;
};

export const validateDateRange = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Некорректные даты';
  if (start > end) return 'Дата начала не может быть позже даты окончания';
  return null;
};

export const validateBudget = (budget: number): string | null => {
  if (budget === undefined || budget === null) return 'Бюджет обязателен';
  if (budget <= 0) return 'Бюджет должен быть больше нуля';
  return null;
};

export const validatePositiveNumber = (value: number, fieldName: string): string | null => {
  if (value === undefined || value === null) return `${fieldName} обязательно`;
  if (typeof value !== 'number' || value <= 0) return `${fieldName} должно быть положительным числом`;
  return null;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (data: Record<string, string>, rules: Record<string, ((value: string) => string | null)[]>): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field] || '';
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};