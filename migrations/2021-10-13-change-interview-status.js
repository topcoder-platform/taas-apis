"use strict";
const config = require("config");
const { Interviews } = require("../app-constants");
const _ = require("lodash");

// allowed status values
const statuses = _.values(Interviews.Status);

const oldStatuses = _.values(_.omit(Interviews.Status, "Expired"));

/**
 * Add Expired for status enum field
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const table = { tableName: "interviews", schema: config.DB_SCHEMA_NAME };
    try {
      await queryInterface.changeColumn(table, "status", {
        type: Sequelize.ENUM(statuses),
        allowNull: false,
      }, {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    const table = {
      tableName: "work_period_payments",
      schema: config.DB_SCHEMA_NAME,
    };
    try {
      await queryInterface.changeColumn(table, "challenge_id", {
        type: Sequelize.ENUM(oldStatuses),
        allowNull: false,
      }, {transaction}),
        await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
