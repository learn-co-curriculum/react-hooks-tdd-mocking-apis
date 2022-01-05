import { useState } from "react";
import languages from "./data/languages";

function App() {
  const [languageFrom, setLanguageFrom] = useState("en");
  const [languageTo, setLanguageTo] = useState("fr");
  const [textFrom, setTextFrom] = useState("");
  const [textTo, setTextTo] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
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
    })
      .then((r) => r.json())
      .then((data) => setTextTo(data.translatedText));
  }

  return (
    <main>
      <header>
        <h1>Translatr</h1>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="form-field">
            <label htmlFor="language-from">From</label>
            <select
              id="language-from"
              value={languageFrom}
              onChange={(e) => setLanguageFrom(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <label htmlFor="text-from">Text to translate</label>
            <textarea
              id="text-from"
              value={textFrom}
              onChange={(e) => setTextFrom(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="language-to">To</label>
            <select
              id="language-to"
              value={languageTo}
              onChange={(e) => setLanguageTo(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <label htmlFor="text-to">Translated text</label>
            <textarea id="text-to" value={textTo} disabled />
          </div>
        </div>
        <button type="submit">Translate</button>
      </form>
    </main>
  );
}

export default App;
