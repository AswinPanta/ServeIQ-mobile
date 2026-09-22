#!/usr/bin/env python3
"""Generate Gandaki University Internship Report PDF"""

from fpdf import FPDF

STUDENT_NAME = "Aswin Panta"
REG_NO = "021-1-02-1-XXX"
EXAM_ROLL = "XXX"
COMPANY = "Pravidhi Digital Innovation Pvt Ltd"
COMPANY_ADDR = "Pokhara, Nepal"
SUPERVISOR = "(to be filled)"
PROJECT = "ServeIQ - Hotel & Restaurant Management SaaS"
DURATION = "Mid-June 2026 to August 2026"


class ReportPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=25)

    def add_title_page(self):
        self.add_page()
        M, CW = 15, 180
        y = 40

        self.set_font("Helvetica", "B", 18)
        self.set_xy(M, y)
        self.cell(CW, 10, "GANDAKI UNIVERSITY", align="C")
        y += 12
        self.set_font("Helvetica", "", 12)
        self.set_xy(M, y)
        self.cell(CW, 8, "Office of the Dean", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 8, "Faculty of Information Technology", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 8, "Rajchautara, Pokhara-32", align="C")
        y += 25

        self.set_font("Helvetica", "", 14)
        self.set_xy(M, y)
        self.cell(CW, 10, "An Internship Report On", align="C")
        y += 12
        self.set_font("Helvetica", "B", 16)
        self.set_xy(M, y)
        self.cell(CW, 10, f'"{PROJECT}"', align="C")
        y += 15
        self.set_font("Helvetica", "", 12)
        self.set_xy(M, y)
        self.cell(CW, 8, "In partial fulfillment of the requirement for the degree of", align="C")
        y += 10
        self.set_font("Helvetica", "B", 13)
        self.set_xy(M, y)
        self.cell(CW, 8, "Bachelor of Information Technology", align="C")
        y += 25

        self.set_font("Helvetica", "", 12)
        self.set_xy(M, y)
        self.cell(CW, 8, "Submitted By:", align="C")
        y += 10
        self.set_font("Helvetica", "B", 13)
        self.set_xy(M, y)
        self.cell(CW, 8, STUDENT_NAME, align="C")
        y += 10
        self.set_font("Helvetica", "", 11)
        self.set_xy(M, y)
        self.cell(CW, 7, f"Exam Roll No: {EXAM_ROLL}", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, f"GU Regd. No: {REG_NO}", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, "Gandaki University", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, "Rajchautara, Pokhara-32", align="C")
        y += 15
        self.set_xy(M, y)
        self.cell(CW, 7, "Aug, 2026", align="C")

    def add_declaration(self):
        self.add_page()
        M, CW = 15, 180
        self.set_font("Helvetica", "B", 14)
        self.set_xy(M, 25)
        self.cell(CW, 10, "STUDENT DECLARATION", align="C")
        y = 45
        self.set_font("Helvetica", "", 11)
        text = (
            f'I hereby declare that the internship report entitled "{PROJECT}", '
            f"submitted to the Office of the Dean, Faculty of Information Technology, Gandaki University, "
            f"is the outcome of my internship program undertaken from {DURATION} "
            f"at {COMPANY}, Pokhara. This report has been prepared in partial fulfillment of the "
            f"requirements for the Bachelor of Information Technology (BIT) degree."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text)
        y += 30
        text2 = (
            "I further declare that this report is my original work and has not been submitted "
            "previously to any other university or institution for the award of any degree, diploma, "
            "or certificate."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text2)
        y += 30
        self.set_xy(M, y)
        self.cell(CW, 7, STUDENT_NAME, align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, f"GU Regd. No: {REG_NO}", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, "Gandaki University, Pokhara", align="C")

    def add_supervisor_rec(self):
        self.add_page()
        M, CW = 15, 180
        self.set_font("Helvetica", "B", 14)
        self.set_xy(M, 25)
        self.cell(CW, 10, "SUPERVISOR RECOMMENDATION", align="C")
        y = 45
        self.set_font("Helvetica", "", 11)
        text = (
            f"This is to recommend that {STUDENT_NAME} has completed an internship in partial "
            f"fulfillment of the requirement for the degree of Bachelor of Information Technology (BIT) "
            f"at {COMPANY}, Pokhara. The internship was conducted from {DURATION} under my supervision."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text)
        y += 30
        self.set_xy(M, y)
        self.cell(CW, 7, f"{SUPERVISOR}", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, "Supervisor", align="C")
        y += 8
        self.set_xy(M, y)
        self.cell(CW, 7, f"{COMPANY}", align="C")

    def add_acknowledgement(self):
        self.add_page()
        M, CW = 15, 180
        self.set_font("Helvetica", "B", 14)
        self.set_xy(M, 25)
        self.cell(CW, 10, "ACKNOWLEDGEMENT", align="C")
        y = 45
        self.set_font("Helvetica", "", 11)
        text = (
            "I would like to express my sincere gratitude to everyone who contributed to the successful "
            "completion of my internship. This report has been prepared in partial fulfillment of the "
            "requirements for the degree of Bachelor in Information Technology (BIT) at Gandaki University."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text)
        y += 20
        text2 = (
            "I am deeply grateful to my supervisor at Pravidhi Digital Innovation Pvt Ltd for their "
            "guidance, support, and encouragement throughout the internship period. Their mentorship "
            "helped me understand the real-world software development process and provided valuable "
            "insights into mobile application development."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text2)
        y += 20
        text3 = (
            "I would also like to thank my colleagues - the frontend developers, backend developer, "
            "and UI/UX designers - who were always willing to help and share their knowledge. Their "
            "support made the learning experience much more enriching."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text3)
        y += 20
        text4 = (
            "Finally, I thank Gandaki University and the Faculty of Information Technology for "
            "providing this opportunity to gain practical experience in the industry."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text4)

    def add_abstract(self):
        self.add_page()
        M, CW = 15, 180
        self.set_font("Helvetica", "B", 14)
        self.set_xy(M, 25)
        self.cell(CW, 10, "ABSTRACT", align="C")
        y = 45
        self.set_font("Helvetica", "", 11)
        text = (
            f"I completed my internship at {COMPANY} in the field of Mobile Application Development. "
            f"The main goal of this internship was to develop a cross-platform mobile application for "
            f"ServeIQ, a multi-tenant Hotel & Restaurant Management SaaS platform."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text)
        y += 18
        text2 = (
            "During the internship, I worked on the ServeIQ mobile application built with React Native "
            "and Expo framework. The project involved developing multiple portal interfaces - Guest portal "
            "for travelers to search and book hotels, Host portal for property owners to manage listings, "
            "and Operations portal sections for housekeeping and front desk management."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text2)
        y += 18
        text3 = (
            "Key contributions included implementing the complete booking flow with payment gateway "
            "integration (Khalti, Stripe, Razorpay), internationalization support for 7 languages, "
            "and connecting the mobile app to the existing FastAPI backend. I also performed Manual QA "
            "testing, documenting 15+ bugs across mobile and web platforms."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text3)
        y += 18
        text4 = (
            "Overall, this internship greatly improved my skills in React Native development, "
            "API integration, payment gateway implementation, and software testing. It was a valuable "
            "opportunity to apply academic knowledge to real-world projects."
        )
        self.set_xy(M, y)
        self.multi_cell(CW, 7, text4)

    def add_chapter(self, number, title):
        self.add_page()
        M, CW = 15, 180
        self.set_font("Helvetica", "B", 14)
        self.set_xy(M, 25)
        self.cell(CW, 10, f"CHAPTER {number}: {title}", align="C")
        self.y = 45

    def add_heading(self, text):
        self.set_font("Helvetica", "B", 12)
        self.set_xy(15, self.y)
        self.multi_cell(180, 7, text)
        self.y += 5

    def add_subheading(self, text):
        self.set_font("Helvetica", "B", 11)
        self.set_xy(15, self.y)
        self.multi_cell(180, 7, text)
        self.y += 3

    def add_para(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_xy(15, self.y)
        self.multi_cell(180, 6, text)
        self.y += 4

    def add_bullet(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_xy(20, self.y)
        self.multi_cell(175, 6, f"- {text}")
        self.y += 2


def main():
    pdf = ReportPDF()

    # Front Matter
    pdf.add_title_page()
    pdf.add_declaration()
    pdf.add_supervisor_rec()
    pdf.add_acknowledgement()
    pdf.add_abstract()

    # Chapter 1: Introduction
    pdf.add_chapter("ONE", "INTRODUCTION")

    pdf.add_heading("1.1 Introduction")
    pdf.add_para(
        "During my internship at Pravidhi Digital Innovation Pvt Ltd, I was introduced to the "
        "company's professional working environment and gained hands-on experience in mobile application "
        "development. The company is working on ServeIQ, a multi-tenant Hotel & Restaurant Management "
        "SaaS platform with multiple portals for different user roles."
    )
    pdf.add_para(
        "When I joined, the team already had 3 frontend developers (my friends from Gandaki University), "
        "1 backend developer, and 1 UI/UX designer working on the web version of the application using "
        "React JS and FastAPI. I was assigned to develop the mobile application version using React Native "
        "with Expo framework."
    )
    pdf.add_para(
        "Throughout the internship, I actively participated in developing the Guest portal booking flow, "
        "Host portal management interface, Operations portal modules, and performed Manual QA testing. "
        "This internship allowed me to apply theoretical knowledge to real-world projects and improved my "
        "analytical thinking, problem-solving ability, and understanding of software development lifecycle."
    )

    pdf.add_heading("1.2 Statement of Problem")
    pdf.add_para(
        "In today's fast-paced software development environment, the demand for high-quality, "
        "bug-free, and user-friendly mobile applications is growing rapidly. However, many organizations "
        "face challenges in delivering reliable mobile applications that work seamlessly across platforms."
    )
    pdf.add_para(
        "The main problem observed was the lack of a mobile application for the ServeIQ platform. "
        "While the web version was functional, there was no mobile app for users who prefer accessing "
        "services on their phones. Additionally, the existing web application had several bugs that "
        "needed identification and resolution through systematic testing."
    )

    pdf.add_heading("1.3 Objectives")
    pdf.add_para("The objectives of this internship were:")
    pdf.add_bullet("To gain practical experience in React Native mobile application development")
    pdf.add_bullet("To understand the software development lifecycle in a professional environment")
    pdf.add_bullet("To develop a cross-platform mobile application for hotel booking management")
    pdf.add_bullet("To integrate payment gateways (Khalti, Stripe, Razorpay) for online transactions")
    pdf.add_bullet("To perform Manual QA testing and document bugs for resolution")
    pdf.add_bullet("To implement internationalization support for multiple languages")
    pdf.add_bullet("To collaborate with frontend, backend, and UI/UX team members")

    pdf.add_heading("1.4 Scope and Limitations")
    pdf.add_subheading("Scope")
    pdf.add_para(
        "The internship provided hands-on experience in React Native development, API integration, "
        "payment gateway implementation, and software testing. I worked on multiple modules of the "
        "ServeIQ platform including Guest booking, Host management, Housekeeping, and Front Desk."
    )
    pdf.add_subheading("Limitations")
    pdf.add_bullet("The internship duration was relatively short, limiting depth of knowledge in all areas")
    pdf.add_bullet("Some backend endpoints were not available, requiring mock data fallbacks")
    pdf.add_bullet("Limited access to iOS testing due to lack of Mac and iPhone devices")
    pdf.add_bullet("Payment gateway testing was limited to development/sandbox environments")

    pdf.add_heading("1.5 Report Organization")
    pdf.add_para(
        "This internship report is organized into four chapters. Chapter 1 provides the introduction, "
        "objectives, and scope. Chapter 2 describes the organization and literature review. "
        "Chapter 3 details the internship activities and projects. Chapter 4 presents the conclusion "
        "and learning outcomes."
    )

    # Chapter 2: Organization Details
    pdf.add_chapter("TWO", "ORGANIZATION DETAILS AND LITERATURE REVIEW")

    pdf.add_heading("2.1 Introduction to Organization")
    pdf.add_para(
        "Pravidhi Digital Innovation Pvt Ltd is a technology company based in Pokhara, Nepal, "
        "that provides innovative digital solutions. The company specializes in software development, "
        "mobile application development, and web application development for various clients."
    )
    pdf.add_para(
        "The primary focus of the company is on building the ServeIQ platform - a multi-tenant "
        "Hotel & Restaurant Management SaaS that serves hospitality businesses with property management, "
        "booking, and operational tools."
    )

    pdf.add_heading("2.2 Organizational Structure")
    pdf.add_para(
        "When I joined the team, there were 5 people working on the ServeIQ project: 3 frontend "
        "developers (React JS / Next.js), 1 backend developer (FastAPI/Python), and 1 UI/UX designer. "
        "A second UI/UX designer from Gandaki University joined a few days after I joined. Later, "
        "a QA team member also joined the team."
    )

    pdf.add_heading("2.3 Technology Stack")
    pdf.add_para("The ServeIQ platform uses the following technology stack:")
    pdf.add_bullet("Frontend (Web): React JS, Next.js, Tailwind CSS")
    pdf.add_bullet("Frontend (Mobile): React Native, Expo SDK 57, Expo Router")
    pdf.add_bullet("Backend: FastAPI (Python), deployed on Render")
    pdf.add_bullet("Database: PostgreSQL")
    pdf.add_bullet("Payments: Khalti, Stripe, Razorpay")
    pdf.add_bullet("IDE: VS Code")
    pdf.add_bullet("Testing: Expo Go on physical device (Redmi 10 Prime)")

    pdf.add_heading("2.4 Literature Review")
    pdf.add_para(
        "React Native is a cross-platform mobile application framework developed by Meta (Facebook) "
        "that allows developers to build native mobile apps using JavaScript and React. It uses a "
        "bridge to communicate with native platform components, enabling near-native performance."
    )
    pdf.add_para(
        "Expo is a framework and platform for React Native applications that provides tools and "
        "services for building, deploying, and managing React Native apps. It simplifies the "
        "development workflow by providing pre-built components and native modules."
    )
    pdf.add_para(
        "FastAPI is a modern, fast web framework for building APIs with Python based on standard "
        "Python type hints. It provides automatic API documentation, validation, and high performance."
    )

    # Chapter 3: Internship Activities
    pdf.add_chapter("THREE", "INTERNSHIP ACTIVITIES")

    pdf.add_heading("3.1 Roles and Responsibilities")
    pdf.add_para("During my internship, my roles and responsibilities included:")
    pdf.add_bullet("Developing the mobile application using React Native and Expo")
    pdf.add_bullet("Porting web application features to the mobile platform")
    pdf.add_bullet("Integrating payment gateways (Khalti, Stripe, Razorpay)")
    pdf.add_bullet("Implementing internationalization for 7 languages")
    pdf.add_bullet("Connecting the mobile app to the existing FastAPI backend")
    pdf.add_bullet("Performing Manual QA testing on mobile and web platforms")
    pdf.add_bullet("Documenting bugs with screen recordings and detailed steps")
    pdf.add_bullet("Participating in sprint planning and code review meetings")

    pdf.add_heading("3.2 Weekly Log")

    # Week 1
    pdf.add_subheading("Week 1: Company Onboarding, SRS Study, and Development Environment Setup")
    pdf.add_para("Day 1 (Sun, Jun 15): First day at Pravidhi Digital Innovation Pvt Ltd. Met the team - 3 frontend friends from Gandaki University, 1 backend developer, and 1 UI/UX designer already working on the StayEasy project. Supervisor gave me the 44-page SRS document and assigned me to the mobile app.")
    pdf.add_para("Day 2 (Mon, Jun 16): Set up Android Studio and tried running the project. Gradle build kept failing for 3 hours. Finally got it working but the emulator was too slow on my MacBook Air 2017.")
    pdf.add_para("Day 3 (Tue, Jun 17): Read the SRS document properly. Understood the system - multi-tenant hotel SaaS with 4 portals. Most of it went over my head. The existing UI/UX designer showed me some Figma designs.")
    pdf.add_para("Day 4 (Wed, Jun 18): Started designing a basic login page in Android Studio. Looked terrible. Supervisor said 'this looks like a student project.' A UI/UX designer from Gandaki University joined the team today.")
    pdf.add_para("Day 5 (Thu, Jun 19): Android Studio was too slow. Supervisor said 'forget it, start with React JS to understand the codebase, then we'll shift to React Native.' Started looking at the web code.")
    pdf.add_para("Day 6 (Fri, Jun 20): Studied the React JS web codebase all day. Understood auth flow, booking flow, search. Supervisor said 'next week, try React Native with Expo.' Installed VS Code, Node.js, and Expo CLI.")

    # Week 2
    pdf.add_subheading("Week 2: React Native Environment Setup and First Mobile App Implementation")
    pdf.add_para("Day 1 (Sun, Jun 22): Created first Expo project. Plugged in my Redmi 10 Prime via USB and opened Expo Go - app appeared on my phone. Way faster than Android Studio emulator. Watched React Native tutorials for 6 hours.")
    pdf.add_para("Day 2 (Mon, Jun 23): Started the actual StayEasy mobile app. Set up folder structure with Expo Router. Began porting login screen from React JS web version. React Native uses View instead of div, Text instead of p - everything was different.")
    pdf.add_para("Day 3 (Tue, Jun 24): Built registration and OTP verification screens. First API call worked - registration and OTP sent. But OTP verification kept failing - was sending string instead of number. Backend developer helped fix it.")
    pdf.add_para("Day 4 (Wed, Jun 25): Built home screen with search bar and property cards using mock data. Images weren't loading - React Native Image needs { uri: url } format. Debugged for 2 hours. Supervisor said 'cards look good but images too small.'")
    pdf.add_para("Day 5 (Thu, Jun 26): Connected home screen to backend search API. First real API call worked. Data format was different from expected - had to create a mapper function. Supervisor happy with progress.")
    pdf.add_para("Day 6 (Fri, Jun 27): Sprint planning meeting with the whole team. Sat there not understanding half the discussions about React JS hooks. Supervisor assigned me the Guest portal booking flow. Project might rename to ServeIQ.")

    # Week 3
    pdf.add_subheading("Week 3: Guest Portal Booking Flow Implementation and Feature Development")
    pdf.add_para("Day 1 (Sun, Jun 29): Started building booking flow - room selection screen. Connected to backend available-rooms endpoint. Data mapping was confusing - backend returned nested objects. Frontend friend said 'console.log the response' - saved me hours.")
    pdf.add_para("Day 2 (Mon, Jun 30): Made first commit to repository - 'Initial commit.' Nervous pushing to main for the first time. Built guest details step with form validation. Was copying heavily from web code.")
    pdf.add_para("Day 3 (Tue, Jul 1): Productive day - completed checkout timer, discount codes, urgency badge, search filters, cancellation policy, booking modification. 12 commits. Supervisor impressed but said 'you're just porting, not understanding mobile-specific challenges.'")
    pdf.add_para("Day 4 (Wed, Jul 2): Code review with supervisor. Found 3 bugs: TouchableOpacity not working, back button crashing, discount validation. Fixed all 3. Updated mock data to include Nepal hotels with NPR pricing.")
    pdf.add_para("Day 5 (Thu, Jul 3): Enhanced hotel detail page with room cards, amenity icons, photo gallery. Tested full flow on my phone. Supervisor said 'images load slowly, optimize it.' Didn't know how to optimize images in React Native.")
    pdf.add_para("Day 6 (Fri, Jul 4): Started Host portal. Created portal picker with 4 cards. Supervisor said 'focus on Guest and Host only.' Built Host login and basic dashboard. Portal-scoped auth system was confusing.")

    # Week 4
    pdf.add_subheading("Week 4: Host Portal Development and Operations Module Implementation")
    pdf.add_para("Day 1 (Sun, Jul 5): Built Host dashboard with stat cards and property list. Connected to backend. Had auth token issues - Host needed different token than Guest. Frontend friend explained the storage key pattern.")
    pdf.add_para("Day 2 (Mon, Jul 6): Built 5-step property listing wizard. Ended up being 2,400+ lines. Supervisor was blunt: 'too long, split it into components.' Didn't know how to split without breaking everything.")
    pdf.add_para("Day 3 (Tue, Jul 7): Connected Host portal to backend - properties, rooms, discount codes all working. Supervisor found room pricing allows negative values. Added validation. Project renamed from StayEasy to ServeIQ.")
    pdf.add_para("Day 4 (Wed, Jul 8): Started Operations portal - Front Desk and Housekeeping. Built room grid with statuses. Created check-in and check-out flows. Didn't know how to handle real-time data in React Native.")
    pdf.add_para("Day 5 (Thu, Jul 9): Built Housekeeping module - task queue, status flow, cleaner assignment. Created HousekeepingContext. Supervisor said 'handle the case where two cleaners are assigned to same room.' hadn't considered that.")
    pdf.add_para("Day 6 (Fri, Jul 10): Committed all work before restructure. Cleaned up unused code - Express/tRPC server, Drizzle ORM, old files. Supervisor said 'good cleanup.' Project rename to ServeIQ complete.")

    # Week 5
    pdf.add_subheading("Week 5: Manual QA Testing on ServeIQ Mobile Application and Website")
    pdf.add_para("Day 1 (Sun, Jul 12): Started Manual QA testing on ServeIQ mobile app and website. No dedicated QA person on team yet - I was the only one testing. Created bug report template. Started exploring Host portal on mobile.")
    pdf.add_para("Day 2 (Mon, Jul 13): Found B_001: phone number accepts more than 10 digits. B_003: discount code accepts negative values. B_002: staff photo upload fails. Documented all 3 with screen recordings on Google Drive.")
    pdf.add_para("Day 3 (Tue, Jul 14): Found B_004: duplicate room names allowed. B_005: end date before start date accepted. B_006: keyboard hides input content. Sent bug report via Slack. Friends still building features while I was just testing.")
    pdf.add_para("Day 4 (Wed, Jul 15): Switched to testing the website. Found B_007 (High): search refresh shows 404 error. B_008: current date treated as past date. Supervisor said '404 bug is critical, escalate to backend.'")
    pdf.add_para("Day 5 (Thu, Jul 16): Found B_009: check-in/out times not editable. B_010 (High): Khalti payment fails with HTTP 400. B_011: pagination on empty search. Supervisor said 'Khalti bug blocks revenue, escalate immediately.'")
    pdf.add_para("Day 6 (Fri, Jul 17): Compiled all bugs into formal report. Presented at standup. Supervisor said 'good work but test more edge cases.' No QA person joined yet. Started researching payment gateways during lunch break.")

    # Week 6
    pdf.add_subheading("Week 6: Extended Mobile App Testing and Bug Resolution Tracking")
    pdf.add_para("Day 1 (Sun, Jul 19): Tested guest-facing mobile screens. Found: search layout alignment issue, location shows black box, notification button does nothing, password placeholder invisible (white on white). Total mobile bugs: 11.")
    pdf.add_para("Day 2 (Mon, Jul 20): Tested host profile and payments. Edit profile saves but values don't show. Test payment broken - only Khalti works in dev server, Stripe and Razorpay fail. Total bugs: 13.")
    pdf.add_para("Day 3 (Tue, Jul 21): Found host login asks to change temp password every time. Room disappears after reload - not saved to database. Backend developer helped understand save flow. Always asking for help.")
    pdf.add_para("Day 4 (Wed, Jul 22): Found phone validation missing on staff forms. Property status toggle unstable. Re-tested B_002 - still failing. Re-tested B_010 Khalti - still broken. Total bugs: 15. Supervisor said 'finding real issues.'")
    pdf.add_para("Day 5 (Thu, Jul 23): Sprint review meeting. Presented bugs - 7 on website (3 High) and 11 on mobile. Boss said 'Khalti and 404 are blocking production, fix first.' Backend developer started Khalti fix.")
    pdf.add_para("Day 6 (Fri, Jul 24): Last day of QA. Final bug report organized by severity. Prepared for return to ServeIQ development. Studied i18next. Supervisor approved plan - start i18n on Sunday. Still no QA person joined.")

    # Week 7
    pdf.add_subheading("Week 7: Internationalization Implementation and Payment Gateway Integration")
    pdf.add_para("Day 1 (Sun, Jul 26): Back to ServeIQ development. Started i18n with i18next. Set up 7 languages: English, Nepali, Hindi, French, Spanish, Japanese, Chinese. Created initial English translations with 200+ keys.")
    pdf.add_para("Day 2 (Mon, Jul 27): Installed Razorpay SDK, created useRazorpay hook. Added Razorpay to booking flow. Built profile stack layout. Added scroll restoration. Supervisor impressed - 'Razorpay and profile in one day?'")
    pdf.add_para("Day 3 (Tue, Jul 28): Completed i18n for all auth and booking screens. Fixed Chinese language code. Total: 600+ keys. Supervisor tested - said 'Japanese text cutting off, add truncation.' Mobile i18n harder than web.")
    pdf.add_para("Day 4 (Wed, Jul 29): Massive day - 16 commits. Completed i18n for all remaining screens. Total: 1,400+ keys in 7 languages. Added scroll restoration across search screens. Working 12+ hours daily. Friends said 'you'll burn out.'")
    pdf.add_para("Day 5 (Thu, Jul 30): Finished all translation files. Fixed auth screen issues. Supervisor tested - said 'Hindi needs review.' Started booking flow rewrite - old 1,254-line file needed splitting. Felt pressure of production code.")
    pdf.add_para("Day 6 (Fri, Jul 31): Split booking-flow.tsx into modular files. Resolved all TypeScript errors - zero errors. Supervisor said 'old code was a mess, good job.' But split was mostly mechanical. Need deeper refactoring skills.")

    # Week 8
    pdf.add_subheading("Week 8: Bug Fixes, Splash Screen Design, and Code Quality Refactoring")
    pdf.add_para("Day 1 (Sun, Aug 2): Fixed timezone date bug - was showing yesterday's date in Nepal. Fixed booking pipeline order. Supervisor found I removed auth footer by mistake. Boss scolded: 'don't make changes without asking.' Learned the lesson.")
    pdf.add_para("Day 2 (Mon, Aug 3): Connected guest portal to backend properly. Added nearby search API. Integrated Khalti payment with pidx flow. Supervisor tested - 'Khalti worked! But date picker still shows yesterday.' Timezone bug kept coming back.")
    pdf.add_para("Day 3 (Tue, Aug 4): Started splash screen design. Created animated Nepal map with landmarks. Made 10+ iterations - supervisor kept asking for changes: 'glow too bright,' 'add more detail.' Also implemented forgot password flow.")
    pdf.add_para("Day 4 (Wed, Aug 5): Continued splash iterations. Installed Khalti native SDK. Configured app.json. Implemented native Khalti checkout. Verified end-to-end payment flow. Boss witnessed it - said 'excellent, this is a milestone!'")
    pdf.add_para("Day 5 (Thu, Aug 6): Code quality refactor. Created tokenization script - replaced 3,200 hardcoded hex colors across 198 files. Split large files: api.ts -> 6 modules, listing-wizard.tsx -> 712-line orchestrator. Zero TypeScript errors.")
    pdf.add_para("Day 6 (Fri, Aug 7): Final day before exam break. Demoed all features to supervisor and team on my phone. Supervisor satisfied. Boss said 'good work, take your exams and come back.' Mixed feelings - proud but aware of how much I don't know.")

    pdf.add_heading("3.3 Description of Projects")
    pdf.add_subheading("ServeIQ Mobile Application")
    pdf.add_para(
        "ServeIQ is a multi-tenant Hotel & Restaurant Management SaaS platform. The mobile application "
        "provides Guest portal for travelers to search and book hotels, Host portal for property owners "
        "to manage their listings, rooms, staff, and pricing, and Operations portal sections for "
        "housekeeping task management and front desk operations."
    )

    pdf.add_subheading("Key Features Implemented")
    pdf.add_bullet("Complete booking flow: search, room selection, guest details, payment confirmation")
    pdf.add_bullet("Payment gateway integration: Khalti (native SDK), Stripe, Razorpay")
    pdf.add_bullet("Internationalization: 7 languages (English, Nepali, Hindi, French, Spanish, Japanese, Chinese)")
    pdf.add_bullet("Host portal: property management, listing wizard, room CRUD, staff management")
    pdf.add_bullet("Operations: housekeeping task queue, front desk room grid, check-in/check-out")
    pdf.add_bullet("Splash screen animation with Nepal-themed design")
    pdf.add_bullet("Code quality: tokenized 3,200+ color values, split large files into modules")

    pdf.add_heading("3.4 QA Testing Activities")
    pdf.add_para(
        "I performed Manual QA testing on both the mobile application and website, documenting "
        "15+ bugs across multiple modules. Key bugs found included:"
    )
    pdf.add_bullet("B_007 (High): Search page shows 404 error on refresh - website")
    pdf.add_bullet("B_010 (High): Khalti payment fails with HTTP 400 - website")
    pdf.add_bullet("B_004 (Medium): Duplicate room names allowed within same property - mobile")
    pdf.add_bullet("B_006 (Medium): Keyboard hides input content on form fields - mobile")
    pdf.add_bullet("B_009 (Medium): Check-in/out times not editable - website")
    pdf.add_bullet("B_001 (Low): Phone number accepts more than 10 digits - mobile")
    pdf.add_bullet("B_002 (Low): Staff photo upload fails with error message - mobile")
    pdf.add_bullet("B_003 (Low): Discount code accepts negative usage limit - mobile")

    # Chapter 4: Conclusion
    pdf.add_chapter("FOUR", "CONCLUSION AND LEARNING OUTCOMES")

    pdf.add_heading("4.1 Conclusion")
    pdf.add_para(
        "My internship at Pravidhi Digital Innovation Pvt Ltd was a valuable learning experience "
        "that provided me with practical skills in mobile application development, API integration, "
        "payment gateway implementation, and software testing. Working on the ServeIQ platform allowed "
        "me to understand the complete software development lifecycle from design to deployment."
    )
    pdf.add_para(
        "The experience of porting a web application to mobile using React Native taught me the "
        "differences between web and mobile development, including component mapping, performance "
        "optimization, and platform-specific considerations. The QA testing phase helped me understand "
        "the importance of systematic testing and bug documentation."
    )
    pdf.add_para(
        "Working with a team of frontend developers, backend developer, and UI/UX designers "
        "improved my collaboration and communication skills. The supervisor's feedback and code "
        "reviews helped me write better, more maintainable code."
    )

    pdf.add_heading("4.2 Learning Outcomes")
    pdf.add_para("Through this internship, I gained the following skills and knowledge:")
    pdf.add_bullet("React Native and Expo framework for cross-platform mobile development")
    pdf.add_bullet("Expo Router for file-based navigation in React Native")
    pdf.add_bullet("API integration using fetch() with FastAPI backend")
    pdf.add_bullet("Payment gateway integration (Khalti native SDK, Stripe, Razorpay)")
    pdf.add_bullet("Internationalization (i18n) implementation with i18next for 7 languages")
    pdf.add_bullet("Manual QA testing methodology and bug documentation")
    pdf.add_bullet("Git version control and collaborative development workflows")
    pdf.add_bullet("Code quality practices: TypeScript, linting, code splitting, design tokens")
    pdf.add_bullet("Professional communication through standup meetings and code reviews")

    # References
    pdf.add_page()
    M, CW = 15, 180
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_xy(M, 25)
    pdf.cell(CW, 10, "REFERENCES", align="C")
    y = 45
    refs = [
        "React Native Documentation. https://reactnative.dev/docs/getting-started",
        "Expo Documentation. https://docs.expo.dev/",
        "FastAPI Documentation. https://fastapi.tiangolo.com/",
        "i18next Documentation. https://www.i18next.com/",
        "Khalti Payment Gateway. https://khalti.com/",
        "Stripe Documentation. https://stripe.com/docs",
        "Razorpay Documentation. https://razorpay.com/docs/",
        "Expo Router. https://docs.expo.dev/router/introduction/",
    ]
    pdf.set_font("Helvetica", "", 10)
    for i, ref in enumerate(refs, 1):
        pdf.set_xy(M, y)
        pdf.multi_cell(CW, 6, f"[{i}] {ref}")
        y += 8

    output_path = "internship-report.pdf"
    pdf.output(output_path)
    print(f"Report generated: {output_path}")


if __name__ == "__main__":
    main()
