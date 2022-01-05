# Mocking APIs

## Learning Goals

- Understand the benefits of mocking network communication for React testing
- Set up a mock server using the Mock Service Worker library
- Use a mock server when testing a React component

## Introduction

In the last lesson, we saw how to handle asynchronous actions in our tests by
working on an app that receives data from an API.

While we now have working tests for our app, the way our tests are set up is not
ideal because they rely on an external service that is out of our control. What
happens if the API server is down, or our internet connection is slow? When we
run our tests, we want to be as scientific in our approach as possible, which
means that we need to set up a _controlled environment_ in which to run our
tests.

You could also imagine a scenario in which our test suite makes not one, but
tens or hundreds of requests to an API. If our tests use a real API, it means
our tests would take a long time to run, and we might end up reaching our rate
limit for the API! If the API persists data to a real database as well, that
means every time our tests run, we're creating/updating/deleting data
unnecessarily. Yikes!

In this lesson, we'll learn just how to go about setting up that controlled
environment for our tests when we're working with an API, and fix the problems
outlined above.

## Mocking `fetch`

As we learned in an earlier lesson, one strategy for controlling our test
environment is by **mocking**: creating a test double that stands in for the
actual implementation of a function. For example, we mocked an implementation of
`Math.random` to control its output for our tests:

```js
describe("coinFlip", () => {
  it("returns false when the random value is less than or equal to 0.5", () => {
    Math.random = jest.fn(() => 0);

    expect(coinFlip()).toBe(false);
  });
});
```

We could take a similar approach, and write a mock implementation of `fetch`.
This is generally considered a bad practice, and we'll show a better approach
soon, but here's how that would look in our tests:

```js
test("translates the text when the form is submitted", async () => {
  // replace the fetch function with a mock that has the same interface as the actual fetch function
  global.fetch = jest.fn(() => {
    // fetch returns a promise, so our mock must return a promise
    // the resolved value is an object that has a .json method
    return Promise.resolve({
      // the .json method also returns a promise
      // the resolved value is an object returned from the API that has a translatedText attribute
      json() {
        return Promise.resolve({
          translatedText: "Holaaa.",
        });
      },
    });
  });

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
  const textTo = await screen.findByDisplayValue("Holaaa.");
  expect(textTo).toBeInTheDocument();
});
```

This test will work, and now when our component uses the `fetch` function during
testing, our mock function will be called instead. Since the mock function has
the same interface as `fetch` (with some crazy-looking syntax!), our component
will get the expected result back from the mock function, and our tests will
pass. Notice that our mocked translation result is `"Holaaa"`, which lets us
know that the real API data isn't being used.

## Mocking Network Communication

As we said above, this isn't the best approach to fixing our tests. While we did
gain back control over our test environment, we _sacrificed some confidence that
our tests are accurately capturing the behavior of our components_.

For example, right now, we could go into the `<App>` component, change the URL
being used with `fetch`, and our tests would still pass, even though we know
this wouldn't work in the browser. Try it out!

In an ideal world, we want our test environment to be as close as possible to
the real thing. So we need a better approach for the problem at hand.

The solution? A library called Mock Service Worker (`msw`).

`msw` works by intercepting any HTTP requests our application makes during
testing, and giving us full control over handling the responses. You can think
of it like setting up a mini API of your very own, just for testing purposes!

## Setting Up a Mock Server

Let's see `msw` in action and discuss how it fixes the problems with our current
mock implementation.

To start, let's put our test back to its original state, replacing the expected
value with `"Holaaa"` so that we have a failing test:

```js
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
  const textTo = await screen.findByDisplayValue("Holaaa.");
  expect(textTo).toBeInTheDocument();
});
```

To use `msw`, we'll need to first install it:

```console
$ npm install msw
```

Next, we need to do a few things:

- Set up handlers for different API requests
- Create a mock server
- Run the server during our tests
- Clean up the server after our tests

### Set Up Handlers

The `msw` library works by intercepting all HTTP requests made by our
application, so the first thing we need to do is set up "handlers" for any
specific HTTP requests we want to override in our tests.

In our case, we can see from the `<App>` component that a POST request is being
made to the URL `https://libretranslate.de/translate`, so that's the request we
need to handle with `msw`.

To handle this, create a new folder in the `src` directory called `mocks` and a
file called `server.js`, and add the following code:

```js
// src/mocks/server.js
import { rest } from "msw";

const handlers = [
  rest.post("https://libretranslate.de/translate", (req, res, ctx) => {
    return res(ctx.json({ translatedText: "Holaaa." }));
  }),
];
```

The syntax here is a lot to take in, but essentially, we're telling `msw`:
"Whenever a POST request is made to `https://libretranslate.de/translate`, send
a response with a JSON object containing `{ translatedText: "Holaaa." }`."

If your application needs to make requests to other API endpoints, you could add
a separate handler for each one of them to this array.

### Create a Mock Server

The next step is to set up a server that can use our handlers. This is a
separate step since `msw` provides a few ways to run a server either in a Node
environment (like we use for testing), or in a browser environment (if you
wanted to use `mws` to intercept network requests while developing your
application).

To create the server, update your `mocks/server.js` file like so:

```js
// src/mocks/server.js
import { rest } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  rest.post("https://libretranslate.de/translate", (req, res, ctx) => {
    return res(ctx.json({ translatedText: "Holaaa." }));
  }),
];

export const server = setupServer(...handlers);
```

### Setup/Teardown the Server During Testing

Now that our `msw` server is all set up, let's use it in our tests! The easiest
way to do this (and to ensure that our server runs for _all_ test files) is to
update the `src/setupTests.js` file like so:

```js
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "warn",
  })
);

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
```

This file will run before our tests, and the `beforeAll` function sets up our
server to `listen` for requests before each test suite, so that any network
requests that are made when the test suite runs will be handled by `msw`. The
`onUnhandledRequest` option prints a helpful warning message in the console in
case your application makes any requests that aren't handled by `msw`, so you
don't accidentally test real API calls.

The `afterEach` block resets the server's handlers to their original state after
each individual test, so that any changes we make to the server during one test
don't impact other tests — it prevents our test behavior from leaking.

The `afterAll` block turns off the server when the tests are done running.

### Trying it out

With all that code in place, let's try out our tests! Run `npm test` and verify
that tests are passing.

It's worth walking through what's happening at this point, now that everything
is wired up. When we run the tests:

- `msw` starts listening for network request using the handlers that we provided
  in the `src/mocks/server.js` file
- Our tests render the `<App>` component, and fill in the form with some data,
  then submit the form
- When the form is submitted, code in the `<App>` component initiates a network
  request, which is intercepted by `msw`
- `msw` sends a response back with the data `{ translatedText: "Holaaa." }`
- Our `<App>` component re-renders with this new data
- Our tests find an element with the text we're looking for: `"Holaaa."`
- `msw` stops the server when the tests finish

Take some time here to explore the code and experiment. There are a few moving
pieces here, so take this opportunity to familiarize yourself with the code! Use
`console.log` and run the tests to get a better sense of what code is running
when.

### Using Request Data in `msw`

`msw` gives us a lot of control over how to handle the request-response cycle of
our mock server during testing. For example, let's add another test to check
that our application can translate from English to French:

```jsx
test("translates from English to French", async () => {
  render(<App />);

  // Find the form input fields
  const languageFrom = screen.getByLabelText(/^from$/i);
  const languageTo = screen.getByLabelText(/^to$/i);
  const textFrom = screen.getByLabelText(/text to translate/i);
  const submitButton = screen.getByRole("button", { name: /translate/i });

  // Fill out the form and submit
  userEvent.selectOptions(languageFrom, "en");

  // Select French this time!
  userEvent.selectOptions(languageTo, "fr");
  userEvent.type(textFrom, "Hello.");
  userEvent.click(submitButton);

  // Assert that the translated text appears on the page
  const textTo = await screen.findByDisplayValue("Bonjour.");
  expect(textTo).toBeInTheDocument();
});
```

We can tell from the `fetch` request in the `<App>` component that the language
option is being sent in the body of the request using the `target` property:

```js
fetch("https://libretranslate.de/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    q: textFrom,
    source: languageFrom,
    target: languageTo,
  }),
});
```

Using `msw`, we can access the `body` of the request and write some additional
logic in the server to customize the response:

```js
// src/mocks/server.js
const handlers = [
  rest.post("https://libretranslate.de/translate", (req, res, ctx) => {
    // Access the target property from the body of the request
    const { target } = req.body;

    // Change the response based on the target
    let text;
    if (target === "fr") {
      text = "Bonjour.";
    } else {
      text = "Holaaa.";
    }
    return res(ctx.json({ translatedText: text }));
  }),
];
```

The ability to handle all this custom server logic makes `msw` very powerful,
and gives us the ability to simulate many real API conditions in our testing
environment. One word of caution: it can be tempting to recreate the entire
functionality of a backend server here, but it's best to only create
functionality that you know you'll need to test.

## Conclusion

We want to control the testing environment as much as possible when running
tests, which means mocking out external services such as APIs. `msw` provides a
lot of great functionality that helps ensure our the conditions of our test
environment are as realistic as possible. It's a great library to choose
whenever you need to handle network requests in your tests. It also plays nicely
with Jest and React Testing Library — see the [example in the React Testing
Library docs][msw example] for more info.

## Resources

- [Mock Service Worker][msw]
- [Kent C. Dodds - Stop Mocking Fetch](https://kentcdodds.com/blog/stop-mocking-fetch)

[msw]: https://mswjs.io/
[msw example]:
  https://testing-library.com/docs/react-testing-library/example-intro
