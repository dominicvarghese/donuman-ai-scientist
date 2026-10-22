"""Numbers for the deck and write-up, computed from the project's own data.

Usage: python submission/results.py <kinetics.sqlite> <benchmark_dir>
Writes submission/results.json and prints a summary.
"""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from PIL import Image
from warden import kinetics as kin
from warden.lit import window_margin
from warden.store import Store

db, bench_dir = sys.argv[1], Path(sys.argv[2])
records = {r["name"]: kin.reclassify(r) for r in kin.current_records(Store(db))}


def summary(name):
    r = records.get(name)
    if r is None:
        return None
    v = {m: [s["Ea_eV"] for s in r["sites"] if s["material"] == m and s["status"] == "valid"] for m in ("SiO2", "SiNx")}
    attempts = [a for s in r["sites"] for a in s["attempts"]]
    out = {"sites": {s["label"]: {"status": s["status"], "Ea_eV": s["Ea_eV"], "barrierless": s.get("barrierless")}
                     for s in r["sites"]},
           "attempts": len(attempts), "usable": sum(a["status"] in kin.USABLE for a in attempts),
           "rescued": [a["rescue"] for a in attempts if a.get("rescue")]}
    if v["SiO2"] and v["SiNx"]:
        out.update(fastest_SiO2_eV=min(v["SiO2"]), slowest_SiNx_eV=max(v["SiNx"]),
                   margin_decades=window_margin(min(v["SiO2"]), max(v["SiNx"])))
    return out


bench = {b: {r["policy"]: r for r in json.load(open(bench_dir / f"bench_{b}_0.json"))["rows"]} for b in (20, 40, 80)}
gain20 = bench[20]["exhaustive_cheap"]["agent_better_by"]
saving80 = 1 - bench[80]["warden_voi"]["mean_spent"] / 80.

# The agent's call on the literature candidates, given acetyl chloride's result only (no-compute dry run).
with tempfile.TemporaryDirectory() as tmp:
    s = Store(Path(tmp) / "db.sqlite")
    acetyl = next(r for r in Store(db).all("kinetics") if r["name"] == "acetyl chloride")
    s.put("kinetics", acetyl["id"], acetyl)
    from warden.chemistry import validate_candidate
    spec = validate_candidate({"name": "acetyl chloride", "smiles": acetyl["smiles"], "template": acetyl["template"]})
    s.put("candidate", spec["id"], spec); s.close()
    subprocess.run([sys.executable, "-m", "warden", "decide", "--db", str(Path(tmp) / "db.sqlite"), "--sites", "gas",
                    "--budget", "6", "--dry-run", "--library", str(ROOT / "examples/candidates-literature.json"),
                    "--out", str(Path(tmp) / "d")], cwd=ROOT, check=True, capture_output=True)
    plan = json.load(open(Path(tmp) / "d/decisions.json"))
values = {}
for line in plan["next"]:
    if line.startswith("add_molecule"):
        name = line[len("add_molecule "):].split(":")[0].strip()
        values[name] = float(line.split("value/cost ")[1].split(",")[0])
skipped = {x["name"]: x["reason"] for x in plan["library_skipped"]}
classes = {"propanoyl chloride": "acyl chloride", "pivaldehyde": "aldehyde", "glutaraldehyde": "dialdehyde",
           "BDMADMS": "aminosilane", "N-methyl-aza-2,2,4-trimethylsilacyclopentane": "cyclic azasilane"}
short = {"N-methyl-aza-2,2,4-trimethylsilacyclopentane": "cyclic azasilane"}
candidates = []
for name, cls in classes.items():
    if name in values:
        call = f"value/cost {values[name]:.2f}"
    elif "control" in skipped.get(name, ""):
        call = "control (prefers SiO₂)"
    else:
        call = "no barrier model yet"
    candidates.append({"name": short.get(name, name), "cls": cls, "call": call})
candidates.sort(key=lambda c: -float(c["call"].split()[-1]) if c["call"].startswith("value") else 0)

ald = {n: summary(n) for n in ("pivaldehyde", "glutaraldehyde")}
done = {n: a for n, a in ald.items() if a and "margin_decades" in a}
if done:
    best = max(done, key=lambda n: done[n]["margin_decades"])
    a = done[best]
    big = f"{a['margin_decades']:+.1f} dec."
    verdict = "inside a practical dose window" if a["margin_decades"] > 0 else "no practical dose window yet"
    small = (f"{best}: oxide {a['fastest_SiO2_eV']:.2f} eV vs slowest nitride {a['slowest_SiNx_eV']:.2f} eV, "
             f"{verdict} (gas-phase xTB)")
    spoken = (f"We then computed {best}: its fastest oxide barrier is {a['fastest_SiO2_eV']:.2f} electron-volts against "
              f"{a['slowest_SiNx_eV']:.2f} on the slowest nitride site, a margin of {a['margin_decades']:.1f} decades, "
              f"so {verdict}.")
else:
    big, small, spoken = "next", "aldehydes queued for barrier calculations", "The aldehydes are next in the queue."

fig4 = Image.open(ROOT / "submission/figures/fig4_benchmark.png").size
results = {"acetyl": {"margin": f"{summary('acetyl chloride')['margin_decades']:.1f} dec.",
                      **summary("acetyl chloride")},
           "bench": {"gain20": f"{gain20:.1f} dec.", "saving80": f"{saving80:.0%}"},
           "candidates": candidates, "aldehydes": ald,
           "aldehyde": {"big": big, "small": small, "spoken": spoken},
           "fig4_aspect": fig4[1] / fig4[0]}
(ROOT / "submission/results.json").write_text(json.dumps(results, indent=1, default=float))
print(json.dumps({k: results[k] for k in ("acetyl", "bench", "candidates", "aldehyde")}, indent=1, default=float)[:3000])
