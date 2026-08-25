import type { SaveStudentRequest } from '../features/students/students.types';

export function createEmptyStudentForm(): SaveStudentRequest {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}
