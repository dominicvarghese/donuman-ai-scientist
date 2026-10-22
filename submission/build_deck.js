// Builds submission/WARDEN_deck.pptx (9 slides, ~4 min) with the transcript as speaker notes,
// and submission/TRANSCRIPT.md from the same text.
// Usage: NODE_PATH=<dir with pptxgenjs> node submission/build_deck.js <apply_theme.js>
// Numbers come from submission/results.json (submission/results.py). Cells and sentences in
// [[double brackets]] are placeholders for the candidate-screening results.
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.argv[2]);

const HERE = __dirname;
const FIG = (f) => path.join(HERE, "figures", f);
const R = JSON.parse(fs.readFileSync(path.join(HERE, "results.json"), "utf8"));
const PENDING = "[[pending]]";

const THEME = {
  name: "WARDEN", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "0B0B0B", lt1: "FFFFFF", dk2: "14213D", lt2: "F3F5F8",
            accent1: "2A78D6", accent2: "EB6834", accent3: "1BAF7A", accent4: "EDA100",
            accent5: "6250D6", accent6: "E34948", hlink: "2A78D6", folHlink: "6250D6" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "WARDEN: an AI co-scientist for area-selective ALD";
const C = pres.SchemeColor;
const SPOKEN = [];
const say = (slide, title, text) => { slide.addNotes(text); SPOKEN.push({ title, text }); };

// ---- layouts --------------------------------------------------------------------
pres.defineSlideMaster({
  title: "DARK", background: { color: THEME.colors.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.2, w: 8.8, h: 1.3, fontSize: 40,
      bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 2.7, w: 8.8, h: 2.2, fontSize: 18,
      color: "CADCFC", valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: THEME.colors.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.75, fontSize: 26,
      bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 9.2, y: 5.2, w: 0.4, h: 0.3, fontSize: 10, color: "52514E" },
});

const card = (slide, x, y, w, h, big, small, color, name, bigSize = 30) => {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 },
    line: { color: C.background2 }, objectName: name + " card" });
  slide.addText(big, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h * 0.5, fontSize: bigSize, bold: true,
    fontFace: THEME.headFontFace, color: color, valign: "bottom", margin: 0, isTextBox: true, objectName: name + " value" });
  slide.addText(small, { x: x + 0.2, y: y + h * 0.6, w: w - 0.4, h: h * 0.36, fontSize: 12, color: C.text1,
    valign: "top", margin: 0, isTextBox: true, objectName: name + " label" });
};
const bullets = (slide, items, x, y, w, h, size = 15) =>
  slide.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
    { x, y, w, h, fontSize: size, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "bullets" });

// ---- 1. title -------------------------------------------------------------------
pres.addSection({ title: "Introduction" });
let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Introduction" });
s.addText("WARDEN", { placeholder: "title" });
s.addText([{ text: "An AI co-scientist that decides what to compute next", options: { breakLine: true } },
  { text: "for area-selective ALD: SiO₂ on SiO₂, nitride passivated", options: {} }], { placeholder: "body" });
say(s, "Title",
  "This is WARDEN, an AI co-scientist for area-selective atomic layer deposition. " +
  "I'll cover the problem, why it is hard, how WARDEN works, what it has shown so far, and where it goes next.");

// ---- 2. introduction ------------------------------------------------------------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
s.addText("The problem: oxide on oxide, not on the nitride", { placeholder: "title" });
bullets(s, [
  "3D NAND needs SiO₂ grown on SiO₂ while the adjacent SiN stays bare, to isolate charge-trap cells",
  "Route: an inhibitor that caps nitride N–H groups but leaves oxide O–H groups free to grow",
  "Hard because both surfaces are amorphous, with many different reactive sites",
], 0.5, 1.35, 5.3, 3.4);
card(s, 6.2, 1.35, 3.3, 1.55, "90 %", "selectivity at 10 nm of oxide: the target", C.accent1, "target");
card(s, 6.2, 3.15, 3.3, 1.55, "3D NAND", "the application: oxide-on-oxide next to charge-trap nitride", C.accent2, "application", 26);
say(s, "The problem",
  "The challenge comes from 3D NAND: grow silicon oxide on oxide, but not on the silicon nitride right next to it, " +
  "with 90 percent selectivity at 10 nanometres. The usual route is an inhibitor molecule that caps the nitride's N-H groups " +
  "and leaves the oxide's O-H groups free. That is hard because both surfaces are amorphous, with many different reactive sites.");

