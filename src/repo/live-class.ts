import { Transaction } from "sequelize";
import { Enrollment, LiveClass, Student } from "../model";
import { EnrollmentStatus, EnrollmentInterface } from "../model/enrollment";
import { LiveClassInterface } from "../model/live-class";

export interface RosterEntry {
    enrollmentId: number;
    status: EnrollmentStatus;
    waitlistPosition: number | null;
    student: {
        id: number;
        name: string;
        email: string;
    };
}

export interface LiveClassRepoInterface {
    create(liveClass: LiveClassInterface): Promise<LiveClassInterface>;
    findById(id: number): Promise<LiveClassInterface | null>;
    findByCompositeKey(
        schoolId: number,
        title: string,
        startTime: Date
    ): Promise<LiveClassInterface | null>;
    lockById(id: number, transaction: Transaction): Promise<LiveClassInterface | null>;
    updateCounts(
        id: number,
        counts: { enrolledCount?: number; waitlistCount?: number },
        transaction: Transaction
    ): Promise<void>;
    listRoster(schoolId: number, liveClassId: number): Promise<RosterEntry[]>;
}

export class LiveClassRepo implements LiveClassRepoInterface {
    async create(liveClass: LiveClassInterface): Promise<LiveClassInterface> {
        const created = await LiveClass.create(liveClass);
        return created.get({ plain: true }) as LiveClassInterface;
    }

    async findById(id: number): Promise<LiveClassInterface | null> {
        const liveClass = await LiveClass.findByPk(id);
        return liveClass
            ? (liveClass.get({ plain: true }) as LiveClassInterface)
            : null;
    }

    async findByCompositeKey(
        schoolId: number,
        title: string,
        startTime: Date
    ): Promise<LiveClassInterface | null> {
        const liveClass = await LiveClass.findOne({
            where: {
                schoolId,
                title,
                startTime,
            },
        });
        return liveClass
            ? (liveClass.get({ plain: true }) as LiveClassInterface)
            : null;
    }

    async lockById(
        id: number,
        transaction: Transaction
    ): Promise<LiveClassInterface | null> {
        const liveClass = await LiveClass.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        return liveClass
            ? (liveClass.get({ plain: true }) as LiveClassInterface)
            : null;
    }

    async updateCounts(
        id: number,
        counts: { enrolledCount?: number; waitlistCount?: number },
        transaction: Transaction
    ): Promise<void> {
        await LiveClass.update(counts, {
            where: { id },
            transaction,
        });
    }

    async listRoster(schoolId: number, liveClassId: number): Promise<RosterEntry[]> {
        const rows = await Enrollment.findAll({
            where: { schoolId, liveClassId },
            include: [
                {
                    model: Student,
                    as: "student",
                    attributes: ["id", "name", "email"],
                },
            ],
            order: [
                ["status", "ASC"],
                ["waitlistPosition", "ASC"],
                ["createdAt", "ASC"],
            ],
        });

        return rows.map((row) => {
            const plain = row.get({ plain: true }) as EnrollmentInterface & {
                student: { id: number; name: string; email: string };
            };

            return {
                enrollmentId: plain.id as number,
                status: plain.status,
                waitlistPosition: plain.waitlistPosition ?? null,
                student: plain.student,
            };
        });
    }
}

export const newLiveClassRepo = async (): Promise<LiveClassRepoInterface> => {
    return new LiveClassRepo();
};
