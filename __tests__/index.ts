import CSGOGSI from '../tsc';

test("creates CSGOGSI object", () => {
    const GSI = new CSGOGSI();
    expect(GSI).toBeDefined();
});

test("throws on bad data", () => {
    const dummyData = {
        allplayers: {},
        map:{},
        phase_countdowns:{}
    } as any;
    const GSI = new CSGOGSI();
    expect(() => GSI.digest(dummyData)).toThrow();
});