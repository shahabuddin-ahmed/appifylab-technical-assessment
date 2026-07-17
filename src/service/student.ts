import { ERROR_CODES } from "../constant/error";
import { StudentInterface } from "../model/student";
import { SchoolRepoInterface } from "../repo/school";
import {
    StudentEnrollmentSummary,
    StudentRepoInterface,
} from "../repo/student";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { NotFoundException } from "../web/exception/not-found-exception";

export interface StudentServiceInterface {
    create(student: StudentInterface): Promise<StudentInterface>;
    getById(id: number): Promise<StudentInterface>;
    listEnrollments(
        schoolId: number,
        studentId: number
    ): Promise<StudentEnrollmentSummary[]>;
}

export class StudentService implements StudentServiceInterface {
    constructor(
        private studentRepo: StudentRepoInterface,
        private schoolRepo: SchoolRepoInterface
    ) {}

    async create(student: StudentInterface): Promise<StudentInterface> {
        const school = await this.schoolRepo.findById(student.schoolId);
        if (!school) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "School does not exist"
            );
        }

        return this.studentRepo.create(student);
    }

    async getById(id: number): Promise<StudentInterface> {
        const student = await this.studentRepo.findById(id);
        if (!student) {
            throw new NotFoundException(
                ERROR_CODES.E_PAGE_NOT_FOUND,
                "Student not found"
            );
        }
        return student;
    }

    async listEnrollments(
        schoolId: number,
        studentId: number
    ): Promise<StudentEnrollmentSummary[]> {
        const student = await this.getById(studentId);
        if (student.schoolId !== schoolId) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "Student does not belong to the provided school"
            );
        }
        return this.studentRepo.listEnrollments(schoolId, studentId);
    }
}

export const newStudentService = async (
    studentRepo: StudentRepoInterface,
    schoolRepo: SchoolRepoInterface
): Promise<StudentServiceInterface> => {
    return new StudentService(studentRepo, schoolRepo);
};
