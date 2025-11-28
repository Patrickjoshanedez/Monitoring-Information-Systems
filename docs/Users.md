# User Roles and Functional Requirements

## Role: Admin
**Primary Objective:** To oversee the entire mentoring program, ensuring system security, user validity, and program quality through monitoring and reporting.

### Detailed Capabilities Table
| Feature Category | Action (I want to...) | Motivation (So that...) |
| :--- | :--- | :--- |
| **Registration & Login** | Log in securely | I can access and manage the system safely. |
| **User Management** | Manage user accounts | Only valid mentors and mentees can participate. |
| **Mentor–Mentee Matching** | Monitor and edit pairings | Mentees are matched with the best mentors. |
| **Scheduling & Session Tracking** | Track sessions | I can ensure proper mentoring activities are happening. |
| **Notification System** | Send notifications | Users are informed about important updates. |
| **Feedback & Evaluation** | Review feedback | I can improve the quality of the mentoring program. |
| **Reports & Analytics** | Generate reports | I can evaluate and improve the program. |
| **Certificate & Recognition** | Generate certificates | Participants are acknowledged for their effort. |
| **Logout** | Log out safely | My account remains secure. |

### Constraints & Security
*   **Security**: Must log in securely and log out safely to protect administrative access.
*   **Data Integrity**: Responsible for ensuring only "valid" users participate.

---

## Role: Mentor
**Primary Objective:** To provide academic guidance and career advice to assigned mentees while managing schedules and tracking progress.

### Detailed Capabilities Table
| Feature Category | Action (I want to...) | Motivation (So that...) |
| :--- | :--- | :--- |
| **Registration & Login** | Register an account, log in securely, and recover my password | I can access the mentoring platform and manage my mentoring activities. |
| **Profile Management** | Create and edit my profile (bio, skills, availability, photo) | Mentees and the system can match me appropriately and view my expertise. |
| **Mentor–Mentee Matching** | Receive match suggestions, review mentee profiles, and accept or decline match requests | I can choose mentees who fit my expertise and availability. |
| **Scheduling & Sessions** | Set my availability, schedule sessions, and manage session details (confirm, reschedule, cancel, and record attendance) | Meetings occur at mutually convenient times and are tracked. |
| **Feedback, Evaluation & Progress Tracking** | Provide feedback, evaluate sessions, and track mentee progress | I can monitor development and adjust guidance. |
| **Communication** | Message mentees, share resources, and receive messages | I can support mentees between sessions. |
| **Notification System** | Receive timely notifications and reminders (session reminders, match requests, messages, announcements) and configure preference settings | I stay informed without unwanted noise. |
| **Logout** | Log out of my account | Ensure my session is closed and my account remains secure on shared devices. |

### Constraints & Security
*   **Availability**: Must set availability to ensure meetings are "mutually convenient."
*   **Security**: Explicit requirement to log out to secure accounts on "shared devices."

---

## Role: Mentee
**Primary Objective:** To connect with mentors for academic support, track personal progress, and achieve learning goals.

### Detailed Capabilities Table
| Feature Category | Action (I want to...) | Motivation (So that...) |
| :--- | :--- | :--- |
| **Registration & Login** | Register an account, log in securely, and recover my password | I can access the mentoring platform and participate in the program. |
| **Profile Management** | Create and edit my profile (bio, academic background, interests, and goals) | Mentors and the system can match me with the right mentor. |
| **Mentor Search & Matching** | View available mentors, apply for help in specific courses or subjects I struggle with, and receive mentor–mentee match notifications | I can find the right support for my needs. |
| **Learning & Progress Tracking** | Access shared materials, track my progress, and monitor achieved goals | I can see how I am improving over time. |
| **Feedback & Evaluation** | Provide feedback on sessions and rate my mentor’s guidance | The program can improve. |
| **Notification System** | Receive reminders for upcoming sessions, as well as alerts for announcements, messages, or updates from mentors/admin | I stay updated on my mentoring activities. |
| **Reports / Dashboard** | View my session history, attendance record, and progress reports | I can track my development. |

### Constraints & Security
*   **Profile Accuracy**: Must provide accurate academic background and goals to ensure correct matching.
