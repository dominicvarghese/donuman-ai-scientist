"""Figures for the WARDEN write-up and deck, from the project's own data.

Usage: python submission/make_figures.py <kinetics.sqlite> <benchmark_dir>
  kinetics.sqlite: live xTB kinetics (acetyl chloride with rescue; aldehydes if computed)
  benchmark_dir:   bench_{20,40,80}_0.json from the 40-world benchmark runs
"""
import json, sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from warden import kinetics as kin
from warden.decide import DEFAULTS, window_width
from warden.store import Store

OUT = Path(__file__).resolve().parent / "figures"
SURFACE, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
S = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.edgecolor": INK2,
                     "axes.labelcolor": INK, "xtick.color": INK2, "ytick.color": INK2,
                     "axes.spines.top": False, "axes.spines.right": False, "figure.facecolor": SURFACE,
                     "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE, "axes.titleweight": "bold",
                     "axes.titlesize": 11, "axes.titlelocation": "left"})


def save(fig, name):
    fig.savefig(OUT / f"{name}.png", dpi=200, bbox_inches="tight")
    plt.close(fig)


# --- 1. pipeline --------------------------------------------------------------------
def pipeline():
    fig, ax = plt.subplots(figsize=(12, 3.4)); ax.set_axis_off(); ax.set_xlim(0, 12); ax.set_ylim(0, 3.4)
    boxes = [(0.1, "Literature", "Valency BOND search\nDOIs + verbatim quotes", S[6]),
             (2.5, "Candidates", "literature molecules\n+ analog designer", S[2]),
             (4.9, "Barriers", "xTB NEB per site,\npathway, orientation\n+ numerical rescue", S[1]),
             (7.3, "Decision agent", "Bayesian value of\ninformation: what\nto compute next", S[0]),
             (9.7, "Process verdict", "dose-window margin,\nrecipe + stress test", S[3])]
    for x, title, body, c in boxes:
        ax.add_patch(FancyBboxPatch((x, 1.35), 2.0, 1.75, boxstyle="round,pad=0.02,rounding_size=0.12",
                                    fc="white", ec=c, lw=2))
        ax.text(x + 1.0, 2.75, title, ha="center", va="center", fontsize=11.5, fontweight="bold", color=INK)
        ax.text(x + 1.0, 1.95, body, ha="center", va="center", fontsize=9, color=INK2, linespacing=1.3)
    for x in (2.1, 4.5, 6.9, 9.3):
        ax.annotate("", (x + 0.38, 2.22), (x + 0.02, 2.22), arrowprops=dict(arrowstyle="-|>", color=INK2, lw=1.5))
    ax.annotate("", (1.1, 1.3), (10.7, 1.3), arrowprops=dict(arrowstyle="-|>", color=S[6], lw=1.5,
                                                           connectionstyle="arc3,rad=-0.12"))
    ax.text(6, 0.2, "LLM planner + critic and a lab notebook close the loop: each result becomes the next literature question",
            ha="center", fontsize=9.5, color=INK2, style="italic")
    save(fig, "fig1_pipeline")


# --- 2. dose-window map ---------------------------------------------------------------
def site_extremes(record):
    record = kin.reclassify(record)
    v = {m: [s["Ea_eV"] for s in record["sites"] if s["material"] == m and s["status"] == "valid"] for m in ("SiO2", "SiNx")}
    return (min(v["SiO2"]), max(v["SiNx"])) if v["SiO2"] and v["SiNx"] else None


def window_map(points):
    g = np.linspace(0, 2.0, 241)
    GS, NGS = np.meshgrid(g, g)
    margin = window_width(GS.reshape(-1, 1), NGS.reshape(-1, 1), DEFAULTS, clip=False).reshape(GS.shape)
    fig, ax = plt.subplots(figsize=(5.6, 4.6))
    norm = plt.matplotlib.colors.TwoSlopeNorm(vmin=-8, vcenter=0, vmax=3)
    im = ax.pcolormesh(g, g, np.clip(margin, -8, 3), cmap=plt.matplotlib.colors.LinearSegmentedColormap.from_list(
        "div", ["#e34948", "#f3f2ee", "#2a78d6"]), norm=norm, shading="auto")
    ax.contour(g, g, margin, levels=[0], colors=INK, linewidths=1.4)
    ax.plot([0, 2], [0, 2], color=INK2, lw=0.8, ls=":")
    ax.text(1.45, 1.6, "no contrast\n(Ea equal)", color=INK2, fontsize=8, rotation=38)
    ax.text(1.35, 0.95, "practical\ndose window", color="white", fontsize=10.5, fontweight="bold")
    for (x, y), label, mk in points:
        ax.plot(x, y, mk, ms=8, mfc="white" if mk == "o" else INK, mec=INK, mew=1.6)
        ax.annotate(label, (x, y), (8, 6), textcoords="offset points", fontsize=8.5, color=INK)
    cb = fig.colorbar(im, ax=ax, shrink=0.85); cb.set_label("dose-window margin (decades)")
    ax.plot([], [], "s", ms=7, mfc=INK, mec=INK, label="earlier reported values")
    ax.plot([], [], "o", ms=7, mfc="white", mec=INK, mew=1.6, label="computed here (GFN2-xTB)")
    ax.legend(loc="upper left", fontsize=8, frameon=True, facecolor="white", edgecolor=GRID)
    ax.set_xlabel("fastest SiO$_2$ (growth) barrier, eV"); ax.set_ylabel("slowest SiN$_x$ (non-growth) barrier, eV")
    ax.set_title("Kinetic AS-ALD feasibility")
    save(fig, "fig2_dose_window")


