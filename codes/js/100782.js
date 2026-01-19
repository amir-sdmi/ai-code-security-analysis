const dotenv = require("dotenv");

dotenv.config();

module.exports = {
	dev: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: `${process.env.DB_NAME}_dev`,
		host: process.env.DB_HOST,
		dialect: "postgres",
		// migrations storage
		// migrationStoragePath: "src/db/migrations",
		// seederStoragePath: "src/db/seeders",
	},
	test: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: `${process.env.DB_NAME}_test`,
		host: process.env.DB_HOST,
		dialect: "postgres",
		// migrations storage
		// migrationStoragePath: "src/db/migrations",
		// seederStoragePath: "src/db/seeders",
	},
	production_test: {
		// this should be almost a clone of production
		// real production variable DATABASE_URL is on heroku
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		dialect: "postgres",
		// dialect options - suggested by ChatGPT
		// dialectOptions: {
		// 	ssl: {
		// 		require: true,
		// 		rejectUnauthorized: false,
		// 	},
		// },
		// migrations storage
		// migrationStoragePath: "src/db/migrations",
		// seederStoragePath: "src/db/seeders",
	},
	production: {
		use_env_variable: "DATABASE_URL",
		dialect: "postgres",
		dialectOptions: {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		},
		// other configurations...
	},

	// other configurations
	// migrationStoragePath: 'src/db/migrations',
	// seederStoragePath: 'src/db/seeders',
};
