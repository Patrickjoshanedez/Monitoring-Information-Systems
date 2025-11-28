# Technical Documentation Extraction Report

## 1. Risk Management Framework (Chapter 2)

### Risk Calculation
The project uses a standard risk matrix formula to prioritize issues:
**Risk Rating = Likelihood × Impact**
*   **Low Risk:** 1–5
*   **Medium Risk:** 6–14
*   **High Risk:** 15–25

### Risk Register Table
| Risk Description | Likelihood | Impact | Risk Rating | Category |
| :--- | :---: | :---: | :---: | :---: |
| Delay in task completion due to unclear assignments | 3 | 3 | 9 | Medium |
| Data loss during system testing | 2 | 5 | 10 | Medium |
| Bugs in scheduling or matching features | 4 | 3 | 12 | Medium |
| Miscommunication among team members | 3 | 4 | 12 | Medium |
| Security vulnerabilities in user data | 2 | 5 | 10 | Medium |
| System downtime during prototype test | 3 | 4 | 12 | Medium |
| Failure during front-end and database integration | 4 | 4 | 16 | High |

### Mitigation Strategies (Control Strategy)
| Risk | Control Strategy |
| :--- | :--- |
| **Delays due to unclear task assignments** | Assign clear responsibilities, use Trello updates, and conduct weekly check-ins. |
| **Data loss during testing** | Create regular database backups and implement version control. |
| **Bugs in core features** | Conduct iterative testing, peer reviews, and debugging sessions. |
| **Miscommunication within the team** | Establish communication protocols and schedule short sync meetings. |
| **Security vulnerabilities** | Use secure authentication, encrypt sensitive data, and follow best coding practices. |
| **System downtime** | Perform stability testing and monitor resources before deployment. |
| **Integration failures** | Break integration tasks into smaller parts and test modules individually before merging. |

---

## 2. Integration & Architecture Logic (Chapter 3)

### API Strategy
The system relies on a RESTful API for internal and external communication.
*   **Internal API:** The frontend consumes backend endpoints (e.g., `GET /api/mentors`, `POST /api/sessions`) using **Axios** and **React Query**.
*   **Response Format:** Responses follow a standard format: `{ success: boolean, data: any, message: string }`.
*   **External APIs:**
    *   **Cloudinary API:** Used for uploading/retrieving images and documents (backend generates signatures).
    *   **Pusher API:** Backend triggers events (e.g., `message-sent`) for real-time frontend updates.
    *   **SMTP/Email API:** Backend connects to an email provider for asynchronous notifications.

### Component Interaction
The system's components are tightly integrated to support complex workflows:
*   **Auth & Role Integration:** Authentication middleware checks the user's role before allowing access to Matching or Session modules.
*   **Matching & Session Integration:** Once a match is established (Matching module), the system allows the Mentee to book sessions with that specific Mentor (Session module).
*   **Session & Feedback Integration:** Completing a session triggers the availability of the Feedback form. Data from Feedback is aggregated to update the Mentor's rating and Mentee's progress.

### Data Flow
Data flows primarily in a **Client-Server** model, augmented by **Real-time** events:
1.  **Request:** User performs an action (e.g., books a session). Frontend sends a JSON payload via HTTPS POST to the Backend.
2.  **Processing:** Backend validates token/data, updates MongoDB, and triggers side effects (e.g., emails).
3.  **Response:** Backend returns a JSON response confirming the action.
4.  **Real-time Update:** Simultaneously, Backend publishes an event via Pusher. Connected clients update their UI immediately without a page refresh.

---

## 3. Security & Compliance Policy (Chapter 4)

### Policy Hierarchy (IS Policy Document)
1.  Hardware Security Policy
2.  Software Security Policy
3.  Network Communications Policy
4.  Data Policy
5.  Process Policy
6.  People Policy

### Testing & Compliance
*   **Network Security Testing:** Includes Network and Server Profiling.
*   **Vulnerability Scoring:** Utilizes **CVSS** (Common Vulnerability Scoring System).
*   **Governance:** Includes Security Governance Standard.

### Business Continuity
The Business Continuity Plan (BCP) specifically includes:
*   **Incident Response Plan**
*   **Disaster Recovery Plan**

---

## 4. Project Reflection Guidelines (Chapter 5)

### Mandatory Questions for Conclusion
The team is required to answer the following in the conclusion:
*   Was the project hard or easy? Why?
*   What did you understand from the problem?
*   What new learnings did you gain?
*   What would you have done if you had more time?
*   What would you recommend other researchers of the same topic to do?
*   Share your insights and reflections during the entire research and development process.

### Appendices Checklist
The following supporting documents must be provided:
*   Summary of Achievements
*   Member's Contributions and Roles
*   API Documentation
*   External API Documentation
*   Design Patterns Documentation