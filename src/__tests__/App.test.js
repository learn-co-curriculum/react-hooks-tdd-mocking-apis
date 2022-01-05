import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

test("displays the site title", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /translatr/i, level: 1 })
  ).toBeInTheDocument();
});

test("displays a form to enter languages and text to translate", () => {
  render(<App />);

  expect(screen.getByLabelText(/^from$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/text to translate/i)).toBeInTheDocument();

  expect(screen.getByLabelText(/^to$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/translated text/i)).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /translate/i })
  ).toBeInTheDocument();
});

test("translates the text when the form is submitted", async () => {
  render(<App />);

  // Find the form input fields
  const languageFrom = screen.getByLabelText(/^from$/i);
  const languageTo = screen.getByLabelText(/^to$/i);
  const textFrom = screen.getByLabelText(/text to translate/i);
  const submitButton = screen.getByRole("button", { name: /translate/i });

  // Fill out the form and submit
  userEvent.selectOptions(languageFrom, "en");
  userEvent.selectOptions(languageTo, "es");
  userEvent.type(textFrom, "Hello.");
  userEvent.click(submitButton);

  // Assert that the translated text appears on the page
  const textTo = await screen.findByDisplayValue("Hola.");
  expect(textTo).toBeInTheDocument();
});