// ---- 3. why it helps ------------------------------------------------------------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
s.addText("Why an AI co-scientist helps", { placeholder: "title" });
const col = (x, headText, color, items, name) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.25, w: 4.3, h: 3.85, rectRadius: 0.08, fill: { color: C.background2 },
    line: { color: C.background2 }, objectName: name + " panel" });
  s.addText(headText, { x: x + 0.25, y: 1.4, w: 3.8, h: 0.45, fontSize: 18, bold: true, fontFace: THEME.headFontFace, color,
    margin: 0, isTextBox: true, objectName: name + " heading" });
  bullets(s, items, x + 0.25, 1.95, 3.85, 3.0, 14);
};
col(0.5, "Today", C.accent6, [
  "Molecules picked by intuition",
  "One idealised surface",
  "Adsorption energy as a proxy",
  "Failed calculations dropped or misread",
  "Compute spread evenly",
], "today");
col(5.2, "With WARDEN", C.accent3, [
  "Molecules from sourced literature and analogs",
  "Validated amorphous surfaces, site by site",
  "Reaction kinetics judged by a real dose window",
  "Numerical failures retried, never read as chemistry",
  "Each calculation chosen for its value",
], "warden");
say(s, "Why it helps",
  "Today, inhibitors are picked by intuition and judged by adsorption on one idealised surface, failed calculations are dropped " +
  "or misread, and compute is spread evenly. WARDEN sources every molecule in the literature, works site by site on validated " +
  "amorphous surfaces, judges kinetics against a real dose window, and spends each calculation where it can change the decision.");

// ---- 4. procedure ---------------------------------------------------------------
pres.addSection({ title: "Approach" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Approach" });
s.addText("How WARDEN works", { placeholder: "title" });
s.addImage({ path: FIG("fig1_pipeline.png"), x: 0.5, y: 1.25, w: 9.0, h: 9.0 * 563 / 1900, objectName: "pipeline figure",
  altText: "Pipeline: literature, candidates, barriers, decision agent, process verdict, with a feedback loop" });
bullets(s, [
  "Every literature claim quotes a retrieved source verbatim; an independent critic reviews each proposal",
  "Amorphous slabs pass admission gates before any energy is computed; hypotheses are scored by code, not by the LLM",
], 0.5, 4.15, 9.0, 1.0, 14);
say(s, "How WARDEN works",
  "Here is the loop. WARDEN searches the literature through Valency BOND and keeps only what it can quote. It turns papers into " +
  "candidate molecules and designs analogs, computes reaction barriers with xTB on validated surfaces, and a decision agent picks " +
  "the next calculation. A process model gives the verdict, and an LLM planner, a critic and a lab notebook turn each result into the next question.");

// ---- 5. criterion ---------------------------------------------------------------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Approach" });
s.addText("One criterion: can a dose separate the surfaces?", { placeholder: "title" });
s.addImage({ path: FIG("fig2_dose_window.png"), x: 0.4, y: 1.15, w: 4.75, h: 4.75 * 875 / 1028, objectName: "dose window figure",
  altText: "Dose-window margin as a function of the fastest oxide barrier and the slowest nitride barrier" });
bullets(s, [
  "Each barrier gives a capping rate: k = (k_B T / h) · exp(−Ea / k_B T)",
  "Works only if the slowest nitride site is 99 % capped before the fastest oxide site reaches 1 %, at 0.05–30 s",
  "Margin in decades, at the best temperature: the number every component optimises",
  "A large barrier difference alone is not enough: both barriers must sit in the blue band",
], 5.45, 1.35, 4.1, 3.9, 14);
say(s, "The criterion",
  "Everything optimises one physical number. Each barrier gives a capping rate. A molecule only works if a practical dose caps " +
  "the slowest nitride site before it touches the fastest oxide site: the blue region, measured in decades. " +
  "A big barrier difference is not enough; both barriers have to sit in the right band.");

// ---- 6. agent -------------------------------------------------------------------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Approach" });
s.addText("The agent chooses what to compute next", { placeholder: "title" });
s.addText("value of a calculation = expected improvement in the margin × P(success) ÷ cost",
  { x: 0.5, y: 1.2, w: 9.0, h: 0.4, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "formula" });
s.addImage({ path: FIG("fig4_benchmark.png"), x: 3.55, y: 1.75, w: 5.95, h: 5.95 * R.fig4_aspect, objectName: "benchmark figure",
  altText: "Regret of the final pick versus compute budget for the WARDEN agent and four baseline policies" });
card(s, 0.5, 1.75, 2.85, 1.5, R.bench.gain20, "lower regret than screening everything, budget 20", C.accent1, "gain");
card(s, 0.5, 3.45, 2.85, 1.5, R.bench.saving80, "less compute to match exhaustive screening, budget 80", C.accent3, "saving");
say(s, "The agent",
  "The agent keeps a Bayesian belief over every barrier it could compute, and values each possible calculation, a new molecule, " +
  "site, pathway, orientation or a better method, by how much it could change the decision per unit cost. On forty synthetic " +
  "test cases per budget, it beats screening everything at tight budgets and matches it at large budgets with sixteen percent less compute.");

// ---- 7. validation --------------------------------------------------------------
pres.addSection({ title: "Results" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Results" });
s.addText("Validation: real calculations, corrected conclusions", { placeholder: "title" });
card(s, 0.5, 1.2, 4.35, 1.3, R.acetyl.margin, "acetyl chloride: oxide reacts with no barrier, so not selective (first screen: +0.71 eV)", C.accent6, "acetyl");
card(s, 5.15, 1.2, 4.35, 1.3, "6 / 6", "usable NEB attempts with targeted numerical retries (was 3 / 6)", C.accent3, "rescue");
s.addImage({ path: FIG("fig3_neb_rescue.png"), x: 0.9, y: 2.65, w: 8.2, h: 8.2 * 700 / 1979, objectName: "NEB figure",
  altText: "Usable NEB attempts before and after retries, and NEB energy profiles for acetyl chloride at oxide and nitride sites" });
say(s, "Validation",
  "We validated the workflow on real calculations. Our first screen had reported acetyl chloride as nitride-selective. " +
  "WARDEN showed its oxide reaction is barrierless, the orange profile, so it would cap the oxide too. And half of all " +
  "barrier calculations were failing for purely numerical reasons; one targeted retry per failure type brought that to six out of six.");

// ---- 8. candidate screening (placeholders) --------------------------------------
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Results" });
s.addText("Candidate screening", { placeholder: "title" });
const head = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: THEME.colors.dk2 } } });
const rows = [[head("Candidate (from Valency)"), head("Agent's priority"), head("Margin, decades"), head("P(S ≥ 90 %)")]]
  .concat(R.candidates.map((c) => [c.name, c.call, PENDING, PENDING]));
