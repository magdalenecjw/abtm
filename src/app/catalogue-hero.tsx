import type { CSSProperties } from "react";

const LIBRARY_NAME = "(automated) book teller machine";
const HEADLINE = "Please make a withdrawal";

/** Milliseconds between typed characters, and before the first one. */
const TYPE_STEP_MS = 55;
const TYPE_START_MS = 250;

/**
 * Splits the headline into words of characters, each tagged with its
 * position in the full string (spaces included), which sets its delay.
 */
function typedWords(text: string) {
  let position = 0;
  return text.split(" ").map((word) => {
    const chars = Array.from(word).map((char) => ({ char, i: position++ }));
    position++; // the space after this word
    return chars;
  });
}

const HEADLINE_WORDS = typedWords(HEADLINE);
const LAST_INDEX = HEADLINE.length - 1;

/**
 * Catalogue hero, per visual-system.md §9.2: library name, the
 * "Please make a withdrawal" headline, and the volume count.
 *
 * The typing effect is pure CSS (see .hero-char in globals.css) rather
 * than a client-side effect, so:
 * - the full headline is in the server-rendered HTML — it works with
 *   JavaScript off and reads correctly to screen readers (aria-label);
 * - there's no flash of the full text before hydration starts typing;
 * - under prefers-reduced-motion every character is simply visible.
 *
 * Each character fades in after `--d` ms; its ::after draws the caret
 * only during its own step, and the last character's caret keeps
 * blinking — so the caret appears to travel with the text.
 *
 * Spaces take one typing step too, giving a natural beat between
 * words. Words are wrapped in nowrap spans so the headline only ever
 * breaks between words on narrow screens.
 */
export function CatalogueHero({ volumeCount }: { volumeCount: string }) {
  return (
    <section className="flex flex-col items-center gap-4 pt-6 pb-10 text-center">
      <p className="hero-label">{LIBRARY_NAME}</p>

      <h1 className="hero-headline" aria-label={HEADLINE}>
        {HEADLINE_WORDS.map((chars, w) => (
          <span key={w} aria-hidden="true">
            <span className="whitespace-nowrap">
              {chars.map(({ char, i }) => (
                <span
                  key={i}
                  className={
                    i === LAST_INDEX ? "hero-char hero-char-last" : "hero-char"
                  }
                  style={
                    {
                      "--d": `${TYPE_START_MS + i * TYPE_STEP_MS}ms`,
                    } as CSSProperties
                  }
                >
                  {char}
                </span>
              ))}
            </span>
            {w < HEADLINE_WORDS.length - 1 && " "}
          </span>
        ))}
      </h1>

      <p className="hero-label tabular-nums">{volumeCount}</p>
    </section>
  );
}
