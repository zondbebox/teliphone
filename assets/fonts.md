# Self-hosted fonts

Downloaded on **23 October 2026** from the official [Google Fonts repository](https://github.com/google/fonts). These assets are served locally by Samal Journeys; opening the app does not request fonts from Google or another third party. No fonts were installed on the operating system.

## DM Serif Display

Used for display headings and italic accents. The regular and italic fonts are unmodified TrueType files from [google/fonts/ofl/dmserifdisplay](https://github.com/google/fonts/tree/main/ofl/dmserifdisplay).

- `public/fonts/DMSerifDisplay-Regular.ttf`: [official source](https://github.com/google/fonts/blob/main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf), SHA-256 `8cc3643535edf039aa5d95440a8542735e9197e4f4b8d9303e980fefbf5ab616`.
- `public/fonts/DMSerifDisplay-Italic.ttf`: [official source](https://github.com/google/fonts/blob/main/ofl/dmserifdisplay/DMSerifDisplay-Italic.ttf), SHA-256 `df74c0ac387baeaeb0fe4f2324e1668e6a3ed8c09cd9796fe162c71753e19e45`.
- License: SIL Open Font License 1.1, copied in full to `public/fonts/DMSerifDisplay-OFL.txt` from the [official license](https://github.com/google/fonts/blob/main/ofl/dmserifdisplay/OFL.txt).
- Copyright 2014–2018 Adobe, with Reserved Font Name “Source”; copyright 2019 Google LLC. Full copyright and license terms are preserved in the accompanying license file.

## Manrope

Used for body text, navigation and form controls. The variable font is an unmodified TrueType file from [google/fonts/ofl/manrope](https://github.com/google/fonts/tree/main/ofl/manrope). Its local filename is simplified for browser URLs; the font data itself is unchanged.

- `public/fonts/Manrope-Variable.ttf`: [official source, Manrope[wght].ttf](https://github.com/google/fonts/blob/main/ofl/manrope/Manrope%5Bwght%5D.ttf), SHA-256 `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6`.
- License: SIL Open Font License 1.1, copied in full to `public/fonts/Manrope-OFL.txt` from the [official license](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt).
- Copyright 2018 The Manrope Project Authors, [upstream project](https://github.com/googlefonts/manrope).

## Caveat

Used for small editorial and guide notes. The variable font is an unmodified TrueType file from [google/fonts/ofl/caveat](https://github.com/google/fonts/tree/main/ofl/caveat). The official [family metadata](https://github.com/google/fonts/blob/main/ofl/caveat/METADATA.pb) specifies a weight range of 400–700. Its local filename is simplified for browser URLs; the font data itself is unchanged.

- `public/fonts/Caveat-Variable.ttf`: [official source, Caveat[wght].ttf](https://github.com/google/fonts/blob/main/ofl/caveat/Caveat%5Bwght%5D.ttf); [exact download URL](https://raw.githubusercontent.com/google/fonts/refs/heads/main/ofl/caveat/Caveat%5Bwght%5D.ttf); SHA-256 `0bdb6b660482d31531b3945849fba5916b3ef8695da7024a9e6b9ee3c4157988`.
- `public/fonts/Caveat-OFL.txt`: [official license source](https://github.com/google/fonts/blob/main/ofl/caveat/OFL.txt); [exact download URL](https://raw.githubusercontent.com/google/fonts/refs/heads/main/ofl/caveat/OFL.txt); SHA-256 `1f9d81d094273d82f3898a1ee8b598a717d050ecbf5ff7bede105b704880157b`.
- License: SIL Open Font License 1.1, copied in full beside the font.
- Copyright 2014 The Caveat Project Authors, [upstream project](https://github.com/googlefonts/caveat).

The supplied runtime did not include fontTools, so no WOFF2 conversion or additional dependency installation was performed. The four font files total 716,136 bytes. Their licenses must remain included when distributing the project.
