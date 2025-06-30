const { loadSchemaSync } = require('@graphql-tools/load');
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const fs = require('fs');

// Load the schema from the file
const schema = loadSchemaSync('schema.gql', {
  loaders: [new GraphQLFileLoader()],
});

// Get types, queries, and mutations
const typeMap = schema.getTypeMap();
const queryType = schema.getQueryType();
const mutationType = schema.getMutationType();

// Function to extract fields from a GraphQL type
function extractFields(type) {
  const fields = type.getFields();
  return Object.keys(fields).map((fieldName) => {
    const field = fields[fieldName];
    const args = field.args.map((arg) => `${arg.name}: ${arg.type}`).join(', ');
    return {
      name: fieldName,
      args: args || 'None',
      returnType: field.type.toString(),
      description: field.description || 'No description provided',
    };
  });
}

// Extract data dictionary
const dataDictionary = {
  types: [],
  queries: queryType ? extractFields(queryType) : [],
  mutations: mutationType ? extractFields(mutationType) : [],
};

// Extract custom types
Object.keys(typeMap).forEach((typeName) => {
  if (!typeName.startsWith('__') && !['Query', 'Mutation', 'Subscription'].includes(typeName)) {
    const type = typeMap[typeName];
    if ('getFields' in type) {
      dataDictionary.types.push({
        name: typeName,
        fields: Object.keys(type.getFields()).map((fieldName) => {
          const field = type.getFields()[fieldName];
          return {
            name: fieldName,
            type: field.type.toString(),
            description: field.description || 'No description provided',
          };
        }),
      });
    }
  }
});

// Format the output
const formattedDataDictionary = `
### Data Dictionary

#### Types:
${dataDictionary.types
  .map(
    (type) =>
      `**${type.name}**\n${type.fields
        .map((field) => `- ${field.name} (${field.type}): ${field.description}`)
        .join('\n')}\n`
  )
  .join('\n')}

`;

// Write the output to a file
fs.writeFileSync('data-dictionary.md', formattedDataDictionary);

console.log('Data dictionary generated as data-dictionary.md');
