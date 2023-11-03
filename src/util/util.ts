export function checkArrayType(value: unknown, type: string): boolean {
    if (!Array.isArray(value)) return false;
    return value.every((item) => typeof item === type);
  }