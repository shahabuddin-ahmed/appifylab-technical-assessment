import { Transaction } from "sequelize";
import { Enrollment, LiveClass, Student } from "../model";
import { EnrollmentStatus } from "../model/enrollment";
import { StudentInterface } from "../model/student";

export interface StudentEnrollmentSummary {
    enrollmentId: number;
    status: EnrollmentStatus;
    waitlistPosition: number | null;
    liveClass: {
        id: number;
        title: string;
        startTime: Date;
        durationMinutes: number;
        maxSeats: number;
    };
}

export interface StudentRepoInterface {
    create(student: StudentInterface): Promise<StudentInterface>;
    findById(id: number, transaction?: Transaction): Promise<StudentInterface | null>;
    findBySchoolAndEmail(
        schoolId: number,
        email: string,
        transaction?: Transaction
    ): Promise<StudentInterface | null>;
    listEnrollments(schoolId: number, studentId: number): Promise<StudentEnrollmentSummary[]>;
}

export class StudentRepo implements StudentRepoInterface {
    async create(student: StudentInterface): Promise<StudentInterface> {
        const created = await Student.create(student);
        return created.get({ plain: true }) as StudentInterface;
    }

    async findById(
        id: number,
        transaction?: Transaction
    ): Promise<StudentInterface | null> {
        const student = await Student.findByPk(id, { transaction });
        return student ? (student.get({ plain: true }) as StudentInterface) : null;
    }

    async findBySchoolAndEmail(
        schoolId: number,
        email: string,
        transaction?: Transaction
    ): Promise<StudentInterface | null> {
        const student = await Student.findOne({
            where: { schoolId, email },
            transaction,
        });
        return student ? (student.get({ plain: true }) as StudentInterface) : null;
    }

    async listEnrollments(
        schoolId: number,
        studentId: number
    ): Promise<StudentEnrollmentSummary[]> {
        const rows = await Enrollment.findAll({
            where: { schoolId, studentId },
            include: [
                {
                    model: LiveClass,
                    as: "liveClass",
                    attributes: [
                        "id",
                        "title",
                        "startTime",
                        "durationMinutes",
                        "maxSeats",
                    ],
                },
            ],
            order: [[{ model: LiveClass, as: "liveClass" }, "startTime", "ASC"]],
        });

        return rows.map((row) => {
            const plain = row.get({ plain: true }) as any;
            return {
                enrollmentId: plain.id,
                status: plain.status,
                waitlistPosition: plain.waitlistPosition ?? null,
                liveClass: {
                    id: plain.liveClass.id,
                    title: plain.liveClass.title,
                    startTime: plain.liveClass.startTime,
                    durationMinutes: plain.liveClass.durationMinutes,
                    maxSeats: plain.liveClass.maxSeats,
                },
            };
        });
    }
}

export const newStudentRepo = async (): Promise<StudentRepoInterface> => {
    return new StudentRepo();
};
