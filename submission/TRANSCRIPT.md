# WARDEN: 4-minute presentation transcript

About 504 words, ~216 s at 140 words per minute. Slide numbers match WARDEN_deck.pptx; the same text is in its speaker notes. Replace [[...]] with the candidate-screening result.

## Slide 1: Title (~14 s)

This is WARDEN, an AI co-scientist for area-selective atomic layer deposition. I'll cover the problem, why it is hard, how WARDEN works, what it has shown so far, and where it goes next.

## Slide 2: The problem (~26 s)

The challenge comes from 3D NAND: grow silicon oxide on oxide, but not on the silicon nitride right next to it, with 90 percent selectivity at 10 nanometres. The usual route is an inhibitor molecule that caps the nitride's N-H groups and leaves the oxide's O-H groups free. That is hard because both surfaces are amorphous, with many different reactive sites.

## Slide 3: Why it helps (~24 s)

Today, inhibitors are picked by intuition and judged by adsorption on one idealised surface, failed calculations are dropped or misread, and compute is spread evenly. WARDEN sources every molecule in the literature, works site by site on validated amorphous surfaces, judges kinetics against a real dose window, and spends each calculation where it can change the decision.

## Slide 4: How WARDEN works (~28 s)

Here is the loop. WARDEN searches the literature through Valency BOND and keeps only what it can quote. It turns papers into candidate molecules and designs analogs, computes reaction barriers with xTB on validated surfaces, and a decision agent picks the next calculation. A process model gives the verdict, and an LLM planner, a critic and a lab notebook turn each result into the next question.

## Slide 5: The criterion (~23 s)

Everything optimises one physical number. Each barrier gives a capping rate. A molecule only works if a practical dose caps the slowest nitride site before it touches the fastest oxide site: the blue region, measured in decades. A big barrier difference is not enough; both barriers have to sit in the right band.

## Slide 6: The agent (~27 s)

The agent keeps a Bayesian belief over every barrier it could compute, and values each possible calculation, a new molecule, site, pathway, orientation or a better method, by how much it could change the decision per unit cost. On forty synthetic test cases per budget, it beats screening everything at tight budgets and matches it at large budgets with sixteen percent less compute.

## Slide 7: Validation (~25 s)

We validated the workflow on real calculations. Our first screen had reported acetyl chloride as nitride-selective. WARDEN showed its oxide reaction is barrierless, the orange profile, so it would cap the oxide too. And half of all barrier calculations were failing for purely numerical reasons; one targeted retry per failure type brought that to six out of six.

## Slide 8: Candidate screening (~23 s)

From ten papers retrieved through Valency, WARDEN built five candidates, each with a DOI and a verbatim quote. Having learned that acyl chlorides attack the oxide, it ranked the aldehydes, the class the literature calls nitride-selective, first. [[Result: name the best candidate, its margin and predicted selectivity, or explain which input limits the verdict.]]

## Slide 9: Conclusion (~25 s)

WARDEN turns the inhibitor search into decisions you can audit: every verdict is computed, sourced and reproducible, including why a molecule fails. Even where today's candidates fall short, the model shows which input limits the prediction, and each part can be upgraded: slab-level barriers, DFT on the leaders, calibration against measured growth, and an automated literature loop. Thank you.
