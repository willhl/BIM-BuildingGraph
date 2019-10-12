"use strict";

var _graphqlSchema = require("./graphql-schema");

var _graphql = require("graphql");

var _apolloServerExpress = require("apollo-server-express");

var _graphqlTools = require("graphql-tools");

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _neo4jDriver = require("neo4j-driver");

var _neo4jGraphqlJs = require("neo4j-graphql-js");

var _dotenv = require("dotenv");

var _dotenv2 = _interopRequireDefault(_dotenv);

var _convertUnits = require("convert-units");

var _convertUnits2 = _interopRequireDefault(_convertUnits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//var convert = require('convert-units')

// set environment variables from ../.env
_dotenv2.default.config();

var app = (0, _express2.default)();

/*
 * Create an executable GraphQL schema object from GraphQL type definitions
 * including autogenerated queries and mutations.
 * Optionally a config object can be included to specify which types to include
 * in generated queries and/or mutations. Read more in the docs:
 * https://grandstack.io/docs/neo4j-graphql-js-api.html#makeaugmentedschemaoptions-graphqlschema
 */
console.log(_graphqlSchema.typeDefs);

var UnitableFloatScalarType = new _graphql.GraphQLScalarType({
  name: 'UnitableFloat',
  description: 'Value with unit',
  serialize: function serialize(value, fieldNodes) {
    if (fieldNodes && fieldNodes[0] && fieldNodes[0].arguments && fieldNodes[0].arguments[0] && fieldNodes[0].arguments[0].value && fieldNodes[0].arguments[0].value.value) {
      var units = fieldNodes[0].arguments[0].value.value;
      if (units) return (0, _convertUnits2.default)(value).from('m2').to(units);
    }
    return value;
  },
  parseValue: function parseValue(value) {

    return value;
  },
  parseLiteral: function parseLiteral(ast) {

    switch (ast.kind) {}
  }
});

var resolvers = {
  UnitableFloat: UnitableFloatScalarType
};

var schema = (0, _neo4jGraphqlJs.makeAugmentedSchema)({ typeDefs: _graphqlSchema.typeDefs, resolvers: resolvers });

/*
 * Create a Neo4j driver instance to connect to the database
 * using credentials specified as environment variables
 * with fallback to defaults
 */
var driver = _neo4jDriver.v1.driver(process.env.NEO4J_URI || "bolt://localhost:7687", _neo4jDriver.v1.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD || "neo4j"));

/*
 * Create a new ApolloServer instance, serving the GraphQL schema
 * created using makeAugmentedSchema above and injecting the Neo4j driver
 * instance into the context object so it is available in the
 * generated resolvers to connect to the database.
 */
var server = new _apolloServerExpress.ApolloServer({
  context: { driver: driver },
  schema: schema,
  introspection: true,
  playground: true
});

// Specify port and path for GraphQL endpoint
var port = process.env.GRAPHQL_LISTEN_PORT || 4001;
var path = "/graphql";

/*
* Optionally, apply Express middleware for authentication, etc
* This also also allows us to specify a path for the GraphQL endpoint
*/
server.applyMiddleware({ app: app, path: path });

app.listen({ port: port, path: path }, function () {
  console.log("GraphQL server ready at http://localhost:" + port + path);
});