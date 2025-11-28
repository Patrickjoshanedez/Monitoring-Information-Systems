BUKIDNON STATE UNIVERSITY
COLLEGE OF TECHNOLOGIES
INFORMATION TECHNOLOGY DEPARTMENT


Academic Mentoring Information System

A Project Presented to
Navidad, Czarissa Louise A.
Caseres, Klevie Jun R.
Cagande, Gil Nicholas T.
Abella, Joseph L.
of the Information Technology Department 
					
In Partial Fulfillment of the Requirement for the Courses
IT133 – Systems Integration and Architecture (SIA) 1 
IT137 Elective 3 – Integrative Programming and Technologies 2
IT132 – Advanced Database Systems
IT135 – Information Assurance and Security 1

By:
James Abugan
Patrick Josh Anedez
Steven Joe Bautista
Chijay Canoy
Kathryn Villaganas

[Date Submitted]
Chapter 1
INTRODUCTION

1.1. Background of the Organization
	1.1.1. Nature of Operations
	The Bukidnon State University Computer Society (ComSoc) is an accredited academic organization under the College of Technologies that supports Information Technology students through skills development, peer support initiatives, academic programs, and student-led activities. The organization plays a significant role in promoting academic excellence, leadership, and technological advancement within the IT community.
ComSoc semesterly conducts academic mentoring, tutoring, onboarding of new students, and peer-assisted learning sessions. However, these activities are currently managed through manual processes, such as physical logbooks, spreadsheets, group chats, and paper forms. These methods often lead to inaccurate attendance tracking, difficulty monitoring mentee progress, unorganized records, and inconsistent communication between mentors and mentees.
	These challenges indicate the need for a centralized platform that supports systematic mentoring and documentation.

	1.1.2. Demographics
The Computer Society consists of:
IT Students (1st–4th year) – mentees and mentors
Officers & Committee Heads – coordinators of mentoring activities
Volunteer student mentors – academically performing students who assist others
Advisers – faculty members guiding the organization
With over 600–900 active members, the organization manages multiple mentoring groups and academic support programs, requiring proper tools for coordination and performance tracking.

	1.1.3. Organization Chart
	
Figure 1. Organization chart of Computer Society
The Academic Mentoring Information System aligns with the operations of this hierarchy by digitizing coordination, documentation, and support for mentoring and academic assistance.
1.2. Background of the System
The Academic Mentoring Information System (AMIS) is a web-based platform designed to streamline academic mentoring in the Computer Society. It enables students to connect with faculty and mentors for guidance on coursework, career advice, and personal development. Key functions include user registration, mentor matching, session scheduling, progress tracking, feedback submission, and reporting. The system addresses challenges like inefficient manual mentoring processes, lack of tracking, and limited accessibility.
Technologies used include:
Frontend: React.js / Tailwind CSS
Backend: Node.js / Express
Database: MongoDB Atlas
Security Concepts: Role-based access, hashing, secure communications
Programming Concepts: REST APIs, MVC architecture, modular design
Hardware Requirements: Desktop/laptop, stable network, server hosting
The system is crucial today as it enhances educational outcomes in a digital era, promoting personalized learning and reducing administrative burdens. It ties into our courses: IT133 (systems integration via modular architecture), IT137 (integrative programming with full-stack development), IT132 (advanced databases for schema design), and IT135 (security through encryption and access controls). Concepts like MVC architecture, relational databases, and risk mitigation are applied to ensure a secure, efficient system.



1.3. Objectives
	1.3.1. General Objectives
	The ultimate goal is to develop a secure, user-friendly web application for academic mentoring in Computer Society, targeting students, faculty, and administrators. It is built using PHP/Laravel (backend), MongoDB (database), React.js (frontend), and AWS (platform), incorporating concepts like modular design, data integrity, and cybersecurity to foster effective mentoring relationships.
	1.3.2. Specific Objectives
To develop a role-based login and authentication system for mentors, mentees, and administrators.
To automate mentor–mentee matching and record management.
To provide a scheduling module for advising, mentoring sessions, and consultations.
To track mentee performance, academic standing, and progress reports.
To build an admin dashboard for analytics, monitoring, and student profiling.
To ensure secure handling, storage, and transmission of data.
To conduct system testing and usability evaluation.

1.4. Scope and Limitations
The system includes features like user profiles, mentor-student matching, session booking, feedback forms, and admin dashboards for reporting. Requirements encompass responsive design, data privacy compliance (e.g., PDPA), and integration with ComSoc's email system. Limitations include no mobile app version (due to time constraints), offline functionality, or AI-based matching (beyond basic algorithms). The system does not automate academic grading; it only stores and views mentoring notes.



