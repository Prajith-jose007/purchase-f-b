
# Local Development Setup Guide

This guide outlines the software and steps required to run this Next.js application successfully on your local machine, particularly if you are using WAMP for your MySQL database.

## Required Software

1.  **Node.js and npm (Node Package Manager):**
    *   **Why:** Next.js is a JavaScript framework that runs on Node.js. npm is used to manage project dependencies and run development scripts.
    *   **Installation:** Download and install Node.js (LTS version recommended) from [https://nodejs.org/](https://nodejs.org/). npm is included with the Node.js installation.
    *   **Verify:** Open a terminal and run `node -v` and `npm -v` to check if they are installed and see their versions.

2.  **MySQL Server (e.g., via WAMP):**
    *   **Why:** The application uses a MySQL database to store all its data.
    *   **Setup with WAMP:**
        *   Ensure your WAMP server is installed and running.
        *   **Crucially, ensure the MySQL service within WAMP is started** (usually indicated by a green icon in the WAMP tray menu).

3.  **A Code Editor (Recommended):**
    *   **Why:** For viewing, understanding, and modifying the project's code (e.g., Visual Studio Code, Sublime Text, Atom).
    *   **Installation:** Download and install your preferred editor.

4.  **A Web Browser:**
    *   **Why:** To access and interact with your Next.js application (e.g., Chrome, Firefox, Edge).

## Steps to Run the Application Locally

1.  **Project Files:** Ensure you have the complete project code on your local drive.

2.  **Environment Variables (`.env` file):**
    *   In the root directory of the project, create a file named `.env` if it doesn't exist.
    *   Add your MySQL database connection details to this file:
        ```dotenv
        DB_HOST=localhost
        DB_USER=your_mysql_user         # e.g., root or a dedicated user
        DB_PASSWORD=your_mysql_password   # e.g., your WAMP MySQL root password or dedicated user password
        DB_DATABASE=dutchpurchase       # The name of the database the app will use
        DB_PORT=3306                    # Default MySQL port
        ```
    *   **Important:** Replace `your_mysql_user` and `your_mysql_password` with the actual credentials for your MySQL setup. The `DB_DATABASE` is the name of the database the setup script will attempt to create if it doesn't exist.

3.  **Install Dependencies:**
    *   Open a terminal or command prompt.
    *   Navigate (using `cd`) to the root directory of your project.
    *   Run the command: `npm install`
        *   This will read `package.json` and download all necessary libraries (including `tsx` for the setup script) into a `node_modules` folder.

4.  **Database and Table Setup (Automated):**
    *   In the same terminal (still in the project's root directory), run the command:
        `npm run db:setup`
    *   This script will:
        *   Connect to your MySQL server using the credentials from `.env`.
        *   Create the database (specified as `DB_DATABASE` in `.env`) if it doesn't already exist.
        *   Create all required application tables (e.g., `users`, `orders`, `inventory`) if they don't exist.
        *   Seed some initial sample data for `branches` and `users` to help you get started.
          (Note: If you don't want sample data, you can edit `src/lib/setupDb.ts` and comment out the `seedData()` call before running the script).
    *   Review the output of this script in your terminal to ensure it completes without errors.

5.  **Run the Development Server:**
    *   In the same terminal, run the command: `npm run dev`
    *   You should see output indicating the server is starting, and eventually, it will say something like:
        ```
        ✓ Ready in X.Xs
        - Local:        http://localhost:9002
        ```
        (The port `9002` is configured in `package.json`).

6.  **Access in Browser:**
    *   Open your web browser (Chrome, Firefox, etc.).
    *   Go to the address: `http://localhost:9002`
    *   You can try logging in with the seeded credentials (e.g., username: `manager`, password: `manager` or `employee1`/`employee1`).

## Troubleshooting Common Issues

*   **`ECONNREFUSED 127.0.0.1:3306` (during `npm run dev` or `npm run db:setup`):**
    *   This means the application/script couldn't connect to your MySQL server.
    *   Ensure MySQL service is running in WAMP.
    *   Verify your `.env` file has the correct `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD`.
    *   Check if a firewall is blocking the connection.
*   **"Access denied for user..." (during `npm run db:setup`):**
    *   The MySQL user specified in `.env` does not have sufficient privileges to create databases or tables, or the password is incorrect.
    *   Ensure the user has `CREATE` and `INSERT` (for seeding) privileges, or use your MySQL root user for the setup.
*   **Login Fails (after successful `db:setup`):**
    *   Double-check the username and password (e.g., `manager`/`manager`).
    *   Verify the `users` table was created and seeded correctly by inspecting it with phpMyAdmin.
    *   Check the server-side terminal (where `npm run dev` is running) for specific error messages logged by `src/actions/userActions.ts`.

By following these steps, including the automated database setup, you should be able to run the application locally with a properly initialized database.

    