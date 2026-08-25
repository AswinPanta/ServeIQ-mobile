#!/usr/bin/env python3
"""Generate Gandaki University Internship Log Book PDF - Minimal Format"""

from fpdf import FPDF

STUDENT_NAME = "Aswin Panta"
REG_NO = "021-1-02-1-XXX"

WEEKS = [
    {
        "week_num": 1,
        "log_no": "G-w1-0001",
        "title": "Company Onboarding, SRS Study, and Development Environment Setup",
        "tasks": [
            ("1", "2026/06/15", "2026/06/20",
             "Company Onboarding & Team Introduction: Meeting the existing development team and gaining access to the project repository and tools.\nSRS Document Review: Studying the 44-page Software Requirements Specification for the StayEasy multi-tenant SaaS platform."),
            ("2", "2026/06/16", "2026/06/20",
             "Development Environment Setup: Installing and configuring Android Studio with SDK, emulator, and project dependencies.\nBuild Issue Resolution: Troubleshooting and resolving Gradle build errors during initial project setup."),
            ("3", "2026/06/17", "2026/06/20",
             "System Architecture Study: Understanding multi-tenant SaaS architecture including database schema and API design.\nFramework Research: Studying React Native and Expo framework fundamentals for mobile application development."),
            ("4", "2026/06/18", "2026/06/20",
             "UI/UX Team Expansion: A new UI/UX designer from Gandaki University joined the team for mobile app branding.\nCompetitor Analysis: Reviewing mobile applications from Airbnb, Booking.com, and Agoda for design reference."),
            ("5", "2026/06/19", "2026/06/20",
             "Technology Stack Decision: Receiving supervisor recommendation to shift from Android Studio to React Native with Expo.\nWeb Codebase Exploration: Beginning study of existing React JS web codebase to understand component patterns."),
            ("6", "2026/06/20", "2026/06/20",
             "Web Application Analysis: Studying authentication flow, booking workflow, and search functionality.\nTools Setup: Installing VS Code, Node.js, and Expo CLI for React Native development."),
        ],
    },
    {
        "week_num": 2,
        "log_no": "G-w2-0002",
        "title": "React Native Environment Setup and First Mobile App Implementation",
        "tasks": [
            ("1", "2026/06/22", "2026/06/27",
             "Expo Project Initialization: Creating first Expo project and testing deployment on Redmi 10 Prime using Expo Go.\nReact Native Fundamentals: Learning core components - View, Text, TextInput, TouchableOpacity, and StyleSheet."),
            ("2", "2026/06/23", "2026/06/27",
             "Project Structure Setup: Establishing folder structure with app/, components/, lib/, constants/ directories.\nLogin Screen Porting: Translating React JS web login screen to React Native native components."),
            ("3", "2026/06/24", "2026/06/27",
             "Registration & OTP Implementation: Developing registration and OTP verification screens connecting to FastAPI backend.\nAPI Integration: Performing first successful API call using fetch() for user registration."),
            ("4", "2026/06/25", "2026/06/27",
             "Home Screen Development: Building home screen with search bar and property card components.\nImage Loading: Resolving React Native Image component URI format for external image URLs."),
            ("5", "2026/06/26", "2026/06/27",
             "Backend API Connection: Connecting home screen to live backend search endpoint for real property data.\nData Mapping: Implementing mapper function for backend response format conversion."),
            ("6", "2026/06/27", "2026/06/27",
             "Sprint Planning: Attending team meeting and receiving assignment for Guest portal booking flow.\nProject Rebranding: Noting official rename from StayEasy to ServeIQ due to domain issues."),
        ],
    },
    {
        "week_num": 3,
        "log_no": "G-w3-0003",
        "title": "Guest Portal Booking Flow Implementation and Feature Development",
        "tasks": [
            ("1", "2026/06/29", "2026/07/04",
             "Room Selection Interface: Developing room selection screen with type, bed configuration, price, and amenities.\nBackend Integration: Connecting to available-rooms endpoint for real-time room availability data."),
            ("2", "2026/06/30", "2026/07/04",
             "Initial Repository Commit: Making first commit with all developed screens and components.\nGuest Details Form: Implementing guest information collection with form validation logic."),
            ("3", "2026/07/01", "2026/07/04",
             "Feature Sprint: Implementing checkout timer, discount codes, urgency badge, search filters, and cancellation policy.\nImage Integration: Adding real hotel images from Unsplash API for property display."),
            ("4", "2026/07/02", "2026/07/04",
             "Code Review: Participating in supervisor review identifying 3 issues - styling, navigation, and validation.\nBug Resolution: Fixing all identified issues and updating mock data with Nepal-specific hotels."),
            ("5", "2026/07/03", "2026/07/04",
             "Hotel Detail Enhancement: Adding room cards, amenity icons, and photo gallery to detail page.\nPerformance: Implementing image lazy loading for improved search results performance."),
            ("6", "2026/07/04", "2026/07/04",
             "Host Portal Initiation: Creating portal picker with 4 cards and Host login screen.\nPortal Auth: Implementing separate AsyncStorage keys for independent portal sessions."),
        ],
    },
    {
        "week_num": 4,
        "log_no": "G-w4-0004",
        "title": "Host Portal Development and Operations Module Implementation",
        "tasks": [
            ("1", "2026/07/05", "2026/07/10",
             "Host Dashboard: Building dashboard with stat cards, recent bookings, and quick actions.\nProperty List: Developing property card layout connected to backend /properties endpoint."),
            ("2", "2026/07/06", "2026/07/10",
             "Listing Wizard: Implementing 5-step property creation with validation and progress indicator.\nCode Assessment: Documenting 2,400+ line wizard file for future refactoring."),
            ("3", "2026/07/07", "2026/07/10",
             "CRUD Operations: Implementing property, room, and discount code create/read/update/delete.\nValidation: Adding price validation and completing project rename from StayEasy to ServeIQ."),
            ("4", "2026/07/08", "2026/07/10",
             "Front Desk Module: Developing room grid with real-time status display and check-in/out flows.\nState Management: Creating FrontDeskContext with 18 rooms across 3 floors."),
            ("5", "2026/07/09", "2026/07/10",
             "Housekeeping Module: Building task queue with status flow and cleaner assignment.\nPOS Integration: Adding basic floor plan view with table status display."),
            ("6", "2026/07/10", "2026/07/10",
             "Project Cleanup: Removing unused Express/tRPC server code and Drizzle ORM files.\nTypeScript Check: Confirming zero errors following project restructure."),
        ],
    },
    {
        "week_num": 5,
        "log_no": "G-w5-0005",
        "title": "Manual QA Testing on ServeIQ Mobile Application and Website",
        "tasks": [
            ("1", "2026/07/12", "2026/07/17",
             "QA Process Start: Beginning Manual QA testing on ServeIQ mobile app and website.\nBug Report Template: Creating standardized format with ID, Title, Severity, Steps, and Attachments."),
            ("2", "2026/07/13", "2026/07/17",
             "Host Portal Testing: Executing test cases on property listing and staff invitation flows.\nBug Documentation: Documenting B_001 (phone validation), B_002 (staff photo), B_003 (discount limit)."),
            ("3", "2026/07/14", "2026/07/17",
             "Room & Offer Testing: Testing room management and special offer creation functionality.\nValidation Issues: Identifying B_004 (duplicate rooms), B_005 (invalid dates), B_006 (keyboard)."),
            ("4", "2026/07/15", "2026/07/17",
             "Website Testing: Transitioning to testing React JS web version built by frontend team.\nCritical Bugs: Finding B_007 (search 404) and B_008 (current date validation) on web."),
            ("5", "2026/07/16", "2026/07/17",
             "Payment Testing: Testing Khalti, Stripe, and Razorpay integration flows on web.\nPayment Bug: Documenting B_010 (Khalti HTTP 400) blocking user payments."),
            ("6", "2026/07/17", "2026/07/17",
             "Bug Compilation: Organizing all bugs by severity for formal presentation.\nResearch: Beginning payment gateway research for development return."),
        ],
    },
    {
        "week_num": 6,
        "log_no": "G-w6-0006",
        "title": "Extended Mobile App Testing and Bug Resolution Tracking",
        "tasks": [
            ("1", "2026/07/19", "2026/07/24",
             "Guest Screen Testing: Testing search, hotel detail, and booking workflow interfaces.\nUX Issues: Documenting layout, map display, notification, and placeholder visibility problems."),
            ("2", "2026/07/20", "2026/07/24",
             "Profile & Payment Testing: Testing host profile editing and payment functionality.\nPersistence Issues: Finding profile edits don't reflect in UI, test payment failures."),
            ("3", "2026/07/21", "2026/07/24",
             "Auth Flow Testing: Testing host login and password management functionality.\nSession Issues: Identifying temp password recurrence and room data persistence failures."),
            ("4", "2026/07/22", "2026/07/24",
             "Staff Module Testing: Testing staff forms, phone validation, and property status toggles.\nRegression: Re-testing B_002 and B_010 to confirm continued failure."),
            ("5", "2026/07/23", "2026/07/24",
             "Sprint Review: Presenting all bugs to supervisor with severity classifications.\nPriority: Khalti payment and search 404 designated as production-blocking."),
            ("6", "2026/07/24", "2026/07/24",
             "Final Report: Compiling bug report organized by High, Medium, Low severity.\nPreparation: Studying i18next for internationalization implementation."),
        ],
    },
    {
        "week_num": 7,
        "log_no": "G-w7-0007",
        "title": "Internationalization Implementation and Payment Gateway Integration",
        "tasks": [
            ("1", "2026/07/26", "2026/07/31",
             "i18n Setup: Configuring i18next with 7 languages - English, Nepali, Hindi, French, Spanish, Japanese, Chinese.\nTranslation Files: Creating initial English translations with 200+ keys for auth and booking."),
            ("2", "2026/07/27", "2026/07/31",
             "Payment SDK: Installing Razorpay and Khalti native payment SDK packages.\nProfile Navigation: Building profile stack layout with sub-page routing."),
            ("3", "2026/07/28", "2026/07/31",
             "Auth Screen i18n: Completing translations for login, register, OTP, and password screens.\nBooking i18n: Applying translation keys to booking and payment confirmation screens."),
            ("4", "2026/07/29", "2026/07/31",
             "Complete i18n: Applying translations to all tab screens, profile pages, and components.\nScroll Restoration: Implementing useScrollRestoration hook for search screens."),
            ("5", "2026/07/30", "2026/07/31",
             "Translation Finalization: Completing all 7 language files with 1,400+ total keys.\nBooking Refactor: Splitting 1,254-line booking-flow.tsx into modular files."),
            ("6", "2026/07/31", "2026/07/31",
             "Code Modularization: Completing booking-flow decomposition into constants, styles, hooks.\nQuality Check: Confirming zero TypeScript errors and reducing lint warnings."),
        ],
    },
    {
        "week_num": 8,
        "log_no": "G-w8-0008",
        "title": "Bug Fixes, Splash Screen Design, and Code Quality Refactoring",
        "tasks": [
            ("1", "2026/08/02", "2026/08/07",
             "Timezone Fix: Resolving Date#toISOString() UTC issue causing incorrect Nepal date display.\nPipeline Correction: Fixing booking payment intent order and discount query formatting."),
            ("2", "2026/08/03", "2026/08/07",
             "Backend Alignment: Connecting guest portal with city rails and nearby search integration.\nKhalti Integration: Implementing Khalti payment flow with pidx verification."),
            ("3", "2026/08/04", "2026/08/07",
             "Splash Screen: Creating animated Nepal map with route lines and landmark illustrations.\nDesign Iterations: Completing 10+ revisions based on supervisor feedback."),
            ("4", "2026/08/05", "2026/08/07",
             "Native SDK Setup: Installing expo-dev-client and Khalti native payment SDK.\nPayment Verification: Testing complete Khalti flow from booking to backend confirmation."),
            ("5", "2026/08/06", "2026/08/07",
             "Color Tokenization: Replacing 3,200+ hardcoded hex colors with design tokens.\nFile Modularization: Splitting api.ts into 6 modules and listing-wizard into orchestrator."),
            ("6", "2026/08/07", "2026/08/07",
             "Feature Demo: Presenting Guest, Host, Housekeeping, and Front Desk modules.\nSprint Sign-off: Supervisor approving work before examination period."),
        ],
    },
]


