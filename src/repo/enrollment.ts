import { Op, Transaction } from "sequelize";
import { Enrollment } from "../model";
import { EnrollmentInterface, EnrollmentStatus } from "../model/enrollment";

export interface EnrollmentRepoInterface {
    create(
        enrollment: EnrollmentInterface,
        transaction: Transaction
    ): Promise<EnrollmentInterface>;
    findByClassAndStudent(
        schoolId: number,
        liveClassId: number,
        studentId: number,
        transaction?: Transaction
    ): Promise<EnrollmentInterface | null>;
    findFirstWaitlisted(
        schoolId: number,
        liveClassId: number,
        transaction: Transaction
    ): Promise<EnrollmentInterface | null>;
    promoteToEnrolled(id: number, transaction: Transaction): Promise<void>;
    deleteById(id: number, transaction: Transaction): Promise<void>;
    decrementWaitlistPositionsAfter(
        schoolId: number,
        liveClassId: number,
        waitlistPosition: number,
        transaction: Transaction
    ): Promise<void>;
}

export class EnrollmentRepo implements EnrollmentRepoInterface {
    async create(
        enrollment: EnrollmentInterface,
        transaction: Transaction
    ): Promise<EnrollmentInterface> {
        const created = await Enrollment.create(enrollment, { transaction });
        return created.get({ plain: true }) as EnrollmentInterface;
    }

    async findByClassAndStudent(
        schoolId: number,
        liveClassId: number,
        studentId: number,
        transaction?: Transaction
    ): Promise<EnrollmentInterface | null> {
        const enrollment = await Enrollment.findOne({
            where: { schoolId, liveClassId, studentId },
            transaction,
        });
        return enrollment
            ? (enrollment.get({ plain: true }) as EnrollmentInterface)
            : null;
    }

    async findFirstWaitlisted(
        schoolId: number,
        liveClassId: number,
        transaction: Transaction
    ): Promise<EnrollmentInterface | null> {
        const enrollment = await Enrollment.findOne({
            where: {
                schoolId,
                liveClassId,
                status: EnrollmentStatus.WAITLISTED,
            },
            order: [["waitlistPosition", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        return enrollment
            ? (enrollment.get({ plain: true }) as EnrollmentInterface)
            : null;
    }

    async promoteToEnrolled(id: number, transaction: Transaction): Promise<void> {
        await Enrollment.update(
            {
                status: EnrollmentStatus.ENROLLED,
                waitlistPosition: null,
            },
            { where: { id }, transaction }
        );
    }

    async deleteById(id: number, transaction: Transaction): Promise<void> {
        await Enrollment.destroy({ where: { id }, transaction });
    }

    async decrementWaitlistPositionsAfter(
        schoolId: number,
        liveClassId: number,
        waitlistPosition: number,
        transaction: Transaction
    ): Promise<void> {
        await Enrollment.decrement("waitlistPosition", {
            by: 1,
            where: {
                schoolId,
                liveClassId,
                status: EnrollmentStatus.WAITLISTED,
                waitlistPosition: {
                    [Op.gt]: waitlistPosition,
                },
            },
            transaction,
        });
    }
}

export const newEnrollmentRepo = async (): Promise<EnrollmentRepoInterface> => {
    return new EnrollmentRepo();
};
