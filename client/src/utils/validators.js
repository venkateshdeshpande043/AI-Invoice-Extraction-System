export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

export function validateName(name) {
  if (!name || name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
}

export function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  if (!file) {
    return 'No file selected';
  }
  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, and PDF are allowed';
  }
  if (file.size > maxSize) {
    return 'File is too large. Maximum size is 10 MB';
  }
  return null;
}