def sanitize(text):
    replacements = {
        '\u2014': '-', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u2264': '<=',
        '\u2265': '>=', '\u00d7': 'x', '\u2022': '-',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


class LogBookPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=False)

    def draw_week_page(self, week):
        self.add_page()
        W, H, M = 210, 297, 15
        CW = W - 2 * M

        self.set_font("Helvetica", "B", 16)
        self.set_xy(M, M)
        self.cell(CW, 10, "Gandaki University", align="C")
        y = M + 14

        self.set_font("Helvetica", "", 9)
        self.set_xy(M, y)
        self.cell(CW * 0.50, 7, f"Student Name: {STUDENT_NAME}              Reg. No.: {REG_NO}")
        self.cell(CW * 0.40, 7, f"Log Book No.: {week['log_no']}", align="R")
        y += 9

        self.set_font("Helvetica", "B", 10)
        self.set_xy(M, y)
        self.cell(CW, 7, week['title'], align="C")
        y += 10

        self.set_font("Helvetica", "", 9)
        self.set_xy(M, y)
        self.cell(CW, 5, "_" * 70, align="C")
        y += 5
        self.set_xy(M, y)
        self.cell(CW, 5, "University Supervisor", align="C")
        y += 10

        col_sno = 8
        col_task = CW * 0.60
        col_start = CW * 0.12
        col_end = CW * 0.12
        col_sig = CW - col_sno - col_task - col_start - col_end

        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(230, 230, 230)
        self.set_xy(M, y)
        self.cell(col_sno, 7, "S.N.", border=1, align="C", fill=True)
        self.cell(col_task, 7, "Projects/Task worked on this week", border=1, align="C", fill=True)
        self.cell(col_start, 7, "Start Date", border=1, align="C", fill=True)
        self.cell(col_end, 7, "End Week", border=1, align="C", fill=True)
        self.cell(col_sig, 7, "Signature of Supervisor", border=1, align="C", fill=True)
        y += 7

        for sn, start_date, end_date, task_text in week["tasks"]:
            self.set_font("DejaVu", "", 6.5)
            lines = self.multi_cell(col_task, 4, sanitize(task_text), border=0, dry_run=True, output="LINES")
            needed_h = max(len(lines) * 4.2 + 2, 18)
            if y + needed_h > H - 30:
                needed_h = H - 30 - y

            self.set_xy(M, y)
            self.cell(col_sno, needed_h, "", border=1)
            self.cell(col_task, needed_h, "", border=1)
            self.cell(col_start, needed_h, "", border=1)
            self.cell(col_end, needed_h, "", border=1)
            self.cell(col_sig, needed_h, "", border=1)

            self.set_xy(M + 1, y + 1)
            self.set_font("Helvetica", "", 8)
            self.cell(col_sno - 2, 4, sn, align="C")

            self.set_xy(M + col_sno + 1, y + 1)
            self.set_font("DejaVu", "", 6.5)
            self.multi_cell(col_task - 2, 3.5, sanitize(task_text))

            self.set_xy(M + col_sno + col_task + 1, y + 1)
            self.set_font("Helvetica", "", 7)
            self.cell(col_start - 2, 4, start_date, align="C")

            self.set_xy(M + col_sno + col_task + col_start + 1, y + 1)
            self.cell(col_end - 2, 4, end_date, align="C")

            y += needed_h


def main():
    pdf = LogBookPDF()
    pdf.add_font("DejaVu", "", "/System/Library/Fonts/Supplemental/Arial Unicode.ttf")

    for week in WEEKS:
        pdf.draw_week_page(week)

    output_path = "internship-log-report.pdf"
    pdf.output(output_path)
    print(f"PDF generated: {output_path}")
    print(f"  {len(WEEKS)} pages")


if __name__ == "__main__":
    main()
