def knec_grade(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 75:
        return "A-"
    if score >= 70:
        return "B+"
    if score >= 65:
        return "B"
    if score >= 60:
        return "B-"
    if score >= 55:
        return "C+"
    if score >= 50:
        return "C"
    if score >= 45:
        return "C-"
    if score >= 40:
        return "D+"
    if score >= 35:
        return "D"
    if score >= 30:
        return "D-"
    return "E"
