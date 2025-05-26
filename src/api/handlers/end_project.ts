/**
 * End project handler
 * https://docs.soulmachines.com/skills/api#tag/Delete
 *
 * Use this endpoint to implement any clean-up for a Skill when it is no longer used by a project.
 *
 * Skills which make use of the init endpoint may find the delete endpoint particularly useful for
 * cleaning up any long-running tasks or stored data associated with the provided projectId.
 *
 * The delete endpoint will be called every time a DDNA Studio project using this Skill is deleted.
 * It will also be called when a project using the Skill removes it, and is then redeployed.
 */
export function endProjectHandler(projectId: string) {
  console.log('End project handler got:', projectId);
}
