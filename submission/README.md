# Submission materials

- `WRITEUP.md`: the one-page write-up (figures in `figures/`). `[[...]]` marks results still to add.
- `WARDEN_deck.pptx`: 9-slide deck for the 4-minute video; the transcript is in its speaker notes.
- `TRANSCRIPT.md`: the same transcript, with approximate timings per slide.

Regenerate after adding results (figures and numbers are computed from the data, not typed):

```bash
python submission/make_figures.py <kinetics.sqlite> <benchmark_dir>   # fig2 adds pivaldehyde/glutaraldehyde when present
python submission/results.py <kinetics.sqlite> <benchmark_dir>        # writes results.json
NODE_PATH=<dir with pptxgenjs> node submission/build_deck.js <pptx skill>/scripts/apply_theme.js
```

`<benchmark_dir>` holds `bench_{20,40,80}_0.json` from the 40-world benchmark runs.
Then replace the `[[pending]]` cells and `[[...]]` sentences in the deck, write-up and transcript.
