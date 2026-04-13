import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const lcov = readFileSync('./coverage/lcov.info', 'utf-8');

let linesTotal = 0, linesHit = 0;
let fnTotal = 0, fnHit = 0;
let brTotal = 0, brHit = 0;

for (const line of lcov.split('\n')) {
	const [key, val] = line.split(':');
	const n = Number(val);
	if (key === 'LF') linesTotal += n;
	else if (key === 'LH') linesHit += n;
	else if (key === 'FNF') fnTotal += n;
	else if (key === 'FNH') fnHit += n;
	else if (key === 'BRF') brTotal += n;
	else if (key === 'BRH') brHit += n;
}

const pct = (hit: number, total: number) => (total === 0 ? 100 : Math.round((hit / total) * 10000) / 100);

const summary = {
	total: {
		lines: { total: linesTotal, covered: linesHit, skipped: 0, pct: pct(linesHit, linesTotal) },
		statements: { total: linesTotal, covered: linesHit, skipped: 0, pct: pct(linesHit, linesTotal) },
		functions: { total: fnTotal, covered: fnHit, skipped: 0, pct: pct(fnHit, fnTotal) },
		branches: { total: brTotal, covered: brHit, skipped: 0, pct: pct(brHit, brTotal) }
	}
};

mkdirSync('./coverage', { recursive: true });
writeFileSync('./coverage/coverage-summary.json', JSON.stringify(summary, null, 2));
