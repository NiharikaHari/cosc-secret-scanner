// Benign code - should not trigger any findings.
const password = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;
const config = {
  password: "changeme",
  token: "<token>",
};
function greet(name) {
  return `Hello, ${name}!`;
}
