import { RedisClientType } from "redis";
import { Transaction } from "sequelize";
import { ERROR_CODES } from "../constant/error";
import newSequelize from "../infra/sequelize";
import { EnrollmentInterface, EnrollmentStatus } from "../model/enrollment";
import { LiveClassInterface } from "../model/live-class";
import { EnrollmentRepoInterface } from "../repo/enrollment";
import { LiveClassRepoInterface, RosterEntry } from "../repo/live-class";
import { SchoolRepoInterface } from "../repo/school";
import { withTransaction } from "../repo/transaction";
import {
    StudentEnrollmentSummary,
    StudentRepoInterface,
} from "../repo/student";
import { BadRequestException } from "../web/exception/bad-request-exception";
import { NotFoundException } from "../web/exception/not-found-exception";

export interface EnrollmentResult {
    enrollment: EnrollmentInterface;
    wasExisting: boolean;
}

export interface CancellationResult {
    cancelledEnrollmentId: number;
    promotedEnrollmentId: number | null;
}

export interface LiveClassServiceInterface {
    create(liveClass: LiveClassInterface): Promise<LiveClassInterface>;
    enroll(
        schoolId: number,
        liveClassId: number,
        studentId: number
    ): Promise<EnrollmentResult>;
    cancel(
        schoolId: number,
        liveClassId: number,
        studentId: number
    ): Promise<CancellationResult>;
    getRoster(schoolId: number, liveClassId: number): Promise<RosterEntry[]>;
    getStudentEnrollments(
        schoolId: number,
        studentId: number
    ): Promise<StudentEnrollmentSummary[]>;
}

export class LiveClassService implements LiveClassServiceInterface {
    constructor(
        private liveClassRepo: LiveClassRepoInterface,
        private enrollmentRepo: EnrollmentRepoInterface,
        private schoolRepo: SchoolRepoInterface,
        private studentRepo: StudentRepoInterface,
        private redisClient: RedisClientType | null
    ) {}

