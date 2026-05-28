# Corpus and Bible text policy

This public repository is a **code-only** release. It does not include Bible verse text.

## KRV / 개역한글 research conclusion

Recent research found that the Korean Bible Society / 대한성서공회 states the Korean economic/property-right protection period for **성경전서 개역한글판 / Korean Revised Version (KRV)** expired on 2011-12-31, while attribution and integrity/moral-right obligations still matter.

That finding is **not the same thing** as saying the corpus is MIT, Apache, CC0, or automatically public-domain worldwide. Public GitHub/web/npm redistribution of a full KRV corpus still requires exact source/provenance review and, for a public global release, Korean Bible Society/counsel clearance.

Therefore bible1's public default is:

- publish application code only;
- do not publish the full KRV verse corpus here;
- keep verse data outside this repository unless redistribution rights are fully documented;
- require self-hosters to bring their own authorized Bible corpus.

Do not write `Used by permission` unless permission has actually been granted for the relevant scope.

## Included metadata

This repository may include Bible book names, abbreviations, route helpers, database schema, and UI strings. It intentionally excludes full verse text and generated chapter payloads.

## Self-hosting

If you deploy bible1 yourself, you are responsible for sourcing, licensing, importing, attributing, and preserving the integrity of the Bible text you use.
