def build_candidate_profile(parsed_resume):

    skills = parsed_resume.get("skills", [])
    projects = parsed_resume.get("project_name", [])

    if isinstance(skills, str):
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    else:
        skill_list = [str(s).strip() for s in skills if str(s).strip()]

    if isinstance(projects, str):
        project_list = [p.strip() for p in projects.split(",") if p.strip()]
    else:
        project_list = [str(p).strip() for p in projects if str(p).strip()]

    profile = {
        "name": parsed_resume.get("name", "Candidate"),
        "skills": skill_list,
        "projects": project_list,
        "experience_level": "fresher",
        "target_role": "Software Engineer"
    }

    return profile