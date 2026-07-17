import Enrollment from "./enrollment";
import LiveClass from "./live-class";
import School from "./school";
import Student from "./student";

let registered = false;

export const registerModels = (): void => {
    if (registered) {
        return;
    }

    School.hasMany(Student, { foreignKey: "schoolId", as: "students" });
    School.hasMany(LiveClass, { foreignKey: "schoolId", as: "liveClasses" });
    School.hasMany(Enrollment, { foreignKey: "schoolId", as: "enrollments" });

    Student.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    Student.hasMany(Enrollment, { foreignKey: "studentId", as: "enrollments" });

    LiveClass.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    LiveClass.hasMany(Enrollment, { foreignKey: "liveClassId", as: "enrollments" });

    Enrollment.belongsTo(School, { foreignKey: "schoolId", as: "school" });
    Enrollment.belongsTo(Student, { foreignKey: "studentId", as: "student" });
    Enrollment.belongsTo(LiveClass, { foreignKey: "liveClassId", as: "liveClass" });

    registered = true;
};

export { School, Student, LiveClass, Enrollment };