    async create(liveClass: LiveClassInterface): Promise<LiveClassInterface> {
        const school = await this.schoolRepo.findById(liveClass.schoolId);
        if (!school) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "School does not exist"
            );
        }

        const existing = await this.liveClassRepo.findByCompositeKey(
            liveClass.schoolId,
            liveClass.title,
            liveClass.startTime
        );
        if (existing) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "Live class already exists for this school at the same start time"
            );
        }

        return this.liveClassRepo.create({
            ...liveClass,
            price: liveClass.price ?? 0,
            enrolledCount: 0,
            waitlistCount: 0,
        });
    }

    async enroll(
        schoolId: number,
        liveClassId: number,
        studentId: number
    ): Promise<EnrollmentResult> {
        const result = await withTransaction(
            async (transaction: Transaction) => {
                const liveClass = await this.mustLockLiveClass(
                    schoolId,
                    liveClassId,
                    transaction
                );
                await this.mustValidateStudent(schoolId, studentId, transaction);

                const existing = await this.enrollmentRepo.findByClassAndStudent(
                    schoolId,
                    liveClassId,
                    studentId,
                    transaction
                );

                if (existing) {
                    return { enrollment: existing, wasExisting: true };
                }

                const hasCapacity =
                    (liveClass.enrolledCount ?? 0) < liveClass.maxSeats;

                if (hasCapacity) {
                    const enrollment = await this.enrollmentRepo.create(
                        {
                            schoolId,
                            liveClassId,
                            studentId,
                            status: EnrollmentStatus.ENROLLED,
                            waitlistPosition: null,
                        },
                        transaction
                    );

                    await this.liveClassRepo.updateCounts(
                        liveClassId,
                        { enrolledCount: (liveClass.enrolledCount ?? 0) + 1 },
                        transaction
                    );

                    return { enrollment, wasExisting: false };
                }

                const enrollment = await this.enrollmentRepo.create(
                    {
                        schoolId,
                        liveClassId,
                        studentId,
                        status: EnrollmentStatus.WAITLISTED,
                        waitlistPosition: (liveClass.waitlistCount ?? 0) + 1,
                    },
                    transaction
                );

                await this.liveClassRepo.updateCounts(
                    liveClassId,
                    { waitlistCount: (liveClass.waitlistCount ?? 0) + 1 },
                    transaction
                );

                return { enrollment, wasExisting: false };
            }
        );

        await this.invalidateEnrollmentCaches(schoolId, liveClassId, studentId);
        return result;
    }

    async cancel(
        schoolId: number,
        liveClassId: number,
        studentId: number
    ): Promise<CancellationResult> {
        const result = await withTransaction(
            async (transaction: Transaction) => {
                const liveClass = await this.mustLockLiveClass(
                    schoolId,
                    liveClassId,
                    transaction
                );

                const existing = await this.enrollmentRepo.findByClassAndStudent(
                    schoolId,
                    liveClassId,
                    studentId,
                    transaction
                );

                if (!existing) {
                    throw new NotFoundException(
                        ERROR_CODES.E_PAGE_NOT_FOUND,
                        "Enrollment not found"
                    );
                }

                await this.enrollmentRepo.deleteById(existing.id as number, transaction);

                if (existing.status === EnrollmentStatus.WAITLISTED) {
                    await this.enrollmentRepo.decrementWaitlistPositionsAfter(
                        schoolId,
                        liveClassId,
                        existing.waitlistPosition as number,
                        transaction
                    );
                    await this.liveClassRepo.updateCounts(
                        liveClassId,
                        { waitlistCount: Math.max((liveClass.waitlistCount ?? 1) - 1, 0) },
                        transaction
                    );

                    return {
                        cancelledEnrollmentId: existing.id as number,
                        promotedEnrollmentId: null,
                    };
                }

                const firstWaitlisted = await this.enrollmentRepo.findFirstWaitlisted(
                    schoolId,
                    liveClassId,
                    transaction
                );

                if (!firstWaitlisted) {
                    await this.liveClassRepo.updateCounts(
                        liveClassId,
                        { enrolledCount: Math.max((liveClass.enrolledCount ?? 1) - 1, 0) },
                        transaction
                    );

                    return {
                        cancelledEnrollmentId: existing.id as number,
                        promotedEnrollmentId: null,
                    };
                }

                await this.enrollmentRepo.promoteToEnrolled(
                    firstWaitlisted.id as number,
                    transaction
                );
                await this.enrollmentRepo.decrementWaitlistPositionsAfter(
                    schoolId,
                    liveClassId,
                    firstWaitlisted.waitlistPosition as number,
                    transaction
                );
                await this.liveClassRepo.updateCounts(
                    liveClassId,
                    { waitlistCount: Math.max((liveClass.waitlistCount ?? 1) - 1, 0) },
                    transaction
                );

                return {
                    cancelledEnrollmentId: existing.id as number,
                    promotedEnrollmentId: firstWaitlisted.id as number,
                };
            }
        );

        await this.invalidateEnrollmentCaches(schoolId, liveClassId, studentId);
        if (result.promotedEnrollmentId) {
            await this.clearRosterCache(schoolId, liveClassId);
        }
        return result;
    }

    async getRoster(schoolId: number, liveClassId: number): Promise<RosterEntry[]> {
        const liveClass = await this.liveClassRepo.findById(liveClassId);
        if (!liveClass || liveClass.schoolId !== schoolId) {
            throw new NotFoundException(
                ERROR_CODES.E_PAGE_NOT_FOUND,
                "Live class not found"
            );
        }

        const cacheKey = `roster:${schoolId}:${liveClassId}`;
        const cached = await this.getCache<RosterEntry[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const roster = await this.liveClassRepo.listRoster(schoolId, liveClassId);
        await this.setCache(cacheKey, roster);
        return roster;
    }

    async getStudentEnrollments(
        schoolId: number,
        studentId: number
    ): Promise<StudentEnrollmentSummary[]> {
        await this.mustValidateStudent(schoolId, studentId);

        const cacheKey = `student-enrollments:${schoolId}:${studentId}`;
        const cached = await this.getCache<StudentEnrollmentSummary[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const enrollments = await this.studentRepo.listEnrollments(schoolId, studentId);
        await this.setCache(cacheKey, enrollments);
        return enrollments;
    }

    private async mustLockLiveClass(
        schoolId: number,
        liveClassId: number,
        transaction: Transaction
    ): Promise<LiveClassInterface> {
        const liveClass = await this.liveClassRepo.lockById(liveClassId, transaction);
        if (!liveClass || liveClass.schoolId !== schoolId) {
            throw new NotFoundException(
                ERROR_CODES.E_PAGE_NOT_FOUND,
                "Live class not found"
            );
        }
        return liveClass;
    }

    private async mustValidateStudent(
        schoolId: number,
        studentId: number,
        transaction?: Transaction
    ): Promise<void> {
        const student = await this.studentRepo.findById(studentId, transaction);
        if (!student) {
            throw new NotFoundException(
                ERROR_CODES.E_PAGE_NOT_FOUND,
                "Student not found"
            );
        }
        if (student.schoolId !== schoolId) {
            throw new BadRequestException(
                ERROR_CODES.E_INVALID_DATA,
                "Student does not belong to the provided school"
            );
        }
    }

    private async invalidateEnrollmentCaches(
        schoolId: number,
        liveClassId: number,
        studentId: number
    ): Promise<void> {
        await this.clearCache(`student-enrollments:${schoolId}:${studentId}`);
        await this.clearRosterCache(schoolId, liveClassId);
    }

    private async clearRosterCache(
        schoolId: number,
        liveClassId: number
    ): Promise<void> {
        await this.clearCache(`roster:${schoolId}:${liveClassId}`);
    }

    private async getCache<T>(key: string): Promise<T | null> {
        if (!this.redisClient) {
            return null;
        }

        const raw = await this.redisClient.get(key);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as T;
    }

    private async setCache(key: string, value: unknown): Promise<void> {
        if (!this.redisClient) {
            return;
        }

        await this.redisClient.set(key, JSON.stringify(value), {
            EX: 60,
        });
    }

    private async clearCache(key: string): Promise<void> {
        if (!this.redisClient) {
            return;
        }

        await this.redisClient.del(key);
    }
}

export const newLiveClassService = async (
    liveClassRepo: LiveClassRepoInterface,
    enrollmentRepo: EnrollmentRepoInterface,
    schoolRepo: SchoolRepoInterface,
    studentRepo: StudentRepoInterface,
    redisClient: RedisClientType | null
): Promise<LiveClassServiceInterface> => {
    return new LiveClassService(
        liveClassRepo,
        enrollmentRepo,
        schoolRepo,
        studentRepo,
        redisClient
    );
};
