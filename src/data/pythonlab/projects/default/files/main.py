"""Daily Check-In Planner.

Run this file, answer the prompt, and read the plan in the console.
Try editing FOCUS_OPTIONS or ENCOURAGEMENTS to make the planner your own.
"""

FOCUS_OPTIONS = [
    "practice one Python function",
    "debug one small mistake",
    "explain my code out loud",
]

ENCOURAGEMENTS = {
    "Ada": "You are thinking like a programmer already.",
    "Grace": "Your careful debugging will pay off.",
    "default": "Small steps still count as progress.",
}


def clean_name(raw_name):
    """Return a friendly display name for the plan."""
    cleaned = raw_name.strip()

    if cleaned == "":
        return "friend"

    return cleaned.title()


def build_focus_plan(name, options):
    """Build a multi-line plan from the student's name and focus options."""
    plan_lines = [
        f"Hello, {name}!",
        "Here is a quick coding plan for today:",
    ]

    for index, option in enumerate(options, start=1):
        plan_lines.append(f"{index}. {option}")

    encouragement = ENCOURAGEMENTS.get(name, ENCOURAGEMENTS["default"])
    plan_lines.append(encouragement)

    return "\n".join(plan_lines)


student_name = clean_name(input("What is your name? "))
print(build_focus_plan(student_name, FOCUS_OPTIONS))