interface SiteTestCase {
	map: string;
	position: string;
	site: 'A' | 'B';
}

export const testCases: SiteTestCase[] = [
	// de_mirage
	{ map: 'de_mirage', site: 'A', position: '-273.56, -2156.22, -175.38' },
	{ map: 'de_mirage', site: 'A', position: '-585.13, -2265.45, -200.00' },
	{ map: 'de_mirage', site: 'A', position: '-485.72, -2166.87, -200.00' },
	{ map: 'de_mirage', site: 'A', position: '-386.31, -2255.59, -200.00' },
	{ map: 'de_mirage', site: 'A', position: '-336.60, -2196.44, -200.00' },
	{ map: 'de_mirage', site: 'B', position: '-2210.31, 110.99, -200.00' },
	{ map: 'de_mirage', site: 'B', position: '-2069.80, 90.98, -200.00' },
	{ map: 'de_mirage', site: 'B', position: '-1929.28, 261.07, -200.00' },
	{ map: 'de_mirage', site: 'B', position: '-2039.69, 391.14, -200.00' },
	{ map: 'de_mirage', site: 'B', position: '-2180.20, 231.06, -200.00' },

	// de_dust2
	{ map: 'de_dust2', site: 'B', position: '-1633.37, 2840.45, -200.00' },
	{ map: 'de_dust2', site: 'B', position: '-1633.37, 2533.11, -200.00' },
	{ map: 'de_dust2', site: 'B', position: '-1387.58, 2541.89, -200.00' },
	{ map: 'de_dust2', site: 'B', position: '-1378.80, 2752.64, -200.00' },
	{ map: 'de_dust2', site: 'B', position: '-1519.25, 2840.45, -200.00' },
	{ map: 'de_dust2', site: 'A', position: '991.37, 2612.14, -200.00' },
	{ map: 'de_dust2', site: 'A', position: '1000.15, 2506.77, -200.00' },
	{ map: 'de_dust2', site: 'A', position: '1096.71, 2383.83, -200.00' },
	{ map: 'de_dust2', site: 'A', position: '1210.83, 2383.83, -200.00' },
	{ map: 'de_dust2', site: 'A', position: '1237.17, 2603.36, -200.00' },

	// de_train
	{ map: 'de_train', site: 'A', position: '236.31, -9.39, -200.00' },
	{ map: 'de_train', site: 'A', position: '310.96, -160.50, -200.00' },
	{ map: 'de_train', site: 'A', position: '842.85, 28.39, -200.00' },
	{ map: 'de_train', site: 'A', position: '796.19, 188.95, -200.00' },
	{ map: 'de_train', site: 'A', position: '572.24, 18.95, -200.00' },
	{ map: 'de_train', site: 'B', position: '-211.59, -1142.74, -200.00' },
	{ map: 'de_train', site: 'B', position: '-211.59, -1369.41, -200.00' },
	{ map: 'de_train', site: 'B', position: '310.96, -1388.30, -200.00' },
	{ map: 'de_train', site: 'B', position: '320.30, -1152.18, -200.00' },
	{ map: 'de_train', site: 'B', position: '68.35, -1265.52, -200.00' },

	// de_inferno
	{ map: 'de_inferno', site: 'A', position: '1827.63, 685.66, -200.00' },
	{ map: 'de_inferno', site: 'A', position: '1837.45, 224.55, -200.00' },
	{ map: 'de_inferno', site: 'A', position: '2122.18, 204.92, -200.00' },
	{ map: 'de_inferno', site: 'A', position: '2131.99, 636.60, -200.00' },
	{ map: 'de_inferno', site: 'A', position: '1994.54, 460.01, -200.00' },
	{ map: 'de_inferno', site: 'B', position: '168.38, 3001.03, -200.00' },
	{ map: 'de_inferno', site: 'B', position: '168.38, 2588.97, -200.00' },
	{ map: 'de_inferno', site: 'B', position: '512.01, 2618.41, -200.00' },
	{ map: 'de_inferno', site: 'B', position: '531.65, 3010.84, -200.00' },
	{ map: 'de_inferno', site: 'B', position: '364.74, 2795.00, -200.00' },

	// de_overpass
	{ map: 'de_overpass', site: 'A', position: '-2531.58, 644.61, 510.00' },
	{ map: 'de_overpass', site: 'A', position: '-2405.29, 924.80, 510.00' },
	{ map: 'de_overpass', site: 'A', position: '-1836.97, 675.74, 510.00' },
	{ map: 'de_overpass', site: 'A', position: '-1910.64, 447.44, 510.00' },
	{ map: 'de_overpass', site: 'A', position: '-2163.23, 561.59, 510.00' },
	{ map: 'de_overpass', site: 'B', position: '-1205.51, 208.76, 100.00' },
	{ map: 'de_overpass', site: 'B', position: '-1205.51, -29.92, 100.00' },
	{ map: 'de_overpass', site: 'B', position: '-995.03, -61.05, 100.00' },
	{ map: 'de_overpass', site: 'B', position: '-973.98, 198.38, 100.00' },
	{ map: 'de_overpass', site: 'B', position: '-1079.22, 63.48, 100.00' },

	// de_cache
	{ map: 'de_cache', site: 'A', position: '-429.97, 2021.63, -200.00' },
	{ map: 'de_cache', site: 'A', position: '-67.47, 1999.59, -200.00' },
	{ map: 'de_cache', site: 'A', position: '-78.46, 1514.88, -200.00' },
	{ map: 'de_cache', site: 'A', position: '-386.03, 1514.88, -200.00' },
	{ map: 'de_cache', site: 'A', position: '-232.24, 1757.24, -200.00' },
	{ map: 'de_cache', site: 'B', position: '-298.15, -1029.87, -200.00' },
	{ map: 'de_cache', site: 'B', position: '-276.18, -1382.39, -200.00' },
	{ map: 'de_cache', site: 'B', position: '196.16, -1426.46, -200.00' },
	{ map: 'de_cache', site: 'B', position: '207.15, -1040.89, -200.00' },
	{ map: 'de_cache', site: 'B', position: '-12.55, -1228.16, -200.00' },

	// de_nuke
	{ map: 'de_nuke', site: 'A', position: '525.16, -482.61, 120.00' },
	{ map: 'de_nuke', site: 'A', position: '511.20, -815.41, 120.00' },
	{ map: 'de_nuke', site: 'A', position: '804.30, -873.29, 120.00' },
	{ map: 'de_nuke', site: 'A', position: '818.25, -554.95, 120.00' },
	{ map: 'de_nuke', site: 'A', position: '664.73, -641.77, 120.00' },
	{ map: 'de_nuke', site: 'B', position: '525.16, -482.61, -800.00' },
	{ map: 'de_nuke', site: 'B', position: '511.20, -815.41, -800.00' },
	{ map: 'de_nuke', site: 'B', position: '804.30, -873.29, -800.00' },
	{ map: 'de_nuke', site: 'B', position: '818.25, -554.95, -800.00' },
	{ map: 'de_nuke', site: 'B', position: '664.73, -641.77, -800.00' },

	// de_vertigo
	{ map: 'de_vertigo', site: 'A', position: '-487.07, -540.75, -200.00' },
	{ map: 'de_vertigo', site: 'A', position: '-463.12, -717.37, -200.00' },
	{ map: 'de_vertigo', site: 'A', position: '-56.11, -693.29, -200.00' },
	{ map: 'de_vertigo', site: 'A', position: '-56.11, -572.87, -200.00' },
	{ map: 'de_vertigo', site: 'A', position: '-287.55, -629.06, -200.00' },
	{ map: 'de_vertigo', site: 'B', position: '-2362.54, 904.32, -200.00' },
	{ map: 'de_vertigo', site: 'B', position: '-2354.56, 687.56, -200.00' },
	{ map: 'de_vertigo', site: 'B', position: '-2155.04, 655.45, -200.00' },
	{ map: 'de_vertigo', site: 'B', position: '-2155.04, 896.29, -200.00' },
	{ map: 'de_vertigo', site: 'B', position: '-2258.79, 807.98, -200.00' }
];