1.5. Definition of Terms
API (Application Programming Interface): A set of rules for software components to interact, enabling data exchange.
Backend: Server-side logic handling data and APIs.
Database Schema: The structure of a database, including tables, relationships, and constraints.
Encryption: The process of converting data into a coded format to prevent unauthorized access.
Frontend: Client-side part of the system visible to users.
Mentoring: A developmental relationship where experienced individuals guide less experienced ones.
MVC (Model-View-Controller): An architectural pattern separating application logic into models (data), views (UI), and controllers (logic).
OAuth: An open standard for access delegation, used for secure user authentication.
RESTful API: A web API following REST principles for stateless, scalable interactions.
Role-Based Access Control: Restricting system actions based on user type.
Scalability: The ability of a system to handle increased load without performance degradation.


Chapter 2
RISK & SYSTEM ANALYSIS

2.1. Risk Analysis
	Risk analysis identifies the potential issues that may affect the development, deployment, and operation of the Mentoring Program Information System. This section evaluates the likelihood of risks, their possible impact, and the strategies to control or mitigate them. Conducting risk analysis ensures that the system remains secure, reliable, and functional throughout its lifecycle.
	2.1.1 Likelihood Scale
	The likelihood scale measures how probable a risk is to occur during the development and use of the system.
Level
Description
Definition
1 – Rare
Very unlikely
The risk is not expected to occur under normal conditions.
2 – Unlikely
Low chance
The risk may occur but only in isolated cases.
3 – Possible
Moderate chance
The risk may occur at some point during development or system use.
4 – Likely
High chance
The risk is expected to occur periodically.
5 - Almost Certain
Very high chance
The risk will occur in most circumstances unless addressed.


	

2.1.2. Risk Impact Scale
		The impact scale measures the severity of the consequences if a risk occurs.
Level
Impact Severity
Definition
1 – Very Low
Minimal impact
Little to no effect on system functionality or timeline.
2 – Low
Minor impact
Slight delays or small issues but still manageable.
3 – Moderate
Noticeable impact
Some functions affected; requires intervention.
4 – High
Significant impact
Major system components affected; development delays likely.
5 – Very High
Critical impact
System failure, data loss, or severe delays.


	2.1.3. Risk Rating Worksheet
	The risk rating is computed using:
Risk Rating = Likelihood × Impact
 (1–5: Low Risk · 6–14: Medium Risk · 15–25: High Risk)
Risk
Likelihood
Impact
Risk Rating
Category
Delay in task completion due to unclear assignments
3
3
9
Medium
Data loss during system testing
2
5
10
Medium
Bugs in scheduling or matching features
4
3
12
Medium
Miscommunication among team members
3
4
12
Medium
Security vulnerabilities in user data
2
5
10
Medium
System downtime during prototype test
3
4
12
Medium
Failure during front-end and database integration
4
4
16
High


	2.1.4. Risk Control Strategy
		This section outlines the strategies used to minimize or eliminate identified risks.
Risk
Strategy
Delays due to unclear task assignments
Assign clear responsibilities, use Trello updates, and conduct weekly check-ins.
Data loss during testing
Create regular database backups and implement version control.
Bugs in core features
Conduct iterative testing, peer reviews, and debugging sessions.
Miscommunication within the team
Establish communication protocols and schedule short sync meetings.
Security vulnerabilities
Use secure authentication, encrypt sensitive data, and follow best coding practices.
System downtime
Perform stability testing and monitor resources before deployment.
Integration failures
Break integration tasks into smaller parts and test modules individually before merging.



2.2. Requirements
	2.2.1 Functional Requirements
	
Admin


Registration & Login
As an admin, I want to log in securely so that I can access and manage the system safely.
User Management
As an admin, I want to manage user accounts so that only valid mentors and mentees can participate.
Mentor–Mentee Matching
As an admin, I want to monitor and edit pairings so that mentees are matched with the best mentors.
Scheduling & Session Tracking
As an admin, I want to track sessions so that I can ensure proper mentoring activities are happening.
Notification System
As an admin, I want to send notifications so that users are informed about important updates.
Feedback & Evaluation
As an admin, I want to review feedback so that I can improve the quality of the mentoring program.
Reports & Analytics
As an admin, I want to generate reports so that I can evaluate and improve the program.
Certificate & Recognition
As an admin, I want to generate certificates so that participants are acknowledged for their effort.
Logout
As an admin, I want to log out safely so that my account remains secure.
Mentor


