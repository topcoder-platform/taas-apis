"use strict";
const config = require("config");

/**
 * Add Expired for status enum field
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    // const table = { tableName: "interviews", schema: config.DB_SCHEMA_NAME };
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE ${config.DB_SCHEMA_NAME}.enum_interviews_status ADD VALUE 'Expired'`
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      queryInterface.sequelize.query(
        `
      DELETE 
      FROM
          pg_enum
      WHERE
          enumlabel = 'Expired' AND
          enumtypid = (
              SELECT
                  oid
              FROM
                  pg_type
              WHERE
                  typname = 'enum_interviews_status'
          )
    `
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
