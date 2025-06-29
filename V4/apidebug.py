from roboflow import Roboflow

rf = Roboflow(api_key="2m3V3mUe7Ee3wfrVqwYS")

workspace = rf.workspace("frc10015")

try:
    print("Projects in 'frc10015':")
    projects = workspace.projects()
    for project_name in projects:
        print("-", project_name)
except Exception as e:
    print("Error accessing workspace or project:", e)
