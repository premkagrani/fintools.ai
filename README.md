# fintools.ai

Providing financial tools to a common man.

fintools.ai is a dependency-free single-page website for quick personal finance calculations. It includes calculators for SIP investing, step-up SIP planning, and EMI estimation, with a clean responsive interface and a subtle live animated background.

## Features

- Normal SIP calculator for monthly investment growth
- Step-up SIP calculator with annual contribution increases
- EMI calculator for loan repayment estimates
- Multi-currency display for INR, USD, EUR, GBP, JPY, AUD, CAD, and SGD
- Live result updates as values change
- Responsive layout for desktop and mobile
- Animated finance-themed wallpaper with reduced-motion support

## How to use

Open `index.html` in any modern browser.

No build step, package install, or server is required.

## Currency note

The currency selector changes how values are displayed. It does not perform exchange-rate conversion, so the numbers entered are treated as amounts in the selected currency.

## Project files

- `index.html` contains the SPA structure
- `styles.css` contains the layout, visual design, and responsive styles
- `app.js` contains calculator logic, currency formatting, charts, and wallpaper animation
