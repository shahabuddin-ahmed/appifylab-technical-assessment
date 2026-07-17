CREATE TABLE `schools` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_schools_name` (`name`)
);

CREATE TABLE `students` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `school_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_students_school_email` (`school_id`, `email`),
    CONSTRAINT `fk_students_school`
        FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE `live_classes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `school_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `start_time` DATETIME NOT NULL,
    `duration_minutes` INT UNSIGNED NOT NULL,
    `max_seats` INT UNSIGNED NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `enrolled_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `waitlist_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_live_classes_school_start_time` (`school_id`, `start_time`),
    UNIQUE KEY `uniq_live_classes_school_title_start_time` (`school_id`, `title`, `start_time`),
    CONSTRAINT `fk_live_classes_school`
        FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE `enrollments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `school_id` INT UNSIGNED NOT NULL,
    `live_class_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `status` ENUM('ENROLLED', 'WAITLISTED') NOT NULL,
    `waitlist_position` INT UNSIGNED NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_enrollments_school_live_class_student` (`school_id`, `live_class_id`, `student_id`),
    KEY `idx_enrollments_waitlist_lookup` (`school_id`, `live_class_id`, `status`, `waitlist_position`),
    CONSTRAINT `fk_enrollments_school`
        FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT `fk_enrollments_live_class`
        FOREIGN KEY (`live_class_id`) REFERENCES `live_classes` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT `fk_enrollments_student`
        FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
