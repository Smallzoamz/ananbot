import math

def get_level_info(total_xp):
    if total_xp <= 0: return 1, 0, 5000
    
    # Solve 2500 * L * (L-1) <= total_xp
    # L^2 - L - (total_xp/2500) <= 0
    l_exact = (1 + math.sqrt(1 + total_xp / 625)) / 2
    level = min(10, math.floor(l_exact))
    
    if level >= 10:
        xp_for_current = 2500 * 10 * 9 # Level 10 starts at 225,000
        return 10, total_xp - xp_for_current, 0
    
    xp_for_current = 2500 * level * (level - 1)
    xp_for_next = 2500 * (level + 1) * level
    current_level_xp = total_xp - xp_for_current
    xp_needed_for_next = xp_for_next - xp_for_current
    
    return level, current_level_xp, xp_needed_for_next

test_cases = [
    (0, (1, 0, 5000)),
    (1000, (1, 1000, 5000)),
    (5000, (2, 0, 10000)),
    (6000, (2, 1000, 10000)),
    (15000, (3, 0, 15000)),
    (30000, (4, 0, 20000)),
    (225000, (10, 0, 0)),
    (300000, (10, 75000, 0))
]

for total_xp, expected in test_cases:
    actual = get_level_info(total_xp)
    print(f"XP: {total_xp:7} | Expected: {expected} | Actual: {actual} | {'OK' if actual == expected else 'FAIL'}")