Registration & Login
As a mentor, I want to register an account, log in securely, and recover my password so that I can access the mentoring platform and manage my mentoring activities.
Profile Management
As a mentor, I want to create and edit my profile (bio, skills, availability, photo) so mentees and the system can match me appropriately and view my expertise.
Mentor–Mentee Matching
As a mentor, I want to receive match suggestions, review mentee profiles, and accept or decline match requests so that I can choose mentees who fit my expertise and availability.
Scheduling & Sessions
As a mentor, I want to set my availability, schedule sessions, and manage session details (confirm, reschedule, cancel, and record attendance) so meetings occur at mutually convenient times and are tracked.
Feedback,Evaluation & Progress Tracking
As a mentor, I want to provide feedback, evaluate sessions, and track mentee progress so I can monitor development and adjust guidance.
Communication
As a mentor, I want to message mentees, share resources, and receive messages so I can support mentees between sessions.
Notification System
As a mentor, I want to receive timely notifications and reminders (session reminders, match requests, messages, announcements) and configure preference settings so I stay informed without unwanted noise.
Logout
As a mentor, I want to log out of my account to ensure my session is closed and my account remains secure on shared devices.
Mentee


Registration & Login
As a mentee, I want to register an account, log in securely, and recover my password so I can access the mentoring platform and participate in the program.


Profile Management
As a mentee, I want to create and edit my profile (bio, academic background, interests, and goals) so mentors and the system can match me with the right mentor.
Mentor Search & Matching
As a mentee, I want to view available mentors, apply for help in specific courses or subjects I struggle with, and receive mentor–mentee match notifications.
Learning & Progress Tracking
As a mentee, I want to access shared materials, track my progress, and monitor achieved goals so I can see how I am improving over time.
Feedback & Evaluation
As a mentee, I want to provide feedback on sessions and rate my mentor’s guidance so the program can improve.
Notification System
As a mentee, I want to receive reminders for upcoming sessions, as well as alerts for announcements, messages, or updates from mentors/admin.
Reports / Dashboard
As a mentee, I want to view my session history, attendance record, and progress reports so I can track my development.




2.2.3 Database Schema





Chapter 3
SYSTEM DESIGN & DEVELOPMENT

3.1. Solution Design
	The Academic Mentoring Information System (AMIS) is architected as a modern, scalable web application using the MERN stack (MongoDB, Express.js, React.js, Node.js). This choice of technology ensures a unified JavaScript/TypeScript development environment from frontend to backend, facilitating rapid development and seamless data flow.

	**Frontend Architecture:**
	The user interface is built with **React 18** and **Vite**, providing a fast and responsive Single Page Application (SPA). Styling is enforced using **Tailwind CSS** with a strict `tw-` prefix to prevent style conflicts. State management is handled by a dual-layer approach: **React Query (TanStack Query)** manages server state (caching, synchronization, and background updates), while **Zustand** handles client-side global state (authentication tokens, user preferences). The application uses **React Router v6** for client-side routing, protected by role-based guards. Interactive elements are enhanced with **Framer Motion** for animations, **FullCalendar** for scheduling, and **Recharts** for data visualization.

	**Backend Architecture:**
	The server-side logic is powered by **Node.js** and **Express.js**, following a modular **Model-View-Controller (MVC)** pattern. This separation of concerns ensures maintainability and scalability.
	- **Controllers**: Handle incoming HTTP requests, validate input using **Joi/Yup**, and orchestrate business logic.
	- **Services**: Encapsulate complex business rules (e.g., matching algorithms, notification dispatching) to keep controllers lean.
	- **Models**: Defined using **Mongoose**, these enforce data schemas, validation rules, and relationships within the MongoDB database.

	**Security & Infrastructure:**
	Security is paramount, with **JWT (JSON Web Tokens)** used for stateless authentication and **bcrypt** for password hashing. Role-Based Access Control (RBAC) middleware ensures users can only access resources appropriate to their role (Admin, Mentor, Mentee). The system integrates with **Cloudinary** for secure media storage and **Pusher** for real-time features like chat and notifications.

3.2. Architectural Views