s.addTable(rows, { x: 0.5, y: 1.2, w: 9.0, colW: [2.7, 2.5, 1.9, 1.9], rowH: 0.42, fontSize: 13, valign: "middle", color: "0B0B0B",
  border: { type: "solid", pt: 0.5, color: "D9DCE1" }, fill: { color: "FFFFFF" }, margin: 0.06, objectName: "candidate table" });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.95, w: 9.0, h: 1.05, rectRadius: 0.08, fill: { color: C.background2 },
  line: { color: C.background2 }, objectName: "finding panel" });
s.addText([{ text: "Finding: ", options: { bold: true, color: C.accent2 } },
  { text: "[[best candidate, its margin and predicted selectivity, or why no candidate passes yet]]", options: {} }],
  { x: 0.75, y: 4.05, w: 8.5, h: 0.85, fontSize: 15, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "finding" });
say(s, "Candidate screening",
  "From ten papers retrieved through Valency, WARDEN built five candidates, each with a DOI and a verbatim quote. Having learned " +
  "that acyl chlorides attack the oxide, it ranked the aldehydes, the class the literature calls nitride-selective, first. " +
  "[[Result: name the best candidate, its margin and predicted selectivity, or explain which input limits the verdict.]]");

// ---- 9. conclusion --------------------------------------------------------------
pres.addSection({ title: "Conclusion" });
s = pres.addSlide({ masterName: "DARK", sectionTitle: "Conclusion" });
s.addText("A search you can audit, and improve", { placeholder: "title" });
s.addText([
  { text: "Every verdict is computed, sourced and reproducible, including the reason a molecule fails", options: { bullet: true, breakLine: true } },
  { text: "Next: slab-level barriers and DFT on the leaders, calibrated against measured growth curves", options: { bullet: true, breakLine: true } },
  { text: "Automate the literature loop: similar and citing papers, reported barriers as priors", options: { bullet: true, breakLine: true } },
  { text: "github.com/dominicvarghese/donuman-ai-scientist", options: { color: "EDA100" } },
], { placeholder: "body" });
say(s, "Conclusion",
  "WARDEN turns the inhibitor search into decisions you can audit: every verdict is computed, sourced and reproducible, " +
  "including why a molecule fails. Even where today's candidates fall short, the model shows which input limits the prediction, " +
  "and each part can be upgraded: slab-level barriers, DFT on the leaders, calibration against measured growth, and an automated literature loop. Thank you.");

(async () => {
  const out = path.join(HERE, "WARDEN_deck.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
  const words = SPOKEN.reduce((n, x) => n + x.text.split(/\s+/).length, 0);
  const lines = ["# WARDEN: 4-minute presentation transcript", "",
    `About ${words} words, ~${Math.round(words / 140 * 60)} s at 140 words per minute. Slide numbers match WARDEN_deck.pptx; ` +
    "the same text is in its speaker notes. Replace [[...]] with the candidate-screening result.", ""];
  SPOKEN.forEach((x, i) => {
    const sec = Math.round(x.text.split(/\s+/).length / 140 * 60);
    lines.push(`## Slide ${i + 1}: ${x.title} (~${sec} s)`, "", x.text, "");
  });
  fs.writeFileSync(path.join(HERE, "TRANSCRIPT.md"), lines.join("\n"));
  console.log("wrote TRANSCRIPT.md:", words, "words");
})();
