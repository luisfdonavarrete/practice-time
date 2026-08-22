export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  timeZone: string;
}

export interface PaginatedStudents {
  data: Student[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface SaveStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  timeZone: string;
}
