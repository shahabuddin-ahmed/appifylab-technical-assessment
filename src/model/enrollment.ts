import { DataTypes, Model } from "sequelize";
import newSequelize from "../infra/sequelize";

export enum EnrollmentStatus {
    ENROLLED = "ENROLLED",
    WAITLISTED = "WAITLISTED",
}

export interface EnrollmentInterface {
    id?: number;
    schoolId: number;
    liveClassId: number;
    studentId: number;
    status: EnrollmentStatus;
    waitlistPosition?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

class Enrollment extends Model<EnrollmentInterface> implements EnrollmentInterface {
    public id?: number;
    public schoolId!: number;
    public liveClassId!: number;
    public studentId!: number;
    public status!: EnrollmentStatus;
    public waitlistPosition?: number | null;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

Enrollment.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        schoolId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "school_id",
        },
        liveClassId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "live_class_id",
        },
        studentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "student_id",
        },
        status: {
            type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
            allowNull: false,
        },
        waitlistPosition: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: "waitlist_position",
        },
    },
    {
        sequelize: newSequelize(),
        tableName: "enrollments",
        modelName: "enrollment",
        timestamps: true,
        indexes: [
            {
                unique: true,
                name: "uniq_enrollments_school_live_class_student",
                fields: ["school_id", "live_class_id", "student_id"],
            },
            {
                name: "idx_enrollments_waitlist_lookup",
                fields: ["school_id", "live_class_id", "status", "waitlist_position"],
            },
        ],
    }
);

export default Enrollment;
