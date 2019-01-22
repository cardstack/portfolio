/* global self */
self.deprecationWorkflow = self.deprecationWorkflow || {};
self.deprecationWorkflow.config = {
  workflow: [
    { handler: "silence", matchId: "events.inherited-function-listeners" },
    { handler: "silence", matchId: "transition-state" }
  ]
};