3.2.1. C1 (System Context Diagram)
	The System Context Diagram illustrates the AMIS within its environment. The central node is the **Academic Mentoring Information System**.
	**Actors:**
	- **Admin**: Manages users, oversees the matching process, and views system-wide reports.
	- **Mentor**: Sets availability, manages sessions, provides feedback, and communicates with mentees.
	- **Mentee**: Searches for mentors, books sessions, tracks progress, and receives guidance.
	**External Systems:**
	- **Email Service (Nodemailer/SendGrid)**: Sends transactional emails (welcome, password reset, notifications).
	- **Cloud Storage (Cloudinary)**: Stores user avatars and learning materials.
	- **Real-time Service (Pusher)**: Facilitates instant messaging and live notifications.
	- **Google/Facebook OAuth**: Provides alternative authentication methods.

3.2.2. C2 (Container Diagram)
	The Container Diagram breaks down the system into deployable units.
	- **Web Application (Single Page Application)**:
		- **Technology**: React, TypeScript, Vite.
		- **Responsibility**: Renders the UI, handles user interaction, and communicates with the API via HTTPS.
	- **API Application (Backend Server)**:
		- **Technology**: Node.js, Express.
		- **Responsibility**: Exposes RESTful endpoints, handles business logic, enforces security, and interacts with the database and external services.
	- **Database**:
		- **Technology**: MongoDB.
		- **Responsibility**: Stores persistent data including user profiles, sessions, feedback, and logs.

3.2.3. C3 (Component Diagram)
	The Component Diagram details the internal structure of the API Application.
	- **Auth Component**: Manages login, registration, and token issuance (`authController`, `passport`).
	- **User Management Component**: Handles profile updates and role management (`profileController`, `adminUserController`).
	- **Matching Component**: Executes the matching algorithm and manages mentorship requests (`matchController`, `matchService`).
	- **Session Component**: Manages scheduling, booking, and attendance (`sessionController`, `availabilityController`).
	- **Feedback Component**: Collects and aggregates session feedback (`feedbackController`, `mentorFeedbackController`).
	- **Communication Component**: Handles chat threads and messages (`chatController`, `notificationController`).
	- **Admin Component**: Provides system oversight, user management, and feedback review (`adminController`, `adminFeedbackController`).
	- **Content Management Component**: Handles announcements, materials, and certificates (`announcementController`, `materialController`, `certificateController`).
	- **Progress & Goals Component**: Tracks mentee achievements and goals (`progressController`, `goalController`).
	- **Reporting Component**: Generates system-wide reports and analytics (`reportController`).
	- **Notification Worker**: Background process for sending session reminders (`sessionReminderWorker`).

3.3. Database Design
	The database utilizes **MongoDB**, a NoSQL document database, allowing for flexible and scalable data modeling. The schema is defined using **Mongoose**.
	**Key Collections:**
	- **Users**: Stores authentication details, profiles, roles, and application status.
	- **Mentorships**: Records active mentor-mentee relationships.
	- **Sessions**: Stores session details, timing, status (scheduled, completed, cancelled), and attendance.
	- **Feedback**: Contains evaluations and ratings for sessions.
	- **ChatThreads & ChatMessages**: Stores conversation history for direct and group chats.
	- **Notifications**: Logs user alerts and updates.
	- **Academic Records**: `Achievement`, `Goal`, `ProgressSnapshot` track mentee development.
	- **Administrative**: `AdminNotificationLog`, `AdminReviewTicket`, `AdminUserAction`, `AuditLog` ensure accountability.
	- **Content**: `Announcement`, `Material`, `Certificate` manage resources and recognition.
	- **System**: `Availability`, `BookingLock`, `MatchRequest`, `MentorshipRequest` handle scheduling and matching logic.
	**Indexing**: Indexes are applied to frequently queried fields such as `email`, `role`, `mentorId`, `menteeId`, and `scheduledDate` to optimize query performance.

3.4. User Interface Design
	The UI is designed with a focus on **usability, accessibility, and responsiveness**.
	- **Design System**: Built with Tailwind CSS, ensuring a consistent visual language (colors, spacing, typography).
	- **Dashboards**: Role-specific dashboards provide a personalized view. Admins see system stats, Mentors see upcoming sessions and requests, and Mentees see their progress and recommended mentors.
	- **Responsiveness**: The layout adapts seamlessly to desktops, tablets, and mobile devices.
	- **Accessibility**: Components include ARIA labels, proper contrast ratios, and keyboard navigation support to ensure inclusivity.

3.5. Integration Strategies

