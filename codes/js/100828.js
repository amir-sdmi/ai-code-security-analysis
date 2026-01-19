// Made with ChatGPT
const { graphql } = import("@octokit/graphql");

const moveIssue = async (token, issueId, columnName) => {
  const graphqlWithAuth = (query, variables) =>
    graphql(query, {
      headers: {
        authorization: `token ${token}`,
      },
      ...variables,
  });

  // Query your project to get column IDs
  const projectData = await graphqlWithAuth(`
    query {
      user(login: "YOUR_ORG_OR_USER") {  // Replace with your org or user login
        projectNext(number: YOUR_PROJECT_NUMBER) {  // Replace with your project number
          id
          fields(first: 20) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  `);

  const columnField = projectData.user.projectNext.fields.nodes.find(
    (field) => field.name === "Status"
  );

  if (!columnField) {
    throw new Error("Column 'Status' not found in project.");
  }

  const fieldId = columnField.id;

  // Move the issue to the desired column (e.g., "In Progress")
  const result = await graphqlWithAuth(`
    mutation {
      updateProjectNextItemField(input: {
        projectId: "${projectData.user.projectNext.id}",
        itemId: "${issueId}",
        fieldId: "${fieldId}",
        value: "${columnName}"
      }) {
        projectNextItem {
          id
        }
      }
    }
  `);

  console.log(`Issue moved to '${columnName}' column successfully.`);
};

// Grab the token, issue ID, and column name from the command line args
const [_, __, token, issueId, columnName] = process.argv;

moveIssue(token, issueId, columnName)
  .then(() => console.log("Move completed!"))
  .catch((error) => console.error(`Error moving issue: ${error.message}`));
