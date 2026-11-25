import {
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Open_Sans,
  Poppins,
  Raleway,
  Roboto,
  Source_Serif_4,
} from "next/font/google";

// Polices des CV adaptés : `preload: false`, le navigateur ne télécharge que
// celle réellement utilisée. Les options doivent rester des littéraux.
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--cv-font-inter" });
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--cv-font-lato",
});
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--cv-font-montserrat" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
  variable: "--cv-font-poppins",
});
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--cv-font-open-sans" });
const roboto = Roboto({ subsets: ["latin"], display: "swap", preload: false, variable: "--cv-font-roboto" });
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false, variable: "--cv-font-raleway" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cv-font-source-serif",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--cv-font-merriweather",
});

/** Classes à poser sur un conteneur pour rendre les polices disponibles. */
export const cvFontVariables = [
  inter,
  lato,
  montserrat,
  poppins,
  openSans,
  roboto,
  raleway,
  sourceSerif,
  merriweather,
]
  .map((font) => font.variable)
  .join(" ");