# --- 3. NEB rescue --------------------------------------------------------------------
def neb(record):
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 3.6), gridspec_kw={"width_ratios": [1, 2.2]})
    bars = a.bar(["fixed settings", "with rescue"], [3, 6], color=[S[7], S[2]], width=0.55)
    for r, v in zip(bars, [3, 6]):
        a.text(r.get_x() + r.get_width() / 2, v + 0.12, f"{v} / 6", ha="center", fontweight="bold")
    a.set_ylim(0, 7); a.set_yticks([0, 2, 4, 6]); a.set_ylabel("usable NEB attempts")
    a.set_title("Acetyl chloride, GFN2-xTB")
    names = {"gas:OH": ("SiO$_2$  Si-OH", S[1]), "gas:NH2": ("SiN$_x$  Si-NH$_2$", S[0]), "gas:NH_bridge": ("SiN$_x$  Si-NH-Si", S[6])}
    for site in record["sites"]:
        label, c = names[site["label"]]
        for att in site["attempts"]:
            p = att.get("profile_eV")
            if not p:
                continue
            x = np.linspace(0, 1, len(p))
            ls = "-" if att.get("orientation") == 0 else "--"
            b.plot(x, np.array(p) - p[0], ls, color=c, lw=2, marker="o", ms=3.5,
                   label=f"{label}, orientation {att['orientation']}" + (f"  [rescued: {att['rescue'].split(':')[0]}]" if att.get("rescue") else ""))
    b.axhline(0, color=GRID, lw=1)
    b.set_xlabel("reaction coordinate (normalised)"); b.set_ylabel("energy vs reactant complex, eV")
    b.set_title("NEB energy profiles: the oxide reacts without a barrier")
    b.legend(fontsize=7.5, frameon=False, loc="lower left")
    fig.tight_layout(); save(fig, "fig3_neb_rescue")


# --- 4. benchmark ---------------------------------------------------------------------
def benchmark(bench_dir):
    labels = {"warden_voi": "WARDEN agent", "exhaustive_cheap": "screen everything (cheap)",
              "screen_then_verify": "screen, then verify top 2", "uncertainty_sampling": "uncertainty sampling",
              "random": "random"}
    data = {b: {r["policy"]: r for r in json.load(open(Path(bench_dir) / f"bench_{b}_0.json"))["rows"]} for b in (20, 40, 80)}
    fig, ax = plt.subplots(figsize=(7.4, 3.9))
    budgets = [20, 40, 80]
    for i, (pol, name) in enumerate(labels.items()):
        y = [data[b][pol]["mean_regret_decades"] for b in budgets]
        ax.plot(budgets, y, "-o", color=S[i], lw=3 if i == 0 else 2, ms=7 if i == 0 else 5.5,
                zorder=3 if i == 0 else 2, label=name)

    ax.set_xticks(budgets); ax.set_xlabel("compute budget (xTB-equivalent calculations)")
    ax.set_ylabel("regret of final pick (decades of dose window)"); ax.set_ylim(bottom=0)
    ax.set_xlim(12, 88); ax.grid(axis="y", color=GRID, lw=0.8)
    ax.legend(fontsize=8.5, frameon=False, loc="center left", bbox_to_anchor=(1.01, 0.5))
    ax.set_title("Choosing what to compute: 40 synthetic worlds per budget\n(lower is better)")
    save(fig, "fig4_benchmark")


if __name__ == "__main__":
    db, bench_dir = sys.argv[1], sys.argv[2]
    records = {r["name"]: r for r in kin.current_records(Store(db))}
    pipeline()
    acetyl = kin.reclassify(records["acetyl chloride"])
    pts = [((0.92, 0.36), "acetyl chloride, earlier report", "s"),
           (site_extremes(records["acetyl chloride"]), "acetyl chloride, corrected", "o"),
           ((0.20, 0.21), "benzoyl chloride", "s")]
    for name in ("pivaldehyde", "glutaraldehyde"):
        if name in records and site_extremes(records[name]):
            pts.append((site_extremes(records[name]), f"{name} (new)", "o"))
    window_map(pts)
    neb(acetyl)
    benchmark(bench_dir)
    print("figures:", sorted(p.name for p in OUT.glob("*.png")))
