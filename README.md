
# Firebase Studio - Culinary Compass

This is a NextJS starter application for managing restaurant supply orders, named Culinary Compass. It's designed to be used with Firebase Studio.

## Getting Started

1.  **Prerequisites**: Ensure you have Node.js and npm installed. If you plan to use a local MySQL database (e.g., with WAMP), ensure it's running.
2.  **Clone/Download**: Get the project files onto your local machine.
3.  **Configure Environment**: Copy `.env.example` to `.env` (if an example exists) or create a new `.env` file. Fill in your database connection details (see `SETUP_GUIDE.md` for details).
    ```env
    DB_HOST=localhost
    DB_USER=your_mysql_user
    DB_PASSWORD=your_mysql_password
    DB_DATABASE=dutchpurchase
    DB_PORT=3306
    ```
4.  **Install Dependencies**:
    ```bash
    npm install
    ```
5.  **Database Setup (Automated)**:
    This command will create the database (if it doesn't exist), create all necessary tables, and seed some initial data.
    ```bash
    npm run db:setup
    ```
    Review the output in the terminal to ensure it completes successfully.
6.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

For more detailed setup instructions, especially if you're using WAMP, refer to `SETUP_GUIDE.md`.

## Key Functionality
*   User authentication (Employee, Purchase Manager roles).
*   Inventory management (view and upload via CSV).
*   Order creation and management.
*   Order status tracking.
*   Invoice uploading for orders.

## Main Technologies
*   Next.js (React framework)
*   TypeScript
*   ShadCN UI components
*   Tailwind CSS
*   Genkit (for AI, if used)
*   MySQL (database)

To explore the application's UI and features, start by navigating to the login page (root `/`) and then to the dashboard after logging in (e.g., as `manager`/`manager`). Key pages include:
*   `src/app/page.tsx` (Login Page)
*   `src/app/dashboard/...` (Authenticated application pages)