3.5.1. API Integrations and Interactions
	The system relies on a robust **RESTful API** for internal and external communication.
	- **Internal API**: The frontend consumes backend endpoints (e.g., `GET /api/mentors`, `POST /api/sessions`) using **Axios** and **React Query**. Responses follow a standard format: `{ success: boolean, data: any, message: string }`.
	- **External APIs**:
		- **Cloudinary API**: Used for uploading and retrieving images and documents. The backend generates signatures for secure uploads.
		- **Pusher API**: The backend triggers events (e.g., `message-sent`) which the frontend subscribes to for real-time updates.
		- **SMTP/Email API**: The backend connects to an email provider to send asynchronous notifications.
		- **Google reCAPTCHA**: Protects public forms (registration, login) from automated abuse.

3.5.2. Integration of Subject Components
	The system's components are tightly integrated to support complex workflows.
	- **Auth & Role Integration**: The Authentication module permeates all other components. Middleware checks the user's role before allowing access to Matching or Session modules.
	- **Matching & Session Integration**: Once a match is established (Matching module), the system allows the Mentee to book sessions with that specific Mentor (Session module).
	- **Session & Feedback Integration**: Completing a session triggers the availability of the Feedback form. The data from Feedback is then aggregated to update the Mentor's rating and the Mentee's progress.

3.5.3. Data Flow and Communication
	Data flows primarily in a **Client-Server** model, augmented by **Real-time** events.
	1.  **Request**: The user performs an action (e.g., books a session). The Frontend sends a JSON payload via HTTPS POST to the Backend.
	2.  **Processing**: The Backend validates the token and data, updates the MongoDB database, and triggers any necessary side effects (e.g., sending an email).
	3.  **Response**: The Backend returns a JSON response confirming the action.
	4.  **Real-time Update**: Simultaneously, the Backend publishes an event via Pusher. Connected clients (e.g., the Mentor's dashboard) receive this event and update their UI immediately without a page refresh.

Chapter 4
SECURITY POLICY

4.1. IS Policy Document
4.1.1. Hardware Security Policy
4.1.2. Software Security Policy
4.1.3. Network Communications Policy
4.1.4. Data Policy
4.1.5. Process Policy
4.1.6. People Policy

4.2. IT Security Management Framework
4.2.1. Legal Compliance
4.2.2. Security Governance Standard

4.3. Network Security Testing
4.3.1. Network and Server Profiling
4.3.2. CVSS

4.4. Solution Design
4.4.1. Policy Design
4.4.2. Logical Design
4.4.3. Physical Design
4.4.4. IS implementation Design (if applicable)
4.4.5. Intrusion and Detection Systems
4.4.6. Secure Process Model

4.5. Business Continuity Plan
4.5.1 Incident Response Plan
4.5.2. Disaster Recovery Plan



Chapter 5
CONCLUSION

5.1. Reflection on Architecture Decisions
	Critically evaluate the architecture decisions made in your project. Discuss both successful and less successful choices, considering their impact on the overall system and the reasoning behind each decision. Assess the strengths and weaknesses of the chosen architecture, addressing factors like performance, scalability, and security. Reflect on any challenges or constraints that influenced your decisions, and explore how you adapted to them. Analyze deviations from the initial plan, including changes in features, user options, and data structures, providing insights into the lessons learned. The goal is to gain a deeper understanding of the decision-making process, fostering continuous improvement for future projects.

5.2. Difficulties Encountered
It is quite valuable for an educational project to identify clearly the difficulties encountered within the project period. The difficulties due to the programming or platform, due to the nature of the problem, etc. should be stated. Also, the effects of these difficulties (forcing to use different ways, abandoning some planned features of the program, etc.) should be explained.

5.3. Improvements and Extensions
In this section, the parts of the system that need improvement and some possible future extensions are discussed. The weak and strong points of the system can be identified. Any shortcomings or defects of the system can be stated. Also, the deviations from the plan at the beginning of the project can be indicated, i.e. the features, user options, data structures, etc. that were initially planned to be included, but could not be done so for some reasons.

5.4. Conclusion
Explain your findings after conducting your project and implementing your program. Was the project hard or easy? Why? What did you understand from the problem? What new learnings did you gain? What would you have done if you had more time? What would you recommend other researchers of the same topic to do? Share your insights and reflections during the entire research and development process.


References
List your references here in alphabetical order using APA 7th ed.



Appendices
	These are the list of supporting documents that you need to provide:
Summary of Achievements
Member's Contributions and Roles
API Documentation
External API Documentation
Design Patterns Documentation
Sample Code Snippets
Coding Standards and Guidelines
Project Management Artifacts
Screenshots of System

