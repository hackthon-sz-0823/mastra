import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { wasteClassifierAgent } from './agents/waste-classifier';
import { simpleClassifierAgent } from './agents/simple-classifier';
import { classificationWorkflow } from './workflows/classification-workflow';

export const mastra = new Mastra({
	server: {
		// host: '0.0.0.0', // 允许外网访问
		port: parseInt(process.env.PORT || '4111'),
		timeout: 120000, // 增加到120秒
	},
	agents: {
		wasteClassifier: wasteClassifierAgent,
		simpleClassifier: simpleClassifierAgent,
	},

	workflows: {
		classificationWorkflow,
	},

	// storage: new LibSQLStore({
	//   url: process.env.NODE_ENV === "production"
	//     ? process.env.DATABASE_URL!
	//     : ":memory:"
	// }),

	// logger: new PinoLogger({
	//   name: "WasteClassifier",
	//   level: "info"
	// }),
});
