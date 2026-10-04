# CSCE-703-OWASP-Juice-Shop-Login-Page

This is a mock-up of the OWASP Juice Shop login page.

## Running the program

If not installed already, install Node.js, then run `npm start` from the root directory and open <http://127.0.0.1:3001> in a browser. If using a remote VS Code workspace,
forward port 3001 from the **Ports** panel and open the forwarded address shown
there. The server uses Node.js built-ins only and does not require installing
npm packages.

## What this program does

The program allows the user to enter their email and password into the respective fields.The browser makes sure that the email and password fields are not empty, the email contains
`@`, and the password is at least 8 characters. Once validated, the inpouts are sent to the "server side", where the server independently validates the inputs. If approved, a message is sent back to the "client side" and displayed to the user; if validation fails for any part (server or client), then an error message is displayed to the user. This is a mock page that is not connected to actual databases or other pages, so the server does cannot authenticate users or save credentials. It is also unable to check/validate most vulnerabilities like SQL injection or authentication bypass as it is not connected to anything that takes queries or checks emails/passwords, so the security of this page is ultimately unclear.