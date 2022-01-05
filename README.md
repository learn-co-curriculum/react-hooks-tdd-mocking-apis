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

## Conclusion

## Resources

- [Mock Service Worker][msw]
- [Kent C. Dodds - Stop Mocking Fetch](https://kentcdodds.com/blog/stop-mocking-fetch)

[msw]: https://mswjs.io/
